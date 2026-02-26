#!/usr/bin/env node

/**
 * Complete Data Import Runner
 *
 * Runs the full Phase 4 data import process:
 * 1. Applies Phase 3 migrations (if needed)
 * 2. Imports Land Registry data
 * 3. Imports planning constraints
 * 4. Shows summary statistics
 *
 * Usage:
 *   node scripts/import-all-data.js              # Quick import (2024 data + all constraints)
 *   node scripts/import-all-data.js --full       # Full import (complete dataset)
 *   node scripts/import-all-data.js --year 2023  # Specific year
 */

import { createClient } from '@supabase/supabase-js'
import { spawn } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(spawn)

// Supabase client for verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
)

/**
 * Run a script and return promise
 */
function runScript(script, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: node ${script} ${args.join(' ')}`)

    const child = spawn('node', [script, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Script ${script} failed with code ${code}`))
      }
    })

    child.on('error', reject)
  })
}

/**
 * Check if enrichment tables exist
 */
async function checkSchema() {
  try {
    const { data, error } = await supabase
      .from('land_registry_prices')
      .select('count')
      .limit(1)

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Get data statistics
 */
async function getDataStats() {
  try {
    const stats = {}

    // Land Registry count
    const { count: lrCount } = await supabase
      .from('land_registry_prices')
      .select('*', { count: 'exact', head: true })

    stats.land_registry = lrCount || 0

    // Planning constraints by dataset
    const { data: constraintData } = await supabase
      .from('planning_constraints')
      .select('dataset')
      .not('dataset', 'is', null)

    if (constraintData) {
      const constraintCounts = {}
      constraintData.forEach(row => {
        constraintCounts[row.dataset] = (constraintCounts[row.dataset] || 0) + 1
      })
      stats.constraints = constraintCounts
    } else {
      stats.constraints = {}
    }

    // Listed buildings count
    const { count: listedCount } = await supabase
      .from('listed_buildings')
      .select('*', { count: 'exact', head: true })

    stats.listed_buildings = listedCount || 0

    return stats
  } catch (error) {
    console.warn('Could not get statistics:', error.message)
    return null
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const result = { full: false, year: null }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--full') {
      result.full = true
    } else if (args[i] === '--year' && i + 1 < args.length) {
      result.year = args[i + 1]
      i++
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Complete Data Import Runner

Usage:
  node scripts/import-all-data.js              # Quick import (2024 data + constraints)
  node scripts/import-all-data.js --full       # Full import (complete Land Registry)
  node scripts/import-all-data.js --year 2023  # Specific year

This script runs the complete Phase 4 data import process:
1. Checks/applies Phase 3 enrichment schema
2. Imports Land Registry property price data
3. Imports planning constraints from gov.uk
4. Shows final data summary

Environment Variables Required:
  NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY
      `)
      process.exit(0)
    }
  }

  return result
}

/**
 * Main import process
 */
async function main() {
  const startTime = Date.now()
  const args = parseArgs()

  console.log('🎯 Planning Radar - Complete Data Import')
  console.log('=======================================\n')

  // Validate environment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL environment variable')
    process.exit(1)
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    process.exit(1)
  }

  try {
    // Step 1: Check schema
    console.log('📋 Step 1: Checking enrichment schema...')
    const schemaExists = await checkSchema()

    if (!schemaExists) {
      console.log('🔧 Enrichment tables not found. Applying Phase 3 migrations...')
      await runScript('scripts/apply-enrichment-migrations.js')
      console.log('✅ Enrichment schema applied\n')
    } else {
      console.log('✅ Enrichment schema exists\n')
    }

    // Step 2: Import Land Registry
    console.log('🏠 Step 2: Importing Land Registry data...')
    const lrArgs = []
    if (args.full) {
      lrArgs.push('--full')
    } else if (args.year) {
      lrArgs.push('--year', args.year)
    } else {
      lrArgs.push('--year', '2024') // Default to 2024
    }

    await runScript('scripts/import-land-registry.js', lrArgs)
    console.log('✅ Land Registry import completed\n')

    // Step 3: Import planning constraints
    console.log('🏛️ Step 3: Importing planning constraints...')
    await runScript('scripts/import-constraints.js')
    console.log('✅ Planning constraints import completed\n')

    // Step 4: Show statistics
    console.log('📊 Step 4: Data summary...')
    const stats = await getDataStats()

    if (stats) {
      console.log('\n🎉 Import completed successfully!')
      console.log('\n📈 Final Data Summary:')
      console.log(`🏠 Land Registry prices: ${stats.land_registry.toLocaleString()} records`)
      console.log(`🏛️ Listed buildings: ${stats.listed_buildings.toLocaleString()} records`)
      console.log('📍 Planning constraints:')

      Object.entries(stats.constraints).forEach(([dataset, count]) => {
        console.log(`   • ${dataset}: ${count.toLocaleString()} areas`)
      })

      const totalConstraints = Object.values(stats.constraints).reduce((a, b) => a + b, 0)
      console.log(`   Total constraints: ${totalConstraints.toLocaleString()} areas`)
    }

    const duration = (Date.now() - startTime) / 1000
    console.log(`\n⏱️ Total duration: ${(duration / 60).toFixed(1)} minutes`)
    console.log('\n🚀 Ready for Phase 5: Enrichment Pipeline!')
    console.log('Next: Build the enrichment logic to analyze planning applications')

  } catch (error) {
    console.error('\n💥 Import failed:', error.message)
    console.log('\n🔍 Troubleshooting:')
    console.log('1. Check environment variables are set correctly')
    console.log('2. Ensure Supabase project is accessible')
    console.log('3. Check network connection for data downloads')
    console.log('4. Review individual import script errors above')
    process.exit(1)
  }
}

main()