import { pool } from '../../config/database'

export interface CartItem {
    productId: string
    productName: string
    quantity: number
    price: number
    canteenId: string
    canteenName: string
    vendorId: string
}

export interface CartSummary {
    items: CartItem[]
    totalAmount: number
    totalItems: number
    canteenId: string | null
    canteenName: string | null
}

export class CartManager {
    // Get cart summary from frontend cart store
    static getCartSummary(cartItems: any[]): CartSummary {
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
        const canteenId = cartItems.length > 0 ? cartItems[0].canteenId : null
        const canteenName = cartItems.length > 0 ? cartItems[0].canteenName : null

        return {
            items: cartItems,
            totalAmount,
            totalItems,
            canteenId,
            canteenName
        }
    }

    // Format cart summary for display
    static formatCartSummary(summary: CartSummary): string {
        if (summary.items.length === 0) {
            return "Your cart is empty."
        }

        const itemsList = summary.items
            .map(item => `- ${item.quantity}x ${item.productName} (₹${(item.price * item.quantity).toFixed(2)})`)
            .join('\n')

        return `Your cart has:\n${itemsList}\n\nTotal: ₹${summary.totalAmount.toFixed(2)} from ${summary.canteenName}`
    }

    // Check if item exists in cart
    static findItemInCart(cartItems: any[], productId: string): any | null {
        return cartItems.find(item => item.productId === productId) || null
    }

    // Check if cart has items from different canteen
    static hasConflictingCanteen(cartItems: any[], newCanteenId: string): boolean {
        if (cartItems.length === 0) return false
        return cartItems[0].canteenId !== newCanteenId
    }
}
