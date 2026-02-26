# Phase 4: Data Import Guide

## Overview

Phase 4 imports real UK property data and planning constraints to populate the enrichment tables created in Phase 3.

## Prerequisites

1. **Phase 3 completed** - Enrichment schema must be applied to Supabase
2. **Environment variables** set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. **Dependencies installed** - `csv-parse` and `node-fetch` (should be installed automatically)

## Import Scripts

### 🏠 Land Registry Price Data

Downloads UK property sale prices and imports London records only.

```bash
# Latest monthly data (~5k-10k records)
node scripts/import-land-registry.js

# Specific year (recommended for initial import)
node scripts/import-land-registry.js --year 2024

# Complete dataset (~4.3GB, 150k+ London records)
node scripts/import-land-registry.js --full

# Help
node scripts/import-land-registry.js --help
```

**Recommended first import:** Start with `--year 2024` to get ~50k London records.

### 🏛️ Planning Constraints

Downloads planning constraint data (conservation areas, Article 4, etc.) from gov.uk.

```bash
# All constraint datasets
node scripts/import-constraints.js

# Specific dataset
node scripts/import-constraints.js conservation-area

# List available datasets
node scripts/import-constraints.js --list

# Help
node scripts/import-constraints.js --help
```

**Available datasets:**
- `conservation-area` - Conservation areas
- `article-4-direction-area` - Article 4 directions
- `green-belt` - Green Belt designation
- `tree-preservation-zone` - Tree preservation orders
- `area-of-outstanding-natural-beauty` - AONB areas
- `ancient-woodland` - Ancient woodland
- `brownfield-site` - Brownfield sites
- `listed-building` - Listed buildings (goes to separate table)

## Import Order

**For initial setup, run in this order:**

1. **Apply Phase 3 schema** (if not done):
   ```bash
   node scripts/apply-enrichment-migrations.js
   ```

2. **Import Land Registry data**:
   ```bash
   node scripts/import-land-registry.js --year 2024
   ```

3. **Import planning constraints**:
   ```bash
   node scripts/import-constraints.js
   ```

4. **Verify data**:
   ```sql
   -- Check Land Registry records
   SELECT COUNT(*) FROM land_registry_prices;

   -- Check constraints by type
   SELECT dataset, COUNT(*) FROM planning_constraints GROUP BY dataset;

   -- Check listed buildings
   SELECT COUNT(*) FROM listed_buildings;
   ```

## Data Sources

- **Land Registry**: http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/
- **Planning Constraints**: https://files.planning.data.gov.uk/dataset/
- **Geographic filtering**: London bounding box applied automatically

## Performance Notes

- **Land Registry**: Processes ~1000 records per batch, filters to London postcodes only
- **Constraints**: Downloads GeoJSON, filters to London bounds, inserts in batches
- **Memory usage**: Scripts process data in streams for large datasets
- **Network**: Downloads can be 100MB+ for full datasets

## Troubleshooting

### "Missing environment variable"
Ensure `.env.local` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### "Download failed"
Government data APIs occasionally have downtime. Try again later.

### "Import failed" / "Batch error"
Check Supabase logs and ensure Phase 3 schema is applied.

### "No records found"
For constraints: Some datasets may have no London records (e.g., green belt)
For Land Registry: Check postcode filtering is working

## Data Volumes

**Expected London records after full import:**
- Land Registry: ~150,000 property sales (2024-2025)
- Conservation areas: ~1,000 areas
- Article 4 directions: ~500 areas
- Listed buildings: ~15,000 buildings
- Other constraints: ~100-1,000 each

## Automated Data Updates

### Monthly Land Registry Sync

The system automatically downloads and imports new Land Registry data on the 1st of each month at 2:00 AM via Vercel Cron.

**Cron Configuration** (in `vercel.json`):
```json
{
  "path": "/api/cron/sync-land-registry",
  "schedule": "0 2 1 * *"
}
```

**Manual Trigger** (for testing/emergency updates):
```bash
curl -X POST https://your-domain.com/api/admin/trigger-land-registry-sync \
  -H "Authorization: Bearer your_admin_secret"
```

**Check Sync Status**:
```bash
curl -X GET https://your-domain.com/api/admin/check-sync-status \
  -H "Authorization: Bearer your_admin_secret"
```

### Environment Variables for Automation

Add these to your Vercel environment:
```env
CRON_SECRET=your_secure_cron_secret_here
ADMIN_SECRET=your_admin_secret_here
```

## Next Steps

After importing data:
1. **Phase 5**: Build enrichment pipeline
2. **Phase 6**: Add enrichment UI
3. **Testing**: Try the enrichment functions in Supabase SQL editor
4. **Monitoring**: Check automated sync logs via admin endpoints