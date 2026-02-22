# Planning Radar - Database Setup

This guide will help you set up the Supabase database for Planning Radar.

## Quick Setup

### 1. Access Supabase SQL Editor

Go to your Supabase project's SQL Editor:
**https://supabase.com/dashboard/project/miuvzbpijzbomvxxqvto/sql**

### 2. Run Database Schema

Copy and paste the entire contents of `database_setup.sql` into the SQL editor and click "Run".

This will create:
- ✅ PostGIS extension for geographic queries
- ✅ All required tables with proper indexes
- ✅ Row Level Security policies
- ✅ Automatic triggers for location updates
- ✅ Sample data for testing

### 3. Verify Setup

After running the script, you should see these tables in your database:
- `planning_applications` - Main data table
- `saved_searches` - User saved searches
- `subscriptions` - User plans and billing
- `lpa_sync_log` - Data sync tracking
- `postcode_cache` - Geocoding cache

## What the Schema Includes

### Core Tables

**planning_applications**
- Stores all UK planning application data
- PostGIS geography column for radius searches
- Full-text search on application titles
- Comprehensive indexes for fast queries

**subscriptions**
- User plan management (free_trial, pro, premium)
- Stripe integration fields
- Trial expiration tracking

**saved_searches**
- User saved search queries
- JSONB filters for flexible search parameters
- RLS protection per user

### Performance Features

- **Geographic Indexing**: GIST indexes for fast postcode radius searches
- **Full-text Search**: GIN indexes for keyword searching
- **Optimized Queries**: Indexes on all frequently queried columns

### Security Features

- **Row Level Security**: Users can only access their own data
- **Authentication**: Integration with Supabase Auth
- **Data Isolation**: Proper foreign key constraints

## Sample Data

The schema includes sample planning applications for testing:
- Bristol applications (approved and pending)
- Birmingham application (pending)
- Cached postcode coordinates

## Next Steps

After setting up the database:

1. **Test the connection** - The Next.js app should now connect successfully
2. **Set up authentication** - Configure Supabase Auth settings
3. **Configure Stripe** - Add your Stripe keys to environment variables
4. **Start data pipeline** - Set up the planning API sync (Phase 3)

## Troubleshooting

### PostGIS Extension Error
If you get an error about PostGIS, your Supabase project may need to enable extensions:
1. Go to Database > Extensions in your Supabase dashboard
2. Enable the "postgis" extension

### RLS Policy Error
If queries fail due to RLS policies:
1. Make sure you're authenticated with Supabase
2. Check that the user has a valid session
3. Verify the middleware is working correctly

## Database Commands

### Useful Queries

Check sample data:
```sql
SELECT * FROM planning_applications LIMIT 5;
```

Test geographic search:
```sql
SELECT title, address, postcode
FROM planning_applications
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-2.5879, 51.4545), 4326)::geography,
  1609.34  -- 1 mile in meters
);
```

View LPA stats:
```sql
SELECT * FROM lpa_stats;
```

### Reset Database
To start fresh, drop all tables:
```sql
DROP TABLE IF EXISTS planning_applications CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS lpa_sync_log CASCADE;
DROP TABLE IF EXISTS postcode_cache CASCADE;
```

Then re-run the setup script.