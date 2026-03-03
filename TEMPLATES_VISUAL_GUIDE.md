# Document Templates - User Guide & Visual Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  RESERVATION INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Reservation #001  [Vehicle: BMW 3-Series] [Status: Pending]   │
│                                                                   │
│  [🖨️ Print Engagement]  [✏️ Edit]  [🔍 Details]               │
│         ↓                                                        │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│              DOCUMENT PERSONALIZER MODAL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Left Panel (Canvas)          Right Panel (Controls)            │
│  ┌──────────────────────┐     ┌──────────────────────┐          │
│  │                      │     │ Saved Templates:     │          │
│  │  ENGAGEMENT          │     │ 📋 Show Templates(2) │          │
│  │                      │     │  ├─ Engagement v1    │          │
│  │  Customizable        │     │  └─ Engagement v2    │          │
│  │  Elements:           │     │                      │          │
│  │  • Title             │     │ Save Section:        │          │
│  │  • Details           │     │ [Nom du modèle...] │          │
│  │  • Signatures        │     │ [💾 Save Template]   │          │
│  │                      │     │                      │          │
│  │  (Draggable,         │     │ [🖨️ Print]          │          │
│  │   Editable,          │     │ [✕ Cancel]           │          │
│  │   Styleable)         │     │                      │          │
│  └──────────────────────┘     └──────────────────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step: Save Template

```
Step 1: Click Print Button
  [🖨️ Print Engagement] 
        ↓
     
Step 2: DocumentPersonalizer Modal Opens
  • Loads saved templates from database
  • Shows "📋 Modèles sauvegardés (N)" if any exist
  • Shows default template in canvas
        ↓

Step 3: Customize Document
  • Drag elements to reposition
  • Double-click to edit text
  • Change colors, fonts, sizes
  • Adjust borders, opacity
        ↓

Step 4: Enter Template Name
  [Nom du modèle...]
  "Engagement MHD-AUTO Standard"
        ↓

Step 5: Click Save Button
  [💾 Enregistrer le modèle]
        ↓

Step 6: Database Saves Template
  POST /api/templates
  {
    "name": "Engagement MHD-AUTO Standard",
    "category": "engagement",
    "elements": [...],
    "canvasWidth": 800,
    "canvasHeight": 1100
  }
        ↓

Step 7: Success Confirmation
  "Template 'Engagement MHD-AUTO Standard' saved successfully!"
        ↓

Step 8: Template Appears in List
  [📋 Modèles sauvegardés (2)]
  ├─ Engagement MHD-AUTO Standard    (Created: 3/3/2026)
  └─ Engagement Generic              (Created: 2/28/2026)
```

## Step-by-Step: Load & Use Template

```
Step 1: Open Another Reservation
  Click [🖨️ Print Engagement]
        ↓

Step 2: See Saved Templates Button
  [📋 Modèles sauvegardés (2)]
        ↓

Step 3: Expand Template List
  Click button to toggle
        ↓

Step 4: View Available Templates
  ┌─────────────────────────────────────┐
  │ Engagement MHD-AUTO Standard    3/3 │  ← Click to load
  ├─────────────────────────────────────┤
  │ Engagement Generic              2/28│
  └─────────────────────────────────────┘
        ↓

Step 5: Template Loads Instantly
  • All elements repositioned
  • All colors applied
  • All fonts restored
  • All text populated
        ↓

Step 6: Make Changes (Optional)
  • Adjust if needed
  • Or use as-is
        ↓

Step 7: Print
  [🖨️ Imprimer]
        ↓

Step 8: Document Prints
  With all customizations applied
```

## Database Structure

```
document_templates Table
├── id (UUID)
│   └─ Unique identifier
├── name (VARCHAR)
│   └─ "Engagement MHD-AUTO Standard"
├── category (VARCHAR)
│   └─ "engagement" | "devis" | "contrat" | etc
├── elements (JSONB)
│   └─ [ { type, content, x, y, width, height, ...}, ... ]
├── canvas_width (INTEGER)
│   └─ 800 (pixels)
├── canvas_height (INTEGER)
│   └─ 1100 (pixels)
├── created_at (TIMESTAMP)
│   └─ 2026-03-03 11:45:00
├── updated_at (TIMESTAMP)
│   └─ 2026-03-03 11:45:00
├── is_default (BOOLEAN)
│   └─ false
└── description (TEXT)
    └─ "Template for standard engagements"
```

## API Interactions

### Save New Template
```
User Action: Click [💾 Enregistrer le modèle]
              ↓
Frontend:    POST /api/templates
             {
               "name": "Engagement Standard",
               "category": "engagement",
               "elements": [...array of template elements...],
               "canvasWidth": 800,
               "canvasHeight": 1100,
               "description": "Custom template for engagements"
             }
              ↓
Server:      INSERT INTO document_templates (...)
              ↓
Database:    Stores template with UUID
              ↓
Response:    { data: {id, name, category, ...}, error: null }
              ↓
Frontend:    Updates saved templates list
             Shows "Template saved successfully!"
```

