import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useWalletStore } from '../../store/walletStore'
import { walletService } from '../../services/walletService'
import ErrorAlert from '../../components/ErrorAlert'
import { Wallet, AlertCircle } from 'lucide-react'

const Checkout = () => {
    const navigate = useNavigate()
    const { items, getTotalAmount, clearCart } = useCartStore()
    const { user } = useAuthStore()
    const { balance: walletBalance, updateBalance } = useWalletStore()

    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const subtotal = getTotalAmount()
    const taxRate = 0.05 // 5% tax
    const taxes = subtotal * taxRate
    const totalAmount = subtotal + taxes

    useEffect(() => {
        // Redirect if cart is empty
        if (items.length === 0) {
            navigate('/cart')
            return
        }

        // Load wallet balance in background (already cached)
        loadWalletBalance()
    }, [items, navigate])

    const loadWalletBalance = async () => {
        try {
            const balance = await walletService.getBalance()
            updateBalance(balance.balance)
        } catch (err: any) {
            console.error('Checkout: Failed to load wallet balance:', err)
        }
    }

    const handleWalletPayment = async () => {
        setIsProcessing(true)
        setError(null)

        try {
            if (!user?.id) {
                throw new Error('User not authenticated')
            }

            // Check if all items have vendorId
            const missingVendorId = items.some(item => !item.vendorId)
            if (missingVendorId) {
                throw new Error('Some items in your cart are missing vendor information. Please clear your cart and add items again.')
            }

            // Check if sufficient balance
            if (walletBalance < totalAmount) {
                throw new Error(
                    `Insufficient wallet balance. Available: ₹${walletBalance.toFixed(2)}, Required: ₹${totalAmount.toFixed(2)}`
                )
            }

            // Process wallet payment
            const result = await walletService.processPayment(items, totalAmount)

            updateBalance(result.newBalance) // Update cached balance immediately
            
            // Prepare bill data for instant rendering using actual API response
            const billData = {
                orderId: result.orderId,
                qrCode: result.qrCode,
                validationToken: result.validationToken,
                totalAmount: totalAmount,
                items: items.map(item => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price,
                    imageUrl: item.imageUrl
                })),
                userName: user.name,
                paymentTimestamp: new Date().toISOString(),
                expiresAt: result.expiresAt,
                isValid: true,
                isDelivered: false
            }

            // Navigate FIRST, then clear cart to avoid redirect
            navigate(`/bill/${result.orderId}`, { 
                state: { billData },
                replace: true 
            })
            
            // Clear cart after navigation
            setTimeout(() => clearCart(), 100)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || err.message || 'Payment failed')
            setIsProcessing(false)
        }
    }

    if (items.length === 0) {
        return null
    }

    const hasSufficientBalance = walletBalance >= totalAmount

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>

                {error && (
                    <div className="mb-6">
                        <ErrorAlert message={error} onClose={() => setError(null)} />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* User Details */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
                            <div className="space-y-2 text-gray-700">
                                <p><span className="font-medium">Name:</span> {user?.name}</p>
                                <p><span className="font-medium">Email:</span> {user?.email}</p>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Order Items</h2>
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={item.imageUrl || '/placeholder-product.png'}
                                                alt={item.productName}
                                                className="w-12 h-12 object-cover rounded"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/placeholder-product.png'
                                                }}
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{item.productName}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-gray-900">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Wallet Payment Section */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Payment Method</h2>

                            {/* Wallet Balance Display */}
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <Wallet className="w-6 h-6 mr-2" />
                                        <span className="font-semibold">Wallet Balance</span>
                                    </div>
                                    <span className="text-2xl font-bold">₹{walletBalance.toFixed(2)}</span>
                                </div>
                                <p className="text-sm opacity-90">
                                    Instant payment from your wallet
                                </p>
                            </div>

                            {/* Insufficient Balance Warning */}
                            {!hasSufficientBalance && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start">
                                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-900">Insufficient Balance</p>
                                        <p className="text-sm text-red-700 mt-1">
                                            You need ₹{(totalAmount - walletBalance).toFixed(2)} more to complete this order.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleWalletPayment}
                                disabled={isProcessing || !hasSufficientBalance}
                                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="w-5 h-5 mr-2" />
                                        Pay ₹{totalAmount.toFixed(2)} from Wallet
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => navigate('/cart')}
                                disabled={isProcessing}
                                className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                            >
                                Back to Cart
                            </button>
                        </div>
                    </div>

                    {/* Sticky Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Taxes (5%)</span>
                                    <span>₹{taxes.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-primary-600">₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-2">Payment Details:</p>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li>• Instant wallet payment</li>
                                    <li>• Secure transaction</li>
                                    <li>• Digital bill generation</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
