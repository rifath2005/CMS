# Automatic Order Expiration - COMPLETE ✅

## Problem
Orders that passed their `bill_expires_at` time remained in PENDING status instead of automatically changing to EXPIRED. This caused:
- Orders not appearing in order history
- Vendors still seeing expired orders as active
- Database inconsistency

## Solution Implemented

### 1. Background Service (Automatic - Every 60 Seconds)

**File**: `CMS/src/services/order/OrderExpirationService.ts`

A background service that runs continuously and checks for expired orders every 60 seconds.

**Features**:
- Starts automatically when server starts
- Checks every 60 seconds for orders past their expiration time
- Updates status from PENDING/PREPARING/READY → EXPIRED
- Logs each expired order to console
- Gracefully stops when server shuts down

**SQL Query**:
```sql
UPDATE orders 
SET status = 'EXPIRED'
WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
  AND bill_expires_at < CURRENT_TIMESTAMP
```

**Note**: The `orders` table doesn't have an `updated_at` column, so we only update the status.

**Integration**: Added to `CMS/src/index.ts`
```typescript
// Initialize and start Order Expiration Service
orderExpirationService = new OrderExpirationService(pool);
orderExpirationService.start();
```

### 2. On-Demand Check (When Viewing Order History)

**File**: `CMS/src/services/order/OrderHistoryService.ts`

The `getUserOrderHistory()` method calls `updateExpiredOrders()` before fetching orders, ensuring the order history is always up-to-date.

```typescript
async getUserOrderHistory(userId: string, filter?: OrderHistoryFilter) {
    // First, update expired orders
    await this.updateExpiredOrders();
    
    // Then fetch history (only DELIVERED and EXPIRED orders)
    // ...
}
```

### 3. Manual Script (Immediate Fix)

**Files**: 
- `CMS/scripts/expire-old-orders.ts`
- `CMS/scripts/expire-old-orders.bat`

A manual script to immediately expire all old orders that have passed their expiration time.

**Usage**:
```bash
# Windows
cd CMS
scripts\expire-old-orders.bat

# Or directly with ts-node
npx ts-node scripts/expire-old-orders.ts
```

**Output Example**:
```
🔍 Checking for expired orders...

Found 3 order(s) that need to be expired:

1. Order ID: 365d58c0-cfd1-4ab6-a31b-bd3e8f6c63e8
   Status: PENDING
   Created: 2026-02-02 15:13:38
   Expired at: 2026-02-02 21:13:38
   Overdue by: 45 minutes

✅ Successfully expired 3 order(s)!

1. Order 365d58c0-cfd1-4ab6-a31b-bd3e8f6c63e8 → Status: EXPIRED

✓ All expired orders have been updated in the database.
✓ These orders will now appear in the order history.
```

### 4. Frontend Timer Expiration

**File**: `CMS/client/src/pages/user/DigitalBill.tsx`

When the countdown timer reaches 0:00, the frontend also calls the backend to mark the order as expired:

```typescript
const handleExpire = async () => {
    setIsExpired(true)
    setCanLeave(true)
    
    if (bill && orderId) {
        setBill({ ...bill, isValid: false })
        await orderService.markOrderAsExpired(orderId)
    }
}
```

**Backend Endpoint**: `POST /api/v1/orders/:orderId/expire`

## How It Works

### Scenario 1: User is on Digital Bill Page
1. Timer counts down from 15:00 to 0:00
2. When timer reaches 0:00, `handleExpire()` is called
3. Frontend calls `POST /orders/:orderId/expire`
4. Backend updates order status to EXPIRED
5. User can now leave the page
6. Order appears in order history

### Scenario 2: User Closes Browser Before Timer Expires
1. Order remains in PENDING status
2. Background service checks every 60 seconds
3. When `bill_expires_at < CURRENT_TIMESTAMP`, order is automatically expired
4. Next time user opens order history, order appears as EXPIRED

### Scenario 3: Server Was Down During Expiration Time
1. Orders remain in PENDING status while server is down
2. When server restarts, background service starts immediately
3. First check expires all overdue orders
4. Orders are updated to EXPIRED status

### Scenario 4: Manual Fix Needed
1. Run `scripts\expire-old-orders.bat`
2. Script finds all overdue orders
3. Updates them to EXPIRED immediately
4. Shows detailed report of what was updated

## Order Status Flow