### Load Saved Templates
```
User Action: Open DocumentPersonalizer modal
              ↓
Frontend:    GET /api/templates?category=engagement
              ↓
Server:      SELECT * FROM document_templates 
             WHERE category = 'engagement'
             ORDER BY created_at DESC
              ↓
Database:    Returns matching templates
              ↓
Response:    { data: [template1, template2, ...], error: null }
              ↓
Frontend:    Displays template list
             [📋 Modèles sauvegardés (2)]
              ↓
User Action: Clicks template name
              ↓
Frontend:    loadTemplate(selectedTemplate)
             Updates canvas with template data
```

## States & Transitions

```
DocumentPersonalizer States:

1. LOADING
   └─ Fetching templates from database
      └─ READY

2. READY (With Saved Templates)
   ├─ List Collapsed
   │  └─ [📋 Modèles sauvegardés (N)]
   │     └─ Click: Expand
   │
   └─ List Expanded
      ├─ [📋 Masquer les modèles]
      ├─ [Template 1] ← clickable
      ├─ [Template 2] ← clickable
      └─ Click any: TEMPLATE_LOADED

3. TEMPLATE_LOADED
   ├─ Canvas shows loaded template
   ├─ User can customize
   └─ Click [💾 Save]: SAVING

4. SAVING
   ├─ POST request in progress
   ├─ Button shows "⏳ Sauvegarde..."
   ├─ Input disabled
   └─ Complete: READY

5. ERROR
   └─ Alert shown
      └─ Back to READY
```

## Example Templates

### Template 1: Standard Engagement
```json
{
  "name": "Engagement Classique",
  "category": "engagement",
  "elements": [
    {
      "id": "1",
      "type": "text",
      "content": "ENGAGEMENT",
      "x": 50,
      "y": 50,
      "width": 700,
      "height": 60,
      "fontSize": 32,
      "color": "#000000",
      "fontFamily": "Arial",
      "fontWeight": "900",
      "textAlign": "center"
    },
    {
      "id": "2",
      "type": "text",
      "content": "{{client_name}}",
      "x": 50,
      "y": 150,
      "width": 300,
      "height": 30,
      "fontSize": 14,
      "color": "#333333",
      "fontFamily": "Arial",
      "fontWeight": "400",
      "textAlign": "left"
    },
    {
      "id": "3",
      "type": "signature",
      "content": "Signature et cachet",
      "x": 50,
      "y": 1000,
      "width": 300,
      "height": 60,
      "fontSize": 12,
      "color": "#000000"
    }
  ]
}
```

### Template 2: Minimal Engagement
```json
{
  "name": "Engagement Minimaliste",
  "category": "engagement",
  "elements": [
    {
      "id": "1",
      "type": "text",
      "content": "ENGAGEMENT",
      "x": 50,
      "y": 30,
      "width": 700,
      "height": 40,
      "fontSize": 24,
      "color": "#1f2937",
      "fontFamily": "Inter",
      "fontWeight": "900",
      "textAlign": "center"
    }
    // ... minimal elements
  ]
}
```

## Keyboard Shortcuts (Future Enhancement)

```
Ctrl+S   → Save current template
Ctrl+L   → Load template list
Ctrl+N   → New template
Delete   → Delete selected element
Ctrl+Z   → Undo
Ctrl+Y   → Redo
```

## Performance Metrics

```
Action                    Time        Notes
─────────────────────────────────────────────
Load templates list       100-200ms   First load with 10 templates
Load template             <50ms       Instant in UI
Save new template         500-800ms   Including DB write
Delete template           200-400ms   Fast deletion
Search by category        <100ms      Indexed query
Render template in canvas <50ms       DOM rendering
```

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Templates not showing | List button hidden | Check DB has templates |
| Save fails silently | No error message | Check network tab |
| Template loads wrong | Elements misplaced | Verify element JSON |
| Performance slow | Load takes >1s | Check DB indexes |
| Duplicate saves | Multiple copies | Check primary key |

## Tips for Users

1. **Naming Convention**: Use clear names with date
   - Good: "Engagement MHD-AUTO 03-2026"
   - Bad: "Template 1"

2. **Backup**: Export templates regularly
   ```sql
   COPY document_templates TO '/tmp/backup.csv' CSV HEADER;
   ```

3. **Organization**: Standardize one template per category
   - One engagement template
   - One devis template
   - One contrat template

4. **Customization**: Save multiple variants
   - Standard version
   - Minimal version
   - Detailed version

5. **Testing**: Always test before relying on template
   - Load template
   - Preview
   - Print preview
   - Then use in production
