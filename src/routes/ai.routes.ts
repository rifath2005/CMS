import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { AIOrderService } from '../services/ai/AIOrderService'

const router = Router()

// Process AI message
router.post('/process-order', authenticate, async (req, res) => {
    try {
        const { message, cartItems } = req.body
        const userId = req.user?.userId

        console.log('AI Process Order - User:', req.user)
        console.log('AI Process Order - User ID:', userId)
        console.log('AI Process Order - Message:', message)
        console.log('AI Process Order - Cart Items:', cartItems)

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated. Please log in again.' }
            })
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: { message: 'Message is required' }
            })
        }

        const result = await AIOrderService.processMessage(message, userId, cartItems || [])

        res.json({
            success: true,
            data: result
        })
    } catch (error: any) {
        console.error('AI process error:', error)
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Failed to process message' }
        })
    }
})

// Complete order with payment
router.post('/complete-order', authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId
        const { cartItems } = req.body

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not authenticated. Please log in again.' }
            })
        }

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'Cart items are required' }
            })
        }

        const result = await AIOrderService.completeOrder(userId, cartItems)

        res.json({
            success: true,
            data: result
        })
    } catch (error: any) {
        console.error('Complete order error:', error)
        res.status(500).json({
            success: false,
            error: { message: error.message || 'Failed to complete order' }
        })
    }
})

export default router
