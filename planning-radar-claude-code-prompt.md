# Planning Radar — Complete Build Prompt

## Project Context

Planning Radar (planningradar.com) is a London planning application intelligence platform. The codebase exists and is partially functional. This prompt covers everything needed to go from current state to a product worth paying £79-£299/month for.

**Existing tech stack:**
- Next.js 14 with Pages Router (NOT App Router)
- Supabase (PostgreSQL + PostGIS + Auth)
- Stripe (partially integrated — checkout exists, webhooks are stubs)
- Tailwind CSS with custom design system (teal #0F766E primary, #F59E0B accent)
- Vercel hosting
- Data: GLA Planning London Datahub (daily cron sync)
- Geocoding: postcodes.io API with postcode_cache table

**Existing database tables:**
- `planning_applications` — main data table with 20+ fields, PostGIS location fields
- `subscriptions` — plan management
- `saved_searches` — user-specific (API exists, no UI)
- `postcode_cache` — geocoding cache
- `lpa_sync_log` — data pipeline tracking

**Existing features that work:**
- Postcode search (basic area matching, not true radius)
- Council/borough filtering (all 35 London boroughs)
- Status filtering (Pending, Approved, Refused, Withdrawn)
- Supabase Auth with magic link (passwordless)
- Live data table on homepage
- Demo page with limited search
- Programmatic SEO pages for each council (/planning-applications/[council])
- Daily automated sync from GLA Datahub
- Three pricing tiers defined (Free Trial, Pro £79/mo, Premium £299/mo)

**What's broken or missing:**
- Stripe webhook handlers are TODO stubs — no working payment flow
- Plan enforcement not implemented — users can't actually upgrade/downgrade
- Authentication middleware disabled — dashboard accessible without login
- CSV export not built (advertised on Premium tier)
- Applicant/agent search not built (advertised on Premium tier)
- Saved searches has API but no UI
- PostGIS radius search not fully implemented
- No user dashboard for account/subscription management

---

## Build Phases — Execute In Order

Work through these phases sequentially. Each phase should be fully working before moving to the next. Test after each phase.

---

## PHASE 1: Fix Critical Blockers (Payment + Auth)

This is the most important phase. Nothing else matters if users can't pay.

### 1A: Complete Stripe Webhook Handlers

File: `pages/api/webhooks/stripe.js` (exists but has TODO stubs)

Implement handlers for these Stripe webhook events:
- `checkout.session.completed` — User completed checkout. Look up the Stripe customer, find or create the user in Supabase, create/update their subscription record with plan type, stripe_customer_id, stripe_subscription_id, status='active', current_period_start, current_period_end.
- `customer.subscription.updated` — Plan changed or renewed. Update the subscription record with new plan, status, and period dates.
- `customer.subscription.deleted` — Cancelled. Set subscription status to 'cancelled', set plan to 'free'.
- `invoice.payment_succeeded` — Renewal payment worked. Update current_period_end.
- `invoice.payment_failed` — Payment failed. Set subscription status to 'past_due'.

The webhook handler must:
- Verify the Stripe signature using `STRIPE_WEBHOOK_SECRET` env var
- Use raw body parsing (disable Next.js body parser for this route)
- Return 200 quickly even if processing takes time
- Log all events for debugging

Env vars needed: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### 1B: Stripe Checkout Session Creation

File: `pages/api/create-checkout-session.js`

- Accept POST with `{ priceId, userId }` (or get userId from Supabase auth session)
- Create a Stripe Checkout Session with:
  - mode: 'subscription'
  - success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`
  - cancel_url: `${origin}/pricing`
  - customer_email: user's email from Supabase auth
  - metadata: { userId, plan }
  - allow_promotion_codes: true
- If user already has a stripe_customer_id in subscriptions table, pass it as `customer` param
- Return the checkout session URL

Create two Stripe Price IDs (in Stripe dashboard):
- Pro: £79/month recurring
- Premium: £299/month recurring

Store these in env vars: `STRIPE_PRO_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`

### 1C: Stripe Customer Portal

File: `pages/api/create-portal-session.js`

- Accept POST, require authenticated user
- Look up their stripe_customer_id from subscriptions table
- Create a Stripe Billing Portal session
- Return the portal URL
- This lets users manage their subscription (upgrade, downgrade, cancel, update payment) without us building UI for it

### 1D: Plan Enforcement Middleware

File: `middleware.js` (or `lib/planEnforcement.js`)

Create a server-side helper function `getUserPlan(userId)` that:
- Queries the subscriptions table for the user
- Returns their current plan ('free', 'pro', 'premium') and status ('active', 'past_due', 'cancelled', 'trialing')
- Caches the result briefly (5 minutes) to avoid hammering the DB on every request

Create plan limit constants:
```
PLAN_LIMITS = {
  free:    { maxResults: 10, historyDays: 7,   savedSearches: 0,  csvExport: false, applicantSearch: false },
  pro:     { maxResults: Infinity, historyDays: 365, savedSearches: 5,  csvExport: false, applicantSearch: false },
  premium: { maxResults: Infinity, historyDays: Infinity, savedSearches: Infinity, csvExport: true, applicantSearch: true },
}
```

Apply these limits in every search API route:
- Limit result count based on plan
- Restrict date range based on plan
- Gate CSV export behind premium check
- Gate applicant/agent search behind premium check

### 1E: Enable Authentication Middleware

File: `middleware.js`

Protect these routes — redirect to /login if not authenticated:
- `/dashboard`
- `/dashboard/*`
- `/api/search` (return 401)
- `/api/saved-searches` (return 401)
- `/api/export` (return 401)

Do NOT protect:
- `/`, `/pricing`, `/login`, `/signup`, `/demo`
- `/planning-applications/*` (SEO pages)
- `/api/webhooks/*`
- `/api/create-checkout-session`

Use Supabase auth middleware: check for the `sb-access-token` cookie or Authorization header.

### 1F: User Dashboard

File: `pages/dashboard/index.js`

Build a dashboard page that shows:
- User's current plan (Free/Pro/Premium) with a status badge
- If on free trial: days remaining, upgrade CTA
- If on paid plan: next billing date, "Manage Subscription" button (links to Stripe portal)
- Saved searches list (from saved_searches table) with delete buttons
- Recent search history
- Quick search bar to jump into searching

Style with existing Tailwind design system (teal primary, amber accent, generous spacing).

---

## PHASE 2: Build Advertised Premium Features

These features are listed on the pricing page but don't work yet. Fix this before adding new features.

### 2A: CSV Export

File: `pages/api/export.js`

- Accept GET with same search params as the search API
- Require authentication + premium plan
- Query planning_applications with the search filters (no result limit)
- Generate CSV with headers: Reference, Address, Council, Description, Status, Application Type, Decision, Decision Date, Received Date, Validated Date, Applicant, Agent
- Return with Content-Type: text/csv and Content-Disposition: attachment; filename="planning-radar-export-{date}.csv"
- Add "Export CSV" button to search results page, visible only to premium users
- Show upgrade prompt if non-premium user clicks it

### 2B: Applicant & Agent Search

Update the search API and UI to support searching by applicant name and agent name.

- Add text input fields for "Applicant Name" and "Agent Name" to the search form
- These should be premium-only: show the fields to everyone but show an upgrade modal if a non-premium user tries to use them
- Query: `WHERE applicant_name ILIKE '%{query}%' OR agent_name ILIKE '%{query}%'`
- Make sure these columns exist and are indexed in planning_applications table

### 2C: Saved Searches UI

File: `pages/dashboard/saved-searches.js` or section in dashboard

The saved_searches table and API already exist. Build the UI:

- "Save This Search" button on search results page (visible to Pro+ users, count-limited to 5 for Pro)
- Saves the current search parameters (postcode, council, status, keywords, etc.) with a user-defined name
- Dashboard section listing saved searches with: name, parameters summary, "Run Search" button, "Delete" button
- Running a saved search navigates to the search page with those params pre-filled

### 2D: PostGIS Radius Search

The database has PostGIS and location fields but radius search isn't fully implemented.

- When user enters a postcode, geocode it via postcodes.io (or hit postcode_cache first)
- Use PostGIS `ST_DWithin` to find applications within a radius (default 1km, allow user to choose 0.5km, 1km, 2km, 5km)
- Query: `WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_metres)`
- Add radius dropdown to the search form next to the postcode input
- Make sure the planning_applications table has a proper geometry column with a GIST index

---

## PHASE 3: Data Enrichment — Database Schema

Now we add the intelligence layer. Run this SQL in Supabase SQL Editor.

### 3A: New Tables

```sql
-- Land Registry Price Paid Data
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

-- EPC Certificates
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

-- Planning Constraints (conservation areas, Article 4, green belt, etc.)
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

-- Flood Risk Zones
CREATE TABLE IF NOT EXISTS flood_risk_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone TEXT NOT NULL,
  source TEXT,
  risk_level TEXT,
  geometry GEOMETRY(MultiPolygon, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flood_geom ON flood_risk_zones USING GIST(geometry);

-- Listed Buildings (fast lookup)
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

-- Enrichment Cache (one row per planning application)
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
```

### 3B: Helper Functions

```sql
-- Get comparable sold prices near a postcode
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
  sector := TRIM(LEFT(target_postcode, LENGTH(target_postcode) - 2));
  RETURN QUERY
  SELECT lr.price, lr.date_of_transfer,
    CONCAT_WS(', ', NULLIF(CONCAT_WS(' ', lr.saon, lr.paon), ''), lr.street, lr.town, lr.postcode),
    lr.property_type, lr.old_new, lr.duration
  FROM land_registry_prices lr
  WHERE lr.postcode_sector = sector
    AND lr.date_of_transfer >= CURRENT_DATE - (months_back || ' months')::INTERVAL
    AND (target_property_type IS NULL OR lr.property_type = target_property_type)
    AND lr.record_status != 'D'
  ORDER BY lr.date_of_transfer DESC
  LIMIT max_results;
END; $$;

-- Check all constraints at a geographic point
CREATE OR REPLACE FUNCTION check_constraints_at_point(
  lng DOUBLE PRECISION, lat DOUBLE PRECISION, buffer_metres INTEGER DEFAULT 50
)
RETURNS TABLE (
  dataset TEXT, constraint_name TEXT, constraint_description TEXT, distance_metres DOUBLE PRECISION
) LANGUAGE plpgsql AS $$
DECLARE pt GEOMETRY;
BEGIN
  pt := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
  RETURN QUERY
  SELECT pc.dataset, pc.name, pc.description, 0.0::DOUBLE PRECISION
  FROM planning_constraints pc
  WHERE ST_Contains(pc.geometry, pt) AND (pc.end_date IS NULL OR pc.end_date > CURRENT_DATE)
  UNION ALL
  SELECT 'listed-building'::TEXT, lb.name, ('Grade ' || lb.grade)::TEXT,
    ST_Distance(lb.point::geography, pt::geography)
  FROM listed_buildings lb
  WHERE ST_DWithin(lb.point::geography, pt::geography, buffer_metres)
  ORDER BY distance_metres ASC;
END; $$;

-- Check flood risk at a point
CREATE OR REPLACE FUNCTION check_flood_risk(lng DOUBLE PRECISION, lat DOUBLE PRECISION)
RETURNS TABLE (zone TEXT, source TEXT, risk_level TEXT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT fz.zone, fz.source, fz.risk_level
  FROM flood_risk_zones fz
  WHERE ST_Contains(fz.geometry, ST_SetSRID(ST_MakePoint(lng, lat), 4326));
END; $$;
```

### 3C: Row Level Security

```sql
ALTER TABLE application_enrichment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrichment readable by authenticated" ON application_enrichment
  FOR SELECT TO authenticated USING (true);

ALTER TABLE land_registry_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LR readable by service role" ON land_registry_prices
  FOR SELECT TO service_role USING (true);
```

---

## PHASE 4: Data Import Scripts

### 4A: Land Registry Import

File: `scripts/import-land-registry.js` (standalone Node script, NOT an API route)

- Downloads CSV from `http://prod1.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/`
- CSV has NO headers. Column order: transaction_id (GUID with {braces}), price, date_of_transfer, postcode, property_type, old_new, duration, paon, saon, street, locality, town, district, county, ppd_category, record_status
- Strip curly braces from transaction_id
- Filter to London postcodes only: all E, EC, N, NW, SE, SW, W, WC, BR, CR, DA, EN, HA, IG, KT, RM, SM, TW, UB outward codes
- Compute postcode_area (outward code before space) and postcode_sector (everything except last 2 chars)
- Upsert batches of 1000 on transaction_id conflict
- CLI: `node scripts/import-land-registry.js` (monthly update), `--year 2024` (specific year), `--full` (complete ~4.3GB dataset)
- Use `@supabase/supabase-js` and `csv-parse` packages
- Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY

**Recommended first import:** Run `--year 2024` then `--year 2025` then default (latest month). Gives ~150K London rows.

### 4B: Constraints Import

File: `scripts/import-constraints.js` (standalone Node script)

- Downloads GeoJSON from `https://files.planning.data.gov.uk/dataset/{name}.geojson`
- Datasets: conservation-area, article-4-direction-area, green-belt, tree-preservation-zone, area-of-outstanding-natural-beauty, ancient-woodland, brownfield-site
- Filter to London bounding box: lng -0.51 to 0.334, lat 51.28 to 51.70
- Clear existing rows for the dataset, then insert new ones
- Separate function for listed buildings → listed_buildings table (extract grade field)
- CLI: `node scripts/import-constraints.js` (all) or `node scripts/import-constraints.js conservation-area` (specific)
- Insert geometry as GeoJSON string (Supabase/PostGIS handles conversion)

---

## PHASE 5: Enrichment Pipeline

### 5A: Core Enrichment Logic

File: `lib/enrich-application.js`

Export `enrichApplication({ application_reference, address, postcode, latitude, longitude })`:

1. **Land Registry**: Query land_registry_prices for exact postcode (own sale history), call get_comparables RPC for sector comparables. Calculate last_sale_price, last_sale_date, comparable stats (avg, median, count).

2. **EPC**: Check epc_certificates table by postcode + address match. Fallback: call EPC API at `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=X` with Basic auth header (env var EPC_API_TOKEN). Return epc_rating, floor_area_sqm, construction_age, property_type.

3. **Constraints**: Call check_constraints_at_point RPC with lng/lat. Map results to booleans: in_conservation_area, has_article_4, in_green_belt, in_aonb, has_tpo, near_listed_building. Extract names/details.

4. **Flood**: Call check_flood_risk RPC. Return highest zone found.

5. **Opportunity Score** (0-100, weighted):
   - Price discount vs area average (weight 30): `discount% * 3`, capped at 100
   - Constraint risk (weight 20): Start at 100, subtract penalties (conservation=25, article4=20, greenbelt=40, flood=30, listed=15, tpo=10)
   - EPC potential (weight 15): G=100, F=85, E=70, D=50, C=30, B=15, A=5
   - Property age (weight 10): Pre-1930=80, 1930-49=70, 1950-66=60, 1967-82=50, post-83=35, post-2003=20
   - Market liquidity (weight 10): comparable_count × 10, capped at 100

Run all 4 enrichments via Promise.all. Upsert result to application_enrichment.

Also export `batchEnrichNewApplications(limit=50)` that finds planning_applications not yet in application_enrichment, enriches each with 200ms delay.

### 5B: Enrichment API Route

File: `pages/api/enrich/[reference].js`

- GET handler, require authentication
- Check application_enrichment cache — return if exists and < 7 days old
- Otherwise find the application in planning_applications, run enrichApplication, return result
- Response: `{ source: "cache"|"fresh", data: { ...enrichment } }`

### 5C: Comparables API Route

File: `pages/api/comparables.js`

- GET with query params: postcode (required), type, months (default 24), limit (default 10)
- Call get_comparables RPC
- Return: `{ postcode, summary: { count, average, median, min, max }, sales: [...] }`

### 5D: Enrichment Cron

File: `pages/api/cron/enrich-batch.js`

- Verify CRON_SECRET bearer token
- Call batchEnrichNewApplications(50)
- Add to vercel.json crons: `{ "path": "/api/cron/enrich-batch", "schedule": "0 */4 * * *" }`

---

## PHASE 6: Frontend — Enrichment UI

### 6A: EnrichmentPanel Component

File: `components/EnrichmentPanel.jsx`

A component that takes `applicationReference` prop and displays enriched data. Style with Tailwind using the existing design system (teal-700 primary, amber-500 accent).

Sections:
1. **Opportunity Score**: Score badge (0-100) with color coding (green ≥70, amber ≥50, red <50). Progress bar. Expandable breakdown showing each factor's score and explanation text.

2. **Price Intelligence**: Grid of stats — Last Sale Price (£formatted + date), Area Average, Area Median, Price per sqm. Show comparable count.

3. **Property Details** (from EPC): EPC rating badge (color A=green through G=red), floor area sqm, construction age band, property type.

4. **Planning Constraints**: Row of pill badges. Use Tailwind:
   - Conservation area: `bg-amber-100 text-amber-800 border-amber-300`
   - Article 4: `bg-red-100 text-red-800 border-red-300`
   - Green belt: `bg-red-100 text-red-800 border-red-300`
   - Flood zone: `bg-red-100 text-red-800 border-red-300`
   - Listed building: `bg-amber-100 text-amber-800 border-amber-300`
   - AONB: `bg-amber-100 text-amber-800 border-amber-300`
   - TPO: `bg-blue-100 text-blue-800 border-blue-300`
   - No constraints: `bg-emerald-100 text-emerald-800 border-emerald-300`

### 6B: React Hooks

File: `hooks/useEnrichment.js`

- `useApplicationEnrichment(ref)` → fetches `/api/enrich/{ref}`, returns `{ enrichment, loading, error }`
- `useComparables(postcode, type, months)` → fetches `/api/comparables`, returns `{ comparables, summary, loading, error }`

### 6C: Integrate Into Application Detail View

Find the existing application detail page/modal in the codebase. Add:
```jsx
import EnrichmentPanel from '../components/EnrichmentPanel';
// Inside the component, below the existing application details:
<EnrichmentPanel applicationReference={application.reference} />
```

### 6D: Add Enrichment Columns to Search Results Table

In the search results table, add optional columns that show data from application_enrichment:
- Opportunity Score (sortable)
- Last Sale Price
- EPC Rating
- Constraint count (number of active constraints)

These should be populated by joining application_enrichment in the search query. If no enrichment exists yet, show "—".

---

## PHASE 7: Map View

### 7A: Mapbox Integration

File: `components/MapView.jsx`

Install: `npm install mapbox-gl`

Build a map component using Mapbox GL JS:
- Center on London (51.509, -0.118), zoom 11
- Plot every application from search results as a marker
- Color-code markers: green=Approved, red=Refused, amber=Pending, gray=Withdrawn
- Cluster markers when zoomed out (use Mapbox cluster source)
- Click a marker → show popup with: address, description, status, opportunity score, last sale price
- Click "View Details" in popup → navigate to full application detail

Env var: `NEXT_PUBLIC_MAPBOX_TOKEN`

Mapbox free tier: 50,000 map loads/month — plenty for early stage.

### 7B: Constraint Map Layers

Add toggleable overlay layers from the planning_constraints table:
- Conservation areas (teal polygons, 30% opacity)
- Article 4 areas (red polygons, 20% opacity)
- Green belt (green polygons, 20% opacity)
- Flood zones (blue polygons, 20% opacity)

Fetch these as GeoJSON from a new API route `pages/api/map/constraints.js` that queries the constraints table with a bounding box filter.

Add a layer toggle panel in the top-right corner of the map.

### 7C: Search Page Layout

Update the search results page to have a split view:
- Left: search form + results table (existing)
- Right: map showing the results

Use a toggle or tab to switch between "List View" and "Map View" on mobile.

---

## Environment Variables Summary

```
# Existing
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Add these
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
EPC_API_TOKEN=...                    # From epc.opendatacommunities.org
CRON_SECRET=...                      # Random string for cron auth
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...   # From mapbox.com
```

---

## File Structure (new/modified files)

```
pages/
  api/
    webhooks/stripe.js           ← MODIFY (implement stubs)
    create-checkout-session.js   ← MODIFY or CREATE
    create-portal-session.js     ← CREATE
    export.js                    ← CREATE
    enrich/[reference].js        ← CREATE
    comparables.js               ← CREATE
    cron/enrich-batch.js         ← CREATE
    map/constraints.js           ← CREATE
  dashboard/
    index.js                     ← MODIFY (add subscription info, saved searches)

components/
  EnrichmentPanel.jsx            ← CREATE
  MapView.jsx                    ← CREATE

hooks/
  useEnrichment.js               ← CREATE

lib/
  enrich-application.js          ← CREATE
  plan-enforcement.js            ← CREATE

scripts/
  import-land-registry.js        ← CREATE (standalone, not deployed)
  import-constraints.js          ← CREATE (standalone, not deployed)

middleware.js                    ← MODIFY (enable auth protection)
vercel.json                      ← MODIFY (add cron)
```

---

## Priority Order If Time Is Limited

If you can only do some of this, do it in this order:

1. **Phase 1A-1C** (Stripe webhooks + checkout + portal) — Can't make money without this
2. **Phase 1D-1E** (Plan enforcement + auth middleware) — Can't justify charging without this
3. **Phase 1F** (User dashboard) — Users need to see their subscription
4. **Phase 2D** (PostGIS radius search) — Makes the core search actually good
5. **Phase 3** (Enrichment schema) — Foundation for intelligence features
6. **Phase 4A** (Land Registry import) — Highest-impact data
7. **Phase 5** (Enrichment pipeline) — Makes the product uniquely valuable
8. **Phase 6A** (EnrichmentPanel) — Users see the value
9. **Phase 7** (Map view) — Wow factor, demo-able, shareable
10. **Phase 2A-2C** (CSV, applicant search, saved searches UI) — Premium features that justify £299/mo

---

## Testing Checklist

After each phase, verify:

- [ ] Phase 1: Can sign up → checkout → see subscription in dashboard → manage via Stripe portal → cancel
- [ ] Phase 1: Free users see 10 results max, Pro users see unlimited, Premium users can export
- [ ] Phase 1: Unauthenticated users redirected from /dashboard to /login
- [ ] Phase 2: CSV downloads work for premium users, upgrade prompt for others
- [ ] Phase 2: Radius search returns different results at 1km vs 5km
- [ ] Phase 3: Tables created, PostGIS functions return data
- [ ] Phase 4: Land Registry has ~150K London rows, constraints have polygons with geometry
- [ ] Phase 5: Enriching an application returns price data, constraints, EPC, and a score
- [ ] Phase 6: EnrichmentPanel renders on application detail with real data
- [ ] Phase 7: Map shows pins, clicking shows popup, constraint layers toggle
