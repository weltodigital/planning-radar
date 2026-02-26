/**
 * Interactive Map Component with Planning Applications
 *
 * Uses Mapbox GL JS to display planning applications as markers with clustering,
 * constraint overlays, and interactive popups for detailed property intelligence.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

const MapView = ({
  applications = [],
  onApplicationClick = null,
  constraints = [],
  showConstraints = false,
  height = '500px'
}) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [layerControls, setLayerControls] = useState({
    conservationAreas: false,
    article4Areas: false,
    greenBelt: false,
    floodZones: false
  })

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-0.118, 51.509], // London center
      zoom: 11,
      pitch: 0,
      bearing: 0
    })

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left')

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Add application markers
  useEffect(() => {
    if (!mapLoaded || !map.current || !applications.length) return

    // Create GeoJSON from applications
    const geojson = {
      type: 'FeatureCollection',
      features: applications
        .filter(app => app.lat && app.lng)
        .map(app => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(app.lng), parseFloat(app.lat)]
          },
          properties: {
            id: app.id,
            reference: app.reference,
            title: app.description || app.title,
            address: app.address,
            status: app.status,
            council: app.council,
            date_validated: app.date_validated,
            opportunity_score: app.opportunity_score,
            last_sale_price: app.last_sale_price,
            external_link: app.external_link
          }
        }))
    }

    // Add source if it doesn't exist
    if (!map.current.getSource('applications')) {
      map.current.addSource('applications', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      })

      // Add cluster circles
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'applications',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#0F766E', // teal-700
            100, '#0891B2', // cyan-600
            750, '#0369A1'  // blue-700
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100, 30,
            750, 40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      })

      // Add cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'applications',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#FFFFFF'
        }
      })

      // Add individual application markers
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'applications',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'status'],
            'Approved', '#22C55E', // green-500
            'Granted', '#22C55E',
            'Permitted', '#22C55E',
            'Refused', '#EF4444',   // red-500
            'Rejected', '#EF4444',
            'Pending', '#F59E0B',   // amber-500
            'Under Consideration', '#F59E0B',
            'Withdrawn', '#9CA3AF', // gray-400
            '#6B7280' // Default gray-500
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 6,
            15, 12
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-opacity': 0.8
        }
      })

      // Add click handlers
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        })
        const clusterId = features[0].properties.cluster_id
        map.current.getSource('applications').getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return

            map.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            })
          }
        )
      })

      // Individual marker click
      map.current.on('click', 'unclustered-point', (e) => {
        const application = e.features[0].properties

        // Create popup content
        const popupContent = createPopupContent(application)

        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(e.geometry.coordinates)
          .setHTML(popupContent)
          .addTo(map.current)
      })

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', 'clusters', () => {
        map.current.getCanvas().style.cursor = ''
      })
      map.current.on('mouseenter', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = ''
      })

    } else {
      // Update existing source
      map.current.getSource('applications').setData(geojson)
    }

  }, [mapLoaded, applications])

  // Add constraint layers
  useEffect(() => {
    if (!mapLoaded || !map.current) return

    // Add constraint layers when showConstraints is true
    if (showConstraints && Object.values(layerControls).some(Boolean)) {
      loadConstraintLayers()
    }
  }, [mapLoaded, showConstraints, layerControls])

  const loadConstraintLayers = async () => {
    try {
      // Get map bounds
      const bounds = map.current.getBounds()
      const boundsArray = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ]

      const response = await fetch(`/api/map/constraints?bbox=${boundsArray.join(',')}`)
      const constraintsData = await response.json()

      if (response.ok && constraintsData.success) {
        addConstraintLayers(constraintsData.data)
      }
    } catch (error) {
      console.error('Failed to load constraint layers:', error)
    }
  }

  const addConstraintLayers = (constraintsData) => {
    // Conservation Areas
    if (layerControls.conservationAreas && constraintsData.conservationAreas) {
      if (!map.current.getSource('conservation-areas')) {
        map.current.addSource('conservation-areas', {
          type: 'geojson',
          data: constraintsData.conservationAreas
        })

        map.current.addLayer({
          id: 'conservation-areas-fill',
          type: 'fill',
          source: 'conservation-areas',
          paint: {
            'fill-color': '#0F766E', // teal
            'fill-opacity': 0.3
          }
        })

        map.current.addLayer({
          id: 'conservation-areas-line',
          type: 'line',
          source: 'conservation-areas',
          paint: {
            'line-color': '#0F766E',
            'line-width': 2,
            'line-opacity': 0.8
          }
        })
      }
    }

    // Article 4 Areas
    if (layerControls.article4Areas && constraintsData.article4Areas) {
      if (!map.current.getSource('article4-areas')) {
        map.current.addSource('article4-areas', {
          type: 'geojson',
          data: constraintsData.article4Areas
        })

        map.current.addLayer({
          id: 'article4-areas-fill',
          type: 'fill',
          source: 'article4-areas',
          paint: {
            'fill-color': '#EF4444', // red
            'fill-opacity': 0.2
          }
        })

        map.current.addLayer({
          id: 'article4-areas-line',
          type: 'line',
          source: 'article4-areas',
          paint: {
            'line-color': '#EF4444',
            'line-width': 2,
            'line-opacity': 0.8
          }
        })
      }
    }

    // Add other constraint layers similarly...
  }

  const toggleLayer = (layerName) => {
    setLayerControls(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }))

    // Remove layer if turning off
    if (layerControls[layerName]) {
      const layerIds = getLayerIdsForConstraint(layerName)
      layerIds.forEach(id => {
        if (map.current.getLayer(id)) {
          map.current.removeLayer(id)
        }
      })

      const sourceId = getSourceIdForConstraint(layerName)
      if (map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId)
      }
    }
  }

  const getLayerIdsForConstraint = (constraint) => {
    const mapping = {
      conservationAreas: ['conservation-areas-fill', 'conservation-areas-line'],
      article4Areas: ['article4-areas-fill', 'article4-areas-line'],
      greenBelt: ['green-belt-fill', 'green-belt-line'],
      floodZones: ['flood-zones-fill', 'flood-zones-line']
    }
    return mapping[constraint] || []
  }

  const getSourceIdForConstraint = (constraint) => {
    const mapping = {
      conservationAreas: 'conservation-areas',
      article4Areas: 'article4-areas',
      greenBelt: 'green-belt',
      floodZones: 'flood-zones'
    }
    return mapping[constraint]
  }

  const createPopupContent = (app) => {
    const statusColor = getStatusColor(app.status)
    const formatPrice = (price) => price ? `£${parseInt(price).toLocaleString()}` : 'N/A'
    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A'

    return `
      <div class="p-4 min-w-[300px] max-w-[400px]">
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-semibold text-gray-900 text-sm leading-tight pr-2">${app.title}</h3>
          <span class="px-2 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap" style="background-color: ${statusColor}">
            ${app.status}
          </span>
        </div>

        <p class="text-gray-600 text-sm mb-3">${app.address}</p>

        <div class="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
          <div>
            <span class="font-medium">Council:</span><br>
            ${app.council}
          </div>
          <div>
            <span class="font-medium">Date:</span><br>
            ${formatDate(app.date_validated)}
          </div>
          ${app.opportunity_score ? `
            <div>
              <span class="font-medium">Opportunity:</span><br>
              <span class="px-1 py-0.5 rounded text-xs ${app.opportunity_score >= 70 ? 'bg-green-100 text-green-800' : app.opportunity_score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}">
                ${app.opportunity_score}/100
              </span>
            </div>
          ` : ''}
          ${app.last_sale_price ? `
            <div>
              <span class="font-medium">Last Sale:</span><br>
              ${formatPrice(app.last_sale_price)}
            </div>
          ` : ''}
        </div>

        <div class="flex space-x-2">
          <button
            onclick="window.dispatchEvent(new CustomEvent('mapApplicationClick', { detail: '${app.reference}' }))"
            class="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
          ${app.external_link ? `
            <a
              href="${app.external_link}"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-700 transition-colors text-center"
            >
              Council Portal
            </a>
          ` : ''}
        </div>
      </div>
    `
  }

  const getStatusColor = (status) => {
    const colors = {
      'Approved': '#22C55E',
      'Granted': '#22C55E',
      'Permitted': '#22C55E',
      'Refused': '#EF4444',
      'Rejected': '#EF4444',
      'Pending': '#F59E0B',
      'Under Consideration': '#F59E0B',
      'Withdrawn': '#9CA3AF'
    }
    return colors[status] || '#6B7280'
  }

  // Listen for application clicks from popup
  useEffect(() => {
    const handleMapApplicationClick = (event) => {
      if (onApplicationClick) {
        const reference = event.detail
        const application = applications.find(app => app.reference === reference)
        if (application) {
          onApplicationClick(application)
        }
      }
    }

    window.addEventListener('mapApplicationClick', handleMapApplicationClick)
    return () => window.removeEventListener('mapApplicationClick', handleMapApplicationClick)
  }, [applications, onApplicationClick])

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map View Unavailable</h3>
          <p className="text-gray-600 text-sm">
            Mapbox token required. Add NEXT_PUBLIC_MAPBOX_TOKEN to environment variables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height }}>
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Layer Controls */}
      {showConstraints && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 text-sm">
          <h4 className="font-medium text-gray-900 mb-2">Map Layers</h4>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={layerControls.conservationAreas}
              onChange={() => toggleLayer('conservationAreas')}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-gray-700">Conservation Areas</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={layerControls.article4Areas}
              onChange={() => toggleLayer('article4Areas')}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-gray-700">Article 4 Directions</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={layerControls.greenBelt}
              onChange={() => toggleLayer('greenBelt')}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700">Green Belt</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={layerControls.floodZones}
              onChange={() => toggleLayer('floodZones')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Flood Zones</span>
          </label>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="font-medium text-gray-900 mb-2 text-sm">Application Status</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Approved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Refused</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Withdrawn</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapView