/**
 * Property Intelligence Enrichment Panel
 *
 * Displays comprehensive property analysis including opportunity score,
 * price intelligence, constraints, and risk factors for planning applications.
 */

import React, { useState } from 'react'
import { useApplicationEnrichment } from '../hooks/useEnrichment'

const EnrichmentPanel = ({ applicationReference }) => {
  const { enrichment, loading, error } = useApplicationEnrichment(applicationReference)
  const [expandedSection, setExpandedSection] = useState(null)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-teal-100 rounded-lg animate-pulse"></div>
          <div className="h-6 bg-slate-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-slate-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-red-700">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" />
          </svg>
          <span className="font-medium">Property Intelligence Unavailable</span>
        </div>
        <p className="text-red-600 mt-2 text-sm">
          Unable to analyze this property. This may be due to missing location data or API issues.
        </p>
      </div>
    )
  }

  if (!enrichment) return null

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Property Intelligence</h3>
        </div>
        <div className="text-xs text-slate-500">
          Analyzed {new Date(enrichment.analyzed_at).toLocaleDateString()}
        </div>
      </div>

      {/* Opportunity Score */}
      <OpportunityScore
        score={enrichment.opportunity_score}
        confidence={enrichment.analysis_confidence}
        expanded={expandedSection === 'opportunity'}
        onToggle={() => toggleSection('opportunity')}
      />

      {/* Price Intelligence */}
      <PriceIntelligence
        data={enrichment}
        expanded={expandedSection === 'price'}
        onToggle={() => toggleSection('price')}
      />

      {/* Property Details */}
      <PropertyDetails
        data={enrichment}
        expanded={expandedSection === 'property'}
        onToggle={() => toggleSection('property')}
      />

      {/* Planning Constraints */}
      <PlanningConstraints
        data={enrichment}
        expanded={expandedSection === 'constraints'}
        onToggle={() => toggleSection('constraints')}
      />

      {/* Risk Factors */}
      {(enrichment.flood_zone || enrichment.constraint_count > 0) && (
        <RiskFactors
          data={enrichment}
          expanded={expandedSection === 'risks'}
          onToggle={() => toggleSection('risks')}
        />
      )}
    </div>
  )
}

