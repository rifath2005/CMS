import { pool } from '../../config/database'
import { IntentDetector, Intent } from './IntentDetector'
import { CartManager } from './CartManager'
import { QRCodeService } from '../bill/QRCodeService'

const qrCodeService = new QRCodeService()

interface ParsedOrder {
    intent: Intent | string
    items: Array<{
        productId: string
        productName: string
        quantity: number
        price: number
        canteenId: string
        vendorId: string
        imageUrl?: string
    }>
    canteen?: string
    totalAmount: number
    response?: string
    action?: 'add_to_cart' | 'update_cart' | 'clear_cart' | 'none'
    context?: {
        awaitingCanteen?: boolean
        awaitingProduct?: boolean
        productNames?: string[]
        quantity?: number
    }
}

// Conversation context storage (in-memory for now)
const conversationContexts = new Map<string, {
    awaitingCanteen?: boolean
    awaitingProduct?: boolean
    productNames?: string[]
    quantity?: number
    lastIntent?: string
}>()

// Conversation history storage - stores last 3 messages per user
const conversationHistory = new Map<string, Array<{
    role: 'user' | 'assistant'
    message: string
    intent?: string
    timestamp: Date
}>>()

export class AIOrderService {
    // Add message to conversation history
    private static addToHistory(userId: string, role: 'user' | 'assistant', message: string, intent?: string) {
        if (!conversationHistory.has(userId)) {
            conversationHistory.set(userId, [])
        }
        
        const history = conversationHistory.get(userId)!
        history.push({
            role,
            message,
            intent,
            timestamp: new Date()
        })
        
        // Keep only last 3 exchanges (6 messages total - 3 user + 3 assistant)
        if (history.length > 6) {
            history.shift()
        }
        
        console.log('AIOrderService - Updated history for user:', userId, 'Total messages:', history.length)
    }
    
    // Get conversation history
    private static getHistory(userId: string): Array<{ role: 'user' | 'assistant', message: string, intent?: string, timestamp: Date }> {
        return conversationHistory.get(userId) || []
    }
    
