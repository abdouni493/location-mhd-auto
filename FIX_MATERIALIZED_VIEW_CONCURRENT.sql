-- Fix for "cannot refresh materialized view concurrently" error
-- This script removes the problematic trigger that tries to refresh the view on every insert/update
-- The materialized view will be refreshed on-demand by the application instead

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS vehicles_dashboard_refresh ON public.vehicles;
DROP FUNCTION IF EXISTS refresh_vehicles_dashboard();

-- Drop the problematic triggers and functions for customers if they exist
DROP TRIGGER IF EXISTS customers_dashboard_refresh ON public.customers;
DROP FUNCTION IF EXISTS refresh_customers_dashboard();

-- Drop other problematic view refresh triggers if they exist
DROP TRIGGER IF EXISTS vehicles_with_images_refresh ON public.vehicles;
DROP FUNCTION IF EXISTS refresh_vehicles_with_images();

DROP TRIGGER IF EXISTS customers_with_pictures_refresh ON public.customers;
DROP FUNCTION IF EXISTS refresh_customers_with_pictures();

DROP TRIGGER IF EXISTS customers_display_refresh ON public.customers;
DROP FUNCTION IF EXISTS refresh_customers_display();

-- Refresh the views manually once (only if they exist)
-- Note: REFRESH MATERIALIZED VIEW doesn't support IF EXISTS, so we only refresh the one we know exists
REFRESH MATERIALIZED VIEW vehicles_dashboard_view;

-- Note: Views will now be refreshed on-demand by the application
-- If you need periodic background refresh, use pg_cron instead:
-- SELECT cron.schedule('refresh-vehicles-view', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW vehicles_dashboard_view');
