/**
 * Map Constraints API
 *
 * Provides GeoJSON data for planning constraints overlay layers
 * including conservation areas, Article 4 directions, green belt, and flood zones.
 */

import { createClient } from '@supabase/supabase-js'

// Supabase client with service role for spatial queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { bbox, types } = req.query

  if (!bbox) {
    return res.status(400).json({ error: 'Bounding box (bbox) parameter is required' })
  }

  try {
    // Parse bounding box: west,south,east,north
    const [west, south, east, north] = bbox.split(',').map(parseFloat)

    if ([west, south, east, north].some(isNaN)) {
      return res.status(400).json({ error: 'Invalid bounding box format. Expected: west,south,east,north' })
    }

    // Create bounding box polygon for PostGIS query
    const bboxPolygon = `POLYGON((${west} ${south}, ${east} ${south}, ${east} ${north}, ${west} ${north}, ${west} ${south}))`

    // Default to all constraint types if not specified
    const constraintTypes = types ? types.split(',') : [
      'conservation-area',
      'article-4-direction-area',
      'green-belt',
      'tree-preservation-zone',
      'area-of-outstanding-natural-beauty',
      'ancient-woodland',
      'brownfield-site'
    ]

    console.log(`🗺️ Fetching constraints for bbox: ${bbox}`)

    const constraintsData = {}

    // Fetch constraints that intersect with the bounding box
    for (const dataset of constraintTypes) {
      try {
        // Fetch all constraints for this dataset (simplified approach for now)
        const { data: constraints } = await supabase
          .from('planning_constraints')
          .select('name, description, dataset, geometry')
          .eq('dataset', dataset)
          .not('geometry', 'is', null)
          .limit(1000) // Reasonable limit for map display

        if (constraints && constraints.length > 0) {
          const validConstraints = constraints.map(constraint => {
            let geometry
            try {
              geometry = typeof constraint.geometry === 'string'
                ? JSON.parse(constraint.geometry)
                : constraint.geometry
            } catch (e) {
              console.warn(`Invalid geometry for constraint ${constraint.name}`)
              return null
            }

            // Basic bounding box check for performance
            if (geometry && geometry.coordinates) {
              const isInBounds = checkGeometryInBounds(geometry, { west, south, east, north })
              if (!isInBounds) {
                return null
              }
            }

            return {
              type: 'Feature',
              geometry,
              properties: {
                name: constraint.name,
                description: constraint.description,
                dataset: constraint.dataset
              }
            }
          }).filter(Boolean)

          if (validConstraints.length > 0) {
            constraintsData[getConstraintKey(dataset)] = {
              type: 'FeatureCollection',
              features: validConstraints
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${dataset} constraints:`, error.message)
      }
    }

    // Also fetch flood risk zones if available
    if (constraintTypes.includes('flood-risk') || !types) {
      try {
        const { data: floodZones } = await supabase
          .from('flood_risk_zones')
          .select('zone, source, risk_level, geometry')
          .not('geometry', 'is', null)
          .limit(500)

        if (floodZones && floodZones.length > 0) {
          const floodFeatures = floodZones.map(zone => {
            let geometry
            try {
              geometry = typeof zone.geometry === 'string'
                ? JSON.parse(zone.geometry)
                : zone.geometry
            } catch (e) {
              return null
            }

            return {
              type: 'Feature',
              geometry,
              properties: {
                zone: zone.zone,
                source: zone.source,
                risk_level: zone.risk_level
              }
            }
          }).filter(Boolean)

          if (floodFeatures.length > 0) {
            constraintsData.floodZones = {
              type: 'FeatureCollection',
              features: floodFeatures
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch flood zones:', error.message)
      }
    }

    const totalFeatures = Object.values(constraintsData)
      .reduce((sum, collection) => sum + (collection.features?.length || 0), 0)

    console.log(`✅ Fetched ${totalFeatures} constraint features across ${Object.keys(constraintsData).length} datasets`)

    return res.status(200).json({
      success: true,
      data: constraintsData,
      bbox: { west, south, east, north },
      summary: {
        datasets: Object.keys(constraintsData).length,
        total_features: totalFeatures
      }
    })

  } catch (error) {
    console.error('❌ Map constraints API failed:', error.message)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch map constraints',
      details: error.message
    })
  }
}

/**
 * Basic bounding box intersection check for geometries
 */
function checkGeometryInBounds(geometry, bounds) {
  try {
    const { west, south, east, north } = bounds

    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates
      return lng >= west && lng <= east && lat >= south && lat <= north
    }

    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      // Check if any coordinate is within bounds
      const coords = geometry.type === 'Polygon'
        ? geometry.coordinates[0]
        : geometry.coordinates[0][0]

      return coords.some(([lng, lat]) =>
        lng >= west && lng <= east && lat >= south && lat <= north
      )
    }

    // For other geometry types, assume they might be relevant
    return true
  } catch (error) {
    console.warn('Geometry bounds check failed:', error.message)
    return true // Include if we can't check
  }
}

/**
 * Map dataset names to consistent keys for frontend
 */
function getConstraintKey(dataset) {
  const mapping = {
    'conservation-area': 'conservationAreas',
    'article-4-direction-area': 'article4Areas',
    'green-belt': 'greenBelt',
    'tree-preservation-zone': 'treePreservation',
    'area-of-outstanding-natural-beauty': 'aonb',
    'ancient-woodland': 'ancientWoodland',
    'brownfield-site': 'brownfieldSites'
  }
  return mapping[dataset] || dataset.replace(/-/g, '')
}