```
PENDING → (15 minutes) → EXPIRED
   ↓
PREPARING → (vendor action) → READY → (vendor action) → DELIVERED
   ↓
EXPIRED (if time runs out)
```

**Rules**:
- Orders in PENDING, PREPARING, or READY can become EXPIRED
- Orders in DELIVERED, EXPIRED, or CANCELLED cannot change status
- Only DELIVERED and EXPIRED orders appear in order history

## Configuration

### Expiration Time
**Default**: 15 minutes from payment time

**Set in**: `CMS/src/services/order/WalletOrderService.ts`
```typescript
const billExpiresAt = new Date(billGeneratedAt.getTime() + 15 * 60 * 1000); // 15 minutes
```

### Background Check Interval
**Default**: 60 seconds (1 minute)

**Set in**: `CMS/src/services/order/OrderExpirationService.ts`
```typescript
private readonly CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds
```

**To change**: Modify the `CHECK_INTERVAL` value
- 30 seconds: `30 * 1000`
- 2 minutes: `2 * 60 * 1000`
- 5 minutes: `5 * 60 * 1000`

## Testing

### Test Automatic Expiration
1. Create an order
2. Wait 15 minutes (or modify expiration time to 1 minute for testing)
3. Check server logs - should see: `✓ Expired 1 order(s) automatically`
4. Check order history - order should appear as EXPIRED

### Test Manual Script
1. Create orders and wait for them to expire
2. Run `scripts\expire-old-orders.bat`
3. Verify orders are updated in database
4. Check order history

### Test Frontend Timer
1. Create an order
2. Stay on digital bill page
3. Wait for timer to reach 0:00
4. Verify order status changes to EXPIRED
5. Verify you can now leave the page

## Server Logs

When the service is working, you'll see logs like:

**On Server Start**:
```
✓ Order expiration service started (checking every 60 seconds)
```

**When Orders Expire**:
```
✓ Expired 2 order(s) automatically
  - Order 365d58c0-cfd1-4ab6-a31b-bd3e8f6c63e8 expired (was due at 2026-02-02 21:13:38)
  - Order 76d3fc3b-622d-4dfb-bc58-59f3b2c2f67e expired (was due at 2026-02-02 21:20:15)
```

**On Server Shutdown**:
```
Order expiration service stopped
```

## Database Query to Check Expired Orders

```sql
-- Find orders that should be expired but aren't
SELECT 
    id, 
    status, 
    bill_expires_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - bill_expires_at)) / 60 as minutes_overdue
FROM orders 
WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
  AND bill_expires_at < CURRENT_TIMESTAMP
ORDER BY bill_expires_at ASC;

-- Manually expire them
UPDATE orders 
SET status = 'EXPIRED', 
    updated_at = CURRENT_TIMESTAMP
WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
  AND bill_expires_at < CURRENT_TIMESTAMP;
```

## Files Modified/Created

### Created
1. `CMS/src/services/order/OrderExpirationService.ts` - Background service
2. `CMS/scripts/expire-old-orders.ts` - Manual expiration script
3. `CMS/scripts/expire-old-orders.bat` - Windows batch file
4. `CMS/AUTOMATIC_ORDER_EXPIRATION_COMPLETE.md` - This documentation

### Modified
1. `CMS/src/index.ts` - Added service initialization
2. `CMS/src/services/order/OrderHistoryService.ts` - Already had updateExpiredOrders()

## Status: ✅ COMPLETE

All requirements met:
- ✅ Orders automatically expire when time is up
- ✅ Background service checks every 60 seconds
- ✅ Expired orders update in database
- ✅ Expired orders appear in order history
- ✅ Orders cannot be changed after EXPIRED
- ✅ Manual script available for immediate fixes
- ✅ Frontend timer also triggers expiration
- ✅ Server logs show expiration activity

## Quick Fix for Your Current Issue

To immediately fix the order you mentioned (365d58c0-cfd1-4ab6-a31b-bd3e8f6c63e8):

**Option 1: Run the script**
```bash
cd CMS
scripts\expire-old-orders.bat
```

**Option 2: Direct SQL**
```sql
UPDATE orders 
SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
WHERE id = '365d58c0-cfd1-4ab6-a31b-bd3e8f6c63e8';
```

**Option 3: Restart the server**
The background service will expire it within 60 seconds of server start.
