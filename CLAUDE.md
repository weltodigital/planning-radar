# PlanScope — UK Planning Application Tracker SaaS

## Project Overview

A SaaS tool that lets UK property investors, estate agents, developers, and planning consultants search and browse planning applications. Data is pulled daily from the planning API and stored in Supabase (Postgres + PostGIS). Users search, filter, and save searches. Monetised via Stripe with a free trial, Pro (£49/mo), and Premium (£199/mo).

## Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Database:** Supabase (Postgres + PostGIS extension + Supabase Auth)
- **Payments:** Stripe (Checkout Sessions, Customer Portal, Webhooks)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS + shadcn/ui components
- **Data source:** api.planning.org.uk (REST API)
- **Geocoding:** postcodes.io (free, no API key)

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
PLANNING_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

---

## BUILD PLAN — Follow these phases in order

---

### PHASE 1: Project Setup

1. Initialise Next.js 14+ project with App Router and TypeScript
2. Install dependencies:
   ```
   npm install @supabase/supabase-js @supabase/ssr stripe tailwindcss @tailwindcss/typography
   npx shadcn-ui@latest init
   ```
3. Set up Tailwind config
4. Create `/lib/supabase/client.ts` (browser client) and `/lib/supabase/server.ts` (server client using cookies)
5. Create `/lib/stripe.ts` (Stripe instance)
6. Create `/lib/types.ts` with all TypeScript types
7. Create `.env.local` template

---

### PHASE 2: Database Schema

