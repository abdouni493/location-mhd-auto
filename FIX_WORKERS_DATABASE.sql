-- ============================================================================
-- WORKERS TABLE FIX - Complete SQL Schema
-- ============================================================================

-- 1. DROP and RECREATE workers table with correct schema
DROP TABLE IF EXISTS workers CASCADE;

CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  birthday DATE,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  id_card_number VARCHAR(50),
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'driver',
  payment_type VARCHAR(10) CHECK (payment_type IN ('day', 'month')),
  amount DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  absences INTEGER DEFAULT 0,
  total_paid DECIMAL(10, 2) DEFAULT 0,
  photo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_workers_username ON workers(username);
CREATE INDEX idx_workers_email ON workers(email);
CREATE INDEX idx_workers_is_active ON workers(is_active);

-- 2. Create worker_transactions table for payment history
DROP TABLE IF EXISTS worker_transactions CASCADE;

CREATE TABLE worker_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('payment', 'advance', 'absence')) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_worker_transactions_worker_id ON worker_transactions(worker_id);
CREATE INDEX idx_worker_transactions_type ON worker_transactions(type);
CREATE INDEX idx_worker_transactions_date ON worker_transactions(date);

-- 3. Create test worker data
INSERT INTO workers (full_name, username, password, role, is_active, payment_type, amount) VALUES
  ('Youssef Abdouni', 'youssef_abdouni', 'youssef123', 'admin', TRUE, 'day', 1500),
  ('Test Driver', 'test_user', 'test123', 'driver', TRUE, 'day', 1200),
  ('Ahmed Mohamed', 'ahmed_m', 'ahmed123', 'driver', TRUE, 'day', 1300)
ON CONFLICT (username) DO NOTHING;

-- 4. Sample transactions
INSERT INTO worker_transactions (worker_id, type, amount, note) 
SELECT id, 'payment', amount, 'Daily payment' FROM workers WHERE username = 'youssef_abdouni' LIMIT 1
ON CONFLICT DO NOTHING;

-- 5. Create update trigger to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_workers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workers_updated_at_trigger ON workers;
CREATE TRIGGER workers_updated_at_trigger
BEFORE UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION update_workers_updated_at();

-- 6. Create view for worker stats
DROP VIEW IF EXISTS worker_stats CASCADE;

CREATE VIEW worker_stats AS
SELECT 
  w.id,
  w.full_name,
  w.username,
  w.role,
  w.is_active,
  w.total_paid,
  w.absences,
  COUNT(CASE WHEN wt.type = 'payment' THEN 1 END) as payment_count,
  COUNT(CASE WHEN wt.type = 'advance' THEN 1 END) as advance_count,
  COUNT(CASE WHEN wt.type = 'absence' THEN 1 END) as absence_count,
  COALESCE(SUM(CASE WHEN wt.type = 'advance' THEN wt.amount ELSE 0 END), 0) as total_advances,
  COALESCE(SUM(CASE WHEN wt.type = 'absence' THEN wt.amount ELSE 0 END), 0) as absence_deductions
FROM workers w
LEFT JOIN worker_transactions wt ON w.id = wt.worker_id
GROUP BY w.id, w.full_name, w.username, w.role, w.is_active, w.total_paid, w.absences;

-- 7. Test Queries
-- Select all active workers
-- SELECT * FROM workers WHERE is_active = TRUE;

-- Check if worker exists with correct password
-- SELECT id, username, role, password, is_active FROM workers WHERE username = 'youssef_abdouni';

-- Get worker statistics
-- SELECT * FROM worker_stats WHERE username = 'youssef_abdouni';

-- See all transactions for a worker
-- SELECT wt.* FROM worker_transactions wt 
-- WHERE wt.worker_id = (SELECT id FROM workers WHERE username = 'youssef_abdouni')
-- ORDER BY wt.date DESC;

-- Note: GRANT statements commented out - uncomment if your role exists
-- GRANT SELECT, INSERT, UPDATE, DELETE ON workers TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON worker_transactions TO authenticated;
-- GRANT SELECT ON worker_stats TO authenticated;

-- ============================================================================
-- DIAGNOSTICS - Run these to verify the data
-- ============================================================================

-- Verify workers table exists and has data
SELECT COUNT(*) as total_workers, COUNT(CASE WHEN is_active THEN 1 END) as active_workers 
FROM workers;

-- Verify a specific worker
SELECT id, username, role, password, is_active 
FROM workers 
WHERE username = 'youssef_abdouni';

-- Verify no blob URLs in photos
SELECT id, username, SUBSTRING(photo, 1, 50) as photo_preview
FROM workers
WHERE photo IS NOT NULL AND photo != '';
