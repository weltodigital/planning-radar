-- Migration: Add Rich Planning London Datahub Fields
-- Adds all 52 fields from Planning London Datahub to support comprehensive planning data

-- Rich address fields
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS site_name TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS site_number TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS street_name TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS secondary_street_name TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS uprn TEXT;

-- Description and type
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS application_type_full TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS development_type TEXT;

-- Decision detail
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS decision_agency TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS decision_target_date DATE;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS decision_conditions TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS decision_process TEXT;

-- Timeline
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS actual_commencement_date DATE;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS actual_completion_date DATE;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS lapsed_date DATE;

-- Appeals
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS appeal_status TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS appeal_decision TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS appeal_decision_date DATE;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS appeal_start_date DATE;

-- Links and references
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS url_planning_app TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS pp_id TEXT;

-- Additional reference fields from audit
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS bo_system TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS borough TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS centroid_easting DECIMAL(10,2);
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS centroid_northing DECIMAL(10,2);
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS application_details TEXT;

-- Construction and completion tracking
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS date_building_work_started_under_previous_permission DATE;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS date_building_work_completed_under_previous_permission DATE;

-- Additional metadata
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS cil_liability TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS title_number TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS subdivision_of_building TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS parking_details TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS epc_number TEXT;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS reference_no_of_permission_being_relied_on TEXT;

-- Consultation
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS last_date_consultation_comments DATE;

-- Sync tracking
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ;
ALTER TABLE planning_applications ADD COLUMN IF NOT EXISTS last_updated_by TEXT;

-- Add indexes on new searchable/filterable fields
CREATE INDEX IF NOT EXISTS idx_apps_ward ON planning_applications(ward);
CREATE INDEX IF NOT EXISTS idx_apps_development_type ON planning_applications(development_type);
CREATE INDEX IF NOT EXISTS idx_apps_appeal_status ON planning_applications(appeal_status);
CREATE INDEX IF NOT EXISTS idx_apps_status ON planning_applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_borough ON planning_applications(borough);
CREATE INDEX IF NOT EXISTS idx_apps_locality ON planning_applications(locality);
CREATE INDEX IF NOT EXISTS idx_apps_street_name ON planning_applications(street_name);

-- Enhanced full-text search indexes
CREATE INDEX IF NOT EXISTS idx_apps_description_search ON planning_applications USING GIN(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_apps_combined_search ON planning_applications USING GIN(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(application_details, ''))
);

-- Add comments for documentation
COMMENT ON COLUMN planning_applications.site_name IS 'Building or site name';
COMMENT ON COLUMN planning_applications.site_number IS 'House/building number';
COMMENT ON COLUMN planning_applications.street_name IS 'Street name';
COMMENT ON COLUMN planning_applications.ward IS 'Council ward';
COMMENT ON COLUMN planning_applications.uprn IS 'Unique Property Reference Number';
COMMENT ON COLUMN planning_applications.description IS 'Full planning application description';
COMMENT ON COLUMN planning_applications.url_planning_app IS 'Direct link to council planning portal';
COMMENT ON COLUMN planning_applications.pp_id IS 'Planning Portal ID';
COMMENT ON COLUMN planning_applications.development_type IS 'Type of development (e.g. residential, commercial)';
COMMENT ON COLUMN planning_applications.decision_agency IS 'Agency that made the decision';
COMMENT ON COLUMN planning_applications.appeal_status IS 'Current appeal status if applicable';