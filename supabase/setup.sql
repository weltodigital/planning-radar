-- Planning Radar Database Setup
-- Run this in your Supabase SQL editor

-- Enable PostGIS extension for location queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Planning applications table
CREATE TABLE IF NOT EXISTS planning_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  lpa_id TEXT NOT NULL,
  lpa_name TEXT NOT NULL,
  title TEXT NOT NULL,
  address TEXT,
  postcode TEXT,
  lat DECIMAL(9,6),
  lng DECIMAL(9,6),
  location GEOGRAPHY(POINT, 4326),
  date_validated DATE,
  date_received DATE,
  date_decision DATE,
  decision TEXT,
  applicant_name TEXT,
  agent_name TEXT,
  application_type TEXT,
  external_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_apps_postcode ON planning_applications(postcode);
CREATE INDEX IF NOT EXISTS idx_apps_lpa ON planning_applications(lpa_name);
CREATE INDEX IF NOT EXISTS idx_apps_date ON planning_applications(date_validated DESC);
CREATE INDEX IF NOT EXISTS idx_apps_location ON planning_applications USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_apps_title_search ON planning_applications USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_apps_decision ON planning_applications(decision);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free_trial',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_stripe ON subscriptions(stripe_customer_id);

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_searches(user_id);

-- Postcode geocode cache
CREATE TABLE IF NOT EXISTS postcode_cache (
  postcode TEXT PRIMARY KEY,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users CRUD own saved searches" ON saved_searches FOR ALL USING (auth.uid() = user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE planning_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Authenticated read applications" ON planning_applications FOR SELECT TO authenticated USING (true);

-- Function to auto-set location from lat/lng
CREATE OR REPLACE FUNCTION set_application_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set location
CREATE TRIGGER trigger_set_location
  BEFORE INSERT OR UPDATE ON planning_applications
  FOR EACH ROW EXECUTE FUNCTION set_application_location();

-- Function to create subscription on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, trial_ends_at, status)
  VALUES (NEW.id, 'free_trial', NOW() + INTERVAL '7 days', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Sample data for testing
INSERT INTO planning_applications (
  external_id, lpa_id, lpa_name, title, address, postcode,
  lat, lng, date_validated, decision, applicant_name, application_type
) VALUES
  ('BS001', '1', 'Bristol City Council', 'Single storey rear extension', '123 High Street, Bristol', 'BS1 5AH', 51.4545, -2.5879, '2024-01-15', 'Approved', 'John Smith', 'Householder'),
  ('BS002', '1', 'Bristol City Council', 'Two storey side extension', '45 Park Road, Bristol', 'BS2 8QW', 51.4625, -2.6020, '2024-01-20', 'Pending', 'Sarah Johnson', 'Householder'),
  ('BS003', '1', 'Bristol City Council', 'Change of use from retail to residential', '67 Queen Street, Bristol', 'BS1 4DF', 51.4520, -2.5900, '2024-01-18', 'Refused', 'Bristol Properties Ltd', 'Change of Use'),
  ('BM001', '2', 'Birmingham City Council', 'New detached dwelling', '89 Oak Avenue, Birmingham', 'B1 1AA', 52.4862, -1.8904, '2024-01-10', 'Approved', 'Green Homes Development', 'Full Application'),
  ('BM002', '2', 'Birmingham City Council', 'Loft conversion with dormer windows', '22 Elm Grove, Birmingham', 'B2 4RT', 52.4950, -1.9020, '2024-01-25', 'Pending', 'Mike Wilson', 'Householder')
ON CONFLICT (external_id) DO NOTHING;