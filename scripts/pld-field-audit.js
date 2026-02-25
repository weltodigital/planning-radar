#!/usr/bin/env node

/**
 * Planning London Datahub Field Audit
 * Diagnostic script to discover all available fields in the API
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://planningdata.london.gov.uk/api-guest';
const REQUIRED_HEADER = 'be2rmRnt&';

// Test 5 different boroughs to see field variations
const TEST_BOROUGHS = [
  'Barnet',
  'Camden',
  'Southwark',
  'Islington',
  'Croydon'
];

/**
 * Fetch a single application from a specific borough with all fields
 */
async function fetchApplicationWithAllFields(boroughName) {
  console.log(`\n🔍 Fetching application from ${boroughName}...`);

  const query = {
    query: {
      bool: {
        must: [
          { term: { "lpa_name.raw": boroughName } }
        ]
      }
    },
    size: 1,
    // NO _source filter - get everything
    sort: [{ valid_date: { order: "desc" } }]
  };

  try {
    const response = await fetch(`${BASE_URL}/applications/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-AllowRequest': REQUIRED_HEADER
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${boroughName}: ${response.status}`);
    }

    const data = await response.json();

    if (data.hits?.hits?.length > 0) {
      const application = data.hits.hits[0]._source;
      console.log(`✅ Found application from ${boroughName}`);
      return {
        borough: boroughName,
        application: application,
        fields: Object.keys(application).sort(),
        fieldCount: Object.keys(application).length
      };
    } else {
      console.log(`❌ No applications found for ${boroughName}`);
      return null;
    }

  } catch (error) {
    console.error(`❌ Error fetching from ${boroughName}:`, error.message);
    return null;
  }
}

/**
 * Get all unique field names across all boroughs
 */
function getAllUniqueFields(boroughResults) {
  const allFields = new Set();

  boroughResults.forEach(result => {
    if (result?.fields) {
      result.fields.forEach(field => allFields.add(field));
    }
  });

  return Array.from(allFields).sort();
}

/**
 * Analyze field variations across boroughs
 */
function analyzeFieldVariations(boroughResults) {
  const fieldOccurrences = {};

  boroughResults.forEach(result => {
    if (result?.fields) {
      result.fields.forEach(field => {
        if (!fieldOccurrences[field]) {
          fieldOccurrences[field] = [];
        }
        fieldOccurrences[field].push(result.borough);
      });
    }
  });

  // Sort by how many boroughs have each field (most common first)
  const sortedFields = Object.entries(fieldOccurrences)
    .sort(([,a], [,b]) => b.length - a.length)
    .map(([field, boroughs]) => ({
      field,
      boroughs,
      count: boroughs.length
    }));

  return sortedFields;
}

/**
 * Main audit function
 */
async function runFieldAudit() {
  console.log('🚀 Starting Planning London Datahub Field Audit...\n');

  const auditResults = {
    timestamp: new Date().toISOString(),
    summary: {},
    boroughResults: [],
    allUniqueFields: [],
    fieldAnalysis: []
  };

  // Fetch from each test borough
  for (const borough of TEST_BOROUGHS) {
    const result = await fetchApplicationWithAllFields(borough);
    if (result) {
      auditResults.boroughResults.push(result);
      console.log(`📊 ${borough}: ${result.fieldCount} fields`);
    }

    // Be nice to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (auditResults.boroughResults.length === 0) {
    console.log('❌ No data retrieved from any borough');
    return;
  }

  // Analyze results
  auditResults.allUniqueFields = getAllUniqueFields(auditResults.boroughResults);
  auditResults.fieldAnalysis = analyzeFieldVariations(auditResults.boroughResults);

  auditResults.summary = {
    boroughsAudited: auditResults.boroughResults.length,
    totalUniqueFields: auditResults.allUniqueFields.length,
    averageFieldsPerBorough: Math.round(
      auditResults.boroughResults.reduce((sum, r) => sum + r.fieldCount, 0) / auditResults.boroughResults.length
    )
  };

  // Log summary to console
  console.log('\n📈 AUDIT SUMMARY:');
  console.log(`   Boroughs audited: ${auditResults.summary.boroughsAudited}`);
  console.log(`   Total unique fields: ${auditResults.summary.totalUniqueFields}`);
  console.log(`   Average fields per borough: ${auditResults.summary.averageFieldsPerBorough}`);

  console.log('\n🏷️  ALL UNIQUE FIELDS:');
  auditResults.allUniqueFields.forEach((field, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}: ${field}`);
  });

  console.log('\n🔍 FIELD AVAILABILITY BY BOROUGH:');
  auditResults.fieldAnalysis.slice(0, 20).forEach(({ field, boroughs, count }) => {
    const percentage = Math.round((count / auditResults.boroughResults.length) * 100);
    console.log(`   ${field.padEnd(25)} | ${count}/${auditResults.boroughResults.length} boroughs (${percentage}%)`);
  });

  // Save to file
  const outputPath = path.join(__dirname, '..', 'pld-field-audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n💾 Full audit results saved to: ${outputPath}`);

  console.log('\n✅ Field audit complete!');
}

// Run the audit
runFieldAudit().catch(console.error);