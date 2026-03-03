-- Create document_templates table to store custom document templates
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'devis', 'contrat', 'versement', 'facture', 'engagement'
  elements JSONB NOT NULL, -- Array of template elements
  canvas_width INTEGER DEFAULT 800,
  canvas_height INTEGER DEFAULT 1100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_default BOOLEAN DEFAULT FALSE,
  description TEXT
);

-- Create index for faster queries
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_created_at ON document_templates(created_at DESC);

-- Sample insert statements
INSERT INTO document_templates (name, category, elements, canvas_width, canvas_height, is_default, description)
VALUES (
  'Modèle Engagement Standard',
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
    }
  ]'::jsonb,
  800,
  1100,
  TRUE,
  'Template standard pour les engagements'
);

-- Alter table to add more fields if needed
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- Create a view for easier querying
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
  agency_id,
  is_shared
FROM document_templates
ORDER BY is_default DESC, created_at DESC;
