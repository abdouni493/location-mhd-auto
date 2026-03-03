# Document Templates Database Integration Guide

## Overview
This implementation adds database support for saving and loading document templates. Users can now save customized document layouts in the database and quickly load them when creating new documents.

## Database Setup

### 1. Create the Tables
Run the SQL code from `SQL_DOCUMENT_TEMPLATES.sql`:

```sql
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
```

### 2. Optional: Add Agency-specific Templates
If you want templates per agency:

```sql
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;

-- Create foreign key if needed
ALTER TABLE document_templates 
  ADD CONSTRAINT fk_agency FOREIGN KEY (agency_id) REFERENCES agencies(id);
```

## API Endpoints

The server now provides these endpoints:

### Get All Templates
```
GET /api/templates
GET /api/templates?category=engagement
```
Returns array of templates, optionally filtered by category

### Get Single Template
```
GET /api/templates/:id
```
Returns a single template by ID

### Save New Template
```
POST /api/templates
Content-Type: application/json

{
  "name": "Modèle Engagement Standard",
  "category": "engagement",
  "elements": [...],
  "canvasWidth": 800,
  "canvasHeight": 1100,
  "description": "Optional description"
}
```

### Update Existing Template
```
PUT /api/templates/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "category": "engagement",
  "elements": [...],
  "canvasWidth": 800,
  "canvasHeight": 1100
}
```

### Delete Template
```
DELETE /api/templates/:id
```

## Frontend Implementation

### How It Works:

1. **Load Saved Templates**: When DocumentPersonalizer opens, it automatically loads all saved templates for that document type
2. **Display Templates List**: Shows a dropdown list of previously saved templates
3. **Load Template**: Click on any saved template to instantly load it into the editor
4. **Save New Template**: After customizing, enter a name and click "💾 Enregistrer le modèle" to save it to the database
5. **Use in Print**: The saved template can be selected when printing future documents

### Features Added:

- **Saved Templates List**: Shows all templates for the current document type with creation dates
- **Quick Load**: One-click loading of any saved template
- **Save Dialog**: Name your template before saving
- **Loading State**: Visual feedback while saving
- **Auto-refresh**: Templates list updates immediately after saving

## Usage Examples

### Scenario 1: Save Custom Engagement Template
1. Click "Print Engagement" on a reservation
2. Customize the document (add text, reposition elements, change colors)
3. Enter name: "Engagement MHD-AUTO 2026"
4. Click "💾 Enregistrer le modèle"
5. Template is now saved and available for all future engagements

### Scenario 2: Reuse Saved Template
1. Click "Print Engagement" on another reservation
2. DocumentPersonalizer opens and loads saved templates
3. Click "📋 Modèles sauvegardés (3)" to expand the list
4. Click on "Engagement MHD-AUTO 2026"
5. Template instantly loads with all your customizations
6. Make any adjustments if needed
7. Click "🖨️ Imprimer" to print

### Scenario 3: Update Existing Template
1. Load a saved template
2. Make modifications
3. Save with the same name to overwrite it
4. Or save with a new name to create a variant

## Database Queries

### View All Templates
```sql
SELECT * FROM document_templates 
ORDER BY category, created_at DESC;
```

### View Templates by Category
```sql
SELECT * FROM document_templates 
WHERE category = 'engagement'
ORDER BY created_at DESC;
```

### View Most Recent Templates
```sql
SELECT * FROM document_templates 
ORDER BY created_at DESC 
LIMIT 10;
```

### Count Templates by Category
```sql
SELECT category, COUNT(*) as count 
FROM document_templates 
GROUP BY category;
```

### Delete Old Templates (Keep last 5 per category)
```sql
DELETE FROM document_templates 
WHERE id NOT IN (
  SELECT id FROM document_templates 
  ORDER BY created_at DESC 
  LIMIT 5
)
AND category = 'engagement';
```

## Structure of Elements

Each template element has this structure:

```json
{
  "id": "unique-id",
  "type": "text|logo|signature|image|table|divider|checklist",
  "content": "Text content or data",
  "x": 50,
  "y": 110,
  "width": 700,
  "height": 40,
  "fontSize": 26,
  "color": "#0f172a",
  "fontFamily": "Inter",
  "fontWeight": "900",
  "textAlign": "left|center|right",
  "backgroundColor": "transparent",
  "borderColor": "#e5e7eb",
  "borderWidth": 0,
  "opacity": 1
}
```

## Performance Considerations

1. **Caching**: The server caches template queries for 10 minutes
2. **Indexing**: Category and creation date are indexed for fast queries
3. **Limits**: Keep templates under 100KB (JSON stringified)
4. **Cleanup**: Consider archiving old templates regularly

## Troubleshooting

### Templates Not Loading
- Check that document_templates table exists: `SELECT * FROM document_templates LIMIT 1;`
- Verify API endpoints are accessible: `curl http://localhost:4000/api/templates`
- Check browser console for errors

### Save Fails
- Verify PostgreSQL is running
- Check server logs for SQL errors
- Ensure elements are valid JSON
- Check network tab in browser dev tools

### Templates Not Appearing in List
- Refresh the page (Ctrl+F5)
- Verify the category matches (case-sensitive)
- Check if templates exist in database

## Future Enhancements

1. **Template Categories**: Organize templates by custom folders
2. **Sharing**: Share templates between agencies
3. **Versioning**: Keep template history and versions
4. **Bulk Export**: Export/Import templates
5. **Preview Thumbnails**: Visual preview of templates
6. **Tags**: Tag templates for better organization
7. **Permissions**: Control who can edit/delete templates

## Files Modified

- `SQL_DOCUMENT_TEMPLATES.sql` - Database schema
- `server/server.js` - API endpoints
- `components/DocumentPersonalizer.tsx` - Frontend template management
