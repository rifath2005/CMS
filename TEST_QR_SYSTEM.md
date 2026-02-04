# Quick Test: QR Verification System

## Before Testing

### 1. Run Database Migration
```bash
cd /path/to/project
npm run ts-node scripts/add-validation-code.ts
```

Expected output:
```
Adding validation_code and verified_at columns to orders table...
✓ Columns added successfully
Creating index on validation_code...
✓ Index created successfully
Generating validation codes for existing orders...
✓ Generated validation codes for X orders
✅ Migration completed successfully!
```

### 2. Restart Backend Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Restart Frontend (if needed)
```bash
cd client
npm run dev
```

## Test Scenario 1: Manual Code Verification

### Steps:
1. **As User:**
   - Login as a regular user
   - Browse products and add to cart
   - Complete payment with wallet
   - Navigate to digital bill
   - **Verify:** You should see a 6-character code displayed prominently below the QR code
   - Note down this code (e.g., "ABC123")

2. **As Vendor:**
   - Login as vendor
   - Go to "Active Orders" page
   - Find the order you just created
   - Click "Start Preparing" → "Mark Ready"
   - **Verify:** You should see a validation code input field
   - Enter the 6-character code from the customer's bill
   - Click "Verify"
   - **Expected:** Order should be marked as DELIVERED
   - **Expected:** Order should disappear from Active Orders
   - **Expected:** Customer's digital bill should show "Order Delivered!"

## Test Scenario 2: QR Code Scanning

### Steps:
1. **As User:**
   - Create another order (same as above)
   - Go to digital bill
   - Keep the QR code visible on screen

2. **As Vendor:**
   - Login as vendor
   - Go to "Active Orders"
   - Mark order as READY
   - Click "Open QR Scanner" button
   - Click "Use Camera" or use "Manual Entry"
   - If using camera: Point at the QR code on customer's screen
   - If using manual: Copy the validation token from QR data
   - **Expected:** Order verified and marked as DELIVERED

## What to Check if It Doesn't Work

### Check 1: Validation Code Exists
```sql
-- Connect to your database and run:
SELECT id, validation_code, status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

Expected: All orders should have a validation_code value

### Check 2: API Endpoint Works
```bash
# Get an order ID from your database
ORDER_ID="your-order-id-here"

# Test the verify-code endpoint
curl -X POST http://localhost:3000/api/orders/$ORDER_ID/verify-code \
  -H "Content-Type: application/json" \
  -d '{"validationCode":"ABC123"}'
```

Expected response:
```json
{
  "success": true,
  "data": { ... order data ... },
  "message": "Order verified and marked as delivered"
}
```

### Check 3: Frontend Console
Open browser DevTools (F12) and check for errors:
- Red errors in Console tab
- Failed network requests in Network tab
- Check the request payload and response

### Check 4: Backend Logs
Check your backend terminal for errors when you try to verify

## Common Problems & Solutions

### Problem: "validation_code column doesn't exist"
**Solution:** Run the migration script again
```bash
npm run ts-node scripts/add-validation-code.ts
```

### Problem: Validation code not showing on digital bill
**Solution:** 
- Clear browser cache
- Create a NEW order (old orders might not have codes)
- Check that `bill.validationCode` has a value in browser console

### Problem: "Invalid validation code" error
**Solution:**
- Make sure you're entering the EXACT code from the bill
- Code is case-insensitive but must be 6 characters
- Check that the order hasn't expired

### Problem: Button says "Open QR Scanner" but nothing happens
**Solution:**
- Check browser console for navigation errors
- Verify the route `/vendor/qr-scanner` exists
- Check that you imported `useNavigate` from react-router-dom

## Success Criteria

✅ Database has validation_code column
✅ New orders generate validation codes automatically
✅ Validation codes display on digital bill (large, bold text)
✅ Vendor can enter code in Active Orders page
✅ Entering correct code marks order as DELIVERED
✅ Entering wrong code shows error message
✅ QR Scanner still works for scanning QR codes
✅ WebSocket updates order status in real-time

## Next Steps After Testing

If everything works:
1. Test with multiple orders
2. Test expired orders (wait 15 minutes)
3. Test with different vendors
4. Test error cases (wrong code, already delivered, etc.)

If something doesn't work:
1. Check the troubleshooting guide: `QR_VERIFICATION_TROUBLESHOOTING.md`
2. Review the implementation guide: `VALIDATION_CODE_IMPLEMENTATION.md`
3. Check for TypeScript/compilation errors
4. Verify all files were saved and server restarted
