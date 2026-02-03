import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import { DigitalBill as DigitalBillType } from '../../types'
import { useWebSocket } from '../../contexts/WebSocketContext'
import ErrorAlert from '../../components/ErrorAlert'
import QRCode from '../../components/QRCode'
import { CountdownTimer } from '../../components/shared/CountdownTimer'
import { CheckCircle, Package, User, Calendar, Receipt, AlertCircle } from 'lucide-react'

const DigitalBill = () => {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { socket } = useWebSocket()

    // Get bill data from navigation state (instant rendering)
    const passedBillData = location.state?.billData

    const [bill, setBill] = useState<DigitalBillType | null>(passedBillData || null)
    const [isLoading, setIsLoading] = useState(!passedBillData) // No loading if data passed
    const [error, setError] = useState<string | null>(null)
    const [isExpired, setIsExpired] = useState(false)
    const [canLeave, setCanLeave] = useState(false)

    // Block navigation until order is delivered or expired
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!canLeave) {
                e.preventDefault()
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [canLeave])

    // Block back button navigation
    useEffect(() => {
        if (!canLeave) {
            const handlePopState = (e: PopStateEvent) => {
                e.preventDefault()
                window.history.pushState(null, '', window.location.pathname)
                alert('Please wait for your order to be delivered or expire before leaving this page.')
            }

            // Push current state to prevent back navigation
            window.history.pushState(null, '', window.location.pathname)
            window.addEventListener('popstate', handlePopState)

            return () => {
                window.removeEventListener('popstate', handlePopState)
            }
        }
    }, [canLeave])

    useEffect(() => {
        if (!orderId) {
            navigate('/orders')
            return
        }

        // If we have passed data, fetch in background to sync
        // If no passed data, fetch immediately
        if (passedBillData) {
            // Fetch in background to ensure data is synced
            fetchBillInBackground()
        } else {
            // No passed data, fetch immediately
            fetchBill()
        }
    }, [orderId])

    const fetchBillInBackground = async () => {
        if (!orderId) return

        try {
            const billData = await orderService.getBillByOrderId(orderId)
            // Update with fresh data from server
            setBill(billData)
            
            // Allow navigation if already delivered or expired
            if (billData.isDelivered || !billData.isValid) {
                setCanLeave(true)
            }
        } catch (err: any) {
            // Don't show error if we already have data
            console.error('Background fetch failed:', err)
        }
    }

    useEffect(() => {
        if (!socket || !orderId) return

        // Listen for order status updates
        const handleStatusUpdate = (data: any) => {
            console.log('Status update received:', data)
            if (data.orderId === orderId) {
                // Update bill status in real-time without refresh
                if (bill) {
                    const updatedBill = { 
                        ...bill, 
                        isDelivered: data.status === 'DELIVERED'
                    }
                    setBill(updatedBill)
                    
                    // Allow navigation if delivered or expired
                    if (data.status === 'DELIVERED' || data.status === 'EXPIRED') {
                        setCanLeave(true)
                    }
                }
            }
        }

        socket.on('order:status-update', handleStatusUpdate)
        socket.on('orderStatusUpdate', handleStatusUpdate)

        return () => {
            socket.off('order:status-update', handleStatusUpdate)
            socket.off('orderStatusUpdate', handleStatusUpdate)
        }
    }, [socket, orderId, bill])

    const fetchBill = async () => {
        if (!orderId) return

        try {
            const billData = await orderService.getBillByOrderId(orderId)
            setBill(billData)
            setIsLoading(false)
            
            // Allow navigation if already delivered or expired
            if (billData.isDelivered || !billData.isValid) {
                setCanLeave(true)
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load digital bill')
            setIsLoading(false)
            setCanLeave(true) // Allow navigation on error
        }
    }

    const handleExpire = async () => {
        setIsExpired(true)
        setCanLeave(true) // Allow navigation when expired
        
        if (bill && orderId) {
            // Update local state
            setBill({ ...bill, isValid: false })
            
            // Call backend to mark order as EXPIRED in database
            try {
                await orderService.markOrderAsExpired(orderId)
                console.log('Order marked as EXPIRED in database')
            } catch (err) {
                console.error('Failed to mark order as expired:', err)
            }
        }
    }

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6 text-center">Digital Bill</h1>
                    
                    {/* Skeleton Status Badge */}
                    <div className="mb-6 text-center">
                        <div className="inline-block h-12 w-32 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Skeleton QR Code */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
                        <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center" style={{ minHeight: '40vh' }}>
                            <div className="w-64 h-64 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mt-4"></div>
                    </div>
                    
                    {/* Skeleton Countdown */}
                    <div className="mb-6 text-center">
                        <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                    
                    {/* Skeleton Bill Details */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-40"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !bill) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <ErrorAlert message={error || 'Bill not found'} />
                    <button
                        onClick={() => navigate('/orders')}
                        className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                        ← Back to Orders
                    </button>
                </div>
            </div>
        )
    }

    if (bill.isDelivered) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-8 text-center mb-6">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-900 mb-2">Order Delivered!</h2>
                    <p className="text-green-700">Your order has been successfully delivered.</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-xl font-bold mb-4">Order Details</h3>
                    <div className="space-y-3">
                        {bill.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-gray-700">
                                <span>{item.productName} × {item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="border-t pt-3 flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary-600">₹{typeof bill.totalAmount === 'number' ? bill.totalAmount.toFixed(2) : parseFloat(bill.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/orders')}
                    className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                    View Order History
                </button>
            </div>
        </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-3xl font-bold mb-6 text-center">Digital Bill</h1>

            {/* Navigation Blocker Warning */}
            {!canLeave && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6 flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-yellow-900">Please wait for your order</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            You cannot leave this page until your order is delivered or expires. 
                            Show this QR code to the vendor to collect your order.
                        </p>
                    </div>
                </div>
            )}

            {/* Status Badge - Large and Centered */}
            <div className="mb-6 text-center">
                <span
                    className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${isExpired || !bill.isValid
                        ? 'bg-red-100 text-red-800 border-2 border-red-300'
                        : 'bg-green-100 text-green-800 border-2 border-green-300'
                        }`}
                >
                    {isExpired || !bill.isValid ? 'Expired' : 'Valid'}
                </span>
            </div>

            {/* QR Code - Occupying at least 40% of viewport height */}
            {!isExpired && bill.isValid && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-center mb-4">Show this QR Code to Vendor</h2>
                    <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center" style={{ minHeight: '40vh' }}>
                        <QRCode value={bill.qrCode} size={Math.min(window.innerWidth * 0.7, 400)} />
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-4">
                        The vendor will scan this code to confirm delivery
                    </p>
                </div>
            )}

            {/* Expired State */}
            {(isExpired || !bill.isValid) && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 text-center mb-6">
                    <div className="text-6xl mb-4">⏰</div>
                    <h2 className="text-2xl font-bold text-red-900 mb-2">Bill Expired</h2>
                    <p className="text-red-700">This bill has expired and can no longer be used for delivery.</p>
                    <p className="text-red-600 text-sm mt-2">Please contact support if you need assistance.</p>
                </div>
            )}

            {/* Countdown Timer - Large and Centered (minimum 2rem font size) */}
            <div className="mb-6">
                <CountdownTimer
                    expiresAt={new Date(bill.expiresAt)}
                    onExpire={handleExpire}
                    size="lg"
                />
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center mb-4">
                    <Receipt className="w-6 h-6 text-primary-600 mr-2" />
                    <h2 className="text-xl font-bold">Bill Details</h2>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-start">
                        <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Customer Name</p>
                            <p className="font-medium">{bill.userName}</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <Package className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Order ID</p>
                            <p className="font-medium font-mono text-sm">{bill.orderId}</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Payment Time</p>
                            <p className="font-medium">
                                {new Date(bill.paymentTimestamp).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Order Items</h3>
                    <div className="space-y-3">
                        {bill.items.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                                <img
                                    src={item.imageUrl || '/placeholder-product.png'}
                                    alt={item.productName}
                                    className="w-12 h-12 object-cover rounded"
                                    onError={(e) => {
                                        e.currentTarget.src = '/placeholder-product.png'
                                    }}
                                />
                                <div className="flex-1">
                                    <p className="font-medium">{item.productName}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t mt-4 pt-4 flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span className="text-primary-600">₹{typeof bill.totalAmount === 'number' ? bill.totalAmount.toFixed(2) : parseFloat(bill.totalAmount).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Show this QR code to the vendor when collecting your order</li>
                    <li>The vendor will scan the code to confirm delivery</li>
                    <li>This bill is valid for 15 minutes from payment time</li>
                    <li>After expiry, you may need to contact support</li>
                </ul>
            </div>

            {/* Action Button - Disabled when not allowed to leave */}
            <button
                onClick={() => {
                    if (canLeave) {
                        navigate('/dashboard')
                    } else {
                        alert('Please wait for your order to be delivered or expire before leaving this page.')
                    }
                }}
                className={`w-full py-3 rounded-lg transition-colors font-medium ${!canLeave
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
            >
                Back to Dashboard
            </button>
        </div>
        </div>
    )
}

export default DigitalBill
