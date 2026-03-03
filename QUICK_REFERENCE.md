# 📌 QUICK REFERENCE - Vercel Deployment Setup

## 📍 File Locations

```
project-root/
├── .env.local                    ← Development only, NOT in git
├── lib/
│   └── api.ts                   ← API helper functions
├── vercel.json                  ← Vercel config
├── App.tsx                      ← Updated: uses apiFetch()
├── pages/
│   ├── CustomersPage.tsx        ← Updated: uses apiPost()
│   ├── WorkersPage.tsx          ← Updated: uses apiPost() (5 places)
│   └── ConfigPage.tsx           ← Updated: uses env var
├── components/
│   └── DocumentPersonalizer.tsx ← Updated: uses API helpers
└── server/server.js            ← Backend: ensure cors() is enabled
```

---

## 💻 Command Reference

```bash
# Local Development
npm run dev              # Start both frontend + backend
npm run dev:vite         # Frontend only (port 5173)
npm run start:server     # Backend only (port 4000)

# Production
npm run build            # Build for Vercel
npm run preview          # Preview production build locally

# Git
git status              # Check changes
git add .               # Stage all
git commit -m "msg"     # Commit
git push                # Push to GitHub
```

---

## 🔧 API Helper Usage

### **Import**
```typescript
import { apiFetch, apiPost, apiGet } from '../lib/api';
```

### **Examples**

**GET Request:**
```typescript
const res = await apiFetch('/api/customers/list?page=0&limit=200');
const data = await res.json();
```

**POST Request:**
```typescript
const res = await apiPost('/api/from/customers/delete', {
  where: { col: 'id', val: id }
});
const data = await res.json();
```

**With Error Handling:**
```typescript
try {
  const res = await apiPost('/api/endpoint', { data: 'value' });
  const json = await res.json();
  if (json.error) {
    console.error(json.error);
  } else {
    // Success!
  }
} catch (err) {
  console.error('Request failed:', err);
}
```

---

## 🌍 Environment Variables

### **Local (.env.local)**
```env
VITE_API_URL=http://localhost:4000
```

### **Access in Code**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
// Returns: http://localhost:4000 (local)
//     or: https://api.example.com (production)
```

### **Vercel Dashboard**
```
Settings → Environment Variables
Name: VITE_API_URL
Value: https://your-backend-url.com
```

---

## 🚀 Deployment Checklist

### Before Deploying
- [ ] `npm run dev` works locally
- [ ] All tests pass (see LOCAL_TESTING_GUIDE.md)
- [ ] No console errors
- [ ] API calls go to localhost:4000 (local)
- [ ] `git push` succeeds

### Backend Deployment (Choose One)
- [ ] Deploy to Railway/Heroku/Render
- [ ] Get backend URL
- [ ] Test backend directly (hit `/api/customers/list`)
- [ ] Save backend URL for next step

### Vercel Deployment
- [ ] Create project on vercel.com
- [ ] Add environment variable: `VITE_API_URL=<backend-url>`
- [ ] Deploy
- [ ] Test production URL
- [ ] Verify API calls go to backend (not localhost)

---

## 🔗 URL Map

| Environment | Frontend | Backend | API Calls Go To |
|-------------|----------|---------|-----------------|
| Local Dev | http://localhost:5173 | http://localhost:4000 | localhost:4000 |
| Production | https://app.vercel.app | https://api.railway.app | api.railway.app |

---

## 📊 What Changed

| Before | After |
|--------|-------|
| `fetch('http://localhost:4000/api/...')` | `apiFetch('/api/...')` |
| Hardcoded localhost | Environment variable |
| Breaks in production | Works everywhere |
| Scattered fetch calls | Centralized in lib/api.ts |

---

## ✅ Status Check

```typescript
// Check if environment variable is loaded
console.log('API URL:', import.meta.env.VITE_API_URL);
// Output: http://localhost:4000 (local)
//      or https://api.example.com (production)
```

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| API 404 | Backend not running: `npm run start:server` |
| Env var undefined | Restart dev server: `npm run dev` |
| CORS error | Check `app.use(cors())` in server.js |
| API goes to :3000 | Check .env.local exists |
| Build fails | Run `npm install`, check errors |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **LOCAL_TESTING_GUIDE.md** | 🟢 How to test locally (start here) |
| **VERCEL_DEPLOYMENT_CHECKLIST.md** | 🟡 Quick deployment steps |
| **VERCEL_SETUP_COMPLETE.md** | 🔴 Complete detailed guide (50+ sections) |
| **VERCEL_DEPLOYMENT_SUMMARY.md** | 🔵 Architecture overview |

**Read in order:** Testing Guide → Checklist → Full Guide if needed

---

## 🎯 5-Minute Quick Start

```bash
# 1. Test locally
npm run dev
# Check http://localhost:5173 - should work

# 2. Deploy backend
# Go to railway.app - deploy and get URL

# 3. Commit changes
git add .
git commit -m "Vercel deployment setup"
git push

# 4. Deploy frontend
# Go to vercel.com - import repo
# Add env var: VITE_API_URL=<backend-url>
# Deploy

# 5. Test production
# Visit https://yourapp.vercel.app
# Should work!
```

---

## 🔑 Key Files Modified

✅ `App.tsx` - Line 6, 126
✅ `pages/CustomersPage.tsx` - Line 6, 219
✅ `pages/WorkersPage.tsx` - Line 4, 151, 191, 235, 241, 287
✅ `pages/ConfigPage.tsx` - Line 4, 176
✅ `components/DocumentPersonalizer.tsx` - Line 4, 86, 109, 157

---

## 💡 Pro Tips

1. **Always use API helpers** - Never hardcode URLs again
2. **Test locally first** - Catch issues before deployment
3. **Keep .env.local secret** - Never commit to Git
4. **Monitor DevTools** - Check Network tab during testing
5. **Use fallback** - API helpers have `http://localhost:4000` fallback
6. **Keep backend URL safe** - Store in Vercel secrets, not in code

---

## 🆘 When Stuck

1. Check LOCAL_TESTING_GUIDE.md
2. Review DevTools Network tab
3. Verify environment variables
4. Check backend is running
5. Read VERCEL_SETUP_COMPLETE.md
6. Contact backend team if API issues

---

## 📞 Useful Links

- Vercel: https://vercel.com/dashboard
- Railway: https://railway.app
- Vite: https://vitejs.dev/guide/env-and-modes.html
- MDN Fetch: https://developer.mozilla.org/en-US/docs/Web/API/fetch

---

**Last Updated:** March 3, 2026
**Status:** ✅ Ready for Deployment
**Framework:** Vite + React + TypeScript
**Hosting:** Vercel (Frontend) + Your Choice (Backend)

---

**Questions?** See the comprehensive guides above or check browser DevTools Network tab!
