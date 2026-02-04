# QR Verification Troubleshooting Guide

## Issue: QR Code Scan Not Marking Order as Delivered

### How the System Works

There are **TWO** independent verification methods:

#### Method 1: QR Code Scanning (Original)
- **What it uses:** `validationToken` (UUID format)
- **Where:** QR Scanner page (`/vendor/qr-scanner`)
- **API Endpoint:** `POST /orders/verify-qr`
- **How it works:**
  1. Customer shows QR code on digital bill
  2. Vendor scans with QR Scanner
  3. System extracts `validationToken` from QR
  4. Calls `/orders/verify-qr` with token
  5. Order marked as delivered

#### Method 2: Manual Code Entry (NEW)
- **What it uses:** `validationCode` (6-character alphanumeric)
- **Where:** Active Orders page - input field on READY orders
- **API Endpoint:** `POST /orders/:orderId/verify-code`
- **How it works:**
  1. Customer shows 6-digit code to vendor
  2. Vendor types code in Active Orders page
  3. Calls `/orders/:orderId/verify-code` with code
  4. Order marked as delivered

## Troubleshooting Steps

### Step 1: Check Database Migration
Run the migration to add validation_code column:
```bash
npm run ts-node scripts/add-validation-code.ts
```

### Step 2: Verify Backend is Running
Check that the server restarted after code changes:
```bash
# Stop and restart the server
npm run dev
```

### Step 3: Test QR Verification Endpoint
```bash
# Test the verify-qr endpoint
curl -X POST http://localhost:3000/api/orders/verify-qr \
  -H "Content-Type: application/json" \
  -d '{"validationToken":"<token-from-qr>"}'
```

### Step 4: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try scanning QR code
4. Look for errors in console
5. Check Network tab for failed requests

### Step 5: Verify QR Code Data
The QR code should contain JSON with this structure:
```json
{
  "orderId": "uuid",
  "validationToken": "uuid",
  "validationCode": "ABC123",
  "userId": "uuid",
  "vendorId": "uuid",
  "timestamp": "ISO date"
}
```

### Step 6: Check Order Status
Make sure the order is in READY status before scanning:
- PENDING → Cannot scan yet
- PREPARING → Cannot scan yet
- READY → Can scan ✓
- DELIVERED → Already delivered
- EXPIRED → Cannot scan

### Step 7: Test Manual Code Entry
Instead of QR scanning, try the manual code entry:
1. Go to Active Orders page
2. Find a READY order
3. Look at the customer's digital bill for the 6-character code
4. Enter the code in the input field
5. Click "Verify"

## Common Issues

### Issue: "Invalid QR code or order not found"
**Cause:** validationToken doesn't match any order
**Solution:** 
- Check that order exists in database
- Verify QR code contains correct validationToken
- Make sure order hasn't been deleted

### Issue: "Order already delivered"
**Cause:** Order status is already DELIVERED
**Solution:** This is expected - order was already completed

### Issue: "Bill has expired"
**Cause:** More than 15 minutes passed since order creation
**Solution:** 
- Order cannot be verified after expiration
- Customer needs to contact support

### Issue: QR Scanner shows blank screen
**Cause:** Camera permissions not granted
**Solution:**
- Grant camera permissions in browser
- Use manual code entry instead

### Issue: "Invalid validation code"
**Cause:** Entered code doesn't match order's validation code
**Solution:**
- Double-check the code on customer's bill
- Code is case-insensitive
- Make sure entering exactly 6 characters

## Debug Mode

### Enable Detailed Logging
Add console logs to track the flow:

**Frontend (QRScannerEnhanced.tsx):**
```typescript
const verifyOrder = async (validationToken: string) => {
    console.log('Verifying with token:', validationToken)
    // ... rest of code
}
```

**Backend (OrderService.ts):**
```typescript
async verifyByToken(validationToken: string): Promise<any> {
    console.log('Received validation token:', validationToken)
    const order = await this.orderModel.findByValidationToken(validationToken)
    console.log('Found order:', order?.id)
    // ... rest of code
}
```

## Testing Checklist

- [ ] Database migration completed
- [ ] Backend server restarted
- [ ] New order created (after migration)
- [ ] Order shows validation code on digital bill
- [ ] Order status is READY
- [ ] QR Scanner page loads without errors
- [ ] Camera permissions granted
- [ ] QR code scans successfully
- [ ] Order marked as DELIVERED
- [ ] WebSocket updates Active Orders list

## Quick Test

1. **Create a test order:**
   - Login as user
   - Add items to cart
   - Complete payment
   - Go to digital bill

2. **Verify validation code shows:**
   - Should see 6-character code below QR
   - Code should be in large, bold text

3. **Test manual verification:**
   - Login as vendor
   - Go to Active Orders
   - Mark order as READY
   - Enter the 6-character code
   - Click Verify
   - Order should be marked DELIVERED

4. **Test QR verification:**
   - Create another order
   - Mark as READY
   - Click "Open QR Scanner"
   - Scan the QR code
   - Order should be marked DELIVERED

## Still Not Working?

Check these files for any syntax errors:
- `src/models/Order.ts`
- `src/services/order/OrderService.ts`
- `src/routes/order.routes.ts`
- `client/src/pages/vendor/QRScannerEnhanced.tsx`
- `client/src/pages/vendor/ActiveOrders.tsx`

Run TypeScript compiler to check for errors:
```bash
npm run build
```

Check database for validation_code column:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('validation_code', 'verified_at');
```
