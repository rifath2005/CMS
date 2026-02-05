import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import { DigitalBill as DigitalBillType } from '../../types'
import { useWebSocket } from '../../contexts/WebSocketContext'
import ErrorAlert from '../../components/ErrorAlert'
import QRCode from '../../components/QRCode'
import { CountdownTimer } from '../../components/shared/CountdownTimer'
import { CheckCircle, Package, User, Calendar, Receipt, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

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
            <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
                    <div className="max-w-2xl mx-auto overflow-x-hidden">
                        <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-center mb-4 sm:mb-6">Digital Bill</h1>
                        
                        {/* Skeleton Status Badge */}
                        <div className="mb-4 sm:mb-6 text-center">
                            <div className="inline-block h-10 sm:h-12 w-28 sm:w-32 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                        
                        {/* Skeleton QR Code */}
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 animate-pulse">
                            <div className="h-5 sm:h-6 bg-gray-200 rounded w-48 sm:w-64 mx-auto mb-3 sm:mb-4"></div>
                            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 flex items-center justify-center min-h-[220px] sm:min-h-[280px] md:min-h-[320px]">
                                <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mx-auto mt-3 sm:mt-4"></div>
                        </div>
                        
                        {/* Skeleton Countdown */}
                        <div className="mb-4 sm:mb-6 text-center">
                            <div className="h-14 sm:h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        
                        {/* Skeleton Bill Details */}
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 animate-pulse">
                            <div className="h-5 sm:h-6 bg-gray-200 rounded w-28 sm:w-32 mb-3 sm:mb-4"></div>
                            <div className="space-y-3 sm:space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-start gap-2 sm:gap-3">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded"></div>
                                        <div className="flex-1">
                                            <div className="h-3 bg-gray-200 rounded w-20 sm:w-24 mb-2"></div>
                                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-32 sm:w-40"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !bill) {
        return (
            <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
                    <div className="max-w-2xl mx-auto overflow-x-hidden">
                        <ErrorAlert message={error || 'Bill not found'} />
                        <Button
                            onClick={() => navigate('/orders')}
                            variant="ghost"
                            size="sm"
                            className="mt-3 sm:mt-4 text-primary hover:text-primary"
                        >
                            ← Back to Orders
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (bill.isDelivered) {
        return (
            <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
                    <div className="max-w-4xl mx-auto overflow-x-hidden">
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 sm:p-6 lg:p-8 text-center mb-4 sm:mb-6">
                            <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-green-600 mx-auto mb-3 sm:mb-4" />
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900 mb-2">Order Delivered!</h2>
                            <p className="text-sm sm:text-base text-green-700">Your order has been successfully delivered.</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Order Details</h3>
                            <div className="space-y-2 sm:space-y-3">
                                {bill.items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-xs sm:text-sm text-gray-700">
                                        <span>{item.productName} × {item.quantity}</span>
                                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="border-t pt-2 sm:pt-3 flex justify-between text-base sm:text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-primary-600">₹{typeof bill.totalAmount === 'number' ? bill.totalAmount.toFixed(2) : parseFloat(bill.totalAmount).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate('/orders')}
                            variant="default"
                            size="lg"
                            className="mt-4 sm:mt-6 w-full"
                        >
                            View Order History
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="max-w-4xl mx-auto overflow-x-hidden">
                    <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-center">Digital Bill</h1>

                    {/* Navigation Blocker Warning */}
                    {!canLeave && (
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-yellow-900">Please wait for your order</p>
                                <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                                    You cannot leave this page until your order is delivered or expires. 
                                    Show this QR code to the vendor to collect your order.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Status Badge - Large and Centered */}
                    <div className="mb-4 sm:mb-6 text-center">
                        <Badge
                            variant={isExpired || !bill.isValid ? "destructive" : "success"}
                            className="px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-bold border-2"
                        >
                            {isExpired || !bill.isValid ? 'Expired' : 'Valid'}
                        </Badge>
                    </div>

                    {/* QR Code - Responsive size */}
                    {!isExpired && bill.isValid && (
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-center mb-3 sm:mb-4">Show this QR Code to Vendor</h2>
                            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 flex items-center justify-center min-h-[220px] sm:min-h-[280px] md:min-h-[320px]">
                                <div className="w-full flex justify-center">
                                    <div className="w-48 sm:w-56 md:w-64">
                                        <QRCode value={bill.validationToken} size={256} />
                                    </div>
                                </div>
                            </div>
                            <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
                                The vendor will scan this code to confirm delivery
                            </p>
                        </div>
                    )}

                    {/* Expired State */}
                    {(isExpired || !bill.isValid) && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 sm:p-6 lg:p-8 text-center mb-4 sm:mb-6">
                            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">⏰</div>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-900 mb-2">Bill Expired</h2>
                            <p className="text-sm sm:text-base text-red-700">This bill has expired and can no longer be used for delivery.</p>
                            <p className="text-xs sm:text-sm text-red-600 mt-2">Please contact support if you need assistance.</p>
                        </div>
                    )}

                    {/* Countdown Timer */}
                    <div className="mb-4 sm:mb-6">
                        <CountdownTimer
                            expiresAt={new Date(bill.expiresAt)}
                            onExpire={handleExpire}
                            size="lg"
                        />
                    </div>

                    {/* Bill Details */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                        <div className="flex items-center mb-3 sm:mb-4">
                            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mr-2" />
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold">Bill Details</h2>
                        </div>

                        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                            <div className="flex items-start">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-gray-500">Customer Name</p>
                                    <p className="text-sm sm:text-base font-medium break-words">{bill.userName}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-gray-500">Order ID</p>
                                    <p className="text-xs sm:text-sm font-medium font-mono break-all max-w-full">{bill.orderId}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs sm:text-sm text-gray-500">Payment Time</p>
                                    <p className="text-sm sm:text-base font-medium break-words">
                                        {new Date(bill.paymentTimestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-3 sm:pt-4">
                            <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Order Items</h3>
                            <div className="space-y-2 sm:space-y-3">
                                {bill.items.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2 sm:space-x-3">
                                        <img
                                            src={item.imageUrl || '/placeholder-product.png'}
                                            alt={item.productName}
                                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0 max-w-full"
                                            onError={(e) => {
                                                e.currentTarget.src = '/placeholder-product.png'
                                            }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm sm:text-base font-medium break-words">{item.productName}</p>
                                            <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-sm sm:text-base font-medium whitespace-nowrap flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t mt-3 sm:mt-4 pt-3 sm:pt-4 flex justify-between text-base sm:text-lg font-bold">
                                <span>Total Amount</span>
                                <span className="text-primary-600">₹{typeof bill.totalAmount === 'number' ? bill.totalAmount.toFixed(2) : parseFloat(bill.totalAmount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">Instructions</h3>
                        <ul className="text-xs sm:text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Show this QR code to the vendor when collecting your order</li>
                            <li>The vendor will scan the code to confirm delivery</li>
                            <li>This bill is valid for 15 minutes from payment time</li>
                            <li>After expiry, you may need to contact support</li>
                        </ul>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={() => {
                            if (canLeave) {
                                navigate('/dashboard')
                            } else {
                                alert('Please wait for you order to be delivered or expire before leaving this page.')
                            }
                        }}
                        variant={canLeave ? "outline" : "secondary"}
                        size="lg"
                        className="w-full"
                        disabled={!canLeave}
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default DigitalBill
