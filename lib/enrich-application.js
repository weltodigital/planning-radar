/**
 * Core Property Intelligence Enrichment Logic
 *
 * Analyzes planning applications using Land Registry sales data,
 * planning constraints, EPC certificates, and flood risk data.
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// Supabase client with service role key for enrichment operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Enrich a single planning application with property intelligence
 */
export async function enrichApplication({
  application_reference,
  address,
  postcode,
  latitude,
  longitude
}) {
  console.log(`🔍 Enriching application ${application_reference}...`)

  try {
    // Run all enrichment queries in parallel for performance
    const [
      landRegistryData,
      epcData,
      constraintsData,
      floodData
    ] = await Promise.all([
      analyzeLandRegistry(postcode, address, latitude, longitude),
      analyzeEPC(postcode, address),
      analyzeConstraints(latitude, longitude),
      analyzeFloodRisk(latitude, longitude)
    ])

    // Calculate opportunity score
    const opportunityScore = calculateOpportunityScore({
      landRegistry: landRegistryData,
      epc: epcData,
      constraints: constraintsData,
      flood: floodData
    })

    const enrichmentData = {
      application_reference,
      analyzed_at: new Date().toISOString(),
      opportunity_score: opportunityScore,

      // Land Registry data
      last_sale_price: landRegistryData.lastSalePrice,
      last_sale_date: landRegistryData.lastSaleDate,
      area_average_price: landRegistryData.areaAverage,
      area_median_price: landRegistryData.areaMedian,
      comparable_count: landRegistryData.comparableCount,
      price_per_sqm: landRegistryData.pricePerSqm,

      // EPC data
      epc_rating: epcData.rating,
      floor_area_sqm: epcData.floorArea,
      construction_age: epcData.constructionAge,
      property_type: epcData.propertyType,

      // Constraints
      in_conservation_area: constraintsData.inConservationArea,
      conservation_area_name: constraintsData.conservationAreaName,
      has_article_4: constraintsData.hasArticle4,
      article_4_name: constraintsData.article4Name,
      in_green_belt: constraintsData.inGreenBelt,
      in_aonb: constraintsData.inAONB,
      has_tpo: constraintsData.hasTPO,
      near_listed_building: constraintsData.nearListedBuilding,
      listed_building_details: constraintsData.listedBuildingDetails,

      // Flood risk
      flood_zone: floodData.zone,
      flood_risk_level: floodData.riskLevel,

      // Analysis metadata
      constraint_count: Object.values(constraintsData).filter(Boolean).length,
      analysis_confidence: calculateConfidence(landRegistryData, epcData, constraintsData)
    }

    // Cache the enrichment result
    await cacheEnrichment(enrichmentData)

    console.log(`✅ Enriched ${application_reference} with score ${opportunityScore}`)
    return enrichmentData

  } catch (error) {
    console.error(`❌ Failed to enrich ${application_reference}:`, error.message)
    throw error
  }
}

/**
 * Analyze Land Registry sales data
 */
async function analyzeLandRegistry(postcode, address, latitude, longitude) {
  try {
    // Check for exact property match first
    const { data: exactMatch } = await supabase
      .from('land_registry_prices')
      .select('*')
      .eq('postcode', postcode)
      .ilike('street', `%${extractStreetName(address)}%`)
      .order('date_of_transfer', { ascending: false })
      .limit(1)

    let lastSalePrice = null
    let lastSaleDate = null

    if (exactMatch && exactMatch.length > 0) {
      lastSalePrice = exactMatch[0].price
      lastSaleDate = exactMatch[0].date_of_transfer
    }

    // Get area comparables using SQL function
    const { data: comparables, error } = await supabase
      .rpc('get_comparables', {
        target_postcode: postcode,
        property_type_filter: null,
        months_back: 24,
        max_results: 50
      })

    if (error) {
      console.warn('Comparables query failed:', error.message)
      return { lastSalePrice, lastSaleDate, comparableCount: 0 }
    }

    // Calculate statistics
    const prices = comparables?.map(c => c.price) || []
    const areaAverage = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null
    const areaMedian = prices.length > 0 ? calculateMedian(prices) : null
    const pricePerSqm = null // Would need floor area from EPC

    return {
      lastSalePrice,
      lastSaleDate,
      areaAverage,
      areaMedian,
      comparableCount: prices.length,
      pricePerSqm,
      comparables: comparables?.slice(0, 10) // Return top 10 for API
    }

  } catch (error) {
    console.warn('Land Registry analysis failed:', error.message)
    return { lastSalePrice: null, lastSaleDate: null, comparableCount: 0 }
  }
}

/**
 * Analyze EPC (Energy Performance Certificate) data
 */
