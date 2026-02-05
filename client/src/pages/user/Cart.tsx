import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { cn } from '../../lib/utils'

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
                        <Button
                            onClick={() => navigate('/products')}
                            variant="default"
                            size="lg"
                            className="inline-flex items-center"
                        >
                            Browse Products
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">Shopping Cart</h1>
                <Button
                    onClick={clearCart}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                >
                    Clear Cart
                </Button>
            </div>

            {/* Cart Items */}
            <div className="space-y-2 sm:space-y-3 mb-4">
                {items.map((item) => (
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 sm:p-4">
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
                                            <h3 className="font-semibold text-sm sm:text-base mb-1">{item.productName}</h3>
                                            <p className="text-primary font-medium text-sm sm:text-base">₹{typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}</p>
                                        </div>
                                        <Button
                                            onClick={() => removeItem(item.productId)}
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-red-50"
                                            title="Remove item"
                                            aria-label={`Remove ${item.productName} from cart`}
                                        >
                                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </Button>
                                    </div>

                                    {/* Quantity Controls and Total */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-1 bg-muted rounded-lg px-1.5 py-1">
                                            <Button
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                variant="ghost"
                                                size="icon"
                                                className="p-0.5 h-auto w-auto rounded hover:bg-gray-200"
                                                disabled={item.quantity <= 1}
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </Button>
                                            <span className="w-6 text-center font-medium text-sm" aria-label={`Quantity: ${item.quantity}`}>
                                                {item.quantity}
                                            </span>
                                            <Button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                variant="ghost"
                                                size="icon"
                                                className="p-0.5 h-auto w-auto rounded hover:bg-gray-200"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        <p className="font-bold text-base sm:text-lg">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Order Summary */}
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5 lg:p-6">
                    <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Order Summary</h2>

                    <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                        <div className="flex justify-between text-muted-foreground text-sm sm:text-base">
                            <span>Items ({totalItems})</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-sm sm:text-base">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-sm sm:text-base">
                            <span>Taxes (5%)</span>
                            <span>₹{taxes.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 sm:pt-3 flex justify-between text-base sm:text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary">₹{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 sm:space-y-3">
                        <Button
                            onClick={handleCheckout}
                            variant="default"
                            size="lg"
                            className="w-full"
                        >
                            Proceed to Checkout
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5" />
                        </Button>

                        <Button
                            onClick={() => navigate('/products')}
                            variant="outline"
                            size="lg"
                            className="w-full"
                        >
                            Continue Shopping
                        </Button>
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    )
}

export default Cart