const OpportunityScore = ({ score, confidence, expanded, onToggle }) => {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-700 bg-emerald-100'
    if (score >= 50) return 'text-amber-700 bg-amber-100'
    return 'text-red-700 bg-red-100'
  }

  const getProgressColor = (score) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(score)}`}>
            {score}/100
          </div>
          <div>
            <h4 className="font-medium text-slate-900">Opportunity Score</h4>
            <p className="text-sm text-slate-600">Development potential assessment</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Investment Potential</span>
          <span>{confidence}% confidence</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-sm text-slate-600 space-y-2">
            <p><strong>Score Breakdown:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Price advantage vs area average</li>
              <li>Planning constraint penalties</li>
              <li>EPC improvement potential</li>
              <li>Property age and character</li>
              <li>Market liquidity factors</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

const PriceIntelligence = ({ data, expanded, onToggle }) => {
  const formatPrice = (price) => {
    if (!price) return 'N/A'
    return `£${price.toLocaleString()}`
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h4 className="font-medium text-slate-900">Price Intelligence</h4>
          <p className="text-sm text-slate-600">{data.comparable_count || 0} recent sales analyzed</p>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {formatPrice(data.last_sale_price)}
              </div>
              <div className="text-sm text-slate-600">Last Sale</div>
              <div className="text-xs text-slate-500 mt-1">
                {formatDate(data.last_sale_date)}
              </div>
            </div>

            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {formatPrice(data.area_average_price)}
              </div>
              <div className="text-sm text-slate-600">Area Average</div>
            </div>

            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {formatPrice(data.area_median_price)}
              </div>
              <div className="text-sm text-slate-600">Area Median</div>
            </div>

            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-lg font-semibold text-slate-900">
                {data.price_per_sqm ? `£${data.price_per_sqm}/m²` : 'N/A'}
              </div>
              <div className="text-sm text-slate-600">Price per m²</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PropertyDetails = ({ data, expanded, onToggle }) => {
  const getEPCColor = (rating) => {
    const colors = {
      'A': 'bg-emerald-600 text-white',
      'B': 'bg-emerald-500 text-white',
      'C': 'bg-green-500 text-white',
      'D': 'bg-yellow-500 text-white',
      'E': 'bg-amber-500 text-white',
      'F': 'bg-orange-500 text-white',
      'G': 'bg-red-500 text-white'
    }
    return colors[rating] || 'bg-slate-300 text-slate-700'
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-3">
          {data.epc_rating && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getEPCColor(data.epc_rating)}`}>
              {data.epc_rating}
            </div>
          )}
          <div>
            <h4 className="font-medium text-slate-900">Property Details</h4>
            <p className="text-sm text-slate-600">Energy and construction data</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">EPC Rating</span>
              <span className="text-sm font-medium text-slate-900">
                {data.epc_rating || 'Not available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Floor Area</span>
              <span className="text-sm font-medium text-slate-900">
                {data.floor_area_sqm ? `${data.floor_area_sqm} m²` : 'Not available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Construction Age</span>
              <span className="text-sm font-medium text-slate-900">
                {data.construction_age || 'Not available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Property Type</span>
              <span className="text-sm font-medium text-slate-900">
                {data.property_type || 'Not available'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PlanningConstraints = ({ data, expanded, onToggle }) => {
  const constraints = [
    {
      active: data.in_conservation_area,
      name: 'Conservation Area',
      detail: data.conservation_area_name,
      style: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      active: data.has_article_4,
      name: 'Article 4',
      detail: data.article_4_name,
      style: 'bg-red-100 text-red-800 border-red-300'
    },
    {
      active: data.in_green_belt,
      name: 'Green Belt',
      style: 'bg-red-100 text-red-800 border-red-300'
    },
    {
      active: data.in_aonb,
      name: 'AONB',
      style: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      active: data.has_tpo,
      name: 'Tree Protection',
      style: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      active: data.near_listed_building,
      name: 'Near Listed Building',
      detail: data.listed_building_details?.name,
      style: 'bg-amber-100 text-amber-800 border-amber-300'
    }
  ]

  const activeConstraints = constraints.filter(c => c.active)

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h4 className="font-medium text-slate-900">Planning Constraints</h4>
          <p className="text-sm text-slate-600">
            {activeConstraints.length > 0 ? `${activeConstraints.length} constraint(s) found` : 'No major constraints'}
          </p>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        {activeConstraints.length > 0 ? (
          activeConstraints.map((constraint, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${constraint.style}`}
              title={constraint.detail}
            >
              {constraint.name}
            </span>
          ))
        ) : (
          <span className="px-3 py-1 rounded-full text-sm font-medium border bg-emerald-100 text-emerald-800 border-emerald-300">
            No major constraints
          </span>
        )}
      </div>

      {expanded && activeConstraints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            {activeConstraints.map((constraint, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium text-slate-900">{constraint.name}:</span>
                <span className="text-slate-600 ml-2">
                  {constraint.detail || 'Active in this area'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const RiskFactors = ({ data, expanded, onToggle }) => {
  const risks = []

  if (data.flood_zone) {
    risks.push({
      type: 'Flood Risk',
      level: data.flood_risk_level,
      detail: `${data.flood_zone} zone`
    })
  }

  if (data.constraint_count > 2) {
    risks.push({
      type: 'Multiple Constraints',
      level: 'Medium',
      detail: `${data.constraint_count} planning constraints`
    })
  }

  if (risks.length === 0) return null

  return (
    <div className="border border-red-200 rounded-xl p-4 bg-red-50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-red-900">Risk Factors</h4>
            <p className="text-sm text-red-700">{risks.length} risk(s) identified</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-red-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="space-y-3">
            {risks.map((risk, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-red-900">{risk.type}</span>
                  <div className="text-xs text-red-700">{risk.detail}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  risk.level === 'High' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                }`}>
                  {risk.level} Risk
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnrichmentPanel