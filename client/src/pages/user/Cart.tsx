import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'

const Cart = () => {
    const navigate = useNavigate()
    const { items, removeItem, updateQuantity, getTotalAmount, getTotalItems, clearCart } = useCartStore()

    const totalAmount = getTotalAmount()
    const totalItems = getTotalItems()

    // Calculate price breakdown
    const subtotal = totalAmount
    const taxRate = 0.05 // 5% tax
    const taxes = subtotal * taxRate
    const total = subtotal + taxes

    const handleCheckout = () => {
        if (items.length > 0) {
            navigate('/checkout')
        }
    }

    if (items.length === 0) {
        return (
            <div className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Shopping Cart</h1>
                    <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center transition-all duration-base">
                        <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
                        <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Add some delicious items to get started!</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-primary-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-primary-700 transition-all duration-base inline-flex items-center hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                        >
                            Browse Products
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 h-screen overflow-hidden flex flex-col">
            <div className="max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-3 sm:mb-4 flex-shrink-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Shopping Cart</h1>
                <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium transition-all duration-base hover:underline focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded px-2 py-1"
                >
                    Clear Cart
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 min-h-0">
                {/* Cart Items */}
                <div className="lg:col-span-2 overflow-y-auto space-y-2 sm:space-y-3 pr-2">
                    {items.map((item) => (
                        <div
                            key={item.productId}
                            className="bg-white rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md"
                        >
                            <div className="flex gap-3 sm:gap-4">
                                <img
                                    src={item.imageUrl || '/placeholder-product.png'}
                                    alt={item.productName}
                                    loading="lazy"
                                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                                    onError={(e) => {
                                        e.currentTarget.src = '/placeholder-product.png'
                                    }}
                                />

                                <div className="flex-1 min-w-0">
                                    {/* Product Name and Price */}
                                    <div className="flex justify-between items-start gap-2 mb-2 sm:mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{item.productName}</h3>
                                            <p className="text-primary-600 font-medium text-sm sm:text-base">₹{typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}</p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.productId)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full flex-shrink-0"
                                            title="Remove item"
                                            aria-label={`Remove ${item.productName} from cart`}
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>

                                    {/* Quantity Controls and Total */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-1.5 py-1">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={item.quantity <= 1}
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="w-3.5 h-3.5 text-gray-600" />
                                            </button>
                                            <span className="w-6 text-center font-medium text-sm" aria-label={`Quantity: ${item.quantity}`}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                className="p-0.5 rounded hover:bg-gray-200"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-gray-600" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-gray-900 text-base sm:text-lg">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md h-full flex flex-col">
                        <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Order Summary</h2>

                        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 flex-1">
                            <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                                <span>Items ({totalItems})</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                                <span>Taxes (5%)</span>
                                <span>₹{taxes.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-1.5 sm:pt-2 flex justify-between text-sm sm:text-base font-bold">
                                <span>Total</span>
                                <span className="text-primary-600">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-primary-600 text-white py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center hover:shadow-md"
                            >
                                Proceed to Checkout
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
                            </button>

                            <button
                                onClick={() => navigate('/products')}
                                className="w-full border border-gray-300 text-gray-700 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg hover:bg-gray-50 font-medium hover:shadow-sm"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}

export default Cart