Create a Supabase migration file or SQL script with the following:

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Planning applications table
CREATE TABLE planning_applications (
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

CREATE INDEX idx_apps_postcode ON planning_applications(postcode);
CREATE INDEX idx_apps_lpa ON planning_applications(lpa_name);
CREATE INDEX idx_apps_date ON planning_applications(date_validated DESC);
CREATE INDEX idx_apps_location ON planning_applications USING GIST(location);
CREATE INDEX idx_apps_title_search ON planning_applications USING GIN(to_tsvector('english', title));
CREATE INDEX idx_apps_applicant ON planning_applications(applicant_name);
CREATE INDEX idx_apps_agent ON planning_applications(agent_name);
CREATE INDEX idx_apps_decision ON planning_applications(decision);

-- Saved searches
CREATE TABLE saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_user ON saved_searches(user_id);

-- Subscriptions
CREATE TABLE subscriptions (
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

CREATE INDEX idx_subs_user ON subscriptions(user_id);
CREATE INDEX idx_subs_stripe ON subscriptions(stripe_customer_id);

-- Sync log
CREATE TABLE lpa_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lpa_id TEXT NOT NULL,
  lpa_name TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  applications_fetched INT DEFAULT 0,
  status TEXT DEFAULT 'success'
);

-- Postcode geocode cache
CREATE TABLE postcode_cache (
  postcode TEXT PRIMARY KEY,
  lat DECIMAL(9,6) NOT NULL,
  lng DECIMAL(9,6) NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own saved searches" ON saved_searches FOR ALL USING (auth.uid() = user_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE planning_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read applications" ON planning_applications FOR SELECT TO authenticated USING (true);

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

CREATE TRIGGER trigger_set_location
  BEFORE INSERT OR UPDATE ON planning_applications
  FOR EACH ROW EXECUTE FUNCTION set_application_location();
```

---

### PHASE 3: Data Pipeline

#### 3a: Planning API client

Create `/lib/planning-api.ts`:

- `generateApiKey(email: string)` → GET `https://api.planning.org.uk/v1/generatekey?email={email}`
- `fetchLPAs(apiKey: string)` → GET `https://api.planning.org.uk/v1/lpas?key={KEY}`
- `searchApplications(apiKey: string, lpaId: string, dateFrom: string, dateTo: string, returnData: boolean)` → GET `https://api.planning.org.uk/v1/search?key={KEY}&lpa_id={ID}&date_from={DATE}&date_to={DATE}&return_data={0|1}`

The API returns:
```json
{
  "response": {
    "status": "OK",
    "application_count": 26,
    "data": [
      {
        "lpa_id": "2",
        "lpa_name": "chichester",
        "keyval": "S08U81GYK8S00",
        "externalLink": "https://...",
        "title": "Two storey rear extension...",
        "address": "21 Church Road Epsom Surrey KT17 4DZ",
        "postcode": "KT17 4DZ",
        "lat": "51.333349",
        "lng": "-0.257361",
        "validated": "2023-10-10",
        "applicant": "Mr Smith",
        "agent": "ABC Planning Ltd",
        "decision": "Approved",
        "decision_date": "2023-12-01",
        "type": "Householder"
      }
    ]
  }
}
```

Map these fields to the `planning_applications` table columns.

#### 3b: Sync cron endpoint

Create `/app/api/cron/sync-applications/route.ts`:

1. Verify `CRON_SECRET` from Authorization header
2. Fetch all LPAs from the planning API
3. For each LPA:
   - Check `lpa_sync_log` for last sync date (default to yesterday if never synced)
   - Fetch applications since last sync with `return_data=1`
   - Upsert into `planning_applications` (ON CONFLICT on `external_id` DO UPDATE)
   - Log result in `lpa_sync_log`
   - Wait 500ms between LPA requests (rate limiting)
4. Use Supabase service role key (not anon key) for writes
5. Handle errors per-LPA — don't let one failure stop the whole sync
6. Return summary JSON

#### 3c: Vercel Cron config

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-applications",
      "schedule": "0 3 * * *"
    }
  ]
}
```

#### 3d: Manual sync trigger

Create `/app/api/admin/trigger-sync/route.ts` — same logic but can be called manually for testing. Protect with a simple admin secret.

---

### PHASE 4: Geocoding Helper

Create `/lib/geocode.ts`:

```typescript
async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  // 1. Check postcode_cache table first
  // 2. If not cached, call https://api.postcodes.io/postcodes/{POSTCODE}
  // 3. Cache result in postcode_cache table
  // 4. Return { lat, lng } or null if invalid
}
```

Normalise postcodes: uppercase, remove extra spaces, validate format.

---

### PHASE 5: Search API Routes

#### 5a: Main search endpoint

Create `/app/api/search/route.ts` (GET):

Query params:
- `postcode` — user's search postcode (geocode it, then radius search)
- `radius` — in miles: 0.5, 1, 3, 5 (convert to meters for PostGIS: 1 mile = 1609.34m)
- `council` — LPA name (alternative to postcode search)
- `keyword` — free text search on title (Pro + Premium only)
- `decision` — filter by decision status
- `date_from` / `date_to` — date range filter
- `page` / `limit` — pagination

Logic:
1. Get user's subscription from `subscriptions` table
2. Apply tier limits (see Tier Enforcement below)
3. Build Postgres query dynamically based on provided filters
4. For postcode search, use PostGIS:
   ```sql
   ST_DWithin(location, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography, $radius_meters)
   ```
5. For keyword search, use full text:
   ```sql
   to_tsvector('english', title) @@ plainto_tsquery('english', $keyword)
   ```
6. Return paginated results

#### 5b: Applicant/agent search endpoint (Premium only)

Create `/app/api/search/applicant/route.ts` (GET):

- `query` — search string matched against `applicant_name` and `agent_name` using ILIKE
- Only accessible to Premium users

#### 5c: CSV export endpoint (Premium only)

Create `/app/api/export/csv/route.ts` (GET):

- Accepts same params as main search
- Returns CSV file with headers
- Only accessible to Premium users
- Limit to 10,000 rows per export

---

### PHASE 6: Tier Enforcement

Create `/lib/plans.ts`:

```typescript
export type Plan = 'free_trial' | 'pro' | 'premium' | 'expired';

