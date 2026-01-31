import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { DigitalBill as DigitalBillType } from '../types'
import { useWebSocket } from '../contexts/WebSocketContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import QRCode from '../components/QRCode'
import Timer from '../components/Timer'
import { CheckCircle, Package, User, Calendar, Receipt } from 'lucide-react'

const DigitalBill = () => {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const { socket } = useWebSocket()

    const [bill, setBill] = useState<DigitalBillType | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!orderId) {
            navigate('/orders')
            return
        }

        fetchBill()
    }, [orderId])

    useEffect(() => {
        if (!socket) return

        // Listen for order status updates
        socket.on('orderStatusUpdate', (data: any) => {
            if (data.orderId === orderId && data.status === 'DELIVERED') {
                // Refresh bill to show delivered status
                fetchBill()
            }
        })

        return () => {
            socket.off('orderStatusUpdate')
        }
    }, [socket, orderId])

    const fetchBill = async () => {
        if (!orderId) return

        try {
            setIsLoading(true)
            const billData = await orderService.getBillByOrderId(orderId)
            setBill(billData)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load digital bill')
        } finally {
            setIsLoading(false)
        }
    }

    const handleExpire = () => {
        if (bill) {
            setBill({ ...bill, isValid: false })
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (error || !bill) {
        return (
            <div className="max-w-2xl mx-auto">
                <ErrorAlert message={error || 'Bill not found'} />
                <button
                    onClick={() => navigate('/orders')}
                    className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                    ← Back to Orders
                </button>
            </div>
        )
    }

    if (bill.isDelivered) {
        return (
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
                            <span className="text-primary-600">₹{bill.totalAmount.toFixed(2)}</span>
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
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Digital Bill</h1>

            {/* Timer */}
            <div className="mb-6">
                <Timer expiresAt={bill.expiresAt} onExpire={handleExpire} />
            </div>

            {/* QR Code */}
            {bill.isValid && (
                <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                    <h2 className="text-xl font-bold text-center mb-4">Show this QR Code to Vendor</h2>
                    <div className="bg-gray-50 rounded-lg p-6">
                        <QRCode value={bill.qrCode} size={280} />
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-4">
                        The vendor will scan this code to confirm delivery
                    </p>
                </div>
            )}

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
                        <span className="text-primary-600">₹{bill.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Show this QR code to the vendor when collecting your order</li>
                    <li>The vendor will scan the code to confirm delivery</li>
                    <li>This bill is valid for 15 minutes from payment time</li>
                    <li>After expiry, you may need to contact support</li>
                </ul>
            </div>

            <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
                Back to Dashboard
            </button>
        </div>
    )
}

export default DigitalBill
