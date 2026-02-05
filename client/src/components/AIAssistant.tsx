import { useState, useRef, useEffect } from 'react'
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    suggestions?: string[]
}

interface AIAssistantProps {
    isOpen: boolean
    onClose: () => void
}

export const AIAssistant = ({ isOpen, onClose }: AIAssistantProps) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm Queal, your AI ordering assistant. I can help you order food from any canteen. Just tell me what you'd like!",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [pendingClearCart, setPendingClearCart] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user } = useAuthStore()
    const { addItem } = useCartStore()
    const navigate = useNavigate()

    // Reset messages and clear cart when modal opens
    useEffect(() => {
        if (isOpen) {
            // Clear cart for fresh start
            const cartStore = useCartStore.getState()
            cartStore.clearCart()
            
            // Reset messages
            setMessages([
                {
                    id: '1',
                    role: 'assistant',
                    content: "Hi! I'm Queal, your AI ordering assistant. I can help you order food from any canteen. Just tell me what you'd like!",
                    timestamp: new Date(),
                    suggestions: ['Order tea', 'Show menu', 'View canteens']
                }
            ])
            setInput('')
            setPendingClearCart(false)
        }
    }, [isOpen])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const addMessage = (role: 'user' | 'assistant', content: string, suggestions?: string[]) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date(),
            suggestions
        }
        setMessages(prev => [...prev, newMessage])
    }

    const processOrder = async (userMessage: string) => {
        setIsProcessing(true)
        addMessage('user', userMessage)

        try {
            // Check if user is confirming cart clear
            if (pendingClearCart && (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('clear'))) {
                const cartStore = useCartStore.getState()
                cartStore.clearCart()
                setPendingClearCart(false)
                addMessage('assistant', 'Your cart has been cleared. You can start a new order anytime!', [
                    'Order tea',
                    'Show menu',
                    'View canteens'
                ])
                setIsProcessing(false)
                return
            }

            // Get current cart items from store (fresh data)
            const cartStore = useCartStore.getState()
            const currentCart = cartStore.items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                canteenId: item.canteenId,
                canteenName: item.canteenName,
                vendorId: item.vendorId
            }))

            console.log('Current cart items:', currentCart)

            // Call AI processing endpoint with cart info
            const response = await api.post('/ai/process-order', {
                message: userMessage,
                userId: user?.id,
                cartItems: currentCart
            })

            const { intent, items, canteen, totalAmount } = response.data.data

            if (intent === 'order' && items && items.length > 0) {
                // Check if cart has items from a different canteen
                const cartStore = useCartStore.getState()
                const existingCanteenId = cartStore.getCanteenId()
                
                if (existingCanteenId && existingCanteenId !== items[0].canteenId) {
                    const existingCanteenName = cartStore.getCanteenName()
                    addMessage('assistant', 
                        `Sorry, you already have items from ${existingCanteenName} in your cart. You cannot order from different canteens at once. Please complete your current order or clear your cart first.`,
                        ['Clear cart', 'Proceed with payment', 'Show cart']
                    )
                    setIsProcessing(false)
                    return
                }
                
                // Add items to cart
                for (const item of items) {
                    addItem({
                        productId: item.productId,
                        productName: item.productName,
                        price: item.price,
                        quantity: item.quantity,
                        canteenId: item.canteenId,
                        vendorId: item.vendorId || '',
                        canteenName: canteen || '',
                        imageUrl: item.imageUrl || ''
                    })
                }

                addMessage('assistant', 
                    `Great! I've added ${items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')} to your cart from ${canteen}. Total: ₹${totalAmount}. Would you like me to proceed with the payment?`,
                    ['Yes, proceed', 'Add more items', 'Show cart', 'Cancel order']
                )
            } else if (intent === 'clarification_needed') {
                // Ask user to clarify which product they want
                addMessage('assistant', response.data.data.response, [
                    'Show menu',
                    'View canteens'
                ])
            } else if (intent === 'confirm_payment') {
                // Get cart items from store
                const cartStore = useCartStore.getState()
                const cartItems = cartStore.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                    vendorId: item.vendorId
                }))

                if (cartItems.length === 0) {
                    addMessage('assistant', 'Your cart is empty. Please add items first by saying something like "Order 3 tea from main canteen"', [
                        'Order tea',
                        'Show menu',
                        'View canteens'
                    ])
                    setIsProcessing(false)
                    return
                }

                // Process payment and create order
                const orderResponse = await api.post('/ai/complete-order', {
                    cartItems
                })

                const { orderId } = orderResponse.data.data

                // Clear cart after successful order
                cartStore.clearCart()

                addMessage('assistant', 
                    `Perfect! Your order has been placed successfully. Order ID: #${orderId.slice(0, 8).toUpperCase()}. Redirecting to your digital bill...`
                )
                
                // Automatically redirect to digital bill with order ID after 2 seconds
                setTimeout(() => {
                    onClose() // Close Queal modal
                    navigate(`/bill/${orderId}`) // Navigate to digital bill with order ID
                }, 2000)
            } else if (intent === 'view_bill') {
                navigate('/digital-bill')
                addMessage('assistant', 'Opening your digital bill...')
            } else if (intent === 'greeting') {
                addMessage('assistant', response.data.data.response, [
                    'Order tea',
                    'Show menu',
                    'View canteens'
                ])
            } else if (intent === 'cancel') {
                setPendingClearCart(true)
                addMessage('assistant', response.data.data.response, [
                    'Yes, clear cart',
                    'No, keep items',
                    'View cart'
                ])
            } else if (intent === 'query' || intent === 'show_menu') {
                addMessage('assistant', response.data.data.response, [
                    'Order from here',
                    'Show another canteen',
                    'View all canteens'
                ])
            } else if (intent === 'view_canteens') {
                addMessage('assistant', response.data.data.response, [
                    'Show menu',
                    'Order tea',
                    'Order coffee'
                ])
            } else if (intent === 'show_cart') {
                const cartStore = useCartStore.getState()
                if (cartStore.items.length > 0) {
                    addMessage('assistant', response.data.data.response, [
                        'Proceed with payment',
                        'Add more items',
                        'Clear cart'
                    ])
                } else {
                    addMessage('assistant', response.data.data.response, [
                        'Order tea',
                        'Show menu',
                        'View canteens'
                    ])
                }
            } else if (intent === 'show_total' || intent === 'show_wallet') {
                addMessage('assistant', response.data.data.response, [
                    'Proceed with payment',
                    'Add more items',
                    'Show cart'
                ])
            } else {
                addMessage('assistant', response.data.data.response || "I'm not sure I understood that. Could you please rephrase?", [
                    'Order tea',
                    'Show menu',
                    'View canteens'
                ])
            }
        } catch (error: any) {
            console.error('AI processing error:', error)
            addMessage('assistant', 
                error.response?.data?.error?.message || 
                "Sorry, I couldn't process that request. Please try again or order manually from the canteens page.",
                ['Try again', 'Show menu', 'View canteens']
            )
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isProcessing) return

        processOrder(input.trim())
        setInput('')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col h-[90vh] sm:h-[600px] shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 sm:rounded-t-2xl rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <SparklesIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold">Queal</h2>
                            <p className="text-[10px] sm:text-xs opacity-90">Order food with natural language</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-full transition"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                                }`}
                            >
                                <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 ${
                                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-sm text-gray-600">Processing...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-white border-t border-gray-200 sm:rounded-b-2xl">
                    {/* Suggestion Buttons */}
                    {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].suggestions && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {messages[messages.length - 1].suggestions!.map((suggestion, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                        setInput(suggestion)
                                        // Auto-submit the suggestion
                                        setTimeout(() => {
                                            processOrder(suggestion)
                                            setInput('')
                                        }, 100)
                                    }}
                                    className="px-3 py-1.5 text-xs sm:text-sm bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors border border-purple-200"
                                    disabled={isProcessing}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your order... e.g., 'Order 3 tea from main canteen'"
                            className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            disabled={isProcessing}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isProcessing}
                            className="px-4 sm:px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <PaperAirplaneIcon className="h-4 w-4" />
                            <span className="hidden sm:inline text-sm">Send</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
