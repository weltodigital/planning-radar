#!/usr/bin/env node

/**
 * Planning Constraints Import
 *
 * Downloads and imports planning constraint data for London from the
 * UK Government's Planning Data platform.
 *
 * Usage:
 *   node scripts/import-constraints.js                      # All datasets
 *   node scripts/import-constraints.js conservation-area    # Specific dataset
 *   node scripts/import-constraints.js --list              # Show available datasets
 *
 * Data source: https://files.planning.data.gov.uk/dataset/
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
)

// London bounding box (approximate)
const LONDON_BBOX = {
  west: -0.51,   // Western boundary
  east: 0.334,   // Eastern boundary
  south: 51.28,  // Southern boundary
  north: 51.70   // Northern boundary
}

// Available datasets
const DATASETS = {
  'conservation-area': {
    name: 'Conservation Area',
    description: 'Areas of special architectural or historic interest',
    url: 'https://files.planning.data.gov.uk/dataset/conservation-area.geojson'
  },
  'article-4-direction-area': {
    name: 'Article 4 Direction Area',
    description: 'Areas where permitted development rights are restricted',
    url: 'https://files.planning.data.gov.uk/dataset/article-4-direction-area.geojson'
  },
  'green-belt': {
    name: 'Green Belt',
    description: 'Green Belt land designation',
    url: 'https://files.planning.data.gov.uk/dataset/green-belt.geojson'
  },
  'tree-preservation-zone': {
    name: 'Tree Preservation Zone',
    description: 'Areas with protected trees',
    url: 'https://files.planning.data.gov.uk/dataset/tree-preservation-zone.geojson'
  },
  'area-of-outstanding-natural-beauty': {
    name: 'Area of Outstanding Natural Beauty',
    description: 'AONB designated areas',
    url: 'https://files.planning.data.gov.uk/dataset/area-of-outstanding-natural-beauty.geojson'
  },
  'ancient-woodland': {
    name: 'Ancient Woodland',
    description: 'Ancient woodland areas',
    url: 'https://files.planning.data.gov.uk/dataset/ancient-woodland.geojson'
  },
  'brownfield-site': {
    name: 'Brownfield Site',
    description: 'Previously developed land suitable for housing',
    url: 'https://files.planning.data.gov.uk/dataset/brownfield-site.geojson'
  },
  'listed-building': {
    name: 'Listed Building',
    description: 'Historic England listed buildings',
    url: 'https://files.planning.data.gov.uk/dataset/listed-building.geojson',
    table: 'listed_buildings'  // Special table for listed buildings
  }
}

/**
 * Check if a point/geometry intersects with London bounding box
 */
function isInLondonBounds(geometry) {
  if (!geometry || !geometry.coordinates) return false

  const coords = geometry.coordinates

  // Handle different geometry types
  let points = []
  if (geometry.type === 'Point') {
    points = [coords]
  } else if (geometry.type === 'Polygon') {
    points = coords[0] // Outer ring
  } else if (geometry.type === 'MultiPolygon') {
    points = coords[0][0] // First polygon, outer ring
  } else {
    return false // Unsupported geometry type
  }

  // Check if any point is within London bounds
  return points.some(([lng, lat]) => {
    return lng >= LONDON_BBOX.west && lng <= LONDON_BBOX.east &&
           lat >= LONDON_BBOX.south && lat <= LONDON_BBOX.north
  })
}

/**
 * Download GeoJSON data
 */
