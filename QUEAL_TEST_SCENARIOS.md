# Queal Test Scenarios - Coverage Report

## ✅ ALREADY WORKING

### 1. Valid order with quantity and canteen
- ✅ "Order 3 tea from main canteen"
- Shows product options if multiple
- Adds to cart
- Shows total and asks for payment confirmation

### 2. Confirm payment
- ✅ "Yes, proceed" / "yes" / "proceed with payment"
- Processes payment
- Creates order
- Shows order ID

### 4. Order without canteen
- ✅ "Order 2 tea"
- Shows canteens where tea is available
- Asks which canteen to order from

### 6. Item not available in selected canteen
- ✅ "Order pizza from main canteen"
- Shows: "pizza is not available in Main Canteen"
- Suggests showing menu

### 8. Canteen does not exist
- ✅ "Order tea from xyz canteen"
- Shows: "xyz canteen does not exist"
- Lists available canteens

### 9. Multiple products match
- ✅ "Order coffee from main canteen"
- Shows: "I found multiple options for coffee"
- Lists Cold Coffee, Filter Coffee with prices

### 10. Insufficient wallet balance
- ✅ Checks balance before payment
- Shows: "You have ₹X but need ₹Y. Add ₹Z"

### 11. Wallet balance sufficient
- ✅ Deducts from wallet
- Creates order successfully

### 12. Show menu (no canteen)
- ✅ "Show menu"
- Lists all available canteens
- Asks which canteen's menu to see

### 13. Show menu for specific canteen
- ✅ "What's available in main canteen?"
- Shows products from that canteen

### 15. User not logged in
- ✅ Authentication middleware handles this
- Returns 401 error

### 16. User account not linked to institution
- ✅ Checks institution_id
- Shows: "Your account is not linked to an institution"

## ❌ NEEDS IMPLEMENTATION

### 3. Order without quantity
- ❌ "Order tea from main canteen"
- Should ask: "How many cups of tea would you like?"
- Currently defaults to 1

### 5. Order multiple items
- ❌ "Order 2 tea and 1 samosa from main canteen"
- Should recognize multiple items
- Currently only recognizes first item

### 7. Item does not exist at all
- ⚠️ Partially working
- Shows generic "not found" message
- Should be more specific

### 14. Popular items
- ❌ "What are popular items?"
- Not implemented
- Should show most ordered items

### 17. Cannot understand request
- ⚠️ Partially working
- Returns "unknown" intent
- Message could be better

### 18. Cancel order
- ❌ "Cancel the order"
- Not implemented
- Should clear cart

### 19. Show bill
- ⚠️ Partially working
- Navigates to /digital-bill
- Should show latest bill

### 20. Greetings
- ⚠️ Returns unknown intent
- Should respond friendly

## IMPLEMENTATION PRIORITY

### HIGH PRIORITY (Must Have)
1. ✅ Order without quantity → Ask for quantity
2. ✅ Order multiple items → Parse multiple items
3. ✅ Cancel order → Clear cart
4. ✅ Better greetings → Friendly responses

### MEDIUM PRIORITY (Nice to Have)
5. Popular items query
6. Better "cannot understand" messages

### LOW PRIORITY (Future Enhancement)
7. Order history queries
8. Modify existing order
9. Reorder previous order

## Next Steps
Implement HIGH PRIORITY items first.
