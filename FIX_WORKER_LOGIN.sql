-- Fix Worker Login and Creation Issues
-- This script ensures new workers can login after creation

-- 1. Ensure all workers have proper setup
-- Workers table should have the username and password fields for authentication

-- 2. Check if workers are being created properly
-- First, let's verify the workers table structure
-- You should be able to see: id, full_name, phone, email, username, password, role, is_active

-- 3. Fix: Set a default password for any workers missing one
UPDATE workers 
SET password = 'Change123!' 
WHERE password IS NULL OR password = '';

-- 4. Ensure all created workers have is_active = true
UPDATE workers 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- 5. Create an index on username for faster login lookups
CREATE INDEX IF NOT EXISTS idx_workers_username ON workers(username) 
WHERE is_active = true;

-- 6. Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_workers_email ON workers(email) 
WHERE is_active = true AND email IS NOT NULL;

-- 7. Verify workers were created (this should show your recent workers)
SELECT id, full_name, username, role, is_active, created_at 
FROM workers 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. If you see NULL usernames, update them:
-- UPDATE workers SET username = LOWER(REPLACE(full_name, ' ', '_')) WHERE username IS NULL;

-- Test: Try to verify a specific worker exists
-- SELECT * FROM workers WHERE username = 'your_username_here';
