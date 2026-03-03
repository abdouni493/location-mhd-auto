# VERCEL DEPLOYMENT GUIDE - DriveFlow App
## Database Connection Fix for Production

---

## 🎯 THE PROBLEM

Your app has **hardcoded localhost URLs** that only work locally:
```javascript
// ❌ WRONG - Only works on your computer
fetch('http://localhost:4000/api/customers/list')
```

When deployed to Vercel, the frontend can't access `localhost:4000` because:
1. Frontend runs on `vercel.com` (your domain)
2. Backend runs on a different server (if at all)
3. `localhost` = "this computer" = doesn't exist on Vercel

---

## ✅ SOLUTION - Environment Variables

### **Step 1: Create `.env.local` File (Local Development)**

Create a file in your project root:

```env
# .env.local

VITE_API_URL=http://localhost:4000
```

### **Step 2: Update All API Calls in Frontend**

**Replace this everywhere:**
```javascript
// ❌ OLD
fetch('http://localhost:4000/api/customers/list')
```

**With this:**
```javascript
// ✅ NEW
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
fetch(`${API_URL}/api/customers/list`)
```

---

## 📝 SPECIFIC FILES TO CHANGE

### **1. App.tsx (Line 125 - fetchCustomers)**

**FIND:**
```typescript
const res = await fetch('http://localhost:4000/api/customers/list?page=0&limit=200');
```

**CHANGE TO:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const res = await fetch(`${API_URL}/api/customers/list?page=0&limit=200`);
```

---

### **2. CustomersPage.tsx (Line 218 - handleDelete)**

**FIND:**
```typescript
const res = await fetch('http://localhost:4000/api/from/customers/delete', {
```

**CHANGE TO:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const res = await fetch(`${API_URL}/api/from/customers/delete`, {
```

---

### **3. WorkersPage.tsx (Multiple Lines)**

**FIND (Lines 150, 194, 242, 252, 302):**
```typescript
const response = await fetch('http://localhost:4000/api/from/workers/select', {
const response = await fetch('http://localhost:4000/api/from/workers/delete', {
const response = await fetch('http://localhost:4000/api/from/workers/update', {
const response = await fetch('http://localhost:4000/api/from/workers/insert', {
```

**CHANGE ALL TO:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const response = await fetch(`${API_URL}/api/from/workers/...`, {
```

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Create Vercel Project**

1. Go to **https://vercel.com**
2. Sign in with GitHub
3. Click "New Project"
4. Select your GitHub repo
5. Click "Import"

### **Step 2: Add Environment Variables in Vercel**

**In Vercel Dashboard:**
1. Go to your project settings
2. Click "Environment Variables"
3. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.com` (see Step 3 below)
4. Click "Add"

### **Step 3: Deploy Your Backend**

**Choose ONE option:**

#### **Option A: Deploy Backend to Railway (Recommended)**
1. Go to **https://railway.app**
2. Sign in with GitHub
3. Create new project → "Deploy from GitHub repo"
4. Select your repo
5. Set environment variables:
   - `DATABASE_URL` = Your Neon PostgreSQL connection string
   - `PORT` = 3001 (or any port)
6. Deploy
7. Get your URL: `https://your-project-xyz.railway.app`
8. Add to Vercel environment variables:
   - `VITE_API_URL=https://your-project-xyz.railway.app`

#### **Option B: Deploy Backend to Heroku**
1. Go to **https://heroku.com**
2. Create new app
3. Connect GitHub repo
4. Add environment variables:
   - `DATABASE_URL` = Your Neon PostgreSQL connection string
5. Deploy
6. Get your URL: `https://your-app-name.herokuapp.com`
7. Add to Vercel environment variables:
   - `VITE_API_URL=https://your-app-name.herokuapp.com`

#### **Option C: Deploy Backend to Vercel (Functions)**
1. Modify `server/server.js` to export as Vercel function
2. Create `api/` folder structure
3. Deploy as Serverless Functions

---

## 🔧 CREATE HELPER FUNCTION (Cleaner Approach)

### **Create `src/lib/api.ts`:**

```typescript
// src/lib/api.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, options);
}

export async function apiPost(endpoint: string, body: any, options?: RequestInit) {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
  });
}
```

### **Then use it everywhere:**

```typescript
// ✅ CLEAN
import { apiFetch } from '../lib/api';

const res = await apiFetch('/api/customers/list?page=0&limit=200');
const res = await apiPost('/api/from/customers/delete', { where: { col: 'id', val: id } });
```

---

## 📋 CHECKLIST

- [ ] Create `.env.local` with `VITE_API_URL=http://localhost:4000`
- [ ] Update App.tsx - fetchCustomers() to use environment variable
- [ ] Update CustomersPage.tsx - handleDelete() to use environment variable
- [ ] Update WorkersPage.tsx - all fetch calls (Lines 150, 194, 242, 252, 302)
- [ ] Test locally: `npm run dev` (should still work)
- [ ] Deploy backend to Railway/Heroku/your choice
- [ ] Get backend URL from deployment service
- [ ] Add environment variable to Vercel dashboard:
  - `VITE_API_URL=https://your-backend-url.com`
- [ ] Deploy frontend to Vercel
- [ ] Test on production URL - should work!

---

## 🧪 TESTING

### **Local (Before Deployment)**
```bash
cd project
npm run dev
# Visit http://localhost:3000
# Should load customers, delete, edit, etc.
```

### **After Vercel Deployment**
1. Visit `https://your-vercel-app.com`
2. Open browser DevTools → Network tab
3. Check API requests go to your backend URL (not localhost)
4. Test all features:
   - Load customers
   - Delete customer
   - Edit customer
   - Create reservation
   - Print documents

---

## ⚠️ COMMON ERRORS & FIXES

### **Error: "Failed to fetch" or 404 on `/api/...`**
- **Cause:** `VITE_API_URL` not set in Vercel
- **Fix:** Go to Vercel Dashboard → Environment Variables → Add `VITE_API_URL`

### **Error: "Backend connection refused"**
- **Cause:** Backend server not running/deployed
- **Fix:** Deploy backend to Railway/Heroku/etc, get URL, add to Vercel env vars

### **Error: "CORS error"**
- **Cause:** Frontend and backend on different domains
- **Fix:** Check `server.js` has `app.use(cors())` at top

### **Error: "Database connection failed on production"**
- **Cause:** `DATABASE_URL` not set in backend deployment
- **Fix:** Add `DATABASE_URL=postgresql://...` in backend env vars

---

## 📚 QUICK REFERENCE

| Component | What to Change | Example |
|-----------|---|---|
| **Frontend** | Replace `localhost:4000` with env var | `${import.meta.env.VITE_API_URL}/api/...` |
| **Vercel Env Var** | Set `VITE_API_URL` | `https://my-api.railway.app` |
| **Backend Env Var** | Set `DATABASE_URL` | `postgresql://user:pass@...` |
| **CORS** | Already configured in server.js | Keep `cors()` enabled |

---

## 🎯 NEXT STEPS

1. **Create `.env.local`** with `VITE_API_URL=http://localhost:4000`
2. **Update the 5 files** with environment variable usage
3. **Deploy backend** to Railway/Heroku
4. **Get backend URL**
5. **Add to Vercel** environment variables
6. **Deploy to Vercel**
7. **Test everything works**

---

*Last Updated: March 3, 2026*
*For: DriveFlow Car Rental Management System*
