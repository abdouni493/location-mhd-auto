-- ============================================================
-- FIX DATABASE TEMPLATES - RUN THIS IN NEON CONSOLE
-- ============================================================
-- Copy and paste this entire script into your Neon SQL editor
-- https://console.neon.tech/app/projects
-- ============================================================

-- Drop existing table if it has issues (ONLY if you want to reset)
-- DROP TABLE IF EXISTS document_templates CASCADE;

-- ============================================================
-- 1. CREATE MAIN TABLE (if not exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('devis', 'contrat', 'versement', 'facture', 'engagement')),
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  canvas_width INTEGER DEFAULT 800,
  canvas_height INTEGER DEFAULT 1100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_default BOOLEAN DEFAULT FALSE,
  description TEXT,
  CONSTRAINT valid_canvas_dimensions CHECK (canvas_width > 0 AND canvas_height > 0)
);

-- ============================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_document_templates_category 
  ON public.document_templates(category);

CREATE INDEX IF NOT EXISTS idx_document_templates_created_at 
  ON public.document_templates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_templates_is_default 
  ON public.document_templates(is_default) 
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_document_templates_category_created 
  ON public.document_templates(category, created_at DESC);

-- ============================================================
-- 3. GRANT PERMISSIONS (OPTIONAL - skip if using Neon default role)
-- ============================================================
-- If needed, uncomment and replace 'your_role' with your actual role name
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_templates TO your_role;

-- For Neon with default connection, permissions are usually inherited
-- If you still get permission errors, check your current role with: SELECT current_user;

-- ============================================================
-- 4. INSERT SAMPLE DATA (OPTIONAL - remove if not needed)
-- ============================================================
-- Sample engagement template
INSERT INTO public.document_templates (name, category, elements, canvas_width, canvas_height, description, is_default)
VALUES (
  'Template Engagement Standard',
  'engagement',
  '[]'::jsonb,
  800,
  1100,
  'Template standard pour les documents d''engagement',
  TRUE
) ON CONFLICT DO NOTHING;

-- Sample quote template
INSERT INTO public.document_templates (name, category, elements, canvas_width, canvas_height, description, is_default)
VALUES (
  'Template Devis Standard',
  'devis',
  '[]'::jsonb,
  800,
  1100,
  'Template standard pour les devis',
  TRUE
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. VERIFY TABLE EXISTS
-- ============================================================
SELECT 
  EXISTS(
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'document_templates'
  ) AS table_exists;

-- ============================================================
-- 6. COUNT EXISTING TEMPLATES
-- ============================================================
SELECT COUNT(*) as total_templates, category, is_default FROM public.document_templates GROUP BY category, is_default;

-- ============================================================
-- 7. VIEW TABLE STRUCTURE
-- ============================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'document_templates'
ORDER BY ordinal_position;