    // Check if user recently mentioned a product
    private static getRecentProduct(userId: string): string | null {
        const history = this.getHistory(userId)
        
        // Look through last 3 user messages for product mentions
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === 'user') {
                const products = this.extractProductNames(history[i].message)
                if (products.length > 0) {
                    return products[0]
                }
            }
        }
        
        return null
    }
    
    // Check if user recently mentioned a canteen
    private static getRecentCanteen(userId: string): string | null {
        const history = this.getHistory(userId)
        
        // Look through last 3 user messages for canteen mentions
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === 'user') {
                const canteen = this.extractCanteen(history[i].message)
                if (canteen) {
                    return canteen
                }
            }
        }
        
        return null
    }

    // Extract numbers from text
    private static extractQuantity(text: string): number {
        const numbers = text.match(/\d+/)
        return numbers ? parseInt(numbers[0]) : 1
    }

    // Extract product names (common food items)
    private static extractProductNames(text: string): string[] {
        const lowerText = text.toLowerCase()
        const products: string[] = []
        const foundKeywords = new Set<string>()

        // Common food items - IMPORTANT: Longer phrases MUST come first
        const foodKeywords = [
            'cold coffee',
            'filter coffee', 
            'hot coffee',
            'iced coffee',
            'pav bhaji',
            'cold drink',
            'coca cola',
            'latte',
            'cappuccino',
            'espresso',
            'mocha',
            'americano',
            'macchiato',
            'frappe',
            'coffee',
            'tea',
            'chai',
            'samosa',
            'vada',
            'dosa',
            'idli',
            'sandwich',
            'burger',
            'pizza',
            'biryani',
            'rice',
            'dal',
            'roti',
            'paratha',
            'juice',
            'water',
            'coke',
            'pepsi',
            'sprite',
            'cake',
            'pastry',
            'biscuit',
            'chocolate',
            'chips',
            'maggi',
            'poha',
            'upma',
            'chaat',
            'pakora',
            'cutlet'
        ]

        // Check each keyword
        for (const keyword of foodKeywords) {
            if (lowerText.includes(keyword)) {
                // Check if this keyword is part of an already found longer keyword
                let isPartOfLonger = false
                for (const found of foundKeywords) {
                    if (found.includes(keyword) && found !== keyword) {
                        isPartOfLonger = true
                        break
                    }
                }
                
                if (!isPartOfLonger) {
                    products.push(keyword)
                    foundKeywords.add(keyword)
                }
            }
        }

        return products
    }

    // Extract canteen name
    private static extractCanteen(text: string): string | null {
        const lowerText = text.toLowerCase().trim()
        
        // Direct canteen name matches
        if (lowerText.includes('main canteen') || lowerText === 'main' || lowerText === 'main canteen') {
            return 'main canteen'
        }
        if (lowerText.includes('food court') || lowerText === 'food court' || lowerText === 'court') {
            return 'food court'
        }
        if (lowerText.includes('cafe') || lowerText === 'cafe' || lowerText.includes('coffee shop')) {
            return 'cafe'
        }
        if (lowerText.includes('cafeteria') || lowerText === 'cafeteria') {
            return 'cafeteria'
        }
        if (lowerText.includes('snack shop') || lowerText === 'snack shop' || lowerText === 'snack') {
            return 'snack shop'
        }
        
        // If text is just a canteen name without other words, return it
        // This handles cases where user just says "main canteen" or "cafeteria"
        const words = lowerText.split(' ')
        if (words.length <= 3) {
            // Check if it matches any common canteen patterns
            if (lowerText.match(/^(main|cafeteria|cafe|snack|food|court)/)) {
                return lowerText
            }
        }
        
        return null
    }

    // Search for products in database
    private static async searchProducts(
        productNames: string[],
        canteenName: string | null,
        institutionId: string
    ): Promise<any[]> {
        try {
            let query = `
                SELECT p.*, c.name as canteen_name, c.id as canteen_id, p.vendor_id
                FROM products p
                JOIN canteens c ON p.vendor_id = c.vendor_id
                WHERE p.is_available = true
                AND c.institution_id = $1
            `
            const params: any[] = [institutionId]

            if (canteenName) {
                query += ` AND LOWER(c.name) LIKE $${params.length + 1}`
                params.push(`%${canteenName}%`)
            }

            if (productNames.length > 0) {
                const nameConditions = productNames.map((_, idx) => 
                    `LOWER(p.name) LIKE $${params.length + idx + 1}`
                ).join(' OR ')
                query += ` AND (${nameConditions})`
                params.push(...productNames.map(name => `%${name}%`))
            }

            query += ` LIMIT 10`

            const result = await pool.query(query, params)
            return result.rows
        } catch (error) {
            console.error('Error searching products:', error)
            return []
        }
    }

    // Main processing function
    static async processMessage(message: string, userId: string, cartItems: any[] = []): Promise<ParsedOrder> {
        try {
            console.log('AIOrderService.processMessage - userId:', userId)
            console.log('AIOrderService.processMessage - message:', message)
            console.log('AIOrderService.processMessage - cartItems:', cartItems)

            // Add user message to history
            this.addToHistory(userId, 'user', message)

            // Get user's institution and wallet
            const userResult = await pool.query(
                'SELECT id, email, institution_id, wallet_balance FROM users WHERE id = $1',
                [userId]
            )

            console.log('AIOrderService - User query result:', userResult.rows)

            if (userResult.rows.length === 0) {
                console.error('AIOrderService - User not found in database:', userId)
                throw new Error('User not found. Please log in again.')
            }

            const institutionId = userResult.rows[0].institution_id
            const walletBalance = parseFloat(userResult.rows[0].wallet_balance)

            console.log('AIOrderService - Institution ID:', institutionId)
            console.log('AIOrderService - Wallet Balance:', walletBalance)

            if (!institutionId) {
                console.error('AIOrderService - User has no institution_id:', userResult.rows[0])
                throw new Error('Your account is not linked to an institution. Please contact support.')
            }

            // Check if user has pending context (awaiting canteen selection)
            const context = conversationContexts.get(userId)
            console.log('AIOrderService - Conversation context:', context)

            // If awaiting canteen and user provides canteen name
            if (context?.awaitingCanteen && context.productNames) {
                console.log('AIOrderService - User has pending context, checking for canteen...')
                
                const canteenName = this.extractCanteen(message)
                console.log('AIOrderService - Extracted canteen from message:', canteenName)
                
                // If user provided a canteen name, process the order
                if (canteenName) {
                    console.log('AIOrderService - User provided canteen:', canteenName)
                    
                    // Clear context
                    conversationContexts.delete(userId)
                    
                    // Process the order with the canteen
                    const cartSummary = CartManager.getCartSummary(cartItems)
                    const result = await this.handleOrderWithCanteen(
                        context.productNames,
                        context.quantity || 1,
                        canteenName,
                        institutionId,
                        cartItems,
                        cartSummary
                    )
                    
                    // Add assistant response to history
                    this.addToHistory(userId, 'assistant', result.response || '', result.intent as string)
                    
                    return result
                } else {
                    // User didn't provide a valid canteen, remind them
                    console.log('AIOrderService - Could not extract canteen from message')
                    
                    // Get available canteens
                    const canteensResult = await pool.query(
                        `SELECT DISTINCT name FROM canteens 
                         WHERE institution_id = $1 AND is_active = true AND is_approved = true
                         ORDER BY name`,
                        [institutionId]
                    )
                    
                    const canteenList = canteensResult.rows.map((c: any) => `- ${c.name}`).join('\n')
                    
                    const response = `I didn't catch which canteen you want. Please choose from:\n\n${canteenList}\n\nJust type the canteen name.`
                    this.addToHistory(userId, 'assistant', response, 'clarification_needed')
                    
                    return {
                        intent: 'clarification_needed',
                        items: [],
                        totalAmount: 0,
                        response
                    }
                }
            }

            // Detect intent using new detector
            const intent = IntentDetector.detect(message)
            console.log('AIOrderService - Detected intent:', intent)

            // Get cart summary
            const cartSummary = CartManager.getCartSummary(cartItems)

            // Handle different intents
            const result = await this.handleIntent(intent, message, userId, institutionId, walletBalance, cartItems, cartSummary)
            
            // Add assistant response to history
            this.addToHistory(userId, 'assistant', result.response || '', result.intent as string)
            
            return result
        } catch (error) {
            console.error('AI processing error:', error)
            throw error
        }
    }

    // Handle different intents
    private static async handleIntent(
        intent: Intent,
        message: string,
        userId: string,
        institutionId: string,
        walletBalance: number,
        cartItems: any[],
        cartSummary: any
    ): Promise<ParsedOrder> {
        switch (intent) {
            case 'show_cart':
                return this.handleShowCart(cartSummary)
            
            case 'show_total':
                return this.handleShowTotal(cartSummary)
            
            case 'show_wallet':
                return this.handleShowWallet(walletBalance)
            
            case 'greeting':
                return this.handleGreetingWithHistory(userId)
            
            case 'thanks':
                return this.handleThanks()
            
            case 'goodbye':
                return this.handleGoodbye()
            
            case 'clear_cart':
                return this.handleClearCart()
            
            case 'confirm_yes':
                return this.handleConfirmYes(cartSummary)
            
            case 'confirm_payment':
                return this.handleConfirmPayment(cartSummary)
            
            case 'view_bill':
                return this.handleViewBill()
            
            case 'show_menu':
                return this.handleMenuQuery(message, institutionId, userId)
            
            case 'view_canteens':
                return this.handleViewCanteens(institutionId)
            
            case 'order':
            case 'add_to_cart':
                const result = await this.handleOrder(message, institutionId, cartItems, cartSummary, userId)
                
                // Store context if awaiting canteen
                if (result.context?.awaitingCanteen) {
                    console.log('AIOrderService - Storing context for user:', userId)
                    console.log('AIOrderService - Context data:', {
                        awaitingCanteen: true,
                        productNames: result.context.productNames,
                        quantity: result.context.quantity
                    })
                    
                    conversationContexts.set(userId, {
                        awaitingCanteen: true,
                        productNames: result.context.productNames,
                        quantity: result.context.quantity
                    })
                    
                    console.log('AIOrderService - Context stored. Map size:', conversationContexts.size)
                    console.log('AIOrderService - Stored context:', conversationContexts.get(userId))
                }
                
                return result
            
            default:
                return this.handleUnknown()
        }
    }

    // Intent Handlers
    private static handleShowCart(cartSummary: any): ParsedOrder {
        return {
            intent: 'show_cart',
            items: [],
            totalAmount: cartSummary.totalAmount,
            response: CartManager.formatCartSummary(cartSummary)
        }
    }

    private static handleShowTotal(cartSummary: any): ParsedOrder {
        if (cartSummary.items.length === 0) {
            return {
                intent: 'show_total',
                items: [],
                totalAmount: 0,
                response: "Your cart is empty. Add some items first!"
            }
        }
        return {
            intent: 'show_total',
            items: [],
            totalAmount: cartSummary.totalAmount,
            response: `Your current total is ₹${cartSummary.totalAmount.toFixed(2)}`
        }
    }

    private static handleShowWallet(balance: number): ParsedOrder {
        return {
            intent: 'show_wallet',
            items: [],
            totalAmount: 0,
            response: `Your wallet balance is ₹${balance.toFixed(2)}`
        }
    }

    private static handleGreeting(): ParsedOrder {
        return {
            intent: 'greeting',
            items: [],
            totalAmount: 0,
            response: "Hello! I'm Queal, your AI ordering assistant. I can help you order food from any canteen. What would you like to order today?"
        }
    }
    
    // Enhanced greeting with history awareness
    private static handleGreetingWithHistory(userId: string): ParsedOrder {
        const history = this.getHistory(userId)
        
        // If user has recent history, personalize the greeting
        if (history.length > 0) {
            const recentProduct = this.getRecentProduct(userId)
            const recentCanteen = this.getRecentCanteen(userId)
            
            if (recentProduct && recentCanteen) {
                return {
                    intent: 'greeting',
                    items: [],
                    totalAmount: 0,
                    response: `Hello again! Would you like to order more ${recentProduct} from ${recentCanteen}, or try something different?`
                }
            } else if (recentProduct) {
                return {
                    intent: 'greeting',
                    items: [],
                    totalAmount: 0,
                    response: `Hi! Would you like to order ${recentProduct} again, or something else?`
                }
            }
        }
        
        return this.handleGreeting()
    }

    private static handleThanks(): ParsedOrder {
        return {
            intent: 'thanks',
            items: [],
            totalAmount: 0,
            response: "You're welcome! 😊 Let me know if you need anything else."
        }
    }

    private static handleGoodbye(): ParsedOrder {
        return {
            intent: 'goodbye',
            items: [],
            totalAmount: 0,
            response: "Goodbye! Feel free to order anytime. Have a great day! 👋"
        }
    }

    private static handleClearCart(): ParsedOrder {
        return {
            intent: 'clear_cart',
            items: [],
            totalAmount: 0,
            response: "I'll help you clear your cart. Please confirm by saying 'yes, clear cart'.",
            action: 'clear_cart'
        }
    }

    private static handleConfirmYes(cartSummary: any): ParsedOrder {
        if (cartSummary.items.length === 0) {
            return {
                intent: 'confirm_yes',
                items: [],
                totalAmount: 0,
                response: "Your cart is empty. Please add items first by saying something like 'Order 2 tea from main canteen'"
            }
        }
        // This will be handled as payment confirmation
        return {
            intent: 'confirm_payment',
            items: [],
            totalAmount: cartSummary.totalAmount,
            response: "Processing payment..."
        }
    }

    private static handleConfirmPayment(cartSummary: any): ParsedOrder {
        return {
            intent: 'confirm_payment',
            items: [],
            totalAmount: cartSummary.totalAmount,
            response: "Processing payment..."
        }
    }

    private static handleViewBill(): ParsedOrder {
        return {
            intent: 'view_bill',
            items: [],
            totalAmount: 0,
            response: "Opening your digital bill..."
        }
    }

    private static handleUnknown(): ParsedOrder {
        return {
            intent: 'unknown',
            items: [],
            totalAmount: 0,
            response: "I'm not sure I understood that. You can:\n• Order food: 'Order 2 tea from main canteen'\n• View menu: 'Show menu'\n• Check cart: 'What's in my cart?'\n• Check total: 'How much do I need to pay?'\n• Proceed with payment: Say 'yes'\n\nWhat would you like to do?"
        }
    }

    private static async handleViewCanteens(institutionId: string): Promise<ParsedOrder> {
        try {
            const canteensResult = await pool.query(
                `SELECT name, location, is_active 
                 FROM canteens 
                 WHERE institution_id = $1 AND is_approved = true
                 ORDER BY name`,
                [institutionId]
            )
            
            if (canteensResult.rows.length === 0) {
                return {
                    intent: 'view_canteens',
                    items: [],
                    totalAmount: 0,
                    response: 'No canteens are currently available at your institution.'
                }
            }
            
            const canteenList = canteensResult.rows
                .map((c: any) => {
                    const status = c.is_active ? '✅' : '❌'
                    const location = c.location ? ` (${c.location})` : ''
                    return `${status} ${c.name}${location}`
                })
                .join('\n')
            
            return {
                intent: 'view_canteens',
                items: [],
                totalAmount: 0,
                response: `Here are the available canteens:\n\n${canteenList}\n\nWhich canteen would you like to order from? You can say "Show menu" or "Order [item] from [canteen]"`
            }
        } catch (error) {
            console.error('Error fetching canteens:', error)
            return {
                intent: 'view_canteens',
                items: [],
                totalAmount: 0,
                response: 'Sorry, I could not fetch the canteen list at the moment. Please try again.'
            }
        }
    }

    private static async handleMenuQuery(message: string, institutionId: string, userId?: string): Promise<ParsedOrder> {
        let canteenName = this.extractCanteen(message)
        
        // If no canteen in message but user has recent canteen in history, use it
        if (!canteenName && userId) {
            const recentCanteen = this.getRecentCanteen(userId)
            if (recentCanteen) {
                console.log('AIOrderService - No canteen in menu query, using recent canteen:', recentCanteen)
                canteenName = recentCanteen
            }
        }
        
        // If no canteen specified, show all canteens
        if (!canteenName) {
            const canteensResult = await pool.query(
                `SELECT name, location FROM canteens 
                 WHERE institution_id = $1 AND is_active = true AND is_approved = true
                 ORDER BY name`,
                [institutionId]
            )
            
            if (canteensResult.rows.length === 0) {
                return {
                    intent: 'show_menu',
                    items: [],
                    totalAmount: 0,
                    response: 'No canteens are currently available.'
                }
            }
            
            const canteenList = canteensResult.rows
                .map((c: any) => `- ${c.name}${c.location ? ` (${c.location})` : ''}`)
                .join('\n')
            
            return {
                intent: 'show_menu',
                items: [],
                totalAmount: 0,
                response: `Here are the available canteens:\n\n${canteenList}\n\nWhich canteen's menu would you like to see?`
            }
        }
        
        const products = await this.searchProducts([], canteenName, institutionId)

        if (products.length === 0) {
            // Check if canteen exists
            const canteenCheck = await pool.query(
                `SELECT name FROM canteens 
                 WHERE institution_id = $1 
                 AND LOWER(name) LIKE $2 
                 AND is_active = true`,
                [institutionId, `%${canteenName.toLowerCase()}%`]
            )
            
            if (canteenCheck.rows.length === 0) {
                // Show available canteens
                const canteensResult = await pool.query(
                    `SELECT name FROM canteens 
                     WHERE institution_id = $1 AND is_active = true AND is_approved = true
                     ORDER BY name`,
                    [institutionId]
                )
                
                const canteenList = canteensResult.rows.map((c: any) => `- ${c.name}`).join('\n')
                return {
                    intent: 'show_menu',
                    items: [],
                    totalAmount: 0,
                    response: `Sorry, "${canteenName}" canteen does not exist. Available canteens:\n\n${canteenList}`
                }
            }
            
            return {
                intent: 'show_menu',
                items: [],
                totalAmount: 0,
                response: `No items available in ${canteenCheck.rows[0].name} at the moment.`
            }
        }

        const menuList = products
            .slice(0, 5)
            .map((p: any) => `${p.name} - ₹${p.price}`)
            .join('\n')

        return {
            intent: 'show_menu',
            items: [],
            totalAmount: 0,
            response: `Here are some available items in ${products[0].canteen_name}:\n\n${menuList}\n\nWould you like to order any of these?`
        }
    }

    private static async handleOrder(
        message: string,
        institutionId: string,
        cartItems: any[],
        cartSummary: any,
        userId?: string
    ): Promise<ParsedOrder> {
        const quantity = this.extractQuantity(message)
        let productNames = this.extractProductNames(message)
        let canteenName = this.extractCanteen(message)

        // If no product found but user has history, check if they're referring to recent product
        if (productNames.length === 0 && userId) {
            const recentProduct = this.getRecentProduct(userId)
            if (recentProduct) {
                console.log('AIOrderService - No product in message, using recent product:', recentProduct)
                productNames = [recentProduct]
            }
        }

        // If no canteen found but user has history, check if they're referring to recent canteen
        if (!canteenName && userId) {
            const recentCanteen = this.getRecentCanteen(userId)
            if (recentCanteen && productNames.length > 0) {
                console.log('AIOrderService - No canteen in message, checking if recent canteen has product')
                // Only use recent canteen if the product is available there
                const products = await this.searchProducts(productNames, recentCanteen, institutionId)
                if (products.length > 0) {
                    console.log('AIOrderService - Using recent canteen:', recentCanteen)
                    canteenName = recentCanteen
                }
            }
        }

        if (productNames.length === 0) {
            return {
                intent: 'unknown',
                items: [],
                totalAmount: 0,
                response: "I couldn't identify any food items in your message. Could you please specify what you'd like to order?"
            }
        }

        // If no canteen specified, check where product is available
        if (!canteenName) {
            const productCheck = await this.searchProducts(productNames, null, institutionId)
            
            if (productCheck.length > 0) {
                // Product exists - show which canteens have it
                const canteenMap = new Map<string, string>()
                productCheck.forEach((p: any) => {
                    if (!canteenMap.has(p.canteen_id)) {
                        canteenMap.set(p.canteen_id, p.canteen_name)
                    }
                })
                
                const canteenList = Array.from(canteenMap.values()).map(c => `- ${c}`).join('\n')
                
                // Capitalize first letter of product name
                const productName = productNames[0].charAt(0).toUpperCase() + productNames[0].slice(1)
                
                return {
                    intent: 'clarification_needed',
                    items: [],
                    totalAmount: 0,
                    response: `${productName} is available in these canteens:\n\n${canteenList}\n\nWhich canteen would you like to order from?`,
                    context: {
                        awaitingCanteen: true,
                        productNames,
                        quantity
                    }
                }
            }
            
            // Product doesn't exist - show all canteens and ask user to specify
            const canteensResult = await pool.query(
                `SELECT DISTINCT name FROM canteens 
                 WHERE institution_id = $1 AND is_active = true AND is_approved = true
                 ORDER BY name`,
                [institutionId]
            )
            
            if (canteensResult.rows.length === 0) {
                return {
                    intent: 'unknown',
                    items: [],
                    totalAmount: 0,
                    response: "Sorry, there are no active canteens available at the moment."
                }
            }
            
            const canteenList = canteensResult.rows.map((c: any) => `- ${c.name}`).join('\n')
            
            // Capitalize first letter of product name
            const productName = productNames[0].charAt(0).toUpperCase() + productNames[0].slice(1)
            
            return {
                intent: 'clarification_needed',
                items: [],
                totalAmount: 0,
                response: `I couldn't find "${productName}" in our system. Here are the available canteens:\n\n${canteenList}\n\nPlease specify which canteen you'd like to order from, and I'll check their menu.`,
                context: {
                    awaitingCanteen: true,
                    productNames,
                    quantity
                }
            }
        }

        // If canteen is specified, process the order
        return await this.handleOrderWithCanteen(productNames, quantity, canteenName, institutionId, cartItems, cartSummary)
    }

    // Handle order when canteen is known
    private static async handleOrderWithCanteen(
        productNames: string[],
        quantity: number,
        canteenName: string,
        institutionId: string,
        cartItems: any[],
        cartSummary: any
    ): Promise<ParsedOrder> {
        // Search for products
        const products = await this.searchProducts(productNames, canteenName, institutionId)

        if (products.length === 0) {
            // Check if canteen exists
            const canteenCheck = await pool.query(
                `SELECT name FROM canteens 
                 WHERE institution_id = $1 
                 AND LOWER(name) LIKE $2 
                 AND is_active = true`,
                [institutionId, `%${canteenName.toLowerCase()}%`]
            )
            
            if (canteenCheck.rows.length === 0) {
                const canteensResult = await pool.query(
                    `SELECT DISTINCT name FROM canteens 
                     WHERE institution_id = $1 AND is_active = true AND is_approved = true
                     ORDER BY name`,
                    [institutionId]
                )
                
                const canteenList = canteensResult.rows.map((c: any) => `- ${c.name}`).join('\n')
                return {
                    intent: 'unknown',
                    items: [],
                    totalAmount: 0,
                    response: `Sorry, "${canteenName}" canteen does not exist. Would you like to see the list of available canteens?\n\n${canteenList}`
                }
            } else {
                return {
                    intent: 'unknown',
                    items: [],
                    totalAmount: 0,
                    response: `Sorry, "${productNames.join(', ')}" is not available in ${canteenCheck.rows[0].name}. Would you like to see the menu? Just say "show menu" or "what's available".`
                }
            }
        }

        // Check if cart has items from different canteen
        if (cartSummary.items.length > 0 && cartSummary.canteenId !== products[0].canteen_id) {
            return {
                intent: 'cart_conflict',
                items: [],
                totalAmount: 0,
                response: `Sorry, you already have items from ${cartSummary.canteenName} in your cart. You can only order from one canteen at a time. Would you like to clear your cart and order from ${products[0].canteen_name} instead?`
            }
        }

        // If multiple products found for single search term, ask for clarification
        if (productNames.length === 1 && products.length > 1) {
            const productList = products.map((p: any) => `- ${p.name} (₹${p.price})`).join('\n')
            return {
                intent: 'clarification_needed',
                items: [],
                totalAmount: 0,
                response: `I found multiple options for "${productNames[0]}":\n\n${productList}\n\nWhich one would you like to order? Please be more specific.`
            }
        }

        // Build order items
        const items = products.map((product: any) => ({
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: parseFloat(product.price),
            canteenId: product.canteen_id,
            vendorId: product.vendor_id,
            imageUrl: product.image_url
        }))

        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const newCartTotal = cartSummary.totalAmount + totalAmount

        // Acknowledge existing cart if present
        let response = ''
        if (cartSummary.items.length > 0) {
            response = `Added ${items.map(i => `${i.quantity}x ${i.productName}`).join(', ')} to your cart.\n\n`
            response += `Your cart now has ${cartSummary.totalItems + items.reduce((sum, i) => sum + i.quantity, 0)} items. `
            response += `New total: ₹${newCartTotal.toFixed(2)}. Would you like me to proceed with the payment?`
        } else {
            response = `Great! I've added ${items.map(i => `${i.quantity}x ${i.productName}`).join(', ')} to your cart from ${products[0].canteen_name}. Total: ₹${totalAmount.toFixed(2)}. Would you like me to proceed with the payment?`
        }

        return {
            intent: 'order',
            items,
            canteen: products[0].canteen_name,
            totalAmount: newCartTotal, // Return the new cart total, not just the new items
            response,
            action: 'add_to_cart'
        }
    }

    // Complete order with payment
    static async completeOrder(userId: string, cartItems: any[]): Promise<{ orderId: string; billUrl: string }> {
        const client = await pool.connect()
        
        try {
            await client.query('BEGIN')

            // Calculate total
            const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            // Check wallet balance
            const userResult = await client.query(
                'SELECT wallet_balance FROM users WHERE id = $1',
                [userId]
            )

            if (userResult.rows.length === 0) {
                throw new Error('User not found')
            }

            const walletBalance = parseFloat(userResult.rows[0].wallet_balance)

            if (walletBalance < totalAmount) {
                throw new Error('Insufficient wallet balance')
            }

            // Deduct from wallet
            await client.query(
                'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
                [totalAmount, userId]
            )

            // Create payment record first
            const paymentResult = await client.query(
                `INSERT INTO payments (user_id, amount, status, upi_transaction_id)
                 VALUES ($1, $2, 'SUCCESS', $3)
                 RETURNING id`,
                [userId, totalAmount, `WALLET_${Date.now()}`]
            )

            const paymentId = paymentResult.rows[0].id

            // Generate QR code and validation token
            const validationToken = `ORDER_${Date.now()}_${userId.slice(0, 8)}`
            const qrCodeData = await qrCodeService.generateQRCode(validationToken, userId, totalAmount)

            // Create order with payment_id and QR code
            // Set expiration to 15 minutes from now
            const billGeneratedAt = new Date()
            const billExpiresAt = new Date(billGeneratedAt.getTime() + 15 * 60 * 1000) // 15 minutes in milliseconds
            
            console.log('Creating order with timestamps:')
            console.log('  Generated at:', billGeneratedAt.toISOString())
            console.log('  Expires at:', billExpiresAt.toISOString())
            
            const orderResult = await client.query(
                `INSERT INTO orders (user_id, vendor_id, total_amount, status, payment_id, bill_generated_at, bill_expires_at, qr_code, validation_token)
                 VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7, $8)
                 RETURNING id, bill_generated_at, bill_expires_at`,
                [userId, cartItems[0].vendorId, totalAmount, paymentId, billGeneratedAt, billExpiresAt, qrCodeData, validationToken]
            )

            const orderId = orderResult.rows[0].id
            
            console.log('Order created successfully:')
            console.log('  Order ID:', orderId)
            console.log('  Bill generated at (DB):', orderResult.rows[0].bill_generated_at)
            console.log('  Bill expires at (DB):', orderResult.rows[0].bill_expires_at)

            // Create order items
            for (const item of cartItems) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, price, product_name)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [orderId, item.productId, item.quantity, item.price, item.productName || 'Unknown Product']
                )
            }

            await client.query('COMMIT')

            return {
                orderId,
                billUrl: `/user/bill/${orderId}`
            }
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    }
}
