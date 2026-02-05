# Queal AI Assistant - Complete Test Script

## 🎯 Test All 25+ Scenarios

Copy and paste these commands into Queal to test all features.

---

## Setup

1. Start backend: `cd CMS && npm run dev`
2. Start frontend: `cd CMS/client && npm run dev`
3. Login: student@example.com / password123
4. Click purple "Queal" button

---

## Test Script

### 1. Greeting Test
```
Hello
```
**Expected:** Friendly welcome message

---

### 2. Basic Order Test
```
Order 2 tea from main canteen
```
**Expected:** Adds 2 tea to cart, shows total

---

### 3. Cart Query Test
```
What's in my cart?
```
**Expected:** Shows cart with 2 tea items

---

### 4. Total Query Test
```
How much do I need to pay?
```
**Expected:** Shows total amount

---

### 5. Wallet Balance Test
```
What's my wallet balance?
```
**Expected:** Shows current wallet balance

---

### 6. Add More Items Test
```
Order 1 samosa from main canteen
```
**Expected:** Adds samosa, shows updated cart total

---

### 7. Cart Summary Test
```
What's in my cart?
```
**Expected:** Shows 2 tea + 1 samosa

---

### 8. Menu Query Test
```
Show menu
```
**Expected:** Lists available canteens

---

### 9. Specific Menu Test
```
What's available in main canteen?
```
**Expected:** Shows main canteen menu items

---

### 10. Canteen Conflict Test
```
Order coffee from food court
```
**Expected:** Prevents order, explains canteen restriction

---

### 11. Clear Cart Test
```
Clear my cart
```
**Expected:** Asks for confirmation

---

### 12. Confirm Clear Test
```
Yes, clear cart
```
**Expected:** Clears cart

---

### 13. Order Without Canteen Test
```
Order 2 tea
```
**Expected:** Asks which canteen

---

### 14. Product Availability Test
```
Order 2 coffee
```
**Expected:** Shows which canteens have coffee

---

### 15. Specify Canteen Test
```
Order 2 coffee from main canteen
```
**Expected:** Adds coffee to cart

---

### 16. Non-Existent Product Test
```
Order sushi from main canteen
```
**Expected:** Says product not available, suggests menu

---

### 17. Non-Existent Canteen Test
```
Order tea from boys hostel canteen
```
**Expected:** Says canteen doesn't exist, shows available canteens

---

### 18. Multiple Products Match Test
```
Order dosa from main canteen
```
**Expected:** If multiple dosa types exist, asks for clarification

---

### 19. Empty Cart Payment Test
```
Clear my cart
Yes, clear cart
Proceed with payment
```
**Expected:** Says cart is empty

---

### 20. Thanks Test
```
Thanks
```
**Expected:** Friendly acknowledgment

---

### 21. Goodbye Test
```
Bye
```
**Expected:** Farewell message

---

### 22. Unknown Command Test
```
I want something nice
```
**Expected:** Asks for clarification, shows help

---

### 23. Full Order Flow Test
```
Order 2 tea from main canteen
Order 1 samosa from main canteen
What's in my cart?
How much do I need to pay?
Yes, proceed
```
**Expected:** Complete order flow with payment

---

### 24. Wallet Insufficient Balance Test
(Only if wallet balance < order total)
```
Order 100 tea from main canteen
Yes, proceed
```
**Expected:** Says insufficient balance

---

### 25. View Bill Test
```
Show my bill
```
**Expected:** Opens bill page or shows bill info

---

## Quick Test Checklist

- [ ] Greetings work (Hello, Thanks, Bye)
- [ ] Basic ordering works
- [ ] Cart queries work
- [ ] Total queries work
- [ ] Wallet balance queries work
- [ ] Menu queries work
- [ ] Canteen conflict detection works
- [ ] Clear cart works
- [ ] Product not found handled
- [ ] Canteen not found handled
- [ ] Multiple canteens handled
- [ ] Empty cart payment prevented
- [ ] Unknown commands handled gracefully

---

## Expected Behavior Summary

### ✅ Should Work
- Natural language order processing
- Cart summary queries
- Total amount queries
- Wallet balance queries
- Menu queries
- Canteen validation
- Product search
- Cart conflict detection
- Clear cart with confirmation
- Friendly greetings/goodbyes
- Error messages with suggestions

### ❌ Known Limitations
- Cannot update quantity of existing item
- Cannot remove specific item (only clear all)
- Cannot query order status
- No recommendations
- Basic keyword matching (not ML-based)

---

## Troubleshooting

### If Queal doesn't respond:
1. Check backend is running (port 5000)
2. Check frontend is running (port 5173)
3. Check browser console for errors (F12)
4. Check backend logs for errors

### If "User not found" error:
1. Make sure you're logged in
2. Check user has institution_id
3. Run: `cd CMS && node scripts/check-current-user.ts`

### If cart doesn't update:
1. Check browser console
2. Verify cart store is working
3. Check localStorage for cart data

---

## Success Criteria

All tests should pass with appropriate responses. Queal should:
- Understand natural language
- Provide helpful responses
- Handle errors gracefully
- Guide users through ordering
- Prevent invalid operations
- Show clear error messages

---

## Report Issues

If any test fails, note:
1. What command you typed
2. What you expected
3. What actually happened
4. Any error messages in console

---

**Happy Testing!** 🚀
