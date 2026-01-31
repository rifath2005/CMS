import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Cart = () => {
    const navigate = useNavigate()
    const { items, removeItem, updateQuantity, getTotalAmount, getTotalItems, clearCart } = useCartStore()

    const totalAmount = getTotalAmount()
    const totalItems = getTotalItems()

    const handleCheckout = () => {
        if (items.length > 0) {
            navigate('/checkout')
        }
    }

    if (items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-6">Add some delicious items to get started!</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
                    >
                        Browse Products
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Shopping Cart</h1>
                <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                >
                    Clear Cart
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.productId}
                            className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-4"
                        >
                            {/* Product Image */}
                            <img
                                src={item.imageUrl || '/placeholder-product.png'}
                                alt={item.productName}
                                className="w-20 h-20 object-cover rounded-lg"
                                onError={(e) => {
                                    e.currentTarget.src = '/placeholder-product.png'
                                }}
                            />

                            {/* Product Details */}
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                                <p className="text-primary-600 font-medium">₹{item.price.toFixed(2)}</p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                    disabled={item.quantity <= 1}
                                >
                                    <Minus className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <Plus className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>

                            {/* Subtotal */}
                            <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => removeItem(item.productId)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Remove item"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Items ({totalItems})</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Delivery</span>
                                <span className="text-green-600 font-medium">Free</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary-600">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center"
                        >
                            Proceed to Checkout
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>

                        <button
                            onClick={() => navigate('/products')}
                            className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Cart
