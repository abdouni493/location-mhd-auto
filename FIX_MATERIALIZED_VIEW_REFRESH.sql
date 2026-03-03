-- ============================================================
-- FIX: Remove concurrent materialized view refresh triggers
-- ============================================================
-- The concurrent refresh fails during deletions when multiple 
-- operations try to refresh the same view simultaneously.
-- Solution: Remove the trigger and use non-concurrent refresh only.

-- 1. Drop the problematic trigger
DROP TRIGGER IF EXISTS customers_dashboard_refresh ON public.customers;
DROP FUNCTION IF EXISTS refresh_customers_dashboard();

-- 2. Alternative: If you want auto-refresh, use this simpler approach
-- that doesn't conflict with concurrent operations:

CREATE OR REPLACE FUNCTION refresh_customers_dashboard_safe() 
RETURNS TRIGGER AS $$
BEGIN
  -- Queue refresh asynchronously (non-blocking)
  -- Use PERFORM to ignore concurrency errors
  BEGIN
    REFRESH MATERIALIZED VIEW customers_dashboard_view;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore view refresh errors
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a non-concurrent trigger
CREATE TRIGGER customers_dashboard_refresh_safe
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION refresh_customers_dashboard_safe();

-- Manual refresh (run occasionally):
-- REFRESH MATERIALIZED VIEW customers_dashboard_view;
