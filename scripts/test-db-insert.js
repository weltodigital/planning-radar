#!/usr/bin/env node

/**
 * Test Database Insert with Rich Fields
 * Tests direct database insertion to identify schema cache issues
 */

import { createServiceClient } from '../lib/supabase/pages-client.js'
import { searchApplications, mapApplicationToDatabase } from '../lib/planning-london-api.js'

async function testDatabaseInsert() {
  console.log('🧪 Testing Database Insert with Rich Fields...\n')

  try {
    // Get one application from Camden
    console.log('📡 Fetching one application from Camden...')
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
      0,
      1
    )

    if (result.applications.length === 0) {
      console.log('❌ No applications found')
      return
    }

    const rawApp = result.applications[0]
    console.log('✅ Got raw application data')

    // Map to database format
    const mappedApp = mapApplicationToDatabase(rawApp)
    console.log('✅ Mapped to database format')
    console.log(`   Fields in mapped object: ${Object.keys(mappedApp).length}`)

    // Test database insert
    console.log('\n💾 Testing database insertion...')

    const supabase = createServiceClient()

    // First, let's check what columns actually exist in the table
    console.log('🔍 Checking table schema...')
    const { data: schemaData, error: schemaError } = await supabase
      .from('planning_applications')
      .select('*')
      .limit(1)

    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError)
      return
    }

    const existingColumns = schemaData.length > 0 ? Object.keys(schemaData[0]) : []
    console.log(`   Existing columns: ${existingColumns.length}`)
    console.log(`   Sample columns: ${existingColumns.slice(0, 10).join(', ')}...`)

    // Filter mapped application to only include existing columns
    const safeApp = {}
    Object.keys(mappedApp).forEach(key => {
      if (existingColumns.includes(key) || existingColumns.length === 0) {
        safeApp[key] = mappedApp[key]
      } else {
        console.log(`⚠️  Skipping unknown column: ${key}`)
      }
    })

    console.log(`\n📝 Attempting insert with ${Object.keys(safeApp).length} fields...`)

    const { data: insertData, error: insertError } = await supabase
      .from('planning_applications')
      .upsert([safeApp], {
        onConflict: 'external_id',
        ignoreDuplicates: false
      })
      .select()

    if (insertError) {
      console.error('❌ Insert failed:', insertError)
      console.log('\n🔍 Problematic fields might be:')
      console.log('   Fields in mapped app:', Object.keys(mappedApp).slice(0, 20).join(', '))
    } else {
      console.log('✅ Insert successful!')
      console.log(`   Inserted application: ${safeApp.external_id}`)
      console.log(`   Title: ${safeApp.title?.substring(0, 60)}...`)
      console.log(`   Address: ${safeApp.address}`)
      console.log(`   Ward: ${safeApp.ward || 'null'}`)
      console.log(`   Description: ${safeApp.description?.substring(0, 60)}...`)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDatabaseInsert()