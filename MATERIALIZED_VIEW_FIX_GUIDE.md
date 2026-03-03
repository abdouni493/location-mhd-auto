# Fix for "Cannot Refresh Materialized View Concurrently" Error

## Problem
When inserting vehicles, you get error:
```
"cannot refresh materialized view \"public.vehicles_dashboard_view\" concurrently"
```

This happens because:
1. A database trigger automatically tries to refresh the materialized view on every INSERT/UPDATE/DELETE
2. Multiple concurrent inserts trigger this at the same time
3. PostgreSQL's `REFRESH MATERIALIZED VIEW CONCURRENTLY` can't run multiple times simultaneously without a UNIQUE index
4. The materialized view doesn't have a UNIQUE index, so the concurrent refresh fails

## Solution
Remove the automatic refresh trigger and let the application refresh views on-demand instead.

## How to Fix

### Option 1: Run the SQL Migration (RECOMMENDED)
Execute this SQL in your Supabase database:

```sql
-- Drop the problematic triggers and functions
DROP TRIGGER IF EXISTS vehicles_dashboard_refresh ON public.vehicles;
DROP FUNCTION IF EXISTS refresh_vehicles_dashboard();

DROP TRIGGER IF EXISTS customers_dashboard_refresh ON public.customers;
DROP FUNCTION IF EXISTS refresh_customers_dashboard();

DROP TRIGGER IF EXISTS vehicles_with_images_refresh ON public.vehicles;
DROP FUNCTION IF EXISTS refresh_vehicles_with_images();

DROP TRIGGER IF EXISTS customers_with_pictures_refresh ON public.customers;
DROP FUNCTION IF EXISTS refresh_customers_with_pictures();

DROP TRIGGER IF EXISTS customers_display_refresh ON public.customers;
DROP FUNCTION IF EXISTS refresh_customers_display();

-- Refresh views manually once
REFRESH MATERIALIZED VIEW vehicles_dashboard_view;
REFRESH MATERIALIZED VIEW customers_dashboard_view;

-- Refresh other views if they exist
REFRESH MATERIALIZED VIEW IF EXISTS vehicles_with_images_view;
REFRESH MATERIALIZED VIEW IF EXISTS customers_with_pictures_view;
REFRESH MATERIALIZED VIEW IF EXISTS customers_display_view;
```

### Option 2: Steps in Supabase Dashboard
1. Go to **SQL Editor** in your Supabase project
2. Create a new query
3. Paste the SQL from Option 1
4. Click **Run**

## After Running the Fix
✅ Vehicle creation will work without errors
✅ Views will still be available for querying
✅ Views won't auto-refresh on inserts (better performance)
✅ If you need scheduled refresh, use pg_cron (see below)

## Optional: Schedule Periodic View Refresh
If you want views to refresh every 5 minutes (instead of after each insert):

```sql
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule refresh of vehicles view every 5 minutes
SELECT cron.schedule('refresh-vehicles-view', '*/5 * * * *', 
  'REFRESH MATERIALIZED VIEW vehicles_dashboard_view');

-- Schedule refresh of customers view every 5 minutes
SELECT cron.schedule('refresh-customers-view', '*/5 * * * *', 
  'REFRESH MATERIALIZED VIEW customers_dashboard_view');
```

## Benefits of This Fix
- ✅ No more concurrent refresh conflicts
- ✅ Faster inserts (no view refresh overhead per row)
- ✅ More predictable performance
- ✅ Views still available for dashboard queries
