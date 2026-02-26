-- =====================================================
-- Phase 3A: Data Enrichment Schema
-- Planning Radar Intelligence Layer
-- =====================================================

-- Enable PostGIS (should already be enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- Land Registry Price Paid Data
-- =====================================================
CREATE TABLE IF NOT EXISTS land_registry_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,
  price INTEGER NOT NULL,
  date_of_transfer DATE NOT NULL,
  postcode TEXT,
  property_type CHAR(1),    -- D=Detached, S=Semi, T=Terraced, F=Flat, O=Other
  old_new CHAR(1),          -- Y=New, N=Established
  duration CHAR(1),         -- F=Freehold, L=Leasehold
  paon TEXT,                -- House number/name
  saon TEXT,                -- Flat number
  street TEXT,
  locality TEXT,
  town TEXT,
  district TEXT,
  county TEXT,
  ppd_category CHAR(1),    -- A=Standard, B=Additional
  record_status CHAR(1),   -- A=Add, C=Change, D=Delete
  postcode_area TEXT,       -- "E1" from "E1 6AN"
  postcode_sector TEXT,     -- "E1 6" from "E1 6AN"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lr_postcode ON land_registry_prices(postcode);
CREATE INDEX idx_lr_postcode_sector ON land_registry_prices(postcode_sector);
CREATE INDEX idx_lr_date ON land_registry_prices(date_of_transfer DESC);
CREATE INDEX idx_lr_property_type ON land_registry_prices(property_type);

-- =====================================================
-- EPC Certificates
-- =====================================================
CREATE TABLE IF NOT EXISTS epc_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lmk_key TEXT UNIQUE NOT NULL,
  address1 TEXT,
  address2 TEXT,
  address3 TEXT,
  postcode TEXT,
  property_type TEXT,
  built_form TEXT,
  total_floor_area DECIMAL,
  construction_age_band TEXT,
  current_energy_rating CHAR(1),
  potential_energy_rating CHAR(1),
  current_energy_efficiency INTEGER,
  wall_description TEXT,
  roof_description TEXT,
  main_heating_description TEXT,
  heating_cost_current INTEGER,
  hot_water_cost_current INTEGER,
  lighting_cost_current INTEGER,
  inspection_date DATE,
  lodgement_date DATE,
  local_authority TEXT,
  uprn TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_epc_postcode ON epc_certificates(postcode);
CREATE INDEX idx_epc_uprn ON epc_certificates(uprn);

-- =====================================================
-- Planning Constraints (conservation areas, Article 4, green belt, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS planning_constraints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id BIGINT,
  dataset TEXT NOT NULL,
  name TEXT,
  description TEXT,
  organisation TEXT,
  document_url TEXT,
  documentation_url TEXT,
  start_date DATE,
  end_date DATE,
  geometry GEOMETRY(MultiPolygon, 4326),
  point GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_constraints_dataset ON planning_constraints(dataset);
CREATE INDEX idx_constraints_geom ON planning_constraints USING GIST(geometry);

-- =====================================================
-- Flood Risk Zones
-- =====================================================
CREATE TABLE IF NOT EXISTS flood_risk_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone TEXT NOT NULL,
  source TEXT,
  risk_level TEXT,
  geometry GEOMETRY(MultiPolygon, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flood_geom ON flood_risk_zones USING GIST(geometry);

-- =====================================================
-- Listed Buildings (fast lookup)
-- =====================================================
CREATE TABLE IF NOT EXISTS listed_buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id BIGINT,
  name TEXT,
  grade TEXT,
  list_entry TEXT,
  documentation_url TEXT,
  point GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listed_point ON listed_buildings USING GIST(point);

-- =====================================================
-- Enrichment Cache (one row per planning application)
-- =====================================================
CREATE TABLE IF NOT EXISTS application_enrichment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_reference TEXT UNIQUE NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  point GEOMETRY(Point, 4326),
  -- Land Registry
  last_sale_price INTEGER,
  last_sale_date DATE,
  comparable_avg_price INTEGER,
  comparable_median_price INTEGER,
  comparable_count INTEGER,
  price_per_sqm INTEGER,
  -- EPC
  epc_rating CHAR(1),
  floor_area_sqm DECIMAL,
  construction_age TEXT,
  epc_property_type TEXT,
  -- Constraints
  in_conservation_area BOOLEAN DEFAULT FALSE,
  conservation_area_name TEXT,
  has_article_4 BOOLEAN DEFAULT FALSE,
  article_4_details TEXT,
  near_listed_building BOOLEAN DEFAULT FALSE,
  nearest_listed_grade TEXT,
  nearest_listed_distance_m INTEGER,
  in_flood_zone BOOLEAN DEFAULT FALSE,
  flood_zone_level TEXT,
  in_green_belt BOOLEAN DEFAULT FALSE,
  in_aonb BOOLEAN DEFAULT FALSE,
  has_tpo BOOLEAN DEFAULT FALSE,
  -- Score
  opportunity_score INTEGER,
  score_breakdown JSONB,
  enriched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enrichment_ref ON application_enrichment(application_reference);
CREATE INDEX idx_enrichment_score ON application_enrichment(opportunity_score DESC NULLS LAST);
CREATE INDEX idx_enrichment_point ON application_enrichment USING GIST(point);

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE land_registry_prices IS 'UK Land Registry Price Paid Data for property sales';
COMMENT ON TABLE epc_certificates IS 'Energy Performance Certificate data';
COMMENT ON TABLE planning_constraints IS 'Planning constraints like conservation areas, Article 4 directions';
COMMENT ON TABLE flood_risk_zones IS 'Environment Agency flood risk zones';
COMMENT ON TABLE listed_buildings IS 'Historic England listed buildings data';
COMMENT ON TABLE application_enrichment IS 'Enriched data cache for planning applications with scores and intelligence';