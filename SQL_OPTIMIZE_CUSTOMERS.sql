-- ============================================================
-- DATABASE OPTIMIZATION FOR CUSTOMERS TABLE
-- Run this in Neon SQL Console to speed up customer loading
-- ============================================================

-- ============================================================
-- 1. ADD MISSING INDEXES FOR FREQUENTLY USED COLUMNS
-- ============================================================

-- Index for dashboard/list views (most commonly used fields)
CREATE INDEX IF NOT EXISTS idx_customers_list_view 
  ON public.customers(created_at DESC, id, first_name, last_name, phone)
  INCLUDE (total_reservations, total_spent);

-- Index for search by full name (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_customers_fullname 
  ON public.customers(lower(first_name), lower(last_name));

-- Index for reservation lookups
CREATE INDEX IF NOT EXISTS idx_customers_reservations
  ON public.customers(total_reservations DESC);

-- Index for spending analysis
CREATE INDEX IF NOT EXISTS idx_customers_spending
  ON public.customers(total_spent DESC);

-- Composite index for agency + wilaya (common filters)
CREATE INDEX IF NOT EXISTS idx_customers_location
  ON public.customers(wilaya, created_at DESC);

-- Index for document lookups
CREATE INDEX IF NOT EXISTS idx_customers_document
  ON public.customers(document_type, document_number);

-- ============================================================
-- 2. CREATE MATERIALIZED VIEW FOR DASHBOARD (FAST LOOKUPS)
-- ============================================================
-- This pre-aggregates customer data so dashboard loads instantly

CREATE MATERIALIZED VIEW IF NOT EXISTS customers_dashboard_view AS
SELECT 
  id,
  first_name,
  last_name,
  phone,
  email,
  wilaya,
  total_reservations,
  total_spent,
  created_at,
  updated_at
FROM public.customers
ORDER BY created_at DESC;

-- Index on the materialized view
CREATE INDEX IF NOT EXISTS idx_customers_dashboard_created 
  ON customers_dashboard_view(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_dashboard_total_spent 
  ON customers_dashboard_view(total_spent DESC);

-- ============================================================
-- 3. CREATE OPTIMIZED VIEW FOR LIST DISPLAYS
-- ============================================================
-- Excludes heavy columns (document_images, profile_picture)

CREATE OR REPLACE VIEW customers_list_view AS
SELECT 
  id,
  first_name,
  last_name,
  phone,
  email,
  wilaya,
  license_number,
  license_expiry,
  total_reservations,
  total_spent,
  created_at,
  updated_at
FROM public.customers;

-- ============================================================
-- 4. REFRESH MATERIALIZED VIEW AFTER UPDATES
-- ============================================================
-- Add this trigger to auto-refresh dashboard view when customers change

CREATE OR REPLACE FUNCTION refresh_customers_dashboard() 
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY customers_dashboard_view;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_dashboard_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION refresh_customers_dashboard();

-- ============================================================
-- 5. ANALYZE TABLE FOR QUERY OPTIMIZER
-- ============================================================
-- This helps PostgreSQL choose the best execution plans

ANALYZE public.customers;

-- ============================================================
-- 6. ENABLE QUERY STATISTICS (OPTIONAL)
-- ============================================================
-- Uncomment if you want to track slow queries (Neon may have this disabled)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================
-- 7. VERIFY INDEXES WERE CREATED
-- ============================================================
SELECT 
  indexname, 
  tablename, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'customers'
ORDER BY indexname;

-- ============================================================
-- 8. CHECK INDEX SIZE (to see if they help)
-- ============================================================
SELECT 
  t.relname AS table_name,
  i.relname AS index_name,
  pg_size_pretty(pg_relation_size(i.oid)) AS index_size
FROM pg_class t
JOIN pg_index idx ON t.oid = idx.indrelid
JOIN pg_class i ON i.oid = idx.indexrelid
WHERE t.relname = 'customers'
ORDER BY pg_relation_size(i.oid) DESC;

-- ============================================================
-- 9. REBUILD INDEXES (if they become fragmented)
-- ============================================================
-- Run this if queries are still slow after a few days
-- REINDEX TABLE CONCURRENTLY public.customers;

-- ============================================================
-- 10. CHECK TABLE STATISTICS
-- ============================================================
SELECT 
  schemaname,
  tablename,
  live_tup,
  dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables 
WHERE tablename = 'customers';
