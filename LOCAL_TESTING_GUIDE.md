# ✅ LOCAL TESTING GUIDE - Before You Deploy

**This guide walks you through testing your app locally to ensure everything works before deploying to Vercel.**

---

## 🎯 What You'll Test

1. ✅ Frontend loads at http://localhost:3000
2. ✅ Backend API accessible at http://localhost:4000
3. ✅ Environment variables working correctly
4. ✅ All API calls using environment-aware URLs
5. ✅ Core features: Load customers, delete, add workers
6. ✅ No console errors or failed API calls

---

## 🚀 Quick Start (5 minutes)

### **Terminal 1: Start the Application**
```bash
cd c:\Users\Admin\Desktop\neonLocation\driveflow---car-rental-management(1)
npm run dev
```

You should see:
```
VITE v6.2.0  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help

  VITE_API_URL is: http://localhost:4000
```

✅ If you see this, the environment variable is loaded correctly!

### **Terminal 2: (Optional) Start Backend Only**
If backend isn't already running:
```bash
npm run start:server
```

You should see:
```
Server running on http://localhost:4000
```

---

## 🌐 Test in Browser

### **Step 1: Open the App**
1. Open http://localhost:5173 in your browser
2. Should load without errors
3. Check DevTools (F12) → Console tab
4. Should see NO red errors

### **Step 2: Check Network Requests**
1. Open DevTools (F12)
2. Click "Network" tab
3. Reload the page (F5)
4. Look for requests to `/api/customers/list`
5. Click on that request
6. Check the URL - should show: `http://localhost:4000/api/customers/list`
7. If it shows `localhost:3000` - **ERROR**, see troubleshooting below

### **Step 3: Test Customer Features**
1. Look for "Customers" page/tab
2. Wait for customers to load (should see list)
3. Try to delete a customer:
   - Click delete button
   - Should show confirmation
   - Click confirm
   - Customer should disappear

### **Step 4: Test Worker Features**
1. Go to Workers page
2. Click "Add Worker" button
3. Fill in the form:
   - Full Name: Test Worker
   - Birthday: 01/01/1990
   - Phone: 0551234567
   - Email: test@example.com
   - Address: Test Address
   - ID Card: 12345
   - Role: Driver
   - Payment Type: Month
   - Amount: 1000
   - Username: testuser
   - Password: testpass
4. Click Save
5. Worker should appear in list

### **Step 5: Monitor Network Requests**
Keep DevTools Network tab open during all tests:
- All requests should go to `http://localhost:4000`
- No requests to `localhost:3000` for API
- All requests should return 200/201 status

---

## 🔍 Verify Environment Variables

### **Check 1: .env.local File Exists**
```bash
# In PowerShell
Test-Path "c:\Users\Admin\Desktop\neonLocation\driveflow---car-rental-management(1)\.env.local"
# Should return: True

# Or check content
Get-Content "c:\Users\Admin\Desktop\neonLocation\driveflow---car-rental-management(1)\.env.local"
# Should show: VITE_API_URL=http://localhost:4000
```

### **Check 2: Vite Reads Environment Variable**
Look for this in browser console or terminal:
```
VITE_API_URL is: http://localhost:4000
```

Or add this to any component temporarily:
```typescript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

### **Check 3: Verify API Helper Module**
1. Check that `lib/api.ts` exists
2. Contains functions: `apiFetch`, `apiPost`, `apiGet`
3. Used in all main files

---

## 📊 Full Test Scenario

Follow this step-by-step for complete verification:

```
START
  ↓
[1] Run: npm run dev
  ↓
[2] Open browser DevTools (F12)
  ↓
[3] Go to Network tab
  ↓
[4] Visit http://localhost:5173
  ↓
[5] Wait for customers to load
  ↓
[6] Check Network tab:
    - See API calls to http://localhost:4000?  ✅ PASS
    - See any localhost:3000 API calls?        ❌ FAIL
  ↓
[7] Delete a customer:
    - Customer disappears?                      ✅ PASS
    - Network shows DELETE request?             ✅ PASS
  ↓
[8] Add a worker:
    - Form saves successfully?                  ✅ PASS
    - Worker appears in list?                   ✅ PASS
  ↓
[9] Check for console errors (F12, Console tab)
    - Any red error messages?                   ❌ FAIL
    - Should be clean or just warnings          ✅ PASS
  ↓
