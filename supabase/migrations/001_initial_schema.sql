-- Planning Radar Database Schema
-- This migration creates the complete database schema for Planning Radar

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- MAIN TABLES
-- ================================

-- Planning applications table - core data from planning API
CREATE TABLE planning_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,         -- keyval from planning API
  lpa_id TEXT NOT NULL,                      -- local planning authority ID
  lpa_name TEXT NOT NULL,                    -- e.g. "bristol"
  title TEXT NOT NULL,                       -- application description
  address TEXT,
  postcode TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  location GEOGRAPHY(POINT, 4326),          -- PostGIS point for radius queries
  date_validated DATE,
  date_received DATE,
  date_decision DATE,
  decision TEXT,                             -- approved, refused, pending, withdrawn
  applicant_name TEXT,
  agent_name TEXT,
  application_type TEXT,                     -- full, householder, change of use, etc.
  external_link TEXT,                        -- link to council portal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved searches for authenticated users
CREATE TABLE saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,                   -- stores the search parameters
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions and plan management
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free_trial',  -- free_trial, pro, premium
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active',             -- active, canceled, past_due
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync log for tracking data pipeline runs
CREATE TABLE lpa_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lpa_id TEXT NOT NULL,
  lpa_name TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  applications_fetched INT DEFAULT 0,
  status TEXT DEFAULT 'success'             -- success, error
);

-- Cache for postcode geocoding to avoid repeated API calls
CREATE TABLE postcode_cache (
  postcode TEXT PRIMARY KEY,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Planning applications indexes (critical for search performance)
CREATE INDEX idx_apps_external_id ON planning_applications(external_id);
CREATE INDEX idx_apps_postcode ON planning_applications(postcode);
CREATE INDEX idx_apps_lpa ON planning_applications(lpa_name);
CREATE INDEX idx_apps_date ON planning_applications(date_validated DESC);
CREATE INDEX idx_apps_location ON planning_applications USING GIST(location);
CREATE INDEX idx_apps_title_search ON planning_applications USING GIN(to_tsvector('english', title));
CREATE INDEX idx_apps_applicant ON planning_applications(applicant_name);
CREATE INDEX idx_apps_agent ON planning_applications(agent_name);
CREATE INDEX idx_apps_decision ON planning_applications(decision);
CREATE INDEX idx_apps_type ON planning_applications(application_type);
CREATE INDEX idx_apps_created ON planning_applications(created_at DESC);

-- Saved searches indexes
CREATE INDEX idx_saved_user ON saved_searches(user_id);
CREATE INDEX idx_saved_created ON saved_searches(created_at DESC);

-- Subscriptions indexes
CREATE INDEX idx_subs_user ON subscriptions(user_id);
CREATE INDEX idx_subs_stripe ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subs_plan ON subscriptions(plan);
CREATE INDEX idx_subs_status ON subscriptions(status);

-- Sync log indexes
CREATE INDEX idx_sync_lpa ON lpa_sync_log(lpa_id);
CREATE INDEX idx_sync_date ON lpa_sync_log(last_synced_at DESC);
CREATE INDEX idx_sync_status ON lpa_sync_log(status);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on user-specific tables
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_applications ENABLE ROW LEVEL SECURITY;

-- Saved searches: users can only CRUD their own
CREATE POLICY "Users can CRUD own saved searches"
  ON saved_searches FOR ALL
  USING (auth.uid() = user_id);

-- Subscriptions: users can only read their own
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Planning applications: readable by all authenticated users
-- (access control handled in application layer based on subscription tier)
CREATE POLICY "Authenticated users can read applications"
  ON planning_applications FOR SELECT
  TO authenticated
  USING (true);

-- ================================
-- FUNCTIONS AND TRIGGERS
-- ================================

-- Function to automatically set location from lat/lng
CREATE OR REPLACE FUNCTION set_application_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set location if we have both lat and lng
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;

  -- Update the updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set location on insert/update
CREATE TRIGGER trigger_set_application_location
  BEFORE INSERT OR UPDATE ON planning_applications
  FOR EACH ROW EXECUTE FUNCTION set_application_location();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscriptions updated_at
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- SAMPLE DATA (for development)
-- ================================

-- Insert a few sample planning applications for testing
INSERT INTO planning_applications (
  external_id, lpa_id, lpa_name, title, address, postcode,
  lat, lng, date_validated, decision, applicant_name, application_type
) VALUES
(
  'SAMPLE001', 'bristol', 'bristol-city-council',
  'Two storey rear extension to existing dwelling',
  '123 Test Street, Bristol', 'BS1 1AA',
  51.4545, -2.5879, '2026-02-01', 'pending', 'John Smith', 'householder'
),
(
  'SAMPLE002', 'bristol', 'bristol-city-council',
  'Change of use from office to residential (4 flats)',
  '456 Example Road, Bristol', 'BS2 2BB',
  51.4600, -2.5800, '2026-01-15', 'approved', 'Bristol Developments Ltd', 'full'
),
(
  'SAMPLE003', 'birmingham', 'birmingham-city-council',
  'Demolition of existing garage and erection of single storey extension',
  '789 Sample Avenue, Birmingham', 'B1 1CD',
  52.4862, -1.8904, '2026-02-10', 'pending', 'Jane Doe', 'householder'
);

-- Insert sample postcode cache entries
INSERT INTO postcode_cache (postcode, lat, lng) VALUES
('BS1 1AA', 51.4545, -2.5879),
('BS2 2BB', 51.4600, -2.5800),
('B1 1CD', 52.4862, -1.8904);

-- Insert sample LPA sync log entries
INSERT INTO lpa_sync_log (lpa_id, lpa_name, applications_fetched, status) VALUES
('bristol', 'bristol-city-council', 2, 'success'),
('birmingham', 'birmingham-city-council', 1, 'success');

-- ================================
-- HELPFUL VIEWS (optional)
-- ================================

-- View for recent applications with formatted dates
CREATE OR REPLACE VIEW recent_applications AS
SELECT
  id,
  external_id,
  lpa_name,
  title,
  address,
  postcode,
  date_validated,
  decision,
  applicant_name,
  application_type,
  external_link,
  CASE
    WHEN decision = 'approved' THEN 'success'
    WHEN decision = 'refused' THEN 'danger'
    WHEN decision = 'pending' THEN 'warning'
    ELSE 'muted'
  END as status_color
FROM planning_applications
WHERE date_validated >= (CURRENT_DATE - INTERVAL '30 days')
ORDER BY date_validated DESC;

-- View for application counts by council
CREATE OR REPLACE VIEW lpa_stats AS
SELECT
  lpa_name,
  COUNT(*) as total_applications,
  COUNT(CASE WHEN decision = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN decision = 'refused' THEN 1 END) as refused_count,
  COUNT(CASE WHEN decision = 'pending' THEN 1 END) as pending_count,
  ROUND(
    COUNT(CASE WHEN decision = 'approved' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN decision IN ('approved', 'refused') THEN 1 END), 0),
    1
  ) as approval_rate_percent
FROM planning_applications
GROUP BY lpa_name
ORDER BY total_applications DESC;

-- ================================
-- GRANTS AND PERMISSIONS
-- ================================

-- Grant usage on sequences to authenticated users
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select on reference tables to authenticated users
GRANT SELECT ON postcode_cache TO authenticated;
GRANT SELECT ON lpa_sync_log TO authenticated;
GRANT SELECT ON recent_applications TO authenticated;
GRANT SELECT ON lpa_stats TO authenticated;