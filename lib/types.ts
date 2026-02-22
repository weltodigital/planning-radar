export type Plan = 'free_trial' | 'pro' | 'premium' | 'expired'

export type PlanningApplication = {
  id: string
  external_id: string
  lpa_id: string
  lpa_name: string
  title: string
  address?: string
  postcode?: string
  lat?: number
  lng?: number
  date_validated?: string
  date_received?: string
  date_decision?: string
  decision?: string
  applicant_name?: string
  agent_name?: string
  application_type?: string
  external_link?: string
  created_at: string
  updated_at: string
}

export type SavedSearch = {
  id: string
  user_id: string
  name: string
  filters: SearchFilters
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  plan: Plan
  trial_ends_at?: string
  current_period_end?: string
  status: string
  created_at: string
  updated_at: string
}

export type LPASyncLog = {
  id: string
  lpa_id: string
  lpa_name: string
  last_synced_at: string
  applications_fetched: number
  status: string
}

export type PostcodeCache = {
  postcode: string
  lat: number
  lng: number
  cached_at: string
}

export type SearchFilters = {
  postcode?: string
  radius?: number
  council?: string
  keyword?: string
  decision?: string
  date_from?: string
  date_to?: string
  applicant?: string
  agent?: string
}

export type SearchParams = SearchFilters & {
  page?: number
  limit?: number
}

export type SearchResult = {
  applications: PlanningApplication[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export type PlanLimits = {
  maxResults: number | null
  historyDays: number | null
  keywordFilters: boolean
  fullDetail: boolean
  maxSavedSearches: number | null
  csvExport: boolean
  applicantSearch: boolean
}

export type LPA = {
  id: string
  name: string
  displayName: string
}

export type GeocodeResult = {
  lat: number
  lng: number
}

// Supabase Database Types
export type Database = {
  public: {
    Tables: {
      planning_applications: {
        Row: PlanningApplication
        Insert: Omit<PlanningApplication, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PlanningApplication, 'id' | 'created_at'>>
      }
      saved_searches: {
        Row: SavedSearch
        Insert: Omit<SavedSearch, 'id' | 'created_at'>
        Update: Partial<Omit<SavedSearch, 'id' | 'created_at'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>
      }
      lpa_sync_log: {
        Row: LPASyncLog
        Insert: Omit<LPASyncLog, 'id' | 'last_synced_at'>
        Update: Partial<Omit<LPASyncLog, 'id'>>
      }
      postcode_cache: {
        Row: PostcodeCache
        Insert: Omit<PostcodeCache, 'cached_at'>
        Update: Partial<PostcodeCache>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_applications_near_point: {
        Args: {
          search_lat: number
          search_lng: number
          radius_meters: number
        }
        Returns: PlanningApplication[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}