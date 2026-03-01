-- ============================================================================
-- DRIVEFLOW CAR RENTAL - DATABASE PERFORMANCE OPTIMIZATION
-- Run these SQL commands in your Neon PostgreSQL database
-- ============================================================================

-- ============================================================================
-- 1. CREATE INDEXES FOR CRITICAL QUERIES (HIGHEST IMPACT)
-- ============================================================================

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_wilaya ON customers(wilaya);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_agency ON vehicles(agency_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at DESC);

-- Reservations table indexes (MOST CRITICAL - This table gets queried frequently)
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_agency ON reservations(agency_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_start_date ON reservations(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_end_date ON reservations(end_date DESC);

-- Workers table indexes
CREATE INDEX IF NOT EXISTS idx_workers_role ON workers(role);
CREATE INDEX IF NOT EXISTS idx_workers_agency ON workers(agency_id);
CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- Inspections table indexes
CREATE INDEX IF NOT EXISTS idx_inspections_reservation ON inspections(reservation_id);
CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(type);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date DESC);

-- Damages table indexes
CREATE INDEX IF NOT EXISTS idx_damages_reservation ON damages(reservation_id);
CREATE INDEX IF NOT EXISTS idx_damages_inspection ON damages(inspection_id);
CREATE INDEX IF NOT EXISTS idx_damages_status ON damages(status);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Agencies table indexes
CREATE INDEX IF NOT EXISTS idx_agencies_created_at ON agencies(created_at DESC);

-- Admin security indexes
CREATE INDEX IF NOT EXISTS idx_admin_security_email ON admin_security(email);

-- ============================================================================
-- 2. CREATE COMPOSITE INDEXES FOR FREQUENT COMBINED QUERIES
-- ============================================================================

-- For reservation search by date range and status
CREATE INDEX IF NOT EXISTS idx_reservations_date_status 
ON reservations(start_date DESC, status);

-- For vehicle availability check
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_dates 
ON reservations(vehicle_id, start_date, end_date);

-- For dashboard stats
CREATE INDEX IF NOT EXISTS idx_reservations_status_date 
ON reservations(status, created_at DESC);

-- ============================================================================
-- 3. OPTIMIZE TABLE STATISTICS (Helps query planner)
-- ============================================================================

ANALYZE customers;
ANALYZE vehicles;
ANALYZE reservations;
ANALYZE agencies;
ANALYZE workers;
ANALYZE inspections;
ANALYZE damages;
ANALYZE payments;
ANALYZE admin_security;

-- ============================================================================
-- 4. CONFIGURE QUERY OPTIMIZATION SETTINGS
-- ============================================================================

-- Set work memory for sorting operations (per connection)
SET work_mem = '256MB';

-- Enable parallel query execution
SET max_parallel_workers_per_gather = 4;
SET max_parallel_workers = 8;

-- ============================================================================
-- 5. ADD PARTIAL INDEXES FOR ACTIVE RECORDS (Reduces index size)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reservations_active 
ON reservations(id, customer_id, vehicle_id) 
WHERE status IN ('pending', 'confirmed', 'ongoing');

CREATE INDEX IF NOT EXISTS idx_vehicles_available 
ON vehicles(id, agency_id) 
WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_customers_active 
ON customers(id, phone, first_name, last_name) 
WHERE is_active = true;

-- ============================================================================
-- 6. TABLE-LEVEL OPTIMIZATIONS
-- ============================================================================

-- Add missing fields if needed and create covering indexes
-- Covering indexes include all columns needed without table access

CREATE INDEX IF NOT EXISTS idx_reservations_covering 
ON reservations(customer_id, vehicle_id, status, created_at)
INCLUDE (start_date, end_date, total_price);

CREATE INDEX IF NOT EXISTS idx_customers_covering 
ON customers(id, phone, status)
INCLUDE (first_name, last_name, wilaya, email);

-- ============================================================================
-- 7. VACUUM AND CLEANUP (Run periodically)
-- ============================================================================

-- Vacuum analyzes dead tuples and optimizes disk space
VACUUM ANALYZE customers;
VACUUM ANALYZE vehicles;
VACUUM ANALYZE reservations;
VACUUM ANALYZE agencies;
VACUUM ANALYZE workers;
VACUUM ANALYZE inspections;
VACUUM ANALYZE damages;
VACUUM ANALYZE payments;

-- ============================================================================
-- 8. VERIFY INDEXES ARE CREATED
-- ============================================================================

-- Check all indexes on important tables
SELECT * FROM pg_indexes 
WHERE tablename IN ('customers', 'vehicles', 'reservations', 'agencies', 'workers')
ORDER BY tablename, indexname;

-- ============================================================================
-- 9. CHECK INDEX USAGE
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('customers', 'vehicles', 'reservations', 'agencies', 'workers')
ORDER BY idx_scan DESC;

-- ============================================================================
-- 10. IDENTIFY SLOW QUERIES (Check after running app)
-- ============================================================================

-- Find sequential scans (slow queries)
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_scan DESC;

-- ============================================================================
-- 11. DATABASE SETTINGS FOR PERFORMANCE
-- ============================================================================

-- These are recommended settings for your .env or database configuration
-- shared_buffers: 25% of available RAM
-- effective_cache_size: 75% of available RAM
-- work_mem: 50MB per connection
-- maintenance_work_mem: 500MB

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Run this script ONCE in your Neon database
-- 2. The indexes will automatically be used by PostgreSQL query planner
-- 3. Indexes improve SELECT speed but slow down INSERT/UPDATE/DELETE slightly
-- 4. Run VACUUM ANALYZE weekly for optimal performance
-- 5. Monitor with: SELECT * FROM pg_stat_user_indexes
-- 6. Expected performance improvement: 50-70% faster queries
-- ============================================================================
