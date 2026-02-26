# Phase 3: Enrichment Schema Setup

## Overview

Phase 3 adds the intelligence layer to Planning Radar with property prices, EPC data, planning constraints, and enrichment scoring.

## Quick Setup

### Option 1: Automatic (Recommended)
```bash
node scripts/apply-enrichment-migrations.js
```

### Option 2: Manual Application

If the automatic script fails, apply these SQL files manually in your Supabase SQL Editor:

1. **`supabase/migrations/003_enrichment_schema.sql`** - Creates all enrichment tables
2. **`supabase/migrations/004_enrichment_functions.sql`** - Creates helper functions
3. **`supabase/migrations/005_enrichment_rls.sql`** - Sets up Row Level Security

**Supabase SQL Editor URL:** `https://supabase.com/dashboard/project/[your-project-id]/sql`

## What Gets Created

### 🗄️ **New Tables:**
- **`land_registry_prices`** - UK property sale data (150k+ London records)
- **`epc_certificates`** - Energy performance certificates
- **`planning_constraints`** - Conservation areas, Article 4 directions, etc.
- **`flood_risk_zones`** - Environment Agency flood risk data
- **`listed_buildings`** - Historic England listed buildings
- **`application_enrichment`** - Enriched planning application cache

### ⚡ **New Functions:**
- **`get_comparables(postcode, type, months, limit)`** - Get comparable property sales
- **`get_comparable_stats(postcode, type, months)`** - Statistical summaries (avg, median, etc.)
- **`check_constraints_at_point(lng, lat, buffer)`** - Check planning constraints at location
- **`check_flood_risk(lng, lat)`** - Check flood risk zones
- **`get_property_history(postcode, house_number, street)`** - Sale history for specific property

### 🔐 **Security:**
- Row Level Security enabled on all tables
- Service role access for bulk data operations
- Authenticated user access to enrichment results via API

## Next Steps

After applying these migrations:

1. **Phase 4:** Import data using the import scripts
2. **Phase 5:** Build the enrichment pipeline
3. **Phase 6:** Add enrichment UI components

## Data Sources

- **Land Registry:** Property sale prices (public data)
- **EPC:** Energy performance certificates (public data)
- **Planning Data:** GLA Planning Constraints (open data)
- **Environment Agency:** Flood risk zones (open data)
- **Historic England:** Listed buildings (open data)

## Architecture Notes

- All enrichment data is cached in `application_enrichment` table
- Functions use PostGIS for efficient geographic queries
- Land Registry data filtered to London postcodes only
- Opportunity scoring algorithm weights multiple factors