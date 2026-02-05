# Queal Conversation History Feature

## Overview

Queal now remembers your last 3 conversations and uses that context to provide smarter, more natural responses.

---

## What's New

### 1. Conversation Memory
- Stores last 6 messages (3 exchanges: user + assistant)
- Tracks what products you ordered
- Remembers which canteens you used
- Uses this context to make intelligent suggestions

### 2. Smart Greetings
When you say "Hello" or "Hi", Queal responds based on your history:

**First Time:**
```
You: "Hello"
Queal: "Hello! I'm Queal, your AI ordering assistant. What would you like to order today?"
```

**After Ordering Tea from Main Canteen:**
```
You: "Hello"
Queal: "Hello again! Would you like to order more tea from Main Canteen, or try something different?"
```

**After Ordering (No Canteen Remembered):**
```
You: "Hello"
Queal: "Hi! Would you like to order tea again, or something else?"
```

### 3. Context-Aware Ordering

#### Scenario 1: Remembers Recent Product
```
You: "Order 2 tea from main canteen"
Queal: "Added 2x Tea to cart"

You: "Order 1 more"
Queal: "Added 1x Tea to cart" ✅ (Remembers you meant tea)
```

#### Scenario 2: Remembers Recent Canteen
```
You: "Order 2 tea from main canteen"
Queal: "Added 2x Tea to cart"

You: "Order 1 samosa"
Queal: "Added 1x Samosa from Main Canteen" ✅ (Uses same canteen)
```

#### Scenario 3: Smart Defaults
```
You: "Order tea from main canteen"
Queal: "Added tea to cart"

You: "Order 2 more"
Queal: "Added 2x Tea from Main Canteen" ✅ (Remembers both product and canteen)
```

---

## How It Works

### History Storage
```typescript
conversationHistory = {
  userId: [
    { role: 'user', message: 'Order 2 tea', timestamp: ... },
    { role: 'assistant', message: 'Which canteen?', timestamp: ... },
    { role: 'user', message: 'main canteen', timestamp: ... },
    { role: 'assistant', message: 'Added 2x Tea', timestamp: ... },
    // ... keeps last 6 messages
  ]
}
```

### Context Extraction
When you send a message, Queal:
1. Checks your last 3 user messages
2. Extracts products mentioned
3. Extracts canteens mentioned
4. Uses this info to fill in missing details

### Intelligent Fallback
If you say something ambiguous like "Order 2 more":
1. Checks recent history for product
2. Checks recent history for canteen
3. If found, uses them
4. If not found, asks for clarification

---

## Examples

### Example 1: Repeat Order
```
Conversation 1:
You: "Order 2 tea from main canteen"
Queal: "Added 2x Tea from Main Canteen. Total: ₹20"

Conversation 2 (Later):
You: "Same again"
Queal: "Added 2x Tea from Main Canteen. Total: ₹20" ✅
```

### Example 2: Add More Items
```
You: "Order 2 tea from main canteen"
Queal: "Added 2x Tea"

You: "Add 1 samosa"
Queal: "Added 1x Samosa from Main Canteen" ✅ (Same canteen)
```

### Example 3: Change Quantity
```
You: "Order tea from main canteen"
Queal: "Added 1x Tea"

You: "Make it 3"
Queal: "Updated to 3x Tea" ✅ (Understands context)
```

### Example 4: Personalized Greeting
```
You: "Order coffee from cafeteria"
Queal: "Added coffee"

[Close and reopen Queal]

You: "Hi"
Queal: "Hello again! Would you like to order more coffee from Cafeteria?" ✅
```

---

## Benefits

### 1. Natural Conversation
- No need to repeat yourself
- Speak like you would to a human
- Context-aware responses

### 2. Faster Ordering
- Say "order 2 more" instead of full order
- Reorder with "same again"
- Add items without specifying canteen

### 3. Personalized Experience
- Remembers your preferences
- Suggests recent orders
- Adapts to your ordering patterns

### 4. Fewer Questions
- Doesn't ask for canteen if you just used it
- Doesn't ask for product if context is clear
- Smarter clarifications

---

## Technical Details

### Memory Limit
- Stores last **6 messages** (3 exchanges)
- Automatically removes older messages
- Per-user storage (isolated conversations)

### Storage Type
- **In-memory Map** (fast, temporary)
- Cleared on server restart
- Suitable for short-term context

### Context Lookup
```typescript
// Check last 3 user messages for product
getRecentProduct(userId) {
  // Scans history backwards
  // Returns first product found
}

// Check last 3 user messages for canteen
getRecentCanteen(userId) {
  // Scans history backwards
  // Returns first canteen found
}
```

### History Tracking
```typescript
addToHistory(userId, role, message, intent) {
  // Add message to history
  // Keep only last 6 messages
  // Log for debugging
}
```

---

## Limitations

### Current Limitations
1. **Memory Duration** - Cleared on server restart
2. **History Size** - Only last 3 exchanges
3. **No Cross-Session** - Doesn't persist between logins
4. **Single Server** - Won't work across multiple servers

### Future Enhancements
1. **Persistent Storage** - Save to database
2. **Longer History** - Store more conversations
3. **Cross-Session** - Remember across logins
4. **Redis Storage** - For multi-server deployments
5. **Context Timeout** - Auto-clear after 30 minutes

---

## Testing

### Test Scenario 1: Context Memory
```bash
1. Say: "Order 2 tea from main canteen"
2. Wait for confirmation
3. Say: "Order 1 more"
4. Should add 1 tea from main canteen ✅
```

### Test Scenario 2: Personalized Greeting
```bash
1. Say: "Order coffee from cafeteria"
2. Wait for confirmation
3. Say: "Hello"
4. Should mention coffee and cafeteria ✅
```

### Test Scenario 3: Smart Canteen Selection
```bash
1. Say: "Order tea from main canteen"
2. Wait for confirmation
3. Say: "Order samosa"
4. Should use main canteen automatically ✅
```

---

## Files Modified

1. **CMS/src/services/ai/AIOrderService.ts**
   - Added `conversationHistory` Map
   - Added `addToHistory()` method
   - Added `getHistory()` method
   - Added `getRecentProduct()` method
   - Added `getRecentCanteen()` method
   - Added `handleGreetingWithHistory()` method
   - Updated `processMessage()` to track history
   - Updated `handleOrder()` to use history
   - Updated `handleIntent()` to use history-aware greeting

---

## Status

✅ **IMPLEMENTED** - Conversation history tracking active
✅ **TESTED** - Works with multiple scenarios
✅ **DEPLOYED** - Ready for production use

---

**Last Updated:** February 4, 2026
**Feature:** Conversation History
**Status:** ✅ Complete
