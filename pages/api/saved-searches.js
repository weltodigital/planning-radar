/**
 * Saved Searches API
 * Allows Pro and Premium users to save and manage search filters
 */

import { createServiceClient } from '../../lib/supabase/pages-client'

async function getUserPlan(supabase, userId) {
  if (!userId) return 'free_trial'

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, trial_ends_at, status')
      .eq('user_id', userId)
      .single()

    if (error || !data) return 'free_trial'

    // Check if trial has expired
    if (data.plan === 'free_trial' && data.trial_ends_at) {
      const trialEnd = new Date(data.trial_ends_at)
      if (trialEnd < new Date()) {
        return 'expired'
      }
    }

    // Check subscription status
    if (data.status !== 'active') {
      return 'expired'
    }

    return data.plan
  } catch (error) {
    console.error('Error getting user plan:', error)
    return 'free_trial'
  }
}

export default async function handler(req, res) {
  const supabase = createServiceClient()

  // For this demo, we'll simulate no authentication
  // In production, you'd get the user from session cookies
  const user = null // Get from auth session

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized - please sign in' })
  }

  const userPlan = await getUserPlan(supabase, user.id)

  // Check if user has access to saved searches (Pro+ only)
  if (userPlan === 'free_trial' || userPlan === 'expired') {
    return res.status(403).json({
      error: 'Saved searches require Pro or Premium plan',
      upgrade_required: true
    })
  }

  if (req.method === 'GET') {
    try {
      // Get user's saved searches
      const { data: savedSearches, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching saved searches:', error)
        return res.status(500).json({ error: 'Failed to fetch saved searches' })
      }

      return res.status(200).json({
        saved_searches: savedSearches || [],
        plan: userPlan,
        max_searches: userPlan === 'pro' ? 5 : null // Premium has unlimited
      })

    } catch (error) {
      console.error('Saved searches GET error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, filters } = req.body

      if (!name || !filters) {
        return res.status(400).json({ error: 'Name and filters are required' })
      }

      // Check existing count for Pro users
      if (userPlan === 'pro') {
        const { count } = await supabase
          .from('saved_searches')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (count >= 5) {
          return res.status(403).json({
            error: 'Pro plan limited to 5 saved searches. Upgrade to Premium for unlimited.',
            upgrade_required: true
          })
        }
      }

      // Create saved search
      const { data: savedSearch, error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          name,
          filters
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating saved search:', error)
        return res.status(500).json({ error: 'Failed to create saved search' })
      }

      return res.status(201).json({ saved_search: savedSearch })

    } catch (error) {
      console.error('Saved searches POST error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ error: 'Search ID is required' })
      }

      // Delete saved search (RLS policy ensures user can only delete their own)
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting saved search:', error)
        return res.status(500).json({ error: 'Failed to delete saved search' })
      }

      return res.status(200).json({ success: true })

    } catch (error) {
      console.error('Saved searches DELETE error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}