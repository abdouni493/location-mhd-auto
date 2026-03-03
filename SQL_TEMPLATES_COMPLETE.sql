-- ============================================================
-- DOCUMENT TEMPLATES DATABASE SETUP
-- Complete SQL for PostgreSQL
-- ============================================================

-- ============================================================
-- 1. CREATE MAIN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS document_templates (
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
  ON document_templates(category);

CREATE INDEX IF NOT EXISTS idx_document_templates_created_at 
  ON document_templates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_templates_is_default 
  ON document_templates(is_default) 
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_document_templates_category_created 
  ON document_templates(category, created_at DESC);

-- ============================================================
-- 3. CREATE VIEW FOR EASIER QUERIES
-- ============================================================
CREATE OR REPLACE VIEW document_templates_view AS
SELECT 
  id,
  name,
  category,
  elements,
  canvas_width,
  canvas_height,
  created_at,
  updated_at,
  is_default,
  description,
  json_array_length(elements) as element_count
FROM document_templates
ORDER BY is_default DESC, created_at DESC;

-- ============================================================
-- 4. CREATE UPDATE TRIGGER FOR updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_document_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_templates_update_trigger
BEFORE UPDATE ON document_templates
FOR EACH ROW
EXECUTE FUNCTION update_document_templates_updated_at();

-- ============================================================
-- 5. INSERT SAMPLE DEFAULT TEMPLATES (OPTIONAL)
-- ============================================================

-- Engagement Template
INSERT INTO document_templates (name, category, elements, canvas_width, canvas_height, is_default, description)
VALUES (
  'Engagement Standard',
  'engagement',
  '[
    {
      "id": "1",
      "type": "text",
      "content": "ENGAGEMENT",
      "x": 50,
      "y": 110,
      "width": 700,
      "height": 40,
      "fontSize": 26,
      "color": "#0f172a",
      "fontFamily": "Inter",
      "fontWeight": "900",
      "textAlign": "center",
      "backgroundColor": "transparent",
      "borderColor": "#e5e7eb",
      "borderWidth": 0,
      "opacity": 1
    },
    {
      "id": "2",
      "type": "text",
      "content": "Client: {{client_name}}\\nLieu: {{vehicle_brand}} {{vehicle_model}}\\nDu: {{start_date}} Au: {{end_date}}",
      "x": 50,
      "y": 180,
      "width": 700,
      "height": 200,
      "fontSize": 12,
      "color": "#374151",
      "fontFamily": "Inter",
      "fontWeight": "400",
      "textAlign": "left",
      "backgroundColor": "transparent",
      "borderColor": "#e5e7eb",
      "borderWidth": 1,
      "opacity": 1
    },
    {
      "id": "3",
      "type": "signature",
      "content": "Signature et cachet",
      "x": 50,
      "y": 950,
      "width": 300,
      "height": 80,
      "fontSize": 12,
      "color": "#000000",
      "fontFamily": "Inter",
      "fontWeight": "400",
      "textAlign": "center",
      "backgroundColor": "transparent",
      "borderColor": "#d1d5db",
      "borderWidth": 2,
      "opacity": 1
    }
  ]'::jsonb,
  800,
  1100,
  TRUE,
  'Default template for engagement documents'
) ON CONFLICT (name, category) DO NOTHING;

-- Devis Template
INSERT INTO document_templates (name, category, elements, canvas_width, canvas_height, is_default, description)
VALUES (
  'Devis Standard',
  'devis',
  '[
    {
      "id": "1",
      "type": "text",
      "content": "DEVIS",
      "x": 50,
      "y": 50,
      "width": 700,
      "height": 40,
      "fontSize": 26,
      "color": "#0f172a",
      "fontFamily": "Inter",
      "fontWeight": "900",
      "textAlign": "center",
      "backgroundColor": "transparent",
      "borderColor": "#e5e7eb",
      "borderWidth": 0,
      "opacity": 1
    },
    {
      "id": "2",
      "type": "table",
      "content": "Devis Table",
      "x": 50,
      "y": 150,
      "width": 700,
      "height": 400,
      "fontSize": 12,
      "color": "#374151",
      "fontFamily": "Inter",
      "fontWeight": "400",
      "textAlign": "left",
      "backgroundColor": "transparent",
      "borderColor": "#e5e7eb",
      "borderWidth": 1,
      "opacity": 1
    },
    {
      "id": "3",
      "type": "text",
      "content": "Montant Total: {{total_amount}} DZ",
      "x": 50,
      "y": 600,
      "width": 700,
      "height": 40,
      "fontSize": 16,
      "color": "#dc2626",
      "fontFamily": "Inter",
      "fontWeight": "900",
      "textAlign": "right",
      "backgroundColor": "transparent",
      "borderColor": "transparent",
      "borderWidth": 0,
      "opacity": 1
    }
  ]'::jsonb,
  800,
  1100,
  TRUE,
  'Default template for devis (quote) documents'
) ON CONFLICT (name, category) DO NOTHING;

