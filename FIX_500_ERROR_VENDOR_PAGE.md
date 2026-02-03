# Fix 500 Error on Vendor Page

## Problem
The vendor dashboard and products pages are showing a 500 error when trying to fetch the vendor's canteen:
```
GET /api/v1/canteens/user/66666666-6666-6666-6666-666666666666
Status: 500 Internal Server Error
```

## Root Cause
The `user_id` column doesn't exist in the `canteens` table yet, causing the SQL query to fail.

## Solution

### Option 1: Quick SQL Fix (Fastest)

Run this SQL directly in your database:

```bash
psql -U your_user -d your_database -f scripts/quick-fix-add-user-id.sql
```

Or copy-paste this SQL:

```sql
-- Add user_id column
ALTER TABLE canteens 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Link vendors to canteens
UPDATE canteens SET user_id = '44444444-4444-4444-4444-444444444444' WHERE vendor_id = 'MIT-MC-001';
UPDATE canteens SET user_id = '55555555-5555-5555-5555-555555555555' WHERE vendor_id = 'MIT-SS-002';
UPDATE canteens SET user_id = '66666666-6666-6666-6666-666666666666' WHERE vendor_id = 'MIT-CF-003';
UPDATE canteens SET user_id = '77777777-7777-7777-7777-777777777777' WHERE vendor_id = 'VIT-FC-001';

-- Verify
SELECT vendor_id, name, user_id FROM canteens ORDER BY vendor_id;
```

### Option 2: Using Node.js Script

```bash
npx ts-node scripts/link-vendors.ts
```

### Option 3: Reset Database (Clean Slate)

```bash
npm run reset-db
```

This will recreate everything with the correct schema.

## Verification

After running the fix, verify it worked:

### 1. Check Database
```sql
SELECT 
    c.vendor_id,
    c.name as canteen_name,
    c.user_id,
    u.email as vendor_email
FROM canteens c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.vendor_id;
```

Expected output:
```
 vendor_id  | canteen_name  |               user_id                |         vendor_email          
------------+---------------+--------------------------------------+-------------------------------
 MIT-CF-003 | Cafeteria     | 66666666-6666-6666-6666-666666666666 | vendor.cafeteria@mitcoe.edu
 MIT-MC-001 | Main Canteen  | 44444444-4444-4444-4444-444444444444 | vendor.maincanteen@mitcoe.edu
 MIT-SS-002 | Snack Shop    | 55555555-5555-5555-5555-555555555555 | vendor.snackshop@mitcoe.edu
 VIT-FC-001 | Food Court    | 77777777-7777-7777-7777-777777777777 | vendor.foodcourt@vit.edu
```

### 2. Test API Endpoint

```bash
curl http://localhost:3000/api/v1/canteens/user/66666666-6666-6666-6666-666666666666 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "c3333333-3333-3333-3333-333333333333",
    "institutionId": "11111111-1111-1111-1111-111111111111",
    "vendorId": "MIT-CF-003",
    "userId": "66666666-6666-6666-6666-666666666666",
    "name": "Cafeteria",
    "location": "Second Floor, Engineering Block",
    "isActive": true,
    "isApproved": true
  }
}
```

### 3. Test Frontend

1. Login as vendor: `vendor.cafeteria@mitcoe.edu` / `password123`
2. Navigate to vendor dashboard
3. Page should load without errors
4. Check browser console - no 500 errors

## What This Fix Does

1. **Adds `user_id` column** to canteens table
2. **Links each canteen to its vendor user**:
   - MIT-MC-001 (Main Canteen) → vendor.maincanteen@mitcoe.edu
   - MIT-SS-002 (Snack Shop) → vendor.snackshop@mitcoe.edu
   - MIT-CF-003 (Cafeteria) → vendor.cafeteria@mitcoe.edu
   - VIT-FC-001 (Food Court) → vendor.foodcourt@vit.edu

3. **Enables the flow**:
   ```
   User logs in → JWT contains userId
   Frontend calls /canteens/user/:userId
   Backend finds canteen with that user_id
   Returns vendorId (e.g., "MIT-CF-003")
   Frontend uses vendorId to fetch products/orders
   ```

## After Fix

Once the migration is complete:

✅ Vendor dashboard will load
✅ Products page will show products
✅ Orders page will show orders
✅ No more 500 errors

## Troubleshooting

### Still getting 500 error?

Check backend logs for the actual error:
```bash
# In your terminal where the backend is running
# Look for error messages after the request
```

### Column already exists error?

If you see: `ERROR: column "user_id" of relation "canteens" already exists`

Just run the UPDATE statements:
```sql
UPDATE canteens SET user_id = '66666666-6666-6666-6666-666666666666' WHERE vendor_id = 'MIT-CF-003';
```

### user_id is NULL?

Check if the user exists:
```sql
SELECT id, email, role FROM users WHERE id = '66666666-6666-6666-6666-666666666666';
```

If not found, the user IDs in your database might be different. Find the correct IDs:
```sql
SELECT id, email, role FROM users WHERE role = 'VENDOR' ORDER BY email;
```

Then update the canteens with the correct user IDs.

## Summary

**Quick Fix Command:**
```bash
psql -U your_user -d your_database -f scripts/quick-fix-add-user-id.sql
```

**Or reset everything:**
```bash
npm run reset-db
```

After running either command, refresh your browser and the vendor pages should work!