async function analyzeEPC(postcode, address) {
  try {
    // Check local EPC cache first
    const { data: cachedEpc } = await supabase
      .from('epc_certificates')
      .select('*')
      .eq('postcode', postcode)
      .ilike('address', `%${extractHouseNumber(address)}%`)
      .limit(1)

    if (cachedEpc && cachedEpc.length > 0) {
      const epc = cachedEpc[0]
      return {
        rating: epc.current_energy_rating,
        floorArea: epc.total_floor_area,
        constructionAge: epc.construction_age_band,
        propertyType: epc.property_type
      }
    }

    // Fallback to EPC API if not cached
    if (process.env.EPC_API_TOKEN) {
      try {
        const response = await fetch(
          `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(postcode)}`,
          {
            headers: {
              'Authorization': `Basic ${Buffer.from(process.env.EPC_API_TOKEN + ':').toString('base64')}`,
              'Accept': 'application/json'
            }
          }
        )

        if (response.ok) {
          const epcData = await response.json()
          if (epcData.rows && epcData.rows.length > 0) {
            // Find best address match
            const match = epcData.rows.find(row =>
              row.address.toLowerCase().includes(extractHouseNumber(address).toLowerCase())
            ) || epcData.rows[0]

            // Cache the result
            await cacheEPCData(postcode, address, match)

            return {
              rating: match['current-energy-rating'],
              floorArea: match['total-floor-area'],
              constructionAge: match['construction-age-band'],
              propertyType: match['property-type']
            }
          }
        }
      } catch (apiError) {
        console.warn('EPC API call failed:', apiError.message)
      }
    }

    return { rating: null, floorArea: null, constructionAge: null, propertyType: null }

  } catch (error) {
    console.warn('EPC analysis failed:', error.message)
    return { rating: null, floorArea: null, constructionAge: null, propertyType: null }
  }
}

/**
 * Analyze planning constraints at location
 */
async function analyzeConstraints(latitude, longitude) {
  if (!latitude || !longitude) {
    return { inConservationArea: false, hasArticle4: false }
  }

  try {
    const { data: constraints, error } = await supabase
      .rpc('check_constraints_at_point', {
        lng: longitude,
        lat: latitude
      })

    if (error) {
      console.warn('Constraints query failed:', error.message)
      return { inConservationArea: false, hasArticle4: false }
    }

    // Process constraint results
    const result = {
      inConservationArea: false,
      conservationAreaName: null,
      hasArticle4: false,
      article4Name: null,
      inGreenBelt: false,
      inAONB: false,
      hasTPO: false,
      nearListedBuilding: false,
      listedBuildingDetails: null
    }

    constraints?.forEach(constraint => {
      switch (constraint.dataset) {
        case 'conservation-area':
          result.inConservationArea = true
          result.conservationAreaName = constraint.name
          break
        case 'article-4-direction-area':
          result.hasArticle4 = true
          result.article4Name = constraint.name
          break
        case 'green-belt':
          result.inGreenBelt = true
          break
        case 'area-of-outstanding-natural-beauty':
          result.inAONB = true
          break
        case 'tree-preservation-zone':
          result.hasTPO = true
          break
      }
    })

    // Check for nearby listed buildings
    const { data: listedBuildings } = await supabase
      .rpc('get_nearby_listed_buildings', {
        lng: longitude,
        lat: latitude,
        buffer_metres: 50
      })

    if (listedBuildings && listedBuildings.length > 0) {
      result.nearListedBuilding = true
      result.listedBuildingDetails = listedBuildings[0] // Closest one
    }

    return result

  } catch (error) {
    console.warn('Constraints analysis failed:', error.message)
    return { inConservationArea: false, hasArticle4: false }
  }
}

/**
 * Analyze flood risk at location
 */
async function analyzeFloodRisk(latitude, longitude) {
  if (!latitude || !longitude) {
    return { zone: null, riskLevel: null }
  }

  try {
    const { data: floodData, error } = await supabase
      .rpc('check_flood_risk', {
        lng: longitude,
        lat: latitude
      })

    if (error || !floodData || floodData.length === 0) {
      return { zone: null, riskLevel: null }
    }

    // Return highest risk zone found
    const highestRisk = floodData.reduce((highest, current) => {
      const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 }
      return (riskOrder[current.risk_level] || 0) > (riskOrder[highest.risk_level] || 0)
        ? current : highest
    }, floodData[0])

    return {
      zone: highestRisk.zone,
      riskLevel: highestRisk.risk_level
    }

  } catch (error) {
    console.warn('Flood risk analysis failed:', error.message)
    return { zone: null, riskLevel: null }
  }
}

/**
 * Calculate opportunity score (0-100)
 */
function calculateOpportunityScore({ landRegistry, epc, constraints, flood }) {
  let score = 0

  // Price discount vs area average (weight 30%)
  if (landRegistry.lastSalePrice && landRegistry.areaAverage) {
    const discount = (landRegistry.areaAverage - landRegistry.lastSalePrice) / landRegistry.areaAverage
    score += Math.min(discount * 3 * 30, 30) // Cap at 30 points
  }

  // Constraint penalties (weight 20%, start at 20 and subtract)
  let constraintScore = 20
  if (constraints.inConservationArea) constraintScore -= 5
  if (constraints.hasArticle4) constraintScore -= 4
  if (constraints.inGreenBelt) constraintScore -= 8
  if (flood.riskLevel === 'High') constraintScore -= 6
  if (flood.riskLevel === 'Medium') constraintScore -= 3
  if (constraints.nearListedBuilding) constraintScore -= 3
  if (constraints.hasTPO) constraintScore -= 2
  score += Math.max(constraintScore, 0)

  // EPC improvement potential (weight 15%)
  const epcScores = { 'G': 15, 'F': 12, 'E': 10, 'D': 7, 'C': 4, 'B': 2, 'A': 1 }
  score += epcScores[epc.rating] || 7 // Default to D rating

  // Property age bonus (weight 10%)
  const ageScores = {
    'before 1930': 8,
    '1930-1949': 7,
    '1950-1966': 6,
    '1967-1975': 5,
    '1976-1982': 5,
    '1983-1990': 3,
    '1991-1995': 3,
    '1996-2002': 3,
    '2003-2006': 2,
    '2007 onwards': 2
  }
  score += ageScores[epc.constructionAge] || 5

  // Market liquidity (weight 10%)
  if (landRegistry.comparableCount) {
    score += Math.min(landRegistry.comparableCount / 10, 10)
  }

  return Math.round(Math.max(0, Math.min(100, score)))
}

/**
 * Calculate confidence level based on data availability
 */
function calculateConfidence(landRegistry, epc, constraints) {
  let confidence = 0
  if (landRegistry.comparableCount > 0) confidence += 30
  if (landRegistry.lastSalePrice) confidence += 20
  if (epc.rating) confidence += 20
  if (constraints.inConservationArea !== null) confidence += 20
  if (landRegistry.comparableCount >= 10) confidence += 10
  return Math.min(100, confidence)
}

/**
 * Cache enrichment result to database
 */
async function cacheEnrichment(enrichmentData) {
  const { error } = await supabase
    .from('application_enrichment')
    .upsert(enrichmentData, {
      onConflict: 'application_reference'
    })

  if (error) {
    console.error('Failed to cache enrichment:', error.message)
  }
}

/**
 * Cache EPC data for future use
 */
async function cacheEPCData(postcode, address, epcRecord) {
  try {
    await supabase
      .from('epc_certificates')
      .upsert({
        postcode,
        address,
        current_energy_rating: epcRecord['current-energy-rating'],
        total_floor_area: epcRecord['total-floor-area'],
        construction_age_band: epcRecord['construction-age-band'],
        property_type: epcRecord['property-type'],
        cached_at: new Date().toISOString()
      }, {
        onConflict: 'postcode,address'
      })
  } catch (error) {
    console.warn('Failed to cache EPC data:', error.message)
  }
}

/**
 * Batch enrich new applications
 */
export async function batchEnrichNewApplications(limit = 50) {
  console.log(`🔄 Starting batch enrichment (limit: ${limit})...`)

  try {
    // Find applications without enrichment
    const { data: applications } = await supabase
      .from('planning_applications')
      .select('external_id, address, postcode, lat, lng')
      .is('external_id', 'not.in', supabase
        .from('application_enrichment')
        .select('application_reference')
      )
      .not('postcode', 'is', null)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(limit)

    if (!applications || applications.length === 0) {
      console.log('✅ No new applications to enrich')
      return { enriched: 0, errors: 0 }
    }

    console.log(`📋 Found ${applications.length} applications to enrich`)

    let enriched = 0
    let errors = 0

    for (const app of applications) {
      try {
        await enrichApplication({
          application_reference: app.external_id,
          address: app.address,
          postcode: app.postcode,
          latitude: app.lat,
          longitude: app.lng
        })

        enriched++

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`Failed to enrich ${app.external_id}:`, error.message)
        errors++
      }
    }

    console.log(`✅ Batch enrichment complete: ${enriched} enriched, ${errors} errors`)
    return { enriched, errors }

  } catch (error) {
    console.error('Batch enrichment failed:', error.message)
    throw error
  }
}

// Helper functions
function extractStreetName(address) {
  if (!address) return ''
  // Remove house number and return street name
  return address.replace(/^\d+[a-zA-Z]?\s+/, '').trim()
}

function extractHouseNumber(address) {
  if (!address) return ''
  const match = address.match(/^(\d+[a-zA-Z]?)/)
  return match ? match[1] : ''
}

function calculateMedian(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}