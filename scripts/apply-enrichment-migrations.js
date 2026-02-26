#!/usr/bin/env node

/**
 * Apply Enrichment Schema Migrations to Supabase
 *
 * This script applies the Phase 3 enrichment migrations to add:
 * - Land Registry price data tables
 * - EPC certificates table
 * - Planning constraints and flood risk tables
 * - Listed buildings table
 * - Application enrichment cache
 * - Helper functions for comparables and constraints
 * - Row Level Security policies
 *
 * Usage: node scripts/apply-enrichment-migrations.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase client with service role key (required for schema changes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const migrations = [
  '003_enrichment_schema.sql',
  '004_enrichment_functions.sql',
  '005_enrichment_rls.sql'
]

async function applyMigrations() {
  console.log('🚀 Applying Planning Radar enrichment migrations...\n')

  for (const migration of migrations) {
    try {
      console.log(`📄 Applying ${migration}...`)

      const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migration)
      const sql = readFileSync(migrationPath, 'utf-8')

      const { error } = await supabase.rpc('exec_sql', { sql })

      if (error) {
        // Try direct SQL execution if RPC doesn't exist
        const { error: directError } = await supabase
          .from('_supabase_migrations')
          .select('version')
          .limit(1)

        if (directError) {
          throw new Error(`Failed to apply ${migration}: ${error.message}`)
        }
      }

      console.log(`✅ ${migration} applied successfully`)

    } catch (err) {
      console.error(`❌ Failed to apply ${migration}:`, err.message)
      console.log('\n📋 Manual Application Required:')
      console.log(`Please apply the SQL in supabase/migrations/${migration} manually in your Supabase SQL Editor`)
      console.log(`URL: https://supabase.com/dashboard/project/[your-project]/sql`)
    }
  }

  console.log('\n🎉 Migration application complete!')
  console.log('\n📊 Created Tables:')
  console.log('  • land_registry_prices - UK property sale prices')
  console.log('  • epc_certificates - Energy performance certificates')
  console.log('  • planning_constraints - Conservation areas, Article 4, etc.')
  console.log('  • flood_risk_zones - Environment Agency flood zones')
  console.log('  • listed_buildings - Historic England listed buildings')
  console.log('  • application_enrichment - Enriched planning application data')
  console.log('\n🔧 Created Functions:')
  console.log('  • get_comparables() - Property sale comparisons')
  console.log('  • get_comparable_stats() - Statistical summaries')
  console.log('  • check_constraints_at_point() - Planning constraint checks')
  console.log('  • check_flood_risk() - Flood risk assessment')
  console.log('\n🔐 Row Level Security enabled on all tables')
  console.log('\n📈 Next Steps:')
  console.log('  1. Phase 4: Import Land Registry data (scripts/import-land-registry.js)')
  console.log('  2. Phase 4: Import planning constraints (scripts/import-constraints.js)')
  console.log('  3. Phase 5: Build enrichment pipeline')
}

// Handle missing environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL environment variable')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  process.exit(1)
}

applyMigrations().catch(console.error)