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

    const totalAmount = getTotalAmount()

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
            // Initiate payment
            const paymentIntent = await paymentService.initiatePayment(totalAmount)
            setPaymentId(paymentIntent.paymentId)
            setPaymentStatus(PaymentStatus.INITIATED)

            // Simulate UPI payment flow (in real app, this would open UPI app)
            // For demo purposes, we'll simulate payment verification
            setTimeout(() => {
                handleVerifyPayment(paymentIntent.paymentId)
            }, 2000)

        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to initiate payment')
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                        <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-pulse" />
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Processing Payment</h3>
                        <p className="text-blue-700">Please wait while we verify your payment...</p>
                        <LoadingSpinner className="mx-auto mt-4" />
                    </div>
                )

            case PaymentStatus.SUCCESS:
                return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-green-900 mb-2">Payment Successful!</h3>
                        <p className="text-green-700">Creating your order and generating digital bill...</p>
                        <LoadingSpinner className="mx-auto mt-4" />
                    </div>
                )

            case PaymentStatus.FAILED:
            case PaymentStatus.CANCELLED:
                return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Payment Failed</h3>
                        <p className="text-red-700 mb-4">Your payment could not be processed.</p>
                        <button
                            onClick={() => {
                                setPaymentId(null)
                                setPaymentStatus(null)
                                setError(null)
                            }}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>

            {error && (
                <div className="mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {paymentStatus ? (
                renderPaymentStatus()
            ) : (
                <>
                    {/* Order Summary */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-4">
                            {items.map((item) => (
                                <div key={item.productId} className="flex justify-between text-gray-700">
                                    <span>
                                        {item.productName} × {item.quantity}
                                    </span>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-3 flex justify-between text-lg font-bold">
                            <span>Total Amount</span>
                            <span className="text-primary-600">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Delivery Details</h2>
                        <div className="space-y-2 text-gray-700">
                            <p><span className="font-medium">Name:</span> {user?.name}</p>
                            <p><span className="font-medium">Email:</span> {user?.email}</p>
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
                            className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isProcessing ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Pay ₹{totalAmount.toFixed(2)}
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => navigate('/cart')}
                            disabled={isProcessing}
                            className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                        >
                            Back to Cart
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default Checkout
