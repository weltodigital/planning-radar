/**
 * Postcode Geocoding using postcodes.io API
 * Free service that converts UK postcodes to lat/lng coordinates
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { GeocodeResult } from '@/lib/types'

export interface PostcodesIoResponse {
  status: number
  result: {
    postcode: string
    quality: number
    eastings: number
    northings: number
    country: string
    nhs_ha: string
    longitude: number
    latitude: number
    european_electoral_region: string
    primary_care_trust: string
    region: string
    lsoa: string
    msoa: string
    incode: string
    outcode: string
    parliamentary_constituency: string
    admin_district: string
    parish: string
    admin_county: string | null
    date_of_introduction: string
    admin_ward: string
    ced: string | null
    ccg: string
    nuts: string
    pfa: string
    // ... many more fields available
  } | null
}

export interface PostcodesBulkResponse {
  status: number
  result: Array<{
    query: string
    result: PostcodesIoResponse['result']
  }>
}

/**
 * Normalize postcode format for consistent storage and API calls
 */
export function normalizePostcode(postcode: string): string {
  if (!postcode) return ''

  // Remove all spaces and convert to uppercase
  const clean = postcode.replace(/\s+/g, '').toUpperCase()

  // Add space before the last 3 characters if it's a valid UK postcode format
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(clean)) {
    return clean.slice(0, -3) + ' ' + clean.slice(-3)
  }

  return clean
}

/**
 * Check if postcode is valid UK format
 */
export function isValidUKPostcode(postcode: string): boolean {
  const normalized = normalizePostcode(postcode)
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(normalized)
}

/**
 * Get coordinates for a postcode, with caching in database
 */
export async function geocodePostcode(postcode: string): Promise<GeocodeResult | null> {
  if (!postcode) return null

  const normalizedPostcode = normalizePostcode(postcode)

  if (!isValidUKPostcode(normalizedPostcode)) {
    console.warn(`Invalid UK postcode format: ${postcode}`)
    return null
  }

  try {
    const supabase = await createServiceRoleClient()

    // Check cache first
    const { data: cached, error: cacheError } = await (supabase
      .from('postcode_cache') as any)
      .select('lat, lng')
      .eq('postcode', normalizedPostcode)
      .single()

    if (!cacheError && cached) {
      return {
        lat: Number(cached.lat),
        lng: Number(cached.lng)
      }
    }

    // Not in cache, fetch from postcodes.io
    console.log(`Geocoding postcode: ${normalizedPostcode}`)

    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalizedPostcode)}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Postcode not found: ${normalizedPostcode}`)
        return null
      }
      throw new Error(`Postcodes.io API error: ${response.status}`)
    }

    const data: PostcodesIoResponse = await response.json()

    if (data.status !== 200 || !data.result) {
      console.warn(`No result for postcode: ${normalizedPostcode}`)
      return null
    }

    const result: GeocodeResult = {
      lat: data.result.latitude,
      lng: data.result.longitude
    }

    // Cache the result
    try {
      await (supabase
        .from('postcode_cache') as any)
        .insert({
          postcode: normalizedPostcode,
          lat: result.lat,
          lng: result.lng
        })
    } catch (insertError) {
      // Don't fail if caching fails, just log it
      console.warn('Failed to cache postcode:', insertError)
    }

    return result
  } catch (error) {
    console.error(`Error geocoding postcode ${normalizedPostcode}:`, error)
    return null
  }
}

/**
 * Batch geocode multiple postcodes (up to 100 at once)
 * More efficient for bulk operations
 */
export async function geocodePostcodesBatch(postcodes: string[]): Promise<Map<string, GeocodeResult | null>> {
  const results = new Map<string, GeocodeResult | null>()

  if (postcodes.length === 0) return results

  // Normalize and deduplicate postcodes
  const normalizedPostcodes = Array.from(
    new Set(postcodes.map(pc => normalizePostcode(pc)).filter(pc => isValidUKPostcode(pc)))
  )

  if (normalizedPostcodes.length === 0) return results

  try {
    const supabase = await createServiceRoleClient()

    // Check cache for all postcodes
    const { data: cached } = await supabase
      .from('postcode_cache')
      .select('postcode, lat, lng')
      .in('postcode', normalizedPostcodes)

    // Build map of cached results
    const cachedMap = new Map<string, GeocodeResult>()
    if (cached) {
      for (const item of cached) {
        cachedMap.set(item.postcode, {
          lat: Number(item.lat),
          lng: Number(item.lng)
        })
      }
    }

    // Find postcodes not in cache
    const uncachedPostcodes = normalizedPostcodes.filter(pc => !cachedMap.has(pc))

    // Process cached results
    for (const postcode of normalizedPostcodes) {
      if (cachedMap.has(postcode)) {
        results.set(postcode, cachedMap.get(postcode)!)
      }
    }

    // Batch geocode uncached postcodes (max 100 per request)
    const batchSize = 100
    for (let i = 0; i < uncachedPostcodes.length; i += batchSize) {
      const batch = uncachedPostcodes.slice(i, i + batchSize)

      console.log(`Geocoding batch of ${batch.length} postcodes...`)

      const response = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postcodes: batch
        })
      })

      if (!response.ok) {
        throw new Error(`Batch geocoding failed: ${response.status}`)
      }

      const data: PostcodesBulkResponse = await response.json()

      if (data.status === 200 && data.result) {
        const cacheInserts = []

        for (const item of data.result) {
          const postcode = normalizePostcode(item.query)

          if (item.result) {
            const geocodeResult: GeocodeResult = {
              lat: item.result.latitude,
              lng: item.result.longitude
            }

            results.set(postcode, geocodeResult)

            // Prepare for cache insertion
            cacheInserts.push({
              postcode,
              lat: geocodeResult.lat,
              lng: geocodeResult.lng
            })
          } else {
            results.set(postcode, null)
          }
        }

        // Batch insert to cache
        if (cacheInserts.length > 0) {
          try {
            await supabase
              .from('postcode_cache')
              .insert(cacheInserts)
          } catch (insertError) {
            console.warn('Failed to cache postcode batch:', insertError)
          }
        }
      }

      // Rate limiting - wait 100ms between batches
      if (i + batchSize < uncachedPostcodes.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

  } catch (error) {
    console.error('Error in batch geocoding:', error)
  }

  return results
}

/**
 * Calculate distance between two geographic points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert miles to meters for PostGIS queries
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.34
}

/**
 * Convert meters to miles for display
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.34
}