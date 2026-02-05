# AI Assistant Integration

## Overview
The AI Assistant allows users to order food using natural language commands. It processes user messages, identifies products, adds them to cart, processes payments, and generates bills automatically.

## Features

### 1. Natural Language Processing
- **Order Recognition**: Understands commands like "Order 3 tea from main canteen"
- **Product Extraction**: Identifies food items from user messages
- **Quantity Detection**: Extracts quantities from text
- **Canteen Selection**: Recognizes canteen names

### 2. Supported Commands

#### Ordering
- "Order 2 tea from main canteen"
- "I want 3 samosas"
- "Get me a coffee"
- "Buy 2 dosas from food court"

#### Queries
- "Show me today's menu"
- "What are the popular items?"
- "What's available in main canteen?"

#### Payment & Bill
- "Yes, proceed with payment" (after order confirmation)
- "Show my bill"
- "View digital bill"

### 3. Workflow

```
User: "Order 3 tea from main canteen"
  ↓
AI: Searches database for "tea" in "main canteen"
  ↓
AI: Adds 3x Tea to cart
  ↓
AI: "I've added 3x Tea to your cart. Total: ₹30. Proceed with payment?"
  ↓
User: "Yes"
  ↓
AI: Processes payment from wallet
  ↓
AI: Creates order & generates bill
  ↓
AI: "Order placed! Order ID: #ABC12345. View bill?"
```

## Implementation Details

### Frontend Component
**File**: `CMS/client/src/components/AIAssistant.tsx`

Features:
- Beautiful chat interface with gradient design
- Message history
- Quick action buttons
- Real-time processing indicators
- Responsive mobile design

### Backend Service
**File**: `CMS/src/services/ai/AIOrderService.ts`

Functions:
- `processMessage()`: Parses user input and extracts intent
- `extractQuantity()`: Finds numbers in text
- `extractProductNames()`: Identifies food items
- `extractCanteen()`: Detects canteen names
- `searchProducts()`: Queries database for matching products
- `completeOrder()`: Processes payment and creates order

### API Routes
**File**: `CMS/src/routes/ai.routes.ts`

Endpoints:
- `POST /api/v1/ai/process-order`: Process user message
- `POST /api/v1/ai/complete-order`: Complete order with payment

## Supported Food Items

The AI recognizes these common food items:
- Beverages: tea, coffee, juice, water, cold drink, coke, pepsi, sprite
- Snacks: samosa, vada, pakora, cutlet, chips, biscuit
- Main Course: dosa, idli, rice, dal, roti, paratha, biryani, pav bhaji
- Fast Food: sandwich, burger, pizza, maggi
- Breakfast: poha, upma
- Desserts: cake, pastry, chocolate

## How to Use

### For Users:
1. Click the AI Assistant button (sparkle icon) in the header
2. Type your order in natural language
3. Confirm when AI asks for payment
4. View your digital bill

### For Developers:

#### Adding New Food Keywords:
Edit `CMS/src/services/ai/AIOrderService.ts`:
```typescript
const foodKeywords = [
    'tea', 'coffee', 'samosa',
    // Add your new items here
    'new_item_1', 'new_item_2'
]
```

#### Adding New Canteens:
Edit the `extractCanteen()` method:
```typescript
if (lowerText.includes('your_canteen_name')) {
    return 'your_canteen_name'
}
```

## Database Requirements

The AI Assistant requires these tables:
- `products`: Product catalog with names, prices
- `canteens`: Canteen information
- `users`: User wallet balance
- `orders`: Order records
- `order_items`: Order line items
- `cart_items`: Shopping cart

## Future Enhancements

### Planned Features:
1. **Voice Input**: Speech-to-text for hands-free ordering
2. **Order History**: "Reorder my last order"
3. **Recommendations**: "What do you recommend?"
4. **Dietary Preferences**: "Show vegetarian options"
5. **Price Queries**: "How much is tea?"
6. **Availability Check**: "Is samosa available?"
7. **Multi-language Support**: Hindi, regional languages
8. **Order Tracking**: "Where is my order?"
9. **Favorites**: "Order my usual"
10. **Group Orders**: "Order for 5 people"

### Advanced AI Integration:
- OpenAI GPT integration for better understanding
- Sentiment analysis for feedback
- Personalized recommendations based on history
- Context-aware conversations

## Testing

### Test Commands:
```
1. "Order 2 tea from main canteen"
2. "I want 3 samosas"
3. "Show me the menu"
4. "What's popular today?"
5. "Yes, proceed" (after order)
6. "View my bill"
```

### Expected Responses:
- Product found: Adds to cart with confirmation
- Product not found: Suggests alternatives
- Insufficient balance: Error message
- Successful order: Order ID and bill link

## Troubleshooting

### Common Issues:

**AI doesn't understand my order:**
- Be specific: Include quantity and item name
- Use simple language
- Mention canteen name if multiple canteens exist

**Product not found:**
- Check if product exists in database
- Verify product is marked as available
- Check spelling of product name

**Payment fails:**
- Ensure sufficient wallet balance
- Check if cart has items
- Verify user is authenticated

## Security

- All requests require authentication
- Wallet balance verified before payment
- Transaction rollback on errors
- SQL injection prevention with parameterized queries

## Performance

- Fast product search with database indexes
- Efficient text parsing algorithms
- Minimal API calls
- Optimized database queries

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast mode compatible
- Mobile responsive design

---

**Note**: This is a template-based AI system. For production use with advanced NLP, consider integrating:
- OpenAI GPT-4
- Google Dialogflow
- Amazon Lex
- Custom ML models