export function getPlanLimits(plan: Plan) {
  return {
    free_trial: {
      maxResults: 10,
      historyDays: 7,
      keywordFilters: false,
      fullDetail: false,
      maxSavedSearches: 0,
      csvExport: false,
      applicantSearch: false,
    },
    pro: {
      maxResults: null,
      historyDays: 365,
      keywordFilters: true,
      fullDetail: true,
      maxSavedSearches: 5,
      csvExport: false,
      applicantSearch: false,
    },
    premium: {
      maxResults: null,
      historyDays: null,
      keywordFilters: true,
      fullDetail: true,
      maxSavedSearches: null,
      csvExport: true,
      applicantSearch: true,
    },
    expired: {
      maxResults: 5,
      historyDays: 7,
      keywordFilters: false,
      fullDetail: false,
      maxSavedSearches: 0,
      csvExport: false,
      applicantSearch: false,
    },
  }[plan];
}
```

Create `/lib/get-user-plan.ts`:

```typescript
async function getUserPlan(userId: string): Promise<Plan> {
  // 1. Query subscriptions table for this user
  // 2. If no subscription, return 'expired'
  // 3. If plan is 'free_trial' and trial_ends_at < now, return 'expired'
  // 4. If status is 'active', return the plan
  // 5. Otherwise return 'expired'
}
```

Use this in every API route and server component to control access.

---

### PHASE 7: Authentication

Use Supabase Auth with email + magic link (passwordless).

#### 7a: Auth setup

- Create `/lib/supabase/middleware.ts` — refresh session on every request
- Create `/middleware.ts` — protect `/dashboard/*` routes, redirect unauthenticated users to `/login`

#### 7b: Auth pages

- `/app/(auth)/login/page.tsx` — email input → sends magic link
- `/app/(auth)/signup/page.tsx` — email input → creates account + sends magic link + creates `subscriptions` row with `plan: 'free_trial'` and `trial_ends_at: 7 days from now`
- `/app/(auth)/auth/callback/route.ts` — handles the magic link callback, exchanges code for session

#### 7c: On signup

After user is created in Supabase Auth, insert into `subscriptions`:
```sql
INSERT INTO subscriptions (user_id, plan, trial_ends_at, status)
VALUES ($userId, 'free_trial', NOW() + INTERVAL '7 days', 'active');
```

Use a Supabase database trigger or do this in the signup flow.

---

### PHASE 8: Stripe Integration

#### 8a: Checkout

Create `/app/api/stripe/checkout/route.ts` (POST):

1. Receives `{ priceId: string }` in body
2. Gets authenticated user from Supabase session
3. Creates or retrieves Stripe customer (store `stripe_customer_id` in subscriptions table)
4. Creates Stripe Checkout Session:
   ```typescript
   const session = await stripe.checkout.sessions.create({
     customer: stripeCustomerId,
     mode: 'subscription',
     line_items: [{ price: priceId, quantity: 1 }],
     success_url: `${APP_URL}/dashboard?upgrade=success`,
     cancel_url: `${APP_URL}/pricing`,
     metadata: { userId: user.id },
   });
   ```
5. Returns `{ url: session.url }`

#### 8b: Customer Portal

Create `/app/api/stripe/portal/route.ts` (POST):

1. Gets authenticated user
2. Creates Stripe Customer Portal session
3. Returns `{ url: session.url }`

#### 8c: Webhooks

Create `/app/api/webhooks/stripe/route.ts` (POST):

Handle these events:
- `checkout.session.completed` → update subscriptions: set plan (pro or premium based on price ID), stripe_customer_id, stripe_subscription_id, status = 'active'
- `customer.subscription.updated` → update plan and current_period_end
- `customer.subscription.deleted` → set plan to 'expired', status to 'canceled'
- `invoice.payment_failed` → set status to 'past_due'

**Important:** Verify webhook signature using `STRIPE_WEBHOOK_SECRET`.

---

### PHASE 9: Dashboard UI

#### 9a: Layout

Create `/app/dashboard/layout.tsx`:
- Sidebar or top nav with: Search, Saved Searches, Account
- Show current plan badge (Free Trial with days remaining, Pro, Premium)
- If trial expired or subscription past_due, show upgrade banner

#### 9b: Search page (`/app/dashboard/page.tsx`)

This is the main page. Components needed:

**SearchBar component:**
- Postcode input with validation
- Radius dropdown: 0.5mi, 1mi, 3mi, 5mi
- OR council dropdown (populated from distinct lpa_name values)
- Keyword input (disabled/locked with upgrade prompt for free trial users)
- Decision status filter: All, Pending, Approved, Refused
- Search button

**SearchResults component:**
- Table with columns: Date, Address, Title/Description, Council, Status
- Status badges: green (Approved), red (Refused), amber (Pending), grey (Withdrawn)
- Click row → navigate to application detail page
- Pagination controls
- "Save this search" button (if user has remaining saved search slots)
- "Export CSV" button (Premium only, otherwise show upgrade prompt)
- For free trial: show blurred/locked rows beyond the 10 result limit with upgrade CTA

**UpgradePrompt component:**
- Reusable component shown when user tries to access a feature above their tier
- Links to pricing page or triggers Stripe Checkout directly

#### 9c: Application detail page (`/app/dashboard/application/[id]/page.tsx`)

- Full application details: title, address, postcode, council, dates, decision, applicant, agent, type
- Link to council portal (external_link)
- For free trial: show basic info only (title, address, date, council). Full detail fields show upgrade prompt.
- Back button to search results

#### 9d: Saved searches page (`/app/dashboard/saved-searches/page.tsx`)

- List saved searches with name, filter summary, date created
- Click to re-run the search
- Delete button
- Show "X of 5 saved searches used" for Pro users
- Show upgrade prompt if at limit

#### 9e: Account page (`/app/dashboard/account/page.tsx`)

- Current plan display
- If free trial: days remaining + upgrade buttons for Pro and Premium
- If paid: "Manage subscription" button → Stripe Customer Portal
- Email display
- Sign out button

---

### PHASE 10: Pricing Page

Create `/app/pricing/page.tsx`:

Three-column pricing cards:

**Free Trial:**
- £0 for 7 days
- Search by postcode or council
- 10 results per search
- Last 7 days of data
- Basic application info
- CTA: "Start Free Trial"

**Pro — £49/mo:** (highlight this as "Most Popular")
- Everything in Free Trial, plus:
- Unlimited results
- 12 months of historical data
- Keyword filters
- Full application detail
- 5 saved searches
- CTA: "Start Free Trial" (trial first, then converts)

**Premium — £199/mo:**
- Everything in Pro, plus:
- Unlimited historical data
- Unlimited saved searches
- CSV export
- Applicant & agent search (track competitors)
- CTA: "Start Free Trial"

All CTAs start the free trial. Upgrade happens from within the dashboard.

---

### PHASE 11: Landing Page

Create `/app/page.tsx`:

Sections:
1. **Hero:** "Track Every UK Planning Application" — subtext about finding opportunities before competitors. Search bar that redirects to signup.
2. **Social proof:** "Trusted by X property investors and estate agents" (placeholder for now)
3. **How it works:** 3 steps — Search → Filter → Act
4. **Features grid:** Radius search, keyword filters, saved searches, CSV export, competitor tracking
5. **Pricing section:** Embed or link to pricing page
6. **FAQ:** Common questions with schema markup
7. **Final CTA:** "Start your 7-day free trial"

Design: clean, professional, dark navy + white + accent colour. Data-focused aesthetic (think Ahrefs/SEMrush).

---

### PHASE 12: SEO Pages (Programmatic)

This is the primary acquisition channel. Very important.

#### 12a: Council pages

Create `/app/planning-applications/[council]/page.tsx`:

- Use `generateStaticParams` to create a page for every LPA (~400 councils)
- Fetch LPA list from database
- Slug: lowercase, hyphenated council name (e.g., "bristol-city-council")

Page content:
- H1: "Planning Applications in [Council Name]"
- Meta description: "Browse the latest planning applications submitted to [Council Name]. Track new developments, extensions, and change of use applications."
- Stats box: applications this month, approval rate, most common types
- Table: 10 most recent applications (publicly visible, no auth)
- CTA: "Get full access to all [Council Name] planning applications — Start your free trial"
- FAQ section about planning in that council area
- Internal links to nearby council pages

Use ISR: `revalidate: 86400` (refresh daily)

#### 12b: Postcode area pages (optional, add after launch)

`/app/planning-applications/[council]/[postcode-area]/page.tsx`

Even more granular. Lower priority — add after council pages are indexed.

#### 12c: Sitemap

Create `/app/sitemap.ts`:

Generate sitemap including all council pages. Submit to Google Search Console.

#### 12d: Robots.txt

Create `/app/robots.ts`:

Allow all crawlers. Reference sitemap.

---

### PHASE 13: Final Polish

1. Loading states: skeleton loaders on search results, spinner on search button
2. Error handling: toast notifications for API errors, friendly error pages
3. Empty states: "No applications found" with suggestions to broaden search
4. Mobile responsive: test dashboard on mobile, ensure search and results work well
5. Favicon and meta tags: Open Graph images, Twitter cards
6. Analytics: add Plausible or PostHog script

---

## File Structure

```
/app
  /page.tsx                              — Landing page
  /pricing/page.tsx                      — Pricing page
  /planning-applications/[council]/page.tsx — SEO pages
  /(auth)
    /login/page.tsx
    /signup/page.tsx
    /auth/callback/route.ts
  /dashboard
    /layout.tsx                          — Dashboard layout with nav
    /page.tsx                            — Main search page
    /application/[id]/page.tsx           — Application detail
    /saved-searches/page.tsx
    /account/page.tsx
  /api
    /search/route.ts                     — Main search endpoint
    /search/applicant/route.ts           — Applicant/agent search
    /export/csv/route.ts                 — CSV export
    /stripe/checkout/route.ts
    /stripe/portal/route.ts
    /webhooks/stripe/route.ts
    /cron/sync-applications/route.ts
    /admin/trigger-sync/route.ts
  /sitemap.ts
  /robots.ts
/components
  /ui/                                   — shadcn components
  /search-bar.tsx
  /search-results.tsx
  /application-card.tsx
  /upgrade-prompt.tsx
  /pricing-card.tsx
  /plan-badge.tsx
  /status-badge.tsx
/lib
  /supabase/client.ts
  /supabase/server.ts
  /supabase/middleware.ts
  /stripe.ts
  /planning-api.ts
  /geocode.ts
  /plans.ts
  /get-user-plan.ts
  /types.ts
  /utils.ts
/middleware.ts
```

---

## Design Tokens

```
Colours:
- Primary: #1e3a5f (dark navy)
- Accent: #3b82f6 (blue)
- Success: #22c55e (green — approved)
- Danger: #ef4444 (red — refused)
- Warning: #f59e0b (amber — pending)
- Muted: #6b7280 (grey — withdrawn)
- Background: #f8fafc
- Card: #ffffff

Fonts:
- Inter (via next/font/google)

Border radius: 8px (rounded-lg)
```

---

## Important Notes

- Use Server Components by default. Only use 'use client' when interactivity is needed (search bar, forms, buttons with onClick).
- Use Supabase service role key for cron jobs and webhooks (bypasses RLS). Use anon key for client-side queries.
- All search API routes should be server-side and check authentication + plan limits before querying.
- Store Stripe price IDs in env vars, not hardcoded.
- The planning API at api.planning.org.uk has rate limits — always add delays between requests in the sync job.
- Normalise all postcodes to uppercase with space before last 3 characters (e.g., "BS1 5AH").
- The free trial should require no credit card. Users only enter payment details when upgrading.
