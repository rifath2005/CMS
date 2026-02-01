import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { paymentService } from '../services/paymentService'
import { orderService } from '../services/orderService'
import { PaymentStatus } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'

const Checkout = () => {
    const navigate = useNavigate()
    const { items, getTotalAmount, clearCart } = useCartStore()
    const { user } = useAuthStore()

    const [paymentId, setPaymentId] = useState<string | null>(null)
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)

    const subtotal = getTotalAmount()
    const taxRate = 0.05 // 5% tax
    const taxes = subtotal * taxRate
    const totalAmount = subtotal + taxes

    useEffect(() => {
        // Redirect if cart is empty
        if (items.length === 0) {
            navigate('/cart')
        }
    }, [items, navigate])

    const handleInitiatePayment = async () => {
        setIsProcessing(true)
        setError(null)

        try {
            if (!user?.id) {
                throw new Error('User not authenticated')
            }

            // Initiate payment
            const paymentIntent = await paymentService.initiatePayment(user.id, totalAmount)
            setPaymentId(paymentIntent.payment.id)
            setPaymentStatus(PaymentStatus.INITIATED)

            // Simulate UPI payment flow (in real app, this would open UPI app)
            // For demo purposes, we'll simulate payment verification
            setTimeout(() => {
                handleVerifyPayment(paymentIntent.payment.id)
            }, 2000)

        } catch (err: any) {
            setError(err.response?.data?.error?.message || err.message || 'Failed to initiate payment')
            setIsProcessing(false)
        }
    }

    const handleVerifyPayment = async (pId: string) => {
        try {
            // Poll for payment status
            const status = await paymentService.verifyPayment(pId)
            setPaymentStatus(status)

            if (status === PaymentStatus.SUCCESS) {
                // Create order after successful payment
                const order = await orderService.createOrder(items, pId)
                setOrderId(order.id)
                clearCart()

                // Redirect to digital bill after a short delay
                setTimeout(() => {
                    navigate(`/bill/${order.id}`)
                }, 2000)
            } else if (status === PaymentStatus.FAILED || status === PaymentStatus.CANCELLED) {
                setError('Payment failed. Please try again.')
                setIsProcessing(false)
            } else {
                // Still pending, check again
                setTimeout(() => handleVerifyPayment(pId), 2000)
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to verify payment')
            setIsProcessing(false)
        }
    }

    const renderPaymentStatus = () => {
        if (!paymentStatus) return null

        switch (paymentStatus) {
            case PaymentStatus.INITIATED:
            case PaymentStatus.PENDING:
                return (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <Clock className="w-16 h-16 text-blue-600 animate-pulse" />
                                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Processing Payment</h3>
                        <p className="text-blue-700 mb-4">Please wait while we verify your payment...</p>
                        <div className="flex justify-center">
                            <LoadingSpinner />
                        </div>
                    </div>
                )

            case PaymentStatus.SUCCESS:
                return (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-100 rounded-full p-4">
                                <CheckCircle className="w-16 h-16 text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-green-900 mb-2">Payment Successful!</h3>
                        <p className="text-green-700 mb-4">Creating your order and generating digital bill...</p>
                        <div className="flex justify-center">
                            <LoadingSpinner />
                        </div>
                    </div>
                )

            case PaymentStatus.FAILED:
            case PaymentStatus.CANCELLED:
                return (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-red-100 rounded-full p-4">
                                <XCircle className="w-16 h-16 text-red-600" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-red-900 mb-2">Payment Failed</h3>
                        <p className="text-red-700 mb-6">Your payment could not be processed. Please try again.</p>
                        <button
                            onClick={() => {
                                setPaymentId(null)
                                setPaymentStatus(null)
                                setError(null)
                                setIsProcessing(false)
                            }}
                            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium min-h-[44px] min-w-[44px]"
                        >
                            Try Again
                        </button>
                    </div>
                )

            default:
                return null
        }
    }

    if (items.length === 0) {
        return null
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>

            {/* Loading Overlay - Prevents interaction during payment processing */}
            {isProcessing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                        {renderPaymentStatus()}
                    </div>
                </div>
            )}

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

                    {/* Payment Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-4">Payment Method</h2>

                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white mb-6">
                            <div className="flex items-center mb-2">
                                <CreditCard className="w-6 h-6 mr-2" />
                                <span className="font-semibold">UPI Payment</span>
                            </div>
                            <p className="text-sm opacity-90">
                                Secure payment via UPI (Google Pay, PhonePe, Paytm, etc.)
                            </p>
                        </div>

                        <button
                            onClick={handleInitiatePayment}
                            disabled={isProcessing}
                            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]"
                        >
                            {isProcessing ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Pay ₹{typeof totalAmount === 'number' ? totalAmount.toFixed(2) : parseFloat(totalAmount).toFixed(2)}
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => navigate('/cart')}
                            disabled={isProcessing}
                            className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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
                                <span className="text-primary-600">₹{typeof totalAmount === 'number' ? totalAmount.toFixed(2) : parseFloat(totalAmount).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Payment Details:</p>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>• Secure UPI payment</li>
                                <li>• Instant confirmation</li>
                                <li>• Digital bill generation</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
