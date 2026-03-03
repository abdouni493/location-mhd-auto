# ✅ API FIX GUIDE - What Changed

## 🔴 Problems Fixed:
1. **404 Not Found errors** - API now checks if table exists before querying
2. **JSON parsing errors** - Added proper error handling and fallback responses
3. **Silent failures** - Added logging to console for debugging

## 🟢 What You Need To Do:

### STEP 1: Run SQL in Neon Console
1. Go to https://console.neon.tech/app/projects
2. Click your project → **SQL Editor**
3. Open file: `FIX_DATABASE_TEMPLATES.sql`
4. Copy the entire content and paste into Neon SQL editor
5. **Click "Execute"** and wait for completion
6. You should see output like:
   ```
   CREATE TABLE
   CREATE INDEX (x4)
   GRANT
   INSERT 0 1
   ```

### STEP 2: Restart Your Development Server
```bash
# Press Ctrl+C in your terminal to stop the server
# Then restart:
npm run dev
```

### STEP 3: Test Template Saving
1. Open the app at http://localhost:3004
2. Go to **Create Document** → Select **Engagement**
3. Click **Save Template**
4. Give it a name and click **Save**
5. You should see a success message

### STEP 4: Test Template Loading
1. When you re-open **Create Document**, it should load your saved templates
2. Templates dropdown should show your saved templates

---

## 🛠️ What Was Fixed in Code:

### Backend (server.js):
- ✅ All API endpoints now check if `document_templates` table exists
- ✅ Returns empty array `[]` if table doesn't exist (doesn't crash)
- ✅ Better error messages for debugging
- ✅ Table existence check: `SELECT EXISTS(...)`

### Frontend (DocumentPersonalizer.tsx):
- ✅ API calls now use full URL: `http://localhost:4000/api/templates`
- ✅ Error handling for non-200 responses
- ✅ Graceful fallback if API fails (shows empty template list)
- ✅ Better error messages to users
- ✅ Checks response status before parsing JSON

---

## 📝 SQL Summary:

The script creates:
1. **Table**: `public.document_templates` with all columns
2. **Indexes**: For fast queries by category, date, and defaults
3. **Constraints**: Ensures valid data (canvas dimensions > 0)
4. **Sample Data**: 2 default templates (you can delete these)
5. **Permissions**: Grants SELECT, INSERT, UPDATE, DELETE

---

## 🔍 Debug If Still Having Issues:

### Check table exists:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'document_templates';
```

### Check data in table:
```sql
SELECT id, name, category FROM public.document_templates;
```

### Check API directly (in browser console):
```javascript
fetch('http://localhost:4000/api/templates')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Check server logs:
Look for `[TEMPLATES GET ERROR]` messages in your terminal

---

## 💡 Important Notes:

- ✅ Backend now has `http://localhost:4000` hardcoded in fetch calls
- ✅ Both endpoints (GET and POST) check table existence
- ✅ If table doesn't exist, API returns empty data instead of 500 error
- ✅ All timestamps are stored with timezone info (UTC)
- ✅ Elements are stored as JSONB (efficient JSON storage in PostgreSQL)

---

**After running the SQL, your template system should be fully functional!**
