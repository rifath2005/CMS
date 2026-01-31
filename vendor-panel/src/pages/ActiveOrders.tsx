import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'
import { Order, OrderStatus } from '../types'
import { useWebSocket } from '../contexts/WebSocketContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { Clock, CheckCircle, Package, User, Calendar, ShoppingBag } from 'lucide-react'
import clsx from 'clsx'

const ActiveOrders = () => {
    const { socket } = useWebSocket()
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchOrders()
    }, [])

    useEffect(() => {
        if (!socket) return

        // Listen for new orders
        socket.on('newOrder', () => {
            fetchOrders()
        })

        // Listen for order status updates
        socket.on('orderStatusUpdate', () => {
            fetchOrders()
        })

        return () => {
            socket.off('newOrder')
            socket.off('orderStatusUpdate')
        }
    }, [socket])

    const fetchOrders = async () => {
        try {
            setIsLoading(true)
            const data = await orderService.getActiveOrders()
            setOrders(data)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load orders')
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.READY:
                return 'bg-green-100 text-green-800 border-green-300'
            case OrderStatus.PREPARING:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300'
            case OrderStatus.PENDING:
                return 'bg-blue-100 text-blue-800 border-blue-300'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.READY:
                return <CheckCircle className="w-5 h-5" />
            case OrderStatus.PREPARING:
                return <Clock className="w-5 h-5" />
            case OrderStatus.PENDING:
                return <Package className="w-5 h-5" />
            default:
                return <Package className="w-5 h-5" />
        }
    }

    const getRemainingTime = (expiresAt: string) => {
        const now = new Date().getTime()
        const expiry = new Date(expiresAt).getTime()
        const diff = Math.max(0, Math.floor((expiry - now) / 1000))
        const minutes = Math.floor(diff / 60)
        const seconds = diff % 60
        return `${minutes}:${String(seconds).padStart(2, '0')}`
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Active Orders</h1>
                    <p className="text-gray-600 mt-1">
                        {orders.length} {orders.length === 1 ? 'order' : 'orders'} to prepare
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No active orders</h2>
                    <p className="text-gray-500">New orders will appear here automatically</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                            {/* Order Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold">
                                            Order #{order.id.slice(0, 8)}
                                        </h3>
                                        <span
                                            className={clsx(
                                                'px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1',
                                                getStatusColor(order.status)
                                            )}
                                        >
                                            {getStatusIcon(order.status)}
                                            <span>{order.status}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                                        <div className="flex items-center">
                                            <User className="w-4 h-4 mr-1" />
                                            {order.userName}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {new Date(order.createdAt).toLocaleTimeString()}
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            Expires: {getRemainingTime(order.billExpiresAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary-600">
                                        ₹{order.totalAmount.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-3">Items:</h4>
                                <div className="space-y-2">
                                    {order.items.map((item, index) => (
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
                                                <p className="text-sm text-gray-500">
                                                    Quantity: {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-medium">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Age Indicator */}
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        Ordered {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)} minutes ago
                                    </span>
                                    <span className="text-gray-600">
                                        Payment ID: {order.paymentId.slice(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ActiveOrders
