#!/usr/bin/env node

/**
 * Land Registry Price Paid Data Import
 *
 * Downloads and imports UK Land Registry property sale data for London.
 * Filters to London postcodes only and processes in batches for efficiency.
 *
 * Usage:
 *   node scripts/import-land-registry.js            # Latest monthly data
 *   node scripts/import-land-registry.js --year 2024  # Specific year
 *   node scripts/import-land-registry.js --full       # Complete dataset (~4.3GB)
 *
 * Data source: http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse'
import { createReadStream } from 'fs'
import { unlink, createWriteStream } from 'fs/promises'
import { pipeline } from 'stream/promises'
import fetch from 'node-fetch'
import { gunzip } from 'zlib'
import { promisify } from 'util'

const gunzipAsync = promisify(gunzip)

// Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
)

// London postcode areas (outward codes)
const LONDON_POSTCODES = [
  'E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC',  // Central London
  'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT',     // Greater London
  'RM', 'SM', 'TW', 'UB'                         // Outer London
]

// Base URL for Land Registry data
const BASE_URL = 'http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com'

/**
 * Check if a postcode is in London
 */
function isLondonPostcode(postcode) {
  if (!postcode) return false

  // Extract outward code (part before space, first 1-2 letters)
  const outward = postcode.split(' ')[0]
  if (!outward) return false

  const area = outward.replace(/\d/g, '') // Remove numbers
  return LONDON_POSTCODES.includes(area.toUpperCase())
}

/**
 * Extract postcode components
 */
function parsePostcode(postcode) {
  if (!postcode) return { area: null, sector: null }

  const cleaned = postcode.replace(/\s+/g, ' ').trim().toUpperCase()
  const parts = cleaned.split(' ')

  if (parts.length !== 2) return { area: null, sector: null }

  const outward = parts[0]
  const area = outward.replace(/\d/g, '')
  const sector = cleaned.substring(0, cleaned.length - 2).trim()

  return { area, sector }
}

/**
 * Map CSV row to database format
 */
function mapLandRegistryRecord(row) {
  // CSV columns (no headers in Land Registry data):
  // 0: transaction_id, 1: price, 2: date_of_transfer, 3: postcode,
  // 4: property_type, 5: old_new, 6: duration, 7: paon, 8: saon,
  // 9: street, 10: locality, 11: town, 12: district, 13: county,
  // 14: ppd_category, 15: record_status

  const transactionId = row[0] ? row[0].replace(/[{}]/g, '') : null // Remove braces
  const postcode = row[3] ? row[3].trim() : null

  if (!transactionId || !postcode || !isLondonPostcode(postcode)) {
    return null // Skip non-London records
  }

  const { area, sector } = parsePostcode(postcode)

  // Parse date (format: YYYY-MM-DD)
  const dateStr = row[2]
  const transferDate = dateStr ? new Date(dateStr).toISOString().split('T')[0] : null

  return {
    transaction_id: transactionId,
    price: parseInt(row[1]) || 0,
    date_of_transfer: transferDate,
    postcode: postcode,
    property_type: row[4] || null,
    old_new: row[5] || null,
    duration: row[6] || null,
    paon: row[7] || null,  // House number/name
    saon: row[8] || null,  // Flat number
    street: row[9] || null,
    locality: row[10] || null,
    town: row[11] || null,
    district: row[12] || null,
    county: row[13] || null,
    ppd_category: row[14] || null,
    record_status: row[15] || null,
    postcode_area: area,
    postcode_sector: sector
  }
}

/**
 * Download and extract data file
 */
async function downloadAndExtract(url, filename) {
  console.log(`📥 Downloading ${filename}...`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  // Check if it's gzipped
  if (filename.endsWith('.gz')) {
    console.log(`📦 Extracting ${filename}...`)
    return await gunzipAsync(buffer)
  }

  return buffer
}

/**
 * Process CSV data in batches
 */
async function processLandRegistryData(csvData) {
  return new Promise((resolve, reject) => {
    const records = []
    let totalRows = 0
    let londonRows = 0
    let errors = 0

    const parser = parse({
      delimiter: ',',
      quote: '"',
      escape: '"',
      skip_empty_lines: true
    })

    parser.on('data', (row) => {
      totalRows++

      try {
        const record = mapLandRegistryRecord(row)
        if (record) {
          records.push(record)
          londonRows++
        }
      } catch (error) {
        errors++
        if (errors < 10) { // Log first few errors
          console.warn(`Row ${totalRows} error:`, error.message)
        }
      }
    })

    parser.on('end', () => {
      console.log(`📊 Processed ${totalRows} total rows`)
      console.log(`🏙️ Found ${londonRows} London records`)
      if (errors > 0) {
        console.log(`⚠️ ${errors} rows had errors`)
      }
      resolve(records)
    })

    parser.on('error', reject)

    parser.write(csvData)
    parser.end()
  })
}

/**
 * Insert records in batches
 */
async function insertBatches(records, batchSize = 1000) {
  const totalBatches = Math.ceil(records.length / batchSize)
  let inserted = 0
  let errors = 0

  console.log(`💾 Inserting ${records.length} records in ${totalBatches} batches...`)

  for (let i = 0; i < totalBatches; i++) {
    const batch = records.slice(i * batchSize, (i + 1) * batchSize)

    try {
      const { error } = await supabase
        .from('land_registry_prices')
        .upsert(batch, {
          onConflict: 'transaction_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error(`Batch ${i + 1} error:`, error)
        errors += batch.length
      } else {
        inserted += batch.length
        if ((i + 1) % 10 === 0 || i === totalBatches - 1) {
          console.log(`✅ Processed ${i + 1}/${totalBatches} batches (${inserted} inserted)`)
        }
      }
    } catch (error) {
      console.error(`Batch ${i + 1} exception:`, error.message)
      errors += batch.length
    }
  }

  return { inserted, errors }
}

/**
 * Get data URL based on arguments
 */
function getDataUrl(args) {
  const year = args.year
  const full = args.full

  if (full) {
    // Complete Price Paid dataset
    return `${BASE_URL}/pp-complete.csv`
  } else if (year) {
    // Specific year
    return `${BASE_URL}/pp-${year}.csv`
  } else {
    // Latest monthly data (current year)
    const currentYear = new Date().getFullYear()
    return `${BASE_URL}/pp-monthly-update-new-version.csv`
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--year' && i + 1 < args.length) {
      result.year = args[i + 1]
      i++ // Skip next argument
    } else if (args[i] === '--full') {
      result.full = true
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Land Registry Import Script

Usage:
  node scripts/import-land-registry.js              # Latest monthly data
  node scripts/import-land-registry.js --year 2024  # Specific year
  node scripts/import-land-registry.js --full       # Complete dataset (~4.3GB)

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY

The script filters data to London postcodes only and imports in batches.
Recommended first import: --year 2024, then --year 2025, then monthly updates.
      `)
      process.exit(0)
    }
  }

  return result
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now()
  const args = parseArgs()

  // Validate environment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL environment variable')
    process.exit(1)
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    process.exit(1)
  }

  console.log('🏠 Land Registry Data Import Starting...')

  try {
    const url = getDataUrl(args)
    console.log(`📡 Source: ${url}`)

    // Download and extract
    const csvData = await downloadAndExtract(url, url.split('/').pop())

    // Process CSV
    const records = await processLandRegistryData(csvData)

    if (records.length === 0) {
      console.log('⚠️ No London records found to import')
      return
    }

    // Insert in batches
    const result = await insertBatches(records)

    const duration = (Date.now() - startTime) / 1000
    console.log('\n🎉 Import completed!')
    console.log(`📊 Results: ${result.inserted} inserted, ${result.errors} errors`)
    console.log(`⏱️ Duration: ${duration.toFixed(1)}s`)
    console.log(`🏙️ London property sales data ready for enrichment pipeline`)

  } catch (error) {
    console.error('💥 Import failed:', error.message)
    process.exit(1)
  }
}

main()