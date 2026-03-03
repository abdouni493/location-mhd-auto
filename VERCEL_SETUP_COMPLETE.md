# Vercel Deployment Complete Setup Guide

## ✅ What's Done

The following changes have been implemented to prepare your app for Vercel deployment:

### 1. **Environment Variables Setup**
- ✅ Created `.env.local` with `VITE_API_URL=http://localhost:4000` for local development
- ✅ Created centralized API helper in `lib/api.ts` for environment-aware API calls
- ✅ Updated all hardcoded API URLs to use environment variables

### 2. **Files Updated**
- ✅ `App.tsx` - Updated `fetchCustomers()` to use `apiFetch()`
- ✅ `pages/CustomersPage.tsx` - Updated `handleDelete()` to use `apiPost()`
- ✅ `pages/WorkersPage.tsx` - Updated all 5 fetch calls to use `apiPost()`
- ✅ `components/DocumentPersonalizer.tsx` - Updated 3 fetch calls to use API helpers
- ✅ `pages/ConfigPage.tsx` - Updated to use environment variable for API_URL
- ✅ `vercel.json` - Created Vercel configuration

### 3. **API Helper Functions** (`lib/api.ts`)
```typescript
// Use these functions throughout your app:
apiFetch(endpoint, options)      // Generic fetch wrapper
apiPost(endpoint, body, options)  // POST requests
apiGet(endpoint, options)         // GET requests
getApiUrl(endpoint)               // Get full URL string
```

---

## 🚀 Deployment Steps (Complete Checklist)

### **Step 1: Test Locally** (DO THIS FIRST!)
```bash
cd c:\Users\Admin\Desktop\neonLocation\driveflow---car-rental-management(1)
npm install  # If not already done
npm run dev
```

Then open `http://localhost:3000` and verify:
- ✅ Customers load
- ✅ Delete customer works
- ✅ Workers list works
- ✅ Add/edit workers works
- ✅ Templates load (if templates table exists)

**If you see errors:**
- Check that backend server is running on port 4000
- Check browser DevTools → Network tab for failed requests
- Ensure `.env.local` file exists with `VITE_API_URL=http://localhost:4000`

---

### **Step 2: Deploy Backend (Choose ONE)**

