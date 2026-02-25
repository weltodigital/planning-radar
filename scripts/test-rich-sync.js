#!/usr/bin/env node

/**
 * Test Rich Sync Pipeline
 * Tests the updated sync pipeline with all 52 Planning London Datahub fields
 */

import { searchApplications } from '../lib/planning-london-api.js'

async function testRichSync() {
  console.log('🧪 Testing Rich Planning London Datahub Sync Pipeline...\n')

  try {
    // Test fetching from Camden (known to have data)
    console.log('📡 Fetching applications from Camden...')

    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(today.getDate() - 7)

    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    const result = await searchApplications(
      'Camden',
      formatDate(weekAgo),
      formatDate(today),
      0, // from
      1   // size - just get 1 application for testing
    )

    console.log(`✅ Found ${result.applications.length} application(s)`)

    if (result.applications.length > 0) {
      const app = result.applications[0]
      console.log('\n📋 Raw API Response Fields:')
      console.log(`   Total fields: ${Object.keys(app).length}`)

      // Show key fields
      console.log('\n🏠 Address Fields:')
      console.log(`   site_number: ${app.site_number || 'null'}`)
      console.log(`   site_name: ${app.site_name || 'null'}`)
      console.log(`   street_name: ${app.street_name || 'null'}`)
      console.log(`   locality: ${app.locality || 'null'}`)
      console.log(`   ward: ${app.ward || 'null'}`)
      console.log(`   uprn: ${app.uprn || 'null'}`)

      console.log('\n📝 Description Fields:')
      console.log(`   description: ${(app.description || 'null').substring(0, 100)}${app.description?.length > 100 ? '...' : ''}`)
      console.log(`   development_type: ${app.development_type || 'null'}`)
      console.log(`   application_type_full: ${app.application_type_full || 'null'}`)

      console.log('\n🔗 Links:')
      console.log(`   url_planning_app: ${app.url_planning_app || 'null'}`)
      console.log(`   pp_id: ${app.pp_id || 'null'}`)

      console.log('\n⚖️ Appeals:')
      console.log(`   appeal_status: ${app.appeal_status || 'null'}`)
      console.log(`   appeal_decision: ${app.appeal_decision || 'null'}`)

      // Test mapping function
      console.log('\n🗺️  Testing Mapping Function...')
      const { mapApplicationToDatabase } = await import('../lib/planning-london-api.js')
      const mappedApp = mapApplicationToDatabase(app)

      console.log(`   Mapped fields: ${Object.keys(mappedApp).length}`)
      console.log(`   external_id: ${mappedApp.external_id}`)
      console.log(`   title: ${mappedApp.title.substring(0, 80)}${mappedApp.title.length > 80 ? '...' : ''}`)
      console.log(`   address: ${mappedApp.address || 'null'}`)
      console.log(`   description: ${(mappedApp.description || 'null').substring(0, 80)}${mappedApp.description?.length > 80 ? '...' : ''}`)
      console.log(`   ward: ${mappedApp.ward || 'null'}`)
      console.log(`   url_planning_app: ${mappedApp.url_planning_app || 'null'}`)

    } else {
      console.log('❌ No applications found for Camden in the last 7 days')
      console.log('   This might be normal - try extending the date range')
    }

    console.log('\n✅ Rich sync pipeline test complete!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testRichSync()