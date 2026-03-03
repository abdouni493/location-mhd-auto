# Document Templates - Real-World Examples

## Example 1: MHD-AUTO Engagement Template

### Scenario
MHD-AUTO uses a standardized engagement form. The manager wants to create a template that all staff can use.

### Steps

**Week 1: Create Template**
```
1. Manager opens reservation for client "WEBER SEDISEF"
2. Clicks "🖨️ Print Engagement"
3. DocumentPersonalizer modal opens
4. Manager customizes:
   - Repositions "ENGAGEMENT" title to top-center
   - Adds company logo and address
   - Changes colors to match brand: blue #2563eb
   - Adjusts signature box size
   - Sets all fonts to Inter, bold weights
5. Enters name: "MHD-AUTO Engagement Standard"
6. Clicks "💾 Enregistrer le modèle"
7. ✅ Template saved

Database now contains:
{
  id: "uuid-123",
  name: "MHD-AUTO Engagement Standard",
  category: "engagement",
  elements: [...array with 15 elements],
  canvas_width: 800,
  canvas_height: 1100,
  created_at: "2026-03-03T10:15:00Z"
}
```

**Week 2: Use Template**
```
1. Staff member opens new reservation
2. Clicks "🖨️ Print Engagement"
3. Sees "📋 Modèles sauvegardés (1)"
4. Clicks to expand: ["MHD-AUTO Engagement Standard"]
5. Clicks template → instantly loads
6. ✅ All customizations applied:
   - Layout matches brand
   - Colors are correct
   - Logo positioned properly
   - Fonts are consistent
7. Clicks "🖨️ Imprimer" → prints with brand styling
```

---

## Example 2: Multi-Template Organization

### Scenario
Agency has 3 different engagement templates for different vehicle types.

### Create Multiple Templates
```
1. STANDARD ENGAGEMENT (for regular vehicles)
   - Name: "Engagement - Voitures Classiques"
   - Simple layout, compact
   - Minimal branding

2. LUXURY ENGAGEMENT (for premium vehicles)
   - Name: "Engagement - Véhicules Premium"
   - Detailed layout, large font
   - Premium branding

3. MINIVAN ENGAGEMENT (for family vehicles)
   - Name: "Engagement - Minivans et Fourgonnettes"
   - Child-friendly sections
   - Safety checklists
```

### Select Appropriate Template When Printing
```
Booking #123: BMW M440 (Luxury)
  → "Engagement - Véhicules Premium"

Booking #124: Hyundai i20 (Standard)
  → "Engagement - Voitures Classiques"

Booking #125: Ford S-Max (Minivan)
  → "Engagement - Minivans et Fourgonnettes"
```

---

## Example 3: Template Evolution

### Timeline

**March 1, 2026**
```
Manager creates: "Engagement v1"
Elements: 10
Status: Saved
```

**March 15, 2026**
```
Client feedback: "Needs more information"
Manager loads "Engagement v1"
Adds more details
Saves as: "Engagement v2"
Old template still available
```

**April 1, 2026**
```
Manager needs to revert
Loads "Engagement v1" for comparison
Takes best of both
Saves as: "Engagement Final"
```

**Database contains all 3 versions:**
```sql
SELECT name, created_at FROM document_templates 
WHERE category = 'engagement'
ORDER BY created_at DESC;

Result:
├─ Engagement Final        (2026-04-01)
├─ Engagement v2           (2026-03-15)
└─ Engagement v1           (2026-03-01)
```

---

## Example 4: API Usage in Custom Integrations

### Scenario
Developer wants to export all templates for backup.

### Shell Script
```bash
#!/bin/bash

# Backup all templates
curl http://localhost:4000/api/templates \
  | jq '.data' > templates_backup.json

# Backup by category
curl http://localhost:4000/api/templates?category=engagement \
  | jq '.data' > engagement_templates.json

# Count templates
curl http://localhost:4000/api/templates \
  | jq '.data | length'
```

### Result
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Engagement Standard",
      "category": "engagement",
      "elements": [...],
      "created_at": "2026-03-03T10:15:00Z"
    },
    {
      "id": "uuid-2",
      "name": "Engagement Premium",
      "category": "engagement",
      "elements": [...],
      "created_at": "2026-03-05T14:30:00Z"
    }
  ],
  "error": null
}
```

---

## Example 5: Database Management

### Cleanup Old Templates
```sql
-- Find old templates (older than 3 months)
SELECT id, name, created_at FROM document_templates
WHERE created_at < NOW() - INTERVAL '3 months'
ORDER BY created_at DESC;

-- Delete old templates for a category (keep last 5)
DELETE FROM document_templates
WHERE category = 'engagement'
  AND id NOT IN (
    SELECT id FROM document_templates
    WHERE category = 'engagement'
    ORDER BY created_at DESC
    LIMIT 5
  );

-- Verify cleanup
SELECT COUNT(*) FROM document_templates WHERE category = 'engagement';
```

---

## Example 6: Template Statistics

### Dashboard Queries
```sql
-- Count templates by category
SELECT category, COUNT(*) as count
FROM document_templates
GROUP BY category
ORDER BY count DESC;

