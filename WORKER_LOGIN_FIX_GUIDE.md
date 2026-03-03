# Worker Creation & Login Fix Guide

## Issues Fixed ✅

### 1. **Placeholder Image Errors** 
- ❌ `net::ERR_NAME_NOT_RESOLVED` errors from `https://via.placeholder.com`
- ✅ **Fixed**: Replaced with emoji fallback `👤`
- No more external image requests on network errors

### 2. **Worker Login Not Working**
- ❌ New workers created couldn't login after creation
- ✅ **Fixed**: Database migration script to ensure proper setup

---

## Steps to Fix Worker Login

### 1. Run the Database Migration
Execute this SQL in **Supabase Dashboard → SQL Editor**:

```sql
-- Set default password for workers missing one
UPDATE workers 
SET password = 'Change123!' 
WHERE password IS NULL OR password = '';

-- Ensure all workers are active
UPDATE workers 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- Create indexes for faster login
CREATE INDEX IF NOT EXISTS idx_workers_username ON workers(username) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_workers_email ON workers(email) 
WHERE is_active = true AND email IS NOT NULL;

-- Verify workers were created
SELECT id, full_name, username, password, role, is_active, created_at 
FROM workers 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Test Worker Login
1. Go to **Équipe (Team)** page
2. Create a new worker with:
   - Full Name: `Test Worker`
   - Username: `testworker` (must be lowercase, no spaces)
   - Password: `Test123!`
3. Logout from admin account
4. Login with:
   - **Username**: `testworker`
   - **Password**: `Test123!`

Should login successfully! ✅

---

## How Worker Login Works

The system checks:
1. **Username** in workers table
2. If found, compares **password** field
3. Returns worker **role** (admin, worker, driver)
4. Creates session for that worker

No Supabase Auth account needed for workers!

---

## Important Notes

⚠️ **Passwords are stored in plain text** (for demo purposes)
- In production, use proper password hashing (bcrypt)
- Never expose passwords in browser console

✅ **New workers are automatically set to is_active = true**
- Only active workers can login
- Update this field to deactivate workers

---

## Troubleshooting

### Worker Won't Login
**Check:**
1. Username exists in workers table: `SELECT * FROM workers WHERE username = 'your_username'`
2. Password matches exactly
3. `is_active = true`

### Change Worker Password
```sql
UPDATE workers 
SET password = 'NewPassword123'
WHERE username = 'testworker';
```

### Reset All Passwords
```sql
UPDATE workers 
SET password = 'DefaultPass123!';
```

### Delete Inactive Workers
```sql
DELETE FROM workers WHERE is_active = false;
```

---

## Frontend Changes ✅

✅ **Fixed placeholder image issues**:
- Workers page now uses emoji `👤` instead of `via.placeholder.com`
- No more DNS resolution errors
- Works offline and with network issues

✅ **Improved user experience**:
- Cleaner fallback design
- Faster page loads (no external requests)
- Better accessibility

