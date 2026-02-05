# Test Conversation Flow

## Quick Test Script

Test the conversation flow fix with these scenarios:

---

## Scenario 1: Order Without Canteen ✅

### Step 1
```
You: "Order 2 tea"
```
**Expected:** Lists canteens that have tea, asks which one

### Step 2
```
You: "main canteen"
```
**Expected:** ✅ Adds 2 tea from Main Canteen to cart

---

## Scenario 2: Order Coffee Without Canteen ✅

### Step 1
```
You: "Order coffee"
```
**Expected:** Lists canteens that have coffee

### Step 2
```
You: "cafeteria"
```
**Expected:** ✅ Adds 1 coffee from Cafeteria to cart

---

## Scenario 3: Complete Order (No Context Needed) ✅

```
You: "Order 2 tea from main canteen"
```
**Expected:** ✅ Directly adds to cart without asking

---

## Scenario 4: Multiple Items Without Canteen ✅

### Step 1
```
You: "Order 2 samosa"
```
**Expected:** Lists canteens, asks which one

### Step 2
```
You: "main canteen"
```
**Expected:** ✅ Adds 2 samosa from Main Canteen

---

## Scenario 5: Context Cleared After Order ✅

### Step 1
```
You: "Order tea"
```
**Expected:** Asks for canteen

### Step 2
```
You: "main canteen"
```
**Expected:** ✅ Adds tea to cart

### Step 3
```
You: "main canteen"
```
**Expected:** Shows "unknown" message (context cleared)

---

## What Should Work Now

✅ **Conversation Flow** - AI remembers context
✅ **Canteen Selection** - Can reply with just canteen name
✅ **Context Clearing** - Context cleared after successful order
✅ **Multiple Orders** - Each order starts fresh
✅ **Natural Language** - More human-like interaction

---

## What Should NOT Work (Expected Behavior)

❌ **Random Canteen Name** - If you say canteen name without context
   - Expected: Shows "unknown" message
   - This is correct behavior

❌ **Wrong Canteen Name** - If you say non-existent canteen
   - Expected: Shows "canteen doesn't exist" message
   - This is correct behavior

---

## How to Test

1. Start backend: `cd CMS && npm run dev`
2. Start frontend: `cd CMS/client && npm run dev`
3. Login as student
4. Click "Queal" button
5. Try the scenarios above

---

## Success Criteria

All scenarios should work as expected. The key test is:

```
User: "Order 2 tea"
Queal: "Tea is available in these canteens... Which one?"
User: "main canteen"
Queal: "Added 2x Tea from Main Canteen" ✅
```

If this works, the conversation flow is fixed!

---

**Status:** Ready for Testing