ALL TESTS PASS → Ready to Deploy! 🚀
```

---

## 🐛 Troubleshooting

### **Problem: "Cannot GET /api/customers/list" (404 error)**

**Cause:** Backend not running

**Fix:**
```bash
# Terminal 2
npm run start:server
# Should show: Server running on http://localhost:4000
```

### **Problem: API calls go to localhost:3000 instead of :4000**

**Cause:** Environment variable not loaded

**Fix:**
1. Check .env.local exists: `Test-Path ".env.local"`
2. Restart dev server: 
   ```bash
   # Press Ctrl+C to stop
   # Then run again:
   npm run dev
   ```
3. Clear browser cache (Ctrl+Shift+Delete)
4. Reload page (Ctrl+F5)

### **Problem: "import { apiFetch } from '../lib/api'" fails**

**Cause:** api.ts file not found

**Fix:**
1. Verify file exists: `lib/api.ts`
2. Check it contains export functions
3. Restart dev server

### **Problem: Customers don't load but no errors shown**

**Cause:** Backend database issue

**Fix:**
1. Check backend logs: Look for error messages when calling API
2. Verify DATABASE_URL is set in backend
3. Check database is running
4. Try calling API directly:
   ```bash
   curl http://localhost:4000/api/customers/list
   ```
   Should return JSON, not error

### **Problem: Console shows "VITE_API_URL is undefined"**

**Cause:** Env variable not read by Vite

**Fix:**
1. Verify .env.local exists in project root (NOT src/)
2. Stop and restart dev server: `npm run dev`
3. Check file content: Should have `VITE_API_URL=http://localhost:4000`

### **Problem: Everything works locally but fails on Vercel**

**Cause:** VITE_API_URL not set in Vercel

**Fix:**
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add: `VITE_API_URL=https://your-backend-url.com`
4. Redeploy

---

## 📋 Test Checklist

Mark off each item as you test:

### Frontend Tests
- [ ] App loads at http://localhost:5173
- [ ] No errors in browser console (F12)
- [ ] Home page displays correctly
- [ ] Navigation menu works

### API Tests
- [ ] DevTools Network tab shows requests to localhost:4000
- [ ] API calls return 200 status
- [ ] No CORS errors
- [ ] Responses contain expected JSON data

### Customer Features
- [ ] Customer list loads (shows data)
- [ ] Can delete a customer
- [ ] Refresh works
- [ ] Pagination works (if implemented)

### Worker Features
- [ ] Worker list loads
- [ ] Can add new worker
- [ ] Can edit existing worker
- [ ] Can delete worker
- [ ] Payment/transaction features work

### Template Features (if applicable)
- [ ] Templates load
- [ ] Can create new template
- [ ] Can save template
- [ ] Can delete template
- [ ] Document preview works

### General
- [ ] No hardcoded localhost:4000 in API calls
- [ ] All API calls use environment variable
- [ ] App works with environment variable fallback
- [ ] No sensitive data in console logs

---

## 🎬 Recording Test Results

If you want to share test results:

```bash
# Save network requests to file (DevTools → Network → Right-click → Save as HAR)
# Save browser console output (DevTools → Console → Right-click → Save as)
# Take screenshot showing successful customer load

# This helps diagnose issues if deployment fails
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ App loads without errors
2. ✅ All API calls show correct backend URL
3. ✅ Customers load and display
4. ✅ Delete customer works
5. ✅ Add/edit workers works
6. ✅ No console errors or warnings
7. ✅ Network tab shows all successful responses (200/201)

---

## 🚀 When You're Ready to Deploy

After passing all tests above:

1. Run: `git add .`
2. Run: `git commit -m "Setup Vercel deployment"`
3. Run: `git push`
4. Go to https://vercel.com
5. Import repo and add environment variable
6. Deploy and test in production

---

## 📞 Quick Reference

| What | Command | Expected Output |
|------|---------|-----------------|
| Start dev server | `npm run dev` | "ready in XXX ms" |
| Start backend only | `npm run start:server` | "Server running on :4000" |
| Build for production | `npm run build` | "dist/" folder created |
| Test environment variable | See console in browser | "http://localhost:4000" |

---

## ⏱️ Time Estimates

- Full test run: 5-10 minutes
- If issues: 10-15 minutes
- Fixing common issues: 2-5 minutes

**Total time: Plan for 15 minutes max**

---

Now you're ready to test! Run `npm run dev` and start testing! 🚀

If everything passes → Deploy to Vercel
If issues found → Check troubleshooting section above
