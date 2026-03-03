-- CUSTOMER PROFILE PICTURES OPTIMIZATION
-- Run this to make customer images load ultra-fast

-- Index for fast profile picture retrieval
CREATE INDEX IF NOT EXISTS idx_customers_profile_picture
  ON public.customers(profile_picture) 
  WHERE profile_picture IS NOT NULL;

-- Index for customer display with profile picture
CREATE INDEX IF NOT EXISTS idx_customers_profile_display
  ON public.customers(id, created_at DESC);

-- Pre-computed view for customers with profile pictures
CREATE MATERIALIZED VIEW IF NOT EXISTS customers_with_pictures_view AS
SELECT 
  id,
  first_name,
  last_name,
  profile_picture,
  total_spent,
  created_at
FROM public.customers
WHERE profile_picture IS NOT NULL AND profile_picture != ''
ORDER BY created_at DESC;

-- Create indexes on the materialized view
CREATE INDEX IF NOT EXISTS idx_customers_pictures_view_id
  ON customers_with_pictures_view(id);

CREATE INDEX IF NOT EXISTS idx_customers_pictures_view_created
  ON customers_with_pictures_view(created_at DESC);

-- Auto-refresh function for customer profile pictures
CREATE OR REPLACE FUNCTION refresh_customers_pictures_view()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY customers_with_pictures_view;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh trigger
DROP TRIGGER IF EXISTS customers_pictures_refresh ON public.customers;

CREATE TRIGGER customers_pictures_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION refresh_customers_pictures_view();

-- Analyze table for query optimizer
ANALYZE public.customers;

-- Verify indexes created
SELECT 
  indexname, 
  tablename
FROM pg_indexes 
WHERE tablename = 'customers' AND indexname LIKE '%picture%'
ORDER BY indexname;

-- Check customers with profile pictures
SELECT 
  COUNT(*) as total_customers,
  COUNT(CASE WHEN profile_picture IS NOT NULL AND profile_picture != '' THEN 1 END) as with_pictures,
  COUNT(CASE WHEN profile_picture IS NULL OR profile_picture = '' THEN 1 END) as without_pictures
FROM public.customers;

-- List all customers with their profile pictures
SELECT 
  id,
  first_name,
  last_name,
  phone,
  profile_picture
FROM public.customers
ORDER BY created_at DESC;
