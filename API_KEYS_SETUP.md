# Planning Radar - API Keys Setup Guide

Follow this guide to get all the required API keys for Planning Radar.

---

## 1. Supabase Service Role Key ⚡

### Where to Find:
1. Go to your Supabase project: https://supabase.com/dashboard/project/miuvzbpijzbomvxxqvto
2. Navigate to **Settings** → **API**
3. Look for **Project API Keys** section
4. Copy the **service_role** key (not the anon/public key)

### ⚠️ Security Note:
- This key has admin access to your database
- Never expose it in client-side code
- Only use it in server-side code and webhooks

**Add to .env.local:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

---

## 2. Stripe API Keys 💳

### Setup Steps:

#### A. Create Stripe Account (if needed)
1. Go to https://stripe.com
2. Sign up or log in
3. Complete account verification

#### B. Get API Keys
1. Go to **Developers** → **API Keys**
2. You'll see two types of keys:

**Publishable Key (starts with `pk_`):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

**Secret Key (starts with `sk_`):**
```env
STRIPE_SECRET_KEY=sk_test_51...
```

#### C. Set up Webhook Endpoint
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set URL: `http://localhost:3000/api/webhooks/stripe` (for now)
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret**:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 3. Stripe Product & Price Setup 📦

### Create Products in Stripe Dashboard:

#### A. Pro Plan Product
1. Go to **Products** → **Add product**
2. **Name:** "Planning Radar Pro"
3. **Description:** "Unlimited results, 12 months history, keyword filters, full detail, 5 saved searches"
4. **Price:** £79.00 GBP monthly
5. **Price ID:** Copy this (e.g., `price_1234567890abcdef`)

#### B. Premium Plan Product
1. **Name:** "Planning Radar Premium"
2. **Description:** "All Pro features plus unlimited history, unlimited saved searches, CSV export, applicant search"
3. **Price:** £299.00 GBP monthly
4. **Price ID:** Copy this (e.g., `price_0987654321fedcba`)

**Add to .env.local:**
```env
STRIPE_PRO_PRICE_ID=price_1234567890abcdef
STRIPE_PREMIUM_PRICE_ID=price_0987654321fedcba
```

---

## 4. Planning API Key 🏗️

### Setup Steps:
1. Go to https://api.planning.org.uk/
2. Sign up for an account
3. Generate API key with your email:

```bash
curl "https://api.planning.org.uk/v1/generatekey?email=your-email@example.com"
```

### Response Example:
```json
{
  "response": {
    "status": "OK",
    "key": "your-api-key-here",
    "message": "API key generated"
  }
}
```

**Add to .env.local:**
```env
PLANNING_API_KEY=your-api-key-here
```

### ⚠️ Important Notes:
- Free API calls don't cost credits (searching without `return_data=1`)
- Full data calls (`return_data=1`) cost credits
- Rate limits apply - add delays between requests

---

## 5. Final Environment File

Your complete `.env.local` should look like this:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://miuvzbpijzbomvxxqvto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qPi_VMahtffxmiUAs21sFQ_9jKQtY22
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Planning API
PLANNING_API_KEY=your_planning_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=planning_radar_cron_secret_2026
```

---

## 6. Testing Your Setup

### Test Supabase Connection:
```bash
npm run dev
# Visit: http://localhost:3000/test-connection
```

### Test Planning API:
```bash
curl "https://api.planning.org.uk/v1/lpas?key=YOUR_API_KEY" | head -50
```

### Test Stripe Webhook:
1. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Or use ngrok for public webhook URL

---

## 7. Production Setup

When deploying to production:

1. **Update Webhook URLs** in Stripe to your live domain
2. **Switch to Live Keys** in Stripe (remove `test_` from keys)
3. **Set Production Environment Variables** in Vercel/your hosting
4. **Update NEXT_PUBLIC_APP_URL** to your live domain

---

## Need Help?

- **Supabase Issues:** Check the Supabase docs or Discord
- **Stripe Issues:** Stripe has excellent documentation and support
- **Planning API Issues:** Contact api@planning.org.uk

Once you have all keys, we can proceed to Phase 3: Data Pipeline! 🚀