import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { Order, OrderStatus } from '../../types'
import api from '../../services/api'
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface VendorUser {
    id: string
    vendorId?: string
    name: string
}

const ActiveOrders = () => {
    const { user } = useAuthStore()
    const { onOrderUpdate } = useWebSocket()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | OrderStatus>('all')

    const vendorId = (user as VendorUser)?.vendorId || user?.id

    useEffect(() => {
        if (vendorId) {
            fetchOrders()
        }
    }, [vendorId])

    useEffect(() => {
        const cleanup = onOrderUpdate(() => {
            fetchOrders()
        })
        return cleanup
    }, [onOrderUpdate])

    const fetchOrders = async () => {
        if (!vendorId) return

        try {
            setLoading(true)
            const response = await api.get(`/vendor/${vendorId}/active-orders`)
            setOrders(response.data.data)
        } catch (error) {
            console.error('Failed to fetch orders:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status })
            fetchOrders()
        } catch (error) {
            console.error('Failed to update order status:', error)
        }
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING: return 'bg-gray-100 text-gray-800'
            case OrderStatus.PREPARING: return 'bg-yellow-100 text-yellow-800'
            case OrderStatus.READY: return 'bg-green-100 text-green-800'
            case OrderStatus.DELIVERED: return 'bg-blue-100 text-blue-800'
            case OrderStatus.EXPIRED: return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date()
        const expires = new Date(expiresAt)
        const diff = expires.getTime() - now.getTime()
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        
        if (diff < 0) return 'EXPIRED'
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(order => order.status === filter)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Active Orders</h1>
                <p className="text-gray-600">View and manage all active orders</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                        filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    All ({orders.length})
                </button>
                <button
                    onClick={() => setFilter(OrderStatus.PENDING)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                        filter === OrderStatus.PENDING ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    Pending ({orders.filter(o => o.status === OrderStatus.PENDING).length})
                </button>
                <button
                    onClick={() => setFilter(OrderStatus.PREPARING)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                        filter === OrderStatus.PREPARING ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    Preparing ({orders.filter(o => o.status === OrderStatus.PREPARING).length})
                </button>
                <button
                    onClick={() => setFilter(OrderStatus.READY)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                        filter === OrderStatus.READY ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                >
                    Ready ({orders.filter(o => o.status === OrderStatus.READY).length})
                </button>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No active orders
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-600">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-lg">#{order.id.slice(0, 8).toUpperCase()}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="mb-3">
                                <p className="text-sm text-gray-600">Customer: {order.userId.slice(0, 8)}</p>
                                <p className="text-sm text-gray-600">Time: {new Date(order.createdAt).toLocaleTimeString()}</p>
                                <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>Expires: {getTimeRemaining(order.billExpiresAt)}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Items:</p>
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="text-sm text-gray-700">
                                        {item.quantity}x {item.productName}
                                    </div>
                                ))}
                            </div>

                            <div className="flex space-x-2">
                                {order.status === OrderStatus.PENDING && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700"
                                    >
                                        Start Preparing
                                    </button>
                                )}
                                {order.status === OrderStatus.PREPARING && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                    >
                                        Mark Ready
                                    </button>
                                )}
                                {order.status === OrderStatus.READY && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, OrderStatus.DELIVERED)}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                    >
                                        Mark Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default ActiveOrders
