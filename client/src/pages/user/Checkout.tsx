import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../store/cartStore'
import { useAuthStore } from '../../store/authStore'
import { useWalletStore } from '../../store/walletStore'
import { walletService } from '../../services/walletService'
import ErrorAlert from '../../components/ErrorAlert'
import { Wallet, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { cn } from '../../lib/utils'

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
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
                                <div className="space-y-2 text-muted-foreground">
                                    <p><span className="font-medium text-foreground">Name:</span> {user?.name}</p>
                                    <p><span className="font-medium text-foreground">Email:</span> {user?.email}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Items */}
                        <Card>
                            <CardContent className="p-6">
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
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Wallet Payment Section */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4">Payment Method</h2>

                                {/* Wallet Balance Display */}
                                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 sm:p-6 text-white mb-4">
                                    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                                        <Wallet className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                                        <span className="font-semibold text-sm sm:text-base">Wallet Balance</span>
                                        <span className="text-xl sm:text-2xl font-bold">₹{walletBalance.toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs sm:text-sm opacity-90 text-center">
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

                                <Button
                                    onClick={handleWalletPayment}
                                    disabled={isProcessing || !hasSufficientBalance}
                                    variant="default"
                                    size="lg"
                                    className="w-full"
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
                                </Button>

                                <Button
                                    onClick={() => navigate('/cart')}
                                    disabled={isProcessing}
                                    variant="outline"
                                    size="lg"
                                    className="w-full mt-3"
                                >
                                    Back to Cart
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sticky Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-20">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Taxes (5%)</span>
                                        <span>₹{taxes.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="bg-muted rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-2">Payment Details:</p>
                                    <ul className="text-sm space-y-1">
                                        <li>• Instant wallet payment</li>
                                        <li>• Secure transaction</li>
                                        <li>• Digital bill generation</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
