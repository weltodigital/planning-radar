/**
 * Manual Land Registry Sync Trigger
 *
 * Admin endpoint to manually trigger Land Registry data import
 * outside of the scheduled monthly cron job. Useful for testing
 * and emergency data updates.
 */

export default async function handler(req, res) {
  // Verify admin authorization
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔧 Manual Land Registry sync triggered by admin')

    // Call the cron endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cronUrl = `${baseUrl}/api/cron/sync-land-registry`

    const response = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.details || result.error || 'Sync failed')
    }

    console.log('✅ Manual Land Registry sync completed')

    return res.status(200).json({
      success: true,
      message: 'Land Registry sync completed successfully',
      sync_result: result.summary,
      triggered_at: new Date().toISOString(),
      triggered_by: 'admin_manual'
    })

  } catch (error) {
    console.error('❌ Manual Land Registry sync failed:', error.message)

    return res.status(500).json({
      success: false,
      error: 'Manual sync failed',
      details: error.message,
      triggered_at: new Date().toISOString(),
      triggered_by: 'admin_manual'
    })
  }
}