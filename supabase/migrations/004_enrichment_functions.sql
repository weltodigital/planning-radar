-- =====================================================
-- Phase 3B: Helper Functions for Enrichment
-- Planning Radar Intelligence Functions
-- =====================================================

-- =====================================================
-- Get comparable sold prices near a postcode
-- =====================================================
CREATE OR REPLACE FUNCTION get_comparables(
  target_postcode TEXT,
  target_property_type CHAR(1) DEFAULT NULL,
  months_back INTEGER DEFAULT 24,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  price INTEGER,
  date_of_transfer DATE,
  full_address TEXT,
  property_type CHAR(1),
  old_new CHAR(1),
  duration CHAR(1)
) LANGUAGE plpgsql AS $$
DECLARE sector TEXT;
BEGIN
  -- Extract postcode sector (everything except last 2 characters)
  sector := TRIM(LEFT(target_postcode, LENGTH(target_postcode) - 2));

  RETURN QUERY
  SELECT lr.price, lr.date_of_transfer,
    CONCAT_WS(', ',
      NULLIF(CONCAT_WS(' ', lr.saon, lr.paon), ''),
      lr.street,
      lr.town,
      lr.postcode
    ),
    lr.property_type, lr.old_new, lr.duration
  FROM land_registry_prices lr
  WHERE lr.postcode_sector = sector
    AND lr.date_of_transfer >= CURRENT_DATE - (months_back || ' months')::INTERVAL
    AND (target_property_type IS NULL OR lr.property_type = target_property_type)
    AND lr.record_status != 'D'
    AND lr.price > 0  -- Exclude non-monetary transfers
  ORDER BY lr.date_of_transfer DESC
  LIMIT max_results;
END; $$;

COMMENT ON FUNCTION get_comparables IS 'Get comparable property sales in the same postcode sector';

-- =====================================================
-- Check all constraints at a geographic point
-- =====================================================
CREATE OR REPLACE FUNCTION check_constraints_at_point(
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  buffer_metres INTEGER DEFAULT 50
)
RETURNS TABLE (
  dataset TEXT,
  constraint_name TEXT,
  constraint_description TEXT,
  distance_metres DOUBLE PRECISION
) LANGUAGE plpgsql AS $$
DECLARE
  pt GEOMETRY;
BEGIN
  pt := ST_SetSRID(ST_MakePoint(lng, lat), 4326);

  -- Return constraints that contain the point (distance 0)
  RETURN QUERY
  SELECT pc.dataset, pc.name, pc.description, 0.0::DOUBLE PRECISION
  FROM planning_constraints pc
  WHERE ST_Contains(pc.geometry, pt)
    AND (pc.end_date IS NULL OR pc.end_date > CURRENT_DATE)

  UNION ALL

  -- Return nearby listed buildings within buffer
  SELECT 'listed-building'::TEXT,
    lb.name,
    ('Grade ' || lb.grade || ' listed building')::TEXT,
    ST_Distance(lb.point::geography, pt::geography)
  FROM listed_buildings lb
  WHERE ST_DWithin(lb.point::geography, pt::geography, buffer_metres)

  ORDER BY distance_metres ASC;
END; $$;

COMMENT ON FUNCTION check_constraints_at_point IS 'Check planning constraints and nearby listed buildings at a geographic point';

-- =====================================================
-- Check flood risk at a point
-- =====================================================
CREATE OR REPLACE FUNCTION check_flood_risk(
  lng DOUBLE PRECISION,
  lat DOUBLE PRECISION
)
RETURNS TABLE (
  zone TEXT,
  source TEXT,
  risk_level TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
  pt GEOMETRY;
BEGIN
  pt := ST_SetSRID(ST_MakePoint(lng, lat), 4326);

  RETURN QUERY
  SELECT fz.zone, fz.source, fz.risk_level
  FROM flood_risk_zones fz
  WHERE ST_Contains(fz.geometry, pt);
END; $$;

COMMENT ON FUNCTION check_flood_risk IS 'Check flood risk zones at a geographic point';

-- =====================================================
-- Get property sale history for exact address/postcode
-- =====================================================
CREATE OR REPLACE FUNCTION get_property_history(
  target_postcode TEXT,
  house_number TEXT DEFAULT NULL,
  street_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  price INTEGER,
  date_of_transfer DATE,
  property_type CHAR(1),
  old_new CHAR(1),
  duration CHAR(1),
  full_address TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT lr.price, lr.date_of_transfer, lr.property_type, lr.old_new, lr.duration,
    CONCAT_WS(', ',
      NULLIF(CONCAT_WS(' ', lr.saon, lr.paon), ''),
      lr.street,
      lr.town,
      lr.postcode
    )
  FROM land_registry_prices lr
  WHERE lr.postcode = target_postcode
    AND (house_number IS NULL OR lr.paon ILIKE '%' || house_number || '%')
    AND (street_name IS NULL OR lr.street ILIKE '%' || street_name || '%')
    AND lr.record_status != 'D'
    AND lr.price > 0
  ORDER BY lr.date_of_transfer DESC;
END; $$;

COMMENT ON FUNCTION get_property_history IS 'Get sale history for a specific property by postcode and optional address components';

-- =====================================================
-- Calculate comparable statistics for a postcode sector
-- =====================================================
CREATE OR REPLACE FUNCTION get_comparable_stats(
  target_postcode TEXT,
  target_property_type CHAR(1) DEFAULT NULL,
  months_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  sector TEXT,
  count INTEGER,
  avg_price INTEGER,
  median_price INTEGER,
  min_price INTEGER,
  max_price INTEGER,
  recent_avg_price INTEGER  -- Last 6 months average
) LANGUAGE plpgsql AS $$
DECLARE
  postcode_sector TEXT;
BEGIN
  postcode_sector := TRIM(LEFT(target_postcode, LENGTH(target_postcode) - 2));

  RETURN QUERY
  WITH sector_sales AS (
    SELECT lr.price, lr.date_of_transfer
    FROM land_registry_prices lr
    WHERE lr.postcode_sector = postcode_sector
      AND lr.date_of_transfer >= CURRENT_DATE - (months_back || ' months')::INTERVAL
      AND (target_property_type IS NULL OR lr.property_type = target_property_type)
      AND lr.record_status != 'D'
      AND lr.price > 0
  ),
  recent_sales AS (
    SELECT lr.price
    FROM land_registry_prices lr
    WHERE lr.postcode_sector = postcode_sector
      AND lr.date_of_transfer >= CURRENT_DATE - INTERVAL '6 months'
      AND (target_property_type IS NULL OR lr.property_type = target_property_type)
      AND lr.record_status != 'D'
      AND lr.price > 0
  )
  SELECT
    postcode_sector,
    COUNT(*)::INTEGER,
    AVG(sector_sales.price)::INTEGER,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sector_sales.price)::INTEGER,
    MIN(sector_sales.price)::INTEGER,
    MAX(sector_sales.price)::INTEGER,
    COALESCE((SELECT AVG(recent_sales.price)::INTEGER FROM recent_sales), 0)::INTEGER
  FROM sector_sales;
END; $$;

COMMENT ON FUNCTION get_comparable_stats IS 'Calculate statistical summary of comparable sales in a postcode sector';

-- =====================================================
-- Update enrichment point geometry from lat/lng
-- =====================================================
CREATE OR REPLACE FUNCTION update_enrichment_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set point geometry
CREATE TRIGGER trigger_update_enrichment_point
  BEFORE INSERT OR UPDATE ON application_enrichment
  FOR EACH ROW EXECUTE FUNCTION update_enrichment_point();