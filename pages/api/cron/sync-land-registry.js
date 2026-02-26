/**
 * Monthly Land Registry Data Sync
 *
 * Automated cron job that downloads and imports the latest Land Registry
 * price paid data for London properties. Runs monthly via Vercel Cron.
 *
 * Schedule: 1st of each month at 2 AM
 * Data source: Land Registry Price Paid monthly updates
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse'
import fetch from 'node-fetch'

// Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// London postcode areas
const LONDON_POSTCODES = [
  'E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC',  // Central London
  'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT',     // Greater London
  'RM', 'SM', 'TW', 'UB'                         // Outer London
]

// Land Registry monthly update URL
const MONTHLY_UPDATE_URL = 'http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-monthly-update-new-version.csv'

/**
 * Check if postcode is in London
 */
function isLondonPostcode(postcode) {
  if (!postcode) return false
  const area = postcode.split(' ')[0]?.replace(/\d/g, '')?.toUpperCase()
  return LONDON_POSTCODES.includes(area)
}

/**
 * Parse postcode components
 */
function parsePostcode(postcode) {
  if (!postcode) return { area: null, sector: null }

  const cleaned = postcode.replace(/\s+/g, ' ').trim().toUpperCase()
  const parts = cleaned.split(' ')

  if (parts.length !== 2) return { area: null, sector: null }

  const area = parts[0].replace(/\d/g, '')
  const sector = cleaned.substring(0, cleaned.length - 2).trim()

  return { area, sector }
}

/**
 * Map Land Registry CSV row to database format
 */
function mapLandRegistryRecord(row) {
  const transactionId = row[0] ? row[0].replace(/[{}]/g, '') : null
  const postcode = row[3] ? row[3].trim() : null

  if (!transactionId || !postcode || !isLondonPostcode(postcode)) {
    return null
  }

  const { area, sector } = parsePostcode(postcode)
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
    paon: row[7] || null,
    saon: row[8] || null,
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
 * Download and process Land Registry CSV data
 */
async function downloadAndProcessData() {
  console.log('📥 Downloading monthly Land Registry update...')

  const response = await fetch(MONTHLY_UPDATE_URL)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`)
  }

  const csvText = await response.text()
  console.log('📦 Processing CSV data...')

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
        if (errors < 5) {
          console.warn(`Row ${totalRows} error:`, error.message)
        }
      }
    })

    parser.on('end', () => {
      console.log(`📊 Processed ${totalRows} total rows, found ${londonRows} London records`)
      if (errors > 0) {
        console.log(`⚠️ ${errors} rows had errors`)
      }
      resolve(records)
    })

    parser.on('error', reject)

    parser.write(csvText)
    parser.end()
  })
}

/**
 * Insert records in batches
 */
async function insertRecords(records, batchSize = 1000) {
  if (records.length === 0) {
    return { inserted: 0, errors: 0 }
  }

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
        console.error(`Batch ${i + 1} error:`, error.message)
        errors += batch.length
      } else {
        inserted += batch.length
      }
    } catch (error) {
      console.error(`Batch ${i + 1} exception:`, error.message)
      errors += batch.length
    }
  }

  return { inserted, errors }
}

/**
 * Log sync result to database
 */
async function logSyncResult(result) {
  try {
    await supabase
      .from('data_sync_log')
      .insert({
        sync_type: 'land_registry_monthly',
        started_at: result.startTime,
        completed_at: result.endTime,
        duration_seconds: result.duration,
        records_processed: result.recordsProcessed,
        records_inserted: result.inserted,
        records_errors: result.errors,
        status: result.errors === 0 ? 'success' : 'partial_failure',
        details: {
          source_url: MONTHLY_UPDATE_URL,
          london_postcodes_only: true,
          batch_size: 1000
        }
      })
  } catch (error) {
    console.error('Failed to log sync result:', error.message)
  }
}

/**
 * Main cron handler
 */
export default async function handler(req, res) {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = new Date()
  console.log('🏠 Starting monthly Land Registry data sync...')

  try {
    // Download and process data
    const records = await downloadAndProcessData()

    // Insert into database
    const { inserted, errors } = await insertRecords(records)

    const endTime = new Date()
    const duration = (endTime - startTime) / 1000

    const result = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: Math.round(duration),
      recordsProcessed: records.length,
      inserted,
      errors
    }

    // Log the sync result
    await logSyncResult(result)

    console.log('✅ Monthly Land Registry sync completed')
    console.log(`📊 Results: ${inserted} inserted, ${errors} errors in ${duration.toFixed(1)}s`)

    return res.status(200).json({
      success: true,
      message: 'Monthly Land Registry sync completed',
      summary: result
    })

  } catch (error) {
    const endTime = new Date()
    const duration = (endTime - startTime) / 1000

    console.error('❌ Monthly Land Registry sync failed:', error.message)

    // Log the failure
    await logSyncResult({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: Math.round(duration),
      recordsProcessed: 0,
      inserted: 0,
      errors: 1
    })

    return res.status(500).json({
      success: false,
      error: 'Monthly Land Registry sync failed',
      details: error.message,
      duration: Math.round(duration)
    })
  }
}