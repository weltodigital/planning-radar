/**
 * Add realistic sample planning application data
 * Run with: node scripts/add-sample-data.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Realistic London planning applications data
const realisticApplications = [
  // Bristol City Council
  {
    external_id: 'BRISTOL_2026_001',
    lpa_id: 'bristol-city-council',
    lpa_name: 'Bristol City Council',
    title: 'Two storey rear extension and single storey side extension to existing dwelling',
    address: '45 Redland Road, Bristol, BS6 6QX',
    postcode: 'BS6 6QX',
    lat: 51.4745,
    lng: -2.6050,
    date_validated: '2026-02-20',
    date_received: '2026-02-15',
    decision: 'Pending',
    applicant_name: 'Mr & Mrs Thompson',
    application_type: 'Householder',
    external_link: 'https://planning.bristol.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=BRISTOL_2026_001'
  },
  {
    external_id: 'BRISTOL_2026_002',
    lpa_id: 'bristol-city-council',
    lpa_name: 'Bristol City Council',
    title: 'Change of use from office (Use Class E) to residential (Use Class C3) comprising 8 flats',
    address: '123 Park Street, Bristol, BS1 5PH',
    postcode: 'BS1 5PH',
    lat: 51.4532,
    lng: -2.6011,
    date_validated: '2026-02-18',
    date_received: '2026-02-10',
    decision: 'Approved',
    applicant_name: 'Bristol Property Development Ltd',
    application_type: 'Full Planning',
    external_link: 'https://planning.bristol.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=BRISTOL_2026_002'
  },
  {
    external_id: 'BRISTOL_2026_003',
    lpa_id: 'bristol-city-council',
    lpa_name: 'Bristol City Council',
    title: 'Loft conversion with rear dormer window and 2 front rooflights',
    address: '67 Gloucester Road, Bristol, BS7 8AS',
    postcode: 'BS7 8AS',
    lat: 51.4765,
    lng: -2.5985,
    date_validated: '2026-02-16',
    date_received: '2026-02-08',
    decision: 'Refused',
    applicant_name: 'Ms Sarah Johnson',
    application_type: 'Householder',
    external_link: 'https://planning.bristol.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=BRISTOL_2026_003'
  },

  // Birmingham City Council
  {
    external_id: 'BIRMINGHAM_2026_001',
    lpa_id: 'birmingham-city-council',
    lpa_name: 'Birmingham City Council',
    title: 'Demolition of existing garage and erection of two storey side extension',
    address: '89 Broad Street, Birmingham, B1 2AA',
    postcode: 'B1 2AA',
    lat: 52.4797,
    lng: -1.9026,
    date_validated: '2026-02-22',
    date_received: '2026-02-17',
    decision: 'Pending',
    applicant_name: 'Mr David Wilson',
    application_type: 'Householder',
    external_link: 'https://eplanning.birmingham.gov.uk/Northgate/DocumentApplication/DocAppFrontController.aspx?ApplicationSearchCriteria.ApplicationNumber=BIRMINGHAM_2026_001'
  },
  {
    external_id: 'BIRMINGHAM_2026_002',
    lpa_id: 'birmingham-city-council',
    lpa_name: 'Birmingham City Council',
    title: 'Erection of 24 residential apartments with associated parking and landscaping',
    address: 'Land adjacent to 156 Corporation Street, Birmingham, B4 6TD',
    postcode: 'B4 6TD',
    lat: 52.4814,
    lng: -1.8998,
    date_validated: '2026-02-19',
    date_received: '2026-02-12',
    decision: 'Approved',
    applicant_name: 'Midlands Housing Group',
    application_type: 'Full Planning',
    external_link: 'https://eplanning.birmingham.gov.uk/Northgate/DocumentApplication/DocAppFrontController.aspx?ApplicationSearchCriteria.ApplicationNumber=BIRMINGHAM_2026_002'
  },

  // Manchester City Council
  {
    external_id: 'MANCHESTER_2026_001',
    lpa_id: 'manchester-city-council',
    lpa_name: 'Manchester City Council',
    title: 'Installation of external plant equipment including air conditioning units',
    address: '34 Princess Street, Manchester, M1 4JY',
    postcode: 'M1 4JY',
    lat: 53.4794,
    lng: -2.2453,
    date_validated: '2026-02-21',
    date_received: '2026-02-14',
    decision: 'Pending',
    applicant_name: 'Manchester Commercial Properties',
    application_type: 'Full Planning',
    external_link: 'https://pa.manchester.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=MANCHESTER_2026_001'
  },
  {
    external_id: 'MANCHESTER_2026_002',
    lpa_id: 'manchester-city-council',
    lpa_name: 'Manchester City Council',
    title: 'Single storey rear extension and internal alterations',
    address: '12 Oxford Road, Manchester, M1 5QA',
    postcode: 'M1 5QA',
    lat: 53.4722,
    lng: -2.2457,
    date_validated: '2026-02-17',
    date_received: '2026-02-11',
    decision: 'Approved',
    applicant_name: 'Dr James Mitchell',
    application_type: 'Householder',
    external_link: 'https://pa.manchester.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=MANCHESTER_2026_002'
  },

  // Leeds City Council
  {
    external_id: 'LEEDS_2026_001',
    lpa_id: 'leeds-city-council',
    lpa_name: 'Leeds City Council',
    title: 'Change of use from retail (Use Class E) to restaurant (Use Class E) with external alterations',
    address: '78 Briggate, Leeds, LS1 6NU',
    postcode: 'LS1 6NU',
    lat: 53.7974,
    lng: -1.5437,
    date_validated: '2026-02-23',
    date_received: '2026-02-18',
    decision: 'Pending',
    applicant_name: 'Yorkshire Dining Ltd',
    application_type: 'Full Planning',
    external_link: 'https://publicaccess.leeds.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=LEEDS_2026_001'
  },

  // Newcastle City Council
  {
    external_id: 'NEWCASTLE_2026_001',
    lpa_id: 'newcastle-city-council',
    lpa_name: 'Newcastle City Council',
    title: 'Erection of boundary fence (height 2.5m) to rear garden',
    address: '23 Grey Street, Newcastle upon Tyne, NE1 6EE',
    postcode: 'NE1 6EE',
    lat: 54.9738,
    lng: -1.6131,
    date_validated: '2026-02-15',
    date_received: '2026-02-09',
    decision: 'Approved',
    applicant_name: 'Mrs Linda Brown',
    application_type: 'Householder',
    external_link: 'https://publicaccessapplications.newcastle.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=NEWCASTLE_2026_001'
  },

  // Liverpool City Council
  {
    external_id: 'LIVERPOOL_2026_001',
    lpa_id: 'liverpool-city-council',
    lpa_name: 'Liverpool City Council',
    title: 'Conversion of existing building to create 6 apartments with associated parking',
    address: '145 Bold Street, Liverpool, L1 4JA',
    postcode: 'L1 4JA',
    lat: 53.4014,
    lng: -2.9785,
    date_validated: '2026-02-20',
    date_received: '2026-02-13',
    decision: 'Refused',
    applicant_name: 'Merseyside Property Investments',
    application_type: 'Full Planning',
    external_link: 'https://planningapps.liverpool.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=LIVERPOOL_2026_001'
  },

  // Sheffield City Council
  {
    external_id: 'SHEFFIELD_2026_001',
    lpa_id: 'sheffield-city-council',
    lpa_name: 'Sheffield City Council',
    title: 'Installation of solar panels on south-facing roof slope',
    address: '56 The Moor, Sheffield, S1 4PF',
    postcode: 'S1 4PF',
    lat: 53.3781,
    lng: -1.4690,
    date_validated: '2026-02-24',
    date_received: '2026-02-19',
    decision: 'Pending',
    applicant_name: 'Green Energy Solutions Yorkshire',
    application_type: 'Householder',
    external_link: 'https://planningapps.sheffield.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=SHEFFIELD_2026_001'
  },

  // Oxford City Council
  {
    external_id: 'OXFORD_2026_001',
    lpa_id: 'oxford-city-council',
    lpa_name: 'Oxford City Council',
    title: 'Listed building consent for internal alterations to historic building',
    address: '12 High Street, Oxford, OX1 4DB',
    postcode: 'OX1 4DB',
    lat: 51.7520,
    lng: -1.2577,
    date_validated: '2026-02-16',
    date_received: '2026-02-07',
    decision: 'Approved',
    applicant_name: 'Oxford Heritage Trust',
    application_type: 'Listed Building',
    external_link: 'https://public.oxford.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=OXFORD_2026_001'
  },

  // Cambridge City Council
  {
    external_id: 'CAMBRIDGE_2026_001',
    lpa_id: 'cambridge-city-council',
    lpa_name: 'Cambridge City Council',
    title: 'Erection of cycle shelter and associated landscaping',
    address: '34 Trinity Street, Cambridge, CB2 1TB',
    postcode: 'CB2 1TB',
    lat: 52.2054,
    lng: 0.1218,
    date_validated: '2026-02-22',
    date_received: '2026-02-16',
    decision: 'Pending',
    applicant_name: 'University of Cambridge',
    application_type: 'Full Planning',
    external_link: 'https://applications.cambridge.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=CAMBRIDGE_2026_001'
  },

  // Bath and North East Somerset Council
  {
    external_id: 'BATH_2026_001',
    lpa_id: 'bath-north-east-somerset',
    lpa_name: 'Bath and North East Somerset Council',
    title: 'Replacement of existing windows in conservation area',
    address: '78 Pulteney Street, Bath, BA2 4HZ',
    postcode: 'BA2 4HZ',
    lat: 51.3813,
    lng: -2.3590,
    date_validated: '2026-02-18',
    date_received: '2026-02-12',
    decision: 'Approved',
    applicant_name: 'Bath Conservation Co',
    application_type: 'Householder',
    external_link: 'https://planning.bathnes.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=BATH_2026_001'
  }
]

async function addSampleData() {
  console.log('🔄 Starting to add realistic sample data...')

  try {
    // Clear existing sample data first
    console.log('🧹 Clearing existing sample data...')
    const { error: deleteError } = await supabase
      .from('planning_applications')
      .delete()
      .neq('external_id', 'KEEP_ME') // Delete all records

    if (deleteError) {
      console.error('Error clearing data:', deleteError)
      return
    }

    console.log('✅ Cleared existing data')

    // Insert new realistic data
    console.log('📝 Inserting realistic planning applications...')
    const { data, error } = await supabase
      .from('planning_applications')
      .insert(realisticApplications)

    if (error) {
      console.error('❌ Error inserting data:', error)
      return
    }

    console.log(`✅ Successfully added ${realisticApplications.length} realistic planning applications!`)

    // Show a sample of what was added
    console.log('\n🏗️ Sample applications added:')
    realisticApplications.slice(0, 3).forEach(app => {
      console.log(`   • ${app.title} (${app.lpa_name}) - ${app.decision}`)
    })

    console.log(`\n🎯 Total councils represented: ${new Set(realisticApplications.map(app => app.lpa_name)).size}`)
    console.log('🚀 Your homepage and SEO pages will now show realistic London planning data!')

  } catch (error) {
    console.error('💥 Script failed:', error)
  }
}

// Run the script
addSampleData()