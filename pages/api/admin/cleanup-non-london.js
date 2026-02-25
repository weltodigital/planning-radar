import { createServiceClient } from '../../../lib/supabase/pages-client'

const LONDON_BOROUGHS = [
  'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
  'City of London', 'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney',
  'Hammersmith and Fulham', 'Haringey', 'Harrow', 'Havering', 'Hillingdon',
  'Hounslow', 'Islington', 'Kensington and Chelsea', 'Kingston upon Thames',
  'Lambeth', 'Lewisham', 'Merton', 'Newham', 'Redbridge',
  'Richmond upon Thames', 'Southwark', 'Sutton', 'Tower Hamlets',
  'Waltham Forest', 'Wandsworth', 'Westminster',
  'London Legacy Development Corporation',
  'Old Oak and Park Royal Development Corporation'
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth check
  const authHeader = req.headers.authorization
  if (authHeader !== 'Bearer admin-secret-change-in-production') {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const supabase = createServiceClient()

    // Debug: Check if we're using the service role
    console.log('🔧 Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // First, check what non-London data exists
    console.log('🔍 Checking for non-London data...')

    // Test RLS bypass with count query
    const { count: totalCount } = await supabase
      .from('planning_applications')
      .select('*', { count: 'exact', head: true })

    console.log('🔢 Total applications visible:', totalCount)

    // Get councils using the same query as search API
    const { data: allCouncils, error: checkError } = await supabase
      .from('planning_applications')
      .select('id, title, address, postcode, lpa_name, decision, date_validated, applicant_name, application_type')
      .order('date_validated', { ascending: false })

    if (checkError) {
      throw checkError
    }

    // Filter to non-London councils
    const uniqueCouncils = [...new Set(allCouncils.map(row => row.lpa_name))]
    const nonLondonCouncils = uniqueCouncils.filter(council =>
      !LONDON_BOROUGHS.includes(council)
    )

    console.log(`📊 Total unique councils:`, uniqueCouncils.length)
    console.log(`📋 All unique councils:`, uniqueCouncils)
    console.log(`📊 Non-London councils found:`, nonLondonCouncils)

    if (nonLondonCouncils.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No non-London data found',
        cleaned: 0,
        councils_removed: []
      })
    }

    // Delete non-London data
    console.log('🧹 Cleaning non-London data...')

    const { data: deleteResult, error: deleteError } = await supabase
      .from('planning_applications')
      .delete()
      .not('lpa_name', 'in', `(${LONDON_BOROUGHS.map(b => `"${b}"`).join(',')})`)
      .select('id')

    if (deleteError) {
      throw deleteError
    }

    const deletedCount = deleteResult ? deleteResult.length : 0
    const councilsRemoved = nonLondonCouncils.map(council => ({
      council: council,
      count: 'removed'
    }))

    console.log(`✅ Deleted ${deletedCount} non-London applications`)

    return res.status(200).json({
      success: true,
      message: `Successfully removed ${deletedCount} non-London planning applications`,
      cleaned: deletedCount,
      councils_removed: councilsRemoved,
      remaining_london_boroughs: LONDON_BOROUGHS.length
    })

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}