async function downloadGeoJSON(url, datasetName) {
  console.log(`📥 Downloading ${datasetName}...`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`)
  }

  const geojson = await response.json()

  if (!geojson.features) {
    throw new Error('Invalid GeoJSON: missing features array')
  }

  console.log(`📦 Downloaded ${geojson.features.length} features`)

  // Filter to London area
  const londonFeatures = geojson.features.filter(feature =>
    isInLondonBounds(feature.geometry)
  )

  console.log(`🏙️ Found ${londonFeatures.length} features in London area`)

  return londonFeatures
}

/**
 * Map GeoJSON feature to database record for planning_constraints
 */
function mapConstraintFeature(feature, dataset) {
  const props = feature.properties || {}
  const geom = feature.geometry

  return {
    entity_id: props['entity-id'] || props.id || null,
    dataset: dataset,
    name: props.name || props.title || props.reference || null,
    description: props.description || props.notes || null,
    organisation: props.organisation || props['local-authority'] || null,
    document_url: props['document-url'] || props.document || null,
    documentation_url: props['documentation-url'] || null,
    start_date: props['start-date'] || props.date || null,
    end_date: props['end-date'] || null,
    // Store geometry as GeoJSON string - PostGIS will convert it
    geometry: geom ? JSON.stringify(geom) : null,
    // Extract centroid for point queries
    point: extractCentroid(geom)
  }
}

/**
 * Map listed building feature to listed_buildings table
 */
function mapListedBuildingFeature(feature) {
  const props = feature.properties || {}
  const geom = feature.geometry

  // Extract grade from name or properties
  let grade = props.grade || props['listed-building-grade']
  if (!grade && props.name) {
    const gradeMatch = props.name.match(/Grade\s+(I\*?|II\*?|III?)/i)
    grade = gradeMatch ? gradeMatch[1] : null
  }

  return {
    entity_id: props['entity-id'] || props.id || null,
    name: props.name || props.title || null,
    grade: grade,
    list_entry: props['list-entry'] || props.reference || null,
    documentation_url: props['documentation-url'] || props.url || null,
    // Store point geometry
    point: geom && geom.type === 'Point' ? JSON.stringify(geom) : null
  }
}

/**
 * Extract centroid from geometry (simplified)
 */
function extractCentroid(geometry) {
  if (!geometry || !geometry.coordinates) return null

  if (geometry.type === 'Point') {
    return JSON.stringify(geometry)
  }

  // For polygons, use first coordinate as approximation
  // (In production, would calculate true centroid)
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0][0]
    return JSON.stringify({
      type: 'Point',
      coordinates: coords
    })
  }

  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates[0][0][0]
    return JSON.stringify({
      type: 'Point',
      coordinates: coords
    })
  }

  return null
}

/**
 * Insert constraint records in batches
 */
async function insertConstraints(records, dataset, batchSize = 1000) {
  if (records.length === 0) {
    console.log('⚠️ No records to insert')
    return { inserted: 0, errors: 0 }
  }

  // Clear existing records for this dataset
  console.log(`🗑️ Clearing existing ${dataset} records...`)
  const { error: deleteError } = await supabase
    .from('planning_constraints')
    .delete()
    .eq('dataset', dataset)

  if (deleteError) {
    console.warn('Delete warning:', deleteError.message)
  }

  const totalBatches = Math.ceil(records.length / batchSize)
  let inserted = 0
  let errors = 0

  console.log(`💾 Inserting ${records.length} records in ${totalBatches} batches...`)

  for (let i = 0; i < totalBatches; i++) {
    const batch = records.slice(i * batchSize, (i + 1) * batchSize)

    try {
      const { error } = await supabase
        .from('planning_constraints')
        .insert(batch)

      if (error) {
        console.error(`Batch ${i + 1} error:`, error)
        errors += batch.length
      } else {
        inserted += batch.length
        if ((i + 1) % 5 === 0 || i === totalBatches - 1) {
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
 * Insert listed building records in batches
 */
async function insertListedBuildings(records, batchSize = 1000) {
  if (records.length === 0) {
    console.log('⚠️ No listed buildings to insert')
    return { inserted: 0, errors: 0 }
  }

  // Clear existing listed buildings
  console.log(`🗑️ Clearing existing listed buildings...`)
  const { error: deleteError } = await supabase
    .from('listed_buildings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteError) {
    console.warn('Delete warning:', deleteError.message)
  }

  const totalBatches = Math.ceil(records.length / batchSize)
  let inserted = 0
  let errors = 0

  console.log(`💾 Inserting ${records.length} listed buildings in ${totalBatches} batches...`)

  for (let i = 0; i < totalBatches; i++) {
    const batch = records.slice(i * batchSize, (i + 1) * batchSize)

    try {
      const { error } = await supabase
        .from('listed_buildings')
        .insert(batch)

      if (error) {
        console.error(`Batch ${i + 1} error:`, error)
        errors += batch.length
      } else {
        inserted += batch.length
        if ((i + 1) % 5 === 0 || i === totalBatches - 1) {
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
 * Import a single dataset
 */
async function importDataset(datasetKey) {
  const dataset = DATASETS[datasetKey]
  if (!dataset) {
    throw new Error(`Unknown dataset: ${datasetKey}`)
  }

  console.log(`\n📋 Importing ${dataset.name}...`)
  console.log(`📝 ${dataset.description}`)

  try {
    // Download GeoJSON features
    const features = await downloadGeoJSON(dataset.url, dataset.name)

    if (features.length === 0) {
      console.log('⚠️ No features found in London area')
      return { dataset: datasetKey, inserted: 0, errors: 0 }
    }

    let result
    if (dataset.table === 'listed_buildings') {
      // Special handling for listed buildings
      const records = features.map(feature => mapListedBuildingFeature(feature))
      result = await insertListedBuildings(records)
    } else {
      // Standard constraint handling
      const records = features.map(feature => mapConstraintFeature(feature, datasetKey))
      result = await insertConstraints(records, datasetKey)
    }

    console.log(`✅ ${dataset.name} import completed: ${result.inserted} inserted, ${result.errors} errors`)

    return { dataset: datasetKey, ...result }

  } catch (error) {
    console.error(`❌ Failed to import ${dataset.name}:`, error.message)
    return { dataset: datasetKey, inserted: 0, errors: 1 }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Planning Constraints Import Script

Usage:
  node scripts/import-constraints.js                      # Import all datasets
  node scripts/import-constraints.js conservation-area    # Import specific dataset
  node scripts/import-constraints.js --list              # List available datasets

Available Datasets:
${Object.entries(DATASETS).map(([key, data]) =>
  `  ${key.padEnd(30)} ${data.name}`
).join('\n')}

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY

The script filters data to London area only and imports in batches.
    `)
    process.exit(0)
  }

  if (args.includes('--list')) {
    console.log('📋 Available Planning Constraint Datasets:\n')
    Object.entries(DATASETS).forEach(([key, data]) => {
      console.log(`🏛️  ${data.name}`)
      console.log(`   Key: ${key}`)
      console.log(`   Description: ${data.description}`)
      console.log(`   URL: ${data.url}`)
      console.log()
    })
    process.exit(0)
  }

  return {
    specific: args.length > 0 ? args[0] : null
  }
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

  console.log('🏛️ Planning Constraints Import Starting...')
  console.log(`🗺️ London bounds: ${LONDON_BBOX.west}, ${LONDON_BBOX.south} to ${LONDON_BBOX.east}, ${LONDON_BBOX.north}`)

  try {
    const results = []

    if (args.specific) {
      // Import specific dataset
      if (!DATASETS[args.specific]) {
        console.error(`❌ Unknown dataset: ${args.specific}`)
        console.log('Available datasets:', Object.keys(DATASETS).join(', '))
        process.exit(1)
      }

      const result = await importDataset(args.specific)
      results.push(result)
    } else {
      // Import all datasets
      console.log(`📦 Importing ${Object.keys(DATASETS).length} datasets...`)

      for (const datasetKey of Object.keys(DATASETS)) {
        const result = await importDataset(datasetKey)
        results.push(result)

        // Small delay between datasets
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Summary
    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
    const duration = (Date.now() - startTime) / 1000

    console.log('\n🎉 Import completed!')
    console.log(`📊 Total: ${totalInserted} inserted, ${totalErrors} errors`)
    console.log(`⏱️ Duration: ${duration.toFixed(1)}s`)
    console.log(`🏙️ Planning constraints data ready for enrichment pipeline`)

    // Per-dataset summary
    console.log('\n📋 Dataset Summary:')
    results.forEach(r => {
      const status = r.errors === 0 ? '✅' : r.inserted > 0 ? '⚠️' : '❌'
      console.log(`${status} ${r.dataset}: ${r.inserted} records`)
    })

  } catch (error) {
    console.error('💥 Import failed:', error.message)
    process.exit(1)
  }
}

main()