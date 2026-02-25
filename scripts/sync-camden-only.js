#!/usr/bin/env node

/**
 * Sync Only Camden with Rich Fields
 * Minimal sync to test the rich data pipeline
 */

import { searchApplications, mapApplicationToDatabase, formatDateForAPI } from '../lib/planning-london-api.js'

async function syncCamden() {
  console.log('🚀 Syncing Camden with Rich Fields...\n')

  try {
    // Last 7 days
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 7)

    const dateFrom = formatDateForAPI(weekAgo)
    const dateTo = formatDateForAPI(today)

    console.log(`📅 Date range: ${dateFrom} to ${dateTo}`)

    // Fetch from Camden
    console.log('📡 Fetching from Camden...')
    const result = await searchApplications('Camden', dateFrom, dateTo, 0, 100)

    console.log(`✅ Found ${result.applications.length} applications`)

    if (result.applications.length === 0) {
      console.log('No applications to sync')
      return
    }

    // Map applications
    console.log('🗺️  Mapping to database format...')
    const mappedApps = result.applications.map(app => {
      const mapped = mapApplicationToDatabase(app)
      console.log(`   Mapped: ${mapped.external_id} - ${mapped.title?.substring(0, 50)}...`)
      return mapped
    })

    console.log(`\n💾 Mapped ${mappedApps.length} applications`)
    console.log('\nSample mapped application:')
    const sample = mappedApps[0]
    console.log(`   external_id: ${sample.external_id}`)
    console.log(`   title: ${sample.title?.substring(0, 80)}...`)
    console.log(`   address: ${sample.address}`)
    console.log(`   description: ${sample.description?.substring(0, 80)}...`)
    console.log(`   ward: ${sample.ward}`)
    console.log(`   url_planning_app: ${sample.url_planning_app}`)
    console.log(`   appeal_status: ${sample.appeal_status}`)

    console.log('\n✅ Rich sync test complete!')
    console.log('Next: Insert these via API endpoint to test database insertion')

  } catch (error) {
    console.error('❌ Sync failed:', error)
  }
}

syncCamden()