# Fix Expired Orders - Quick Guide

## Problem
Order `365d58c0-cfd1-4ab6-a31b-bd3e8f6c63e8` (and possibly others) have passed their expiration time but are still showing as PENDING instead of EXPIRED.

## Solution Options

### Option 1: Restart the Server (Easiest)
The background service will automatically expire all old orders within 60 seconds of server start.

```bash
# Stop the server (Ctrl+C)
# Then start it again
npm run dev
```

**What happens**:
- Server starts
- OrderExpirationService starts automatically
- Within 60 seconds, all expired orders are updated
- You'll see logs: `✓ Expired X order(s) automatically`

### Option 2: Run SQL Script (Immediate)
Execute the SQL script directly in your database client (pgAdmin, DBeaver, psql, etc.)

**File**: `CMS/scripts/expire-old-orders.sql`

**Steps**:
1. Open your PostgreSQL client
2. Connect to your database
3. Open and run `CMS/scripts/expire-old-orders.sql`
4. Check the results

**Or use psql command line**:
```bash
psql -U postgres -d canteen_db -f CMS/scripts/expire-old-orders.sql
```

### Option 3: Direct SQL Query (Fastest)
Run this single query in your database:

```sql
UPDATE orders 
SET status = 'EXPIRED'
WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
  AND bill_expires_at < CURRENT_TIMESTAMP;
```
WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
  AND bill_expires_at < CURRENT_TIMESTAMP;
```

### Option 4: Run TypeScript Script
If you have ts-node installed:

```bash
cd CMS
npx ts-node scripts/expire-old-orders.ts
```

## Verify the Fix

After running any of the above options, verify the order is expired:

```sql
SELECT id, status, bill_expires_at, updated_at
FROM orders
WHERE id = '365d58c0-cfd1-4ab6-a31b-bd3e8f6c63e8';
```

**Expected Result**:
- status: `EXPIRED`
- updated_at: Recent timestamp

## Check Order History

After expiring the order, it should appear in the user's order history:

1. Log in as the user
2. Go to Order History page
3. The expired order should now be visible with status "Expired"

## Prevent Future Issues

The automatic expiration system is now in place:

1. **Background Service**: Checks every 60 seconds (runs automatically with server)
2. **On-Demand Check**: Runs when viewing order history
3. **Frontend Timer**: Expires order when countdown reaches 0:00

**No manual intervention needed going forward!**

## Troubleshooting

### Orders still not expiring?
1. Check if server is running
2. Check server logs for errors
3. Verify database connection
4. Run the SQL script manually

### Order expired but not in history?
The order history only shows DELIVERED and EXPIRED orders. If the order is EXPIRED, it should appear. Try:
1. Refresh the page
2. Log out and log back in
3. Check the database directly:
```sql
SELECT * FROM orders WHERE status IN ('DELIVERED', 'EXPIRED') AND user_id = 'YOUR_USER_ID';
```

## Quick Fix for Your Specific Order

Run this query right now:

```sql
UPDATE orders 
SET status = 'EXPIRED'
WHERE id = '365d58c0-cfd1-4ab6-a31b-bd3e8f6c63e8';
```

Then refresh the order history page.

## Summary

**Immediate Fix**: Run the SQL query above
**Long-term Solution**: Already implemented (background service)
**Verification**: Check order history page

The system is now fully automated and will handle all future expirations automatically!