#### **Option A: Railway (Recommended) ⭐**
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your repository
6. Configure environment variables:
   - `DATABASE_URL` = Your Neon PostgreSQL URL (postgresql://user:password@...)
   - `PORT` = 4000
7. Railway auto-deploys when you push to GitHub
8. Get your backend URL from Railway dashboard (e.g., `https://yourusername-production.up.railway.app`)
9. **Save this URL - you'll need it in Step 4**

#### **Option B: Heroku (Free tier removed, but still available)**
1. Go to https://heroku.com
2. Create new app
3. Connect GitHub repo
4. Add environment variables:
   - `DATABASE_URL` = Your Neon PostgreSQL connection string
5. Deploy
6. Get your URL: `https://your-app-name.herokuapp.com`
7. **Save this URL**

#### **Option C: Render.com (Good Free Tier)**
1. Go to https://render.com
2. Sign in with GitHub
3. Create new "Web Service"
4. Connect GitHub repo
5. Set Start Command: `npm run start:server`
6. Add environment variable:
   - `DATABASE_URL` = Your Neon PostgreSQL URL
7. Deploy
8. Get your URL: `https://your-app-name.onrender.com`
9. **Save this URL**

**After deploying backend:**
- Test the backend URL directly: `https://your-backend-url.com/api/customers/list`
- Should return JSON data
- If it works, move to Step 3

---

### **Step 3: Prepare Frontend Repository**

Make sure all changes are committed:
```bash
git status
git add .
git commit -m "Configure environment variables for Vercel deployment"
git push
```

---

### **Step 4: Create Vercel Project**

1. Go to https://vercel.com
2. Sign in with GitHub (or create account)
3. Click "Add New..." → "Project"
4. Find your GitHub repo in the list
5. Click "Import"
6. **Configure Project:**
   - **Framework Preset:** Vite (should auto-detect)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
   - **Install Command:** `npm install` (default)

7. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add new variable:
     - **Name:** `VITE_API_URL`
     - **Value:** `https://your-backend-url.com` (from Step 2)
   - Click "Add"

8. Click "Deploy"
9. Wait for deployment to complete (usually 1-2 minutes)
10. Get your Vercel URL: `https://your-project-name.vercel.app`

---

### **Step 5: Test Production Deployment**

1. Visit your Vercel URL: `https://your-project-name.vercel.app`
2. Open browser DevTools (F12)
3. Go to "Network" tab
4. Reload page
5. Check that API requests go to your backend URL (not localhost)
6. Test all features:
   - ✅ Load customers (should see list)
   - ✅ Try to delete a customer (should work)
   - ✅ Add new worker (should work)
   - ✅ Load templates (if available)

---

## 🔧 Environment Variables Reference

### **Local Development (.env.local)**
```env
VITE_API_URL=http://localhost:4000
```

### **Vercel Dashboard**
Add in Project Settings → Environment Variables:
```
VITE_API_URL=https://your-backend-url.com
```

### **Backend Server**
Set these environment variables on your backend deployment:
```
DATABASE_URL=postgresql://user:password@host:port/database
PORT=4000 (or whatever you choose)
NODE_ENV=production
```

---

## 📋 Quick Reference Commands

```bash
# Local development
npm run dev              # Runs both frontend (Vite) and backend (Express)

# Build for production
npm run build            # Creates dist/ folder

# Preview production build locally
npm preview             # Shows what will be deployed

# Start only the backend
npm run start:server    # Runs Express server on port 4000

# Start only the frontend
npm run dev:vite        # Runs Vite dev server on port 5173
```

---

## 🚨 Troubleshooting

### **Error: "Failed to fetch" or API calls returning 404**
**Solution:** 
- Check that `VITE_API_URL` is set in Vercel dashboard
- Verify the backend URL is correct and backend is running
- Check browser DevTools → Network tab to see actual URL being called

### **Error: "Cannot GET /api/customers/list"**
**Solution:**
- Backend is not running or deployed
- Check that backend deployment was successful
- Verify environment variables are set on backend server

### **Error: "CORS error" in browser console**
**Solution:**
- Check that your backend server has CORS enabled
- Look for `app.use(cors())` in `server/server.js`
- Should be at the top of the Express app

### **Error: "Database connection refused"**
**Solution:**
- Check that `DATABASE_URL` environment variable is set on backend
- Verify Neon PostgreSQL connection string is correct
- Test connection manually: `psql postgresql://user:pass@host:port/db`

### **Error: Build fails on Vercel**
**Solution:**
- Check Vercel build logs for specific error
- Usually missing dependencies - run `npm install` locally first
- Ensure all files are committed to Git (not in .gitignore)

### **Frontend loads but no data appears**
**Solution:**
1. Open DevTools → Network tab
2. Look for API requests (should start with your backend URL, not localhost)
3. Click on failed request to see error details
4. Common causes:
   - Backend server not running
   - Environment variable not set
   - CORS not enabled on backend
   - Database connection failed

---

## 📚 File Structure After Setup

```
project-root/
├── .env.local                          # ← Local development only
├── vercel.json                          # ← Vercel config
├── lib/
│   └── api.ts                          # ← NEW: Centralized API helpers
├── App.tsx                             # ← Updated: Uses apiFetch()
├── pages/
│   ├── CustomersPage.tsx               # ← Updated: Uses apiPost()
│   ├── WorkersPage.tsx                 # ← Updated: Uses apiPost()
│   ├── ConfigPage.tsx                  # ← Updated: Uses env var
│   └── ...
├── components/
│   ├── DocumentPersonalizer.tsx        # ← Updated: Uses API helpers
│   └── ...
├── server/                             # ← Your backend
├── package.json
└── ...
```

---

## 🎯 Final Verification Checklist

- [ ] Local testing works (`npm run dev` loads customers)
- [ ] Backend deployed to Railway/Heroku/Render
- [ ] Backend URL copied and verified working
- [ ] All changes pushed to GitHub
- [ ] Vercel project created
- [ ] `VITE_API_URL` environment variable set in Vercel
- [ ] Frontend deployed to Vercel
- [ ] Production URL loads (https://yourapp.vercel.app)
- [ ] API requests show correct backend URL (not localhost)
- [ ] All features work: load customers, delete, add workers, etc.

---

## 🔗 Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app
- **Neon Console:** https://console.neon.tech
- **Vite Documentation:** https://vitejs.dev
- **Express Documentation:** https://expressjs.com

---

## 📞 Quick Support

If something doesn't work:
1. Check DevTools → Network tab (shows actual API calls)
2. Check Vercel build logs (Deployments → click deploy → Logs)
3. Check backend deployment logs
4. Verify all environment variables are set correctly
5. Make sure `.env.local` is only for local dev, NOT committed to Git

---

**You're all set! Follow the deployment steps above and your app will be live on Vercel! 🚀**
