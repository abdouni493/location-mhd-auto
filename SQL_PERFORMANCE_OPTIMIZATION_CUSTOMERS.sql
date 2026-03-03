-- ============================================================
-- CUSTOMERS TABLE PERFORMANCE OPTIMIZATION
-- ============================================================
-- This script optimizes the customers table for faster queries
-- by adding strategic indexes and optimizing data retrieval

-- 1. CREATE INDEXES FOR FREQUENTLY SEARCHED FIELDS
-- Index on frequently searched customer fields
CREATE INDEX IF NOT EXISTS idx_customers_first_name 
  ON customers(first_name);

CREATE INDEX IF NOT EXISTS idx_customers_last_name 
  ON customers(last_name);

CREATE INDEX IF NOT EXISTS idx_customers_phone 
  ON customers(phone);

CREATE INDEX IF NOT EXISTS idx_customers_email 
  ON customers(email);

CREATE INDEX IF NOT EXISTS idx_customers_license_number 
  ON customers(license_number);

CREATE INDEX IF NOT EXISTS idx_customers_id_card_number 
  ON customers(id_card_number);

-- 2. COMPOSITE INDEX FOR COMMON QUERY PATTERNS
-- Optimizes queries that filter by first_name AND last_name
CREATE INDEX IF NOT EXISTS idx_customers_name_composite 
  ON customers(first_name, last_name);

-- 3. INDEX FOR SORTING/FILTERING BY CREATION DATE
CREATE INDEX IF NOT EXISTS idx_customers_created_at 
  ON customers(created_at DESC);

-- 4. INDEX FOR WILAYA-BASED QUERIES
CREATE INDEX IF NOT EXISTS idx_customers_wilaya 
  ON customers(wilaya);

-- ============================================================
-- ADD COMPUTED COLUMNS (if using PostgreSQL features)
-- ============================================================
-- These allow faster aggregations without recalculating

-- ALTERNATIVE: Use materialized views for better performance with aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS v_customers_with_stats AS
SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.phone,
  c.email,
  c.id_card_number,
  c.license_number,
  c.license_expiry,
  c.profile_picture,
  c.birthday,
  c.birth_place,
  c.document_type,
  c.document_number,
  c.document_delivery_date,
  c.document_delivery_address,
  c.document_expiry_date,
  c.license_issue_date,
  c.license_issue_place,
  c.wilaya,
  c.address,
  c.document_left_at_store,
  c.document_images,
  c.created_at,
  COALESCE(COUNT(r.id), 0) AS total_reservations,
  COALESCE(SUM(r.total_amount), 0) AS total_spent
FROM customers c
LEFT JOIN reservations r ON c.id = r.customer_id
GROUP BY c.id, c.first_name, c.last_name, c.phone, c.email, c.id_card_number, 
         c.license_number, c.license_expiry, c.profile_picture, c.birthday, 
         c.birth_place, c.document_type, c.document_number, c.document_delivery_date,
         c.document_delivery_address, c.document_expiry_date, c.license_issue_date,
         c.license_issue_place, c.wilaya, c.address, c.document_left_at_store,
         c.document_images, c.created_at;

-- Create index on the materialized view for faster lookups
CREATE INDEX IF NOT EXISTS idx_v_customers_stats_id 
  ON v_customers_with_stats(id);

CREATE INDEX IF NOT EXISTS idx_v_customers_stats_name 
  ON v_customers_with_stats(first_name, last_name);

-- ============================================================
-- REFRESH MATERIALIZED VIEW STRATEGY
-- ============================================================
-- Run this periodically to update the statistics (every hour recommended)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY v_customers_with_stats;

-- Or add a scheduled job using pg_cron (if available):
-- SELECT cron.schedule('refresh_customer_stats', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY v_customers_with_stats');

-- ============================================================
-- ALTERNATIVE: DENORMALIZATION APPROACH
-- ============================================================
-- If your database doesn't support materialized views,
-- you can use triggers to keep the counts updated:

CREATE OR REPLACE FUNCTION update_customer_reservation_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts in customers table when reservation is created/updated/deleted
  UPDATE customers 
  SET 
    total_reservations = (SELECT COUNT(*) FROM reservations WHERE customer_id = NEW.customer_id OR customer_id = OLD.customer_id),
    total_spent = (SELECT COALESCE(SUM(total_amount), 0) FROM reservations WHERE customer_id = NEW.customer_id OR customer_id = OLD.customer_id)
  WHERE id = COALESCE(NEW.customer_id, OLD.customer_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on reservations table
CREATE TRIGGER trg_update_customer_stats
AFTER INSERT OR UPDATE OR DELETE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_customer_reservation_stats();

-- ============================================================
-- OPTIMIZE TABLE STRUCTURE
-- ============================================================
-- Ensure no unnecessary columns are stored as full text
-- Analyze the table to update statistics
ANALYZE customers;

-- ============================================================
-- QUERY OPTIMIZATION RECOMMENDATIONS
-- ============================================================
-- Use these optimized query patterns:

-- 1. Fast customer lookup with all fields
-- SELECT * FROM customers WHERE id = $1 LIMIT 1;

-- 2. Fast list query with pagination (uses created_at index)
-- SELECT * FROM customers ORDER BY created_at DESC LIMIT 50 OFFSET 0;

-- 3. Fast search by name (uses composite index)
-- SELECT * FROM customers WHERE first_name ILIKE $1 OR last_name ILIKE $1;

-- 4. Fast stats retrieval (uses materialized view)
-- SELECT * FROM v_customers_with_stats WHERE id = $1;

-- 5. Batch insert optimization (for bulk uploads)
-- Use COPY or INSERT ... VALUES for multiple rows at once

-- ============================================================
-- BATCH INSERT EXAMPLE FOR PERFORMANCE
-- ============================================================
-- For bulk customer uploads, use this pattern:
-- 
-- INSERT INTO customers (first_name, last_name, phone, email, id_card_number, ...)
-- VALUES 
--   ('John', 'Doe', '555-1234', 'john@example.com', 'ABC123', ...),
--   ('Jane', 'Smith', '555-5678', 'jane@example.com', 'XYZ789', ...),
--   ...
-- ON CONFLICT (id) DO UPDATE SET
--   first_name = EXCLUDED.first_name,
--   last_name = EXCLUDED.last_name,
--   ...
-- WHERE customers.updated_at < EXCLUDED.updated_at;
