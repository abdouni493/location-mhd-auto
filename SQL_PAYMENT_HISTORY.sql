-- Payment History Table Setup
-- This table tracks all payment transactions for reservations

-- Drop existing table if needed (uncomment if migration needed)
-- DROP TABLE IF EXISTS payment_history;

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_history_reservation_id ON payment_history(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(date DESC);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_payment_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_history_timestamp ON payment_history;

CREATE TRIGGER trigger_update_payment_history_timestamp
BEFORE UPDATE ON payment_history
FOR EACH ROW
EXECUTE FUNCTION update_payment_history_timestamp();

-- Optional: Enable RLS (Row Level Security) if you have Supabase Auth configured
-- Uncomment the following lines if you want to enable RLS with auth policies
-- 
-- ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Enable read access for authenticated users" ON payment_history
--   FOR SELECT USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Enable insert access for authenticated users" ON payment_history
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
--
-- CREATE POLICY "Enable update access for authenticated users" ON payment_history
--   FOR UPDATE USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Enable delete access for authenticated users" ON payment_history
--   FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you have a custom user_id column, use this instead:
-- ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Enable all access for authenticated users" ON payment_history
--   USING (TRUE) WITH CHECK (TRUE);