Result:
┌──────────┬─────┐
│ category │ cnt │
├──────────┼─────┤
│ engagement │ 5   │
│ contrat  │ 3   │
│ devis    │ 2   │
│ versement│ 1   │
└──────────┴─────┘

-- Most used templates (by name frequency)
SELECT name, COUNT(*) as uses
FROM document_templates
GROUP BY name
ORDER BY uses DESC;

-- Recent templates
SELECT name, category, created_at
FROM document_templates
ORDER BY created_at DESC
LIMIT 10;

-- Average template size
SELECT 
  category,
  ROUND(AVG(octet_length(elements::text))) as avg_size_bytes
FROM document_templates
GROUP BY category;
```

---

## Example 7: Custom Element Positioning

### Template with Complex Layout
```json
{
  "name": "Engagement - Layout Pro",
  "category": "engagement",
  "elements": [
    {
      "id": "header-logo",
      "type": "logo",
      "x": 50,
      "y": 20,
      "width": 100,
      "height": 80
    },
    {
      "id": "header-company",
      "type": "text",
      "content": "MHD-AUTO",
      "x": 160,
      "y": 30,
      "width": 590,
      "height": 30,
      "fontSize": 24,
      "fontWeight": "900",
      "color": "#2563eb"
    },
    {
      "id": "title",
      "type": "text",
      "content": "ENGAGEMENT DE LOCATION",
      "x": 50,
      "y": 130,
      "width": 700,
      "height": 40,
      "fontSize": 20,
      "fontWeight": "900",
      "textAlign": "center"
    },
    {
      "id": "client-info-box",
      "type": "text",
      "content": "Client: {{client_name}}\\nTéléphone: {{client_phone}}\\nLieu Naissance: {{client_pob}}",
      "x": 50,
      "y": 200,
      "width": 450,
      "height": 120,
      "fontSize": 11,
      "backgroundColor": "#f3f4f6",
      "borderColor": "#2563eb",
      "borderWidth": 2
    },
    {
      "id": "vehicle-info-box",
      "type": "text",
      "content": "Véhicule: {{vehicle_brand}} {{vehicle_model}}\\nImmatriculation: {{vehicle_plate}}\\nCouleur: {{vehicle_color}}",
      "x": 520,
      "y": 200,
      "width": 230,
      "height": 120,
      "fontSize": 11,
      "backgroundColor": "#f3f4f6",
      "borderColor": "#2563eb",
      "borderWidth": 2
    },
    {
      "id": "signature-agency",
      "type": "signature",
      "content": "Signature et cachet de l'Agence",
      "x": 50,
      "y": 950,
      "width": 320,
      "height": 100,
      "fontSize": 12
    },
    {
      "id": "signature-client",
      "type": "signature",
      "content": "Signature du client",
      "x": 430,
      "y": 950,
      "width": 320,
      "height": 100,
      "fontSize": 12
    }
  ],
  "canvas_width": 800,
  "canvas_height": 1100
}
```

---

## Example 8: Testing Checklist

### Before Deploying Template to Production

```
[ ] Save template with clear name
[ ] Load template in fresh modal
[ ] Verify all elements loaded correctly
[ ] Check element positions match original
[ ] Check colors are accurate
[ ] Check fonts are correct
[ ] Test printing to PDF
[ ] Test printing to physical printer
[ ] Verify printed output matches preview
[ ] Check database entry was created
[ ] Test loading template in new reservation
```

---

## Example 9: Performance Monitoring

### Check Database Performance
```sql
-- Check query speed
EXPLAIN ANALYZE
SELECT * FROM document_templates 
WHERE category = 'engagement'
ORDER BY created_at DESC
LIMIT 10;

-- Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename = 'document_templates';

-- Check table size
SELECT 
  pg_size_pretty(pg_total_relation_size('document_templates')) as total_size,
  pg_size_pretty(pg_relation_size('document_templates')) as table_size,
  pg_size_pretty(pg_indexes_size('document_templates')) as indexes_size;
```

---

## Example 10: Disaster Recovery

### Backup Strategy
```bash
# Daily backup
pg_dump -U postgres -d your_db -t document_templates \
  > /backups/templates_$(date +%Y%m%d).sql

# Weekly full backup
pg_dump -U postgres -d your_db > /backups/full_$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres -d your_db < /backups/templates_20260303.sql
```

### Export to External Storage
```bash
# Export as JSON
sqlite3 -json /tmp/backup.json << EOF
SELECT * FROM document_templates;
EOF

# Export as CSV for Excel
COPY document_templates TO '/tmp/templates.csv' CSV HEADER;

# Export specific columns
COPY (SELECT id, name, category, created_at FROM document_templates) 
TO '/tmp/templates_list.csv' CSV HEADER;
```

---

## Summary

These examples show:
- ✅ How to create and use templates
- ✅ How to organize multiple templates
- ✅ How to evolve templates over time
- ✅ How to use API for integrations
- ✅ How to manage the database
- ✅ How to monitor performance
- ✅ How to backup and recover

**All real-world scenarios your team might encounter!**
