import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'
import { getPlanLimits } from '@/lib/plans'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Get user's saved searches
    const { data: savedSearches, error } = await (supabase
      .from('saved_searches') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Saved searches fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch saved searches'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: savedSearches || []
    })

  } catch (error) {
    console.error('Saved searches API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, filters } = body

    if (!name || !filters) {
      return NextResponse.json({
        success: false,
        error: 'Name and filters are required'
      }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Check user plan limits
    const userPlan = await getUserPlan(user.id)
    const planLimits = getPlanLimits(userPlan)

    // Count existing saved searches
    const { count: existingCount } = await (supabase
      .from('saved_searches') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Check if user has reached their limit
    if (planLimits.maxSavedSearches !== null && (existingCount || 0) >= planLimits.maxSavedSearches) {
      return NextResponse.json({
        success: false,
        error: `You have reached your limit of ${planLimits.maxSavedSearches} saved searches`,
        upgrade: {
          feature: 'Saved Searches',
          currentPlan: userPlan,
          requiredPlan: userPlan === 'free_trial' ? 'Pro' : 'Premium'
        }
      }, { status: 403 })
    }

    // Save the search
    const { data: savedSearch, error } = await (supabase
      .from('saved_searches') as any)
      .insert({
        user_id: user.id,
        name,
        filters
      })
      .select()
      .single()

    if (error) {
      console.error('Save search error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save search'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: savedSearch,
      message: 'Search saved successfully'
    })

  } catch (error) {
    console.error('Save search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Search ID is required'
      }, { status: 400 })
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Delete the saved search (RLS will ensure user can only delete their own)
    const { error } = await (supabase
      .from('saved_searches') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete saved search error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete saved search'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Saved search deleted successfully'
    })

  } catch (error) {
    console.error('Delete saved search API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}