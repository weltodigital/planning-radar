/**
 * Geocoding Helper
 * Handles postcode to lat/lng conversion using postcodes.io (free API)
 * Includes caching to database for performance
 */

import { createServiceClient } from './supabase/pages-client'

/**
 * Normalize postcode format
 * @param {string} postcode - Raw postcode input
 * @returns {string} Normalized postcode (uppercase, proper spacing)
 */
function normalizePostcode(postcode) {
  if (!postcode) return null

  // Remove all spaces and convert to uppercase
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase()

  // UK postcode format: AA9A 9AA or A9A 9AA or AA9 9AA or A9 9AA
  const match = cleaned.match(/^([A-Z]{1,2})(\d{1,2})([A-Z]?)(\d)([A-Z]{2})$/)

  if (!match) return null

  const [, area, district, subdistrict, sector, unit] = match
  return `${area}${district}${subdistrict} ${sector}${unit}`
}

/**
 * Check if postcode exists in cache
 * @param {string} postcode - Normalized postcode
 * @returns {Promise<Object|null>} Cached coordinates or null
 */
async function getFromCache(postcode) {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('postcode_cache')
      .select('lat, lng')
      .eq('postcode', postcode)
      .single()

    if (error || !data) return null

    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng)
    }
  } catch (error) {
    console.error('Error checking postcode cache:', error)
    return null
  }
}

/**
 * Save coordinates to cache
 * @param {string} postcode - Normalized postcode
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
async function saveToCache(postcode, lat, lng) {
  try {
    const supabase = createServiceClient()

    await supabase
      .from('postcode_cache')
      .upsert({
        postcode,
        lat,
        lng,
        cached_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error saving to postcode cache:', error)
  }
}

/**
 * Fetch coordinates from postcodes.io API
 * @param {string} postcode - Normalized postcode
 * @returns {Promise<Object|null>} Coordinates or null
 */
async function fetchFromAPI(postcode) {
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null // Invalid postcode
      }
      throw new Error(`Postcodes.io API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 200 && data.result) {
      return {
        lat: data.result.latitude,
        lng: data.result.longitude
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching from postcodes.io:', error)
    return null
  }
}

/**
 * Geocode a UK postcode to lat/lng coordinates
 * @param {string} postcode - Raw postcode input
 * @returns {Promise<Object|null>} { lat: number, lng: number } or null
 */
export async function geocodePostcode(postcode) {
  // Normalize the postcode
  const normalizedPostcode = normalizePostcode(postcode)

  if (!normalizedPostcode) {
    return null
  }

  try {
    // 1. Check cache first
    const cached = await getFromCache(normalizedPostcode)
    if (cached) {
      return cached
    }

    // 2. Fetch from API
    const coordinates = await fetchFromAPI(normalizedPostcode)

    if (coordinates) {
      // 3. Save to cache for future use
      await saveToCache(normalizedPostcode, coordinates.lat, coordinates.lng)
      return coordinates
    }

    return null

  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Convert miles to meters for PostGIS queries
 * @param {number} miles - Distance in miles
 * @returns {number} Distance in meters
 */
export function milesToMeters(miles) {
  return miles * 1609.34
}

/**
 * Get popular postcodes for autocomplete suggestions
 * @returns {Array<string>} Array of cached postcodes
 */
export async function getPopularPostcodes() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('postcode_cache')
      .select('postcode')
      .order('cached_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching popular postcodes:', error)
      return []
    }

    return (data || []).map(item => item.postcode)

  } catch (error) {
    console.error('Error getting popular postcodes:', error)
    return []
  }
}

/**
 * Validate UK postcode format
 * @param {string} postcode - Postcode to validate
 * @returns {boolean} True if valid format
 */
export function isValidPostcode(postcode) {
  if (!postcode) return false

  const cleaned = postcode.replace(/\s+/g, '').toUpperCase()

  // UK postcode regex patterns
  const patterns = [
    /^[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2}$/, // Full postcode
    /^[A-Z]{1,2}\d{1,2}[A-Z]?$/ // Partial postcode (outward code)
  ]

  return patterns.some(pattern => pattern.test(cleaned))
}