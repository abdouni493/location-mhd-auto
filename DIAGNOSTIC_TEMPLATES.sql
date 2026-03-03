-- ============================================================
-- DIAGNOSTIC SCRIPT - Check if table exists and debug
-- ============================================================

-- 1. Check if table exists
SELECT 
  EXISTS(
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'document_templates'
  ) AS table_exists;

-- 2. If table exists, show its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'document_templates'
ORDER BY ordinal_position;

-- 3. Check all tables in public schema
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 4. Check if data exists
SELECT COUNT(*) as template_count FROM public.document_templates;

-- 5. Show all data
SELECT * FROM public.document_templates;

-- 6. Check current user/role
SELECT current_user, current_database(), current_schema();