-- Contrat Template
INSERT INTO document_templates (name, category, elements, canvas_width, canvas_height, is_default, description)
VALUES (
  'Contrat Standard',
  'contrat',
  '[
    {
      "id": "1",
      "type": "text",
      "content": "CONTRAT DE LOCATION",
      "x": 50,
      "y": 50,
      "width": 700,
      "height": 40,
      "fontSize": 24,
      "color": "#0f172a",
      "fontFamily": "Inter",
      "fontWeight": "900",
      "textAlign": "center",
      "backgroundColor": "transparent",
      "borderColor": "#e5e7eb",
      "borderWidth": 0,
      "opacity": 1
    },
    {
      "id": "2",
      "type": "text",
      "content": "Détails du Contrat:\\nNuméro: {{res_number}}\\nClient: {{client_name}}\\nVéhicule: {{vehicle_brand}} {{vehicle_model}}\\nDurée: {{duration}} jours\\nMontant: {{total_amount}} DZ",
      "x": 50,
      "y": 130,
      "width": 700,
      "height": 300,
      "fontSize": 12,
      "color": "#374151",
      "fontFamily": "Inter",
      "fontWeight": "400",
      "textAlign": "left",
      "backgroundColor": "#f9fafb",
      "borderColor": "#e5e7eb",
      "borderWidth": 1,
      "opacity": 1
    }
  ]'::jsonb,
  800,
  1100,
  TRUE,
  'Default template for rental contracts'
) ON CONFLICT (name, category) DO NOTHING;

-- ============================================================
-- 6. GRANT PERMISSIONS (if using different user)
-- ============================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON document_templates TO your_app_user;
-- GRANT USAGE ON SCHEMA public TO your_app_user;

-- ============================================================
-- 7. USEFUL QUERIES FOR MANAGEMENT
-- ============================================================

-- View all templates with element count
-- SELECT * FROM document_templates_view;

-- Count templates by category
-- SELECT category, COUNT(*) as count FROM document_templates GROUP BY category;

-- Find template by name
-- SELECT * FROM document_templates WHERE name ILIKE '%engagement%' LIMIT 1;

-- Get all templates for a category
-- SELECT id, name, created_at FROM document_templates WHERE category = 'engagement' ORDER BY created_at DESC;

-- Update template
-- UPDATE document_templates SET name = 'New Name' WHERE id = 'uuid-here' RETURNING *;

-- Delete old templates (keep last 10)
-- DELETE FROM document_templates WHERE id NOT IN (
--   SELECT id FROM document_templates ORDER BY created_at DESC LIMIT 10
-- ) AND category = 'engagement';

-- Export to CSV
-- COPY document_templates TO '/tmp/templates.csv' CSV HEADER;

-- ============================================================
-- 8. BACKUP & RESTORE COMMANDS
-- ============================================================

-- Backup all templates
-- pg_dump -U postgres -d your_db_name -t document_templates -f templates_backup.sql

-- Restore from backup
-- psql -U postgres -d your_db_name -f templates_backup.sql

-- Export as JSON for external storage
-- SELECT json_agg(row_to_json(t)) as templates FROM document_templates t;

-- ============================================================
-- DONE!
-- ============================================================
-- Your document_templates table is now ready to use.
-- The API endpoints can now save and retrieve templates.
-- The frontend DocumentPersonalizer will display saved templates.
