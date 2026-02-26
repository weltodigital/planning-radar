-- =====================================================
-- Phase 3C: Row Level Security for Enrichment Tables
-- Planning Radar Data Access Control
-- =====================================================

-- =====================================================
-- Application Enrichment - Readable by authenticated users
-- =====================================================
ALTER TABLE application_enrichment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrichment readable by authenticated" ON application_enrichment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enrichment writable by service role" ON application_enrichment
  FOR ALL TO service_role USING (true);

-- =====================================================
-- Land Registry - Service role access only (bulk data)
-- =====================================================
ALTER TABLE land_registry_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LR readable by service role" ON land_registry_prices
  FOR SELECT TO service_role USING (true);

CREATE POLICY "LR writable by service role" ON land_registry_prices
  FOR ALL TO service_role USING (true);

-- =====================================================
-- EPC Certificates - Service role access only
-- =====================================================
ALTER TABLE epc_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EPC readable by service role" ON epc_certificates
  FOR SELECT TO service_role USING (true);

CREATE POLICY "EPC writable by service role" ON epc_certificates
  FOR ALL TO service_role USING (true);

-- =====================================================
-- Planning Constraints - Service role access only
-- =====================================================
ALTER TABLE planning_constraints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Constraints readable by service role" ON planning_constraints
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Constraints writable by service role" ON planning_constraints
  FOR ALL TO service_role USING (true);

-- =====================================================
-- Flood Risk Zones - Service role access only
-- =====================================================
ALTER TABLE flood_risk_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flood zones readable by service role" ON flood_risk_zones
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Flood zones writable by service role" ON flood_risk_zones
  FOR ALL TO service_role USING (true);

-- =====================================================
-- Listed Buildings - Service role access only
-- =====================================================
ALTER TABLE listed_buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listed buildings readable by service role" ON listed_buildings
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Listed buildings writable by service role" ON listed_buildings
  FOR ALL TO service_role USING (true);

-- =====================================================
-- Grant execute permissions on functions to authenticated users
-- This allows them to call the RPC functions from the client
-- =====================================================

-- Comparables functions (for authenticated users via API)
GRANT EXECUTE ON FUNCTION get_comparables(TEXT, CHAR, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comparable_stats(TEXT, CHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_history(TEXT, TEXT, TEXT) TO authenticated;

-- Constraint checking functions (for authenticated users via API)
GRANT EXECUTE ON FUNCTION check_constraints_at_point(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_flood_risk(DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- All functions available to service role (for enrichment processing)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON POLICY "Enrichment readable by authenticated" ON application_enrichment
IS 'Allow authenticated users to read enrichment data for applications';

COMMENT ON POLICY "LR readable by service role" ON land_registry_prices
IS 'Land Registry data accessible only via service role for enrichment processing';

COMMENT ON POLICY "Constraints readable by service role" ON planning_constraints
IS 'Planning constraints accessible only via service role for enrichment processing';