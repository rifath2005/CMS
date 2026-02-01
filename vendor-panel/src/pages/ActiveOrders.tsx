import { useState, useEffect } from 'react'
import { orderService } from '../services/orderService'
import { Order, OrderStatus } from '../types'
import { useWebSocket } from '../contexts/WebSocketContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { StatusChip } from '../components/shared'
import { Clock, User, Calendar, ShoppingBag, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const ActiveOrders = () => {
    const { socket } = useWebSocket()
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [previousStatuses, setPreviousStatuses] = useState<Record<string, OrderStatus>>({})

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

            // Sort orders with oldest first (by createdAt)
            const sortedOrders = [...data].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )

            // Track status changes for animations
            const newStatuses: Record<string, OrderStatus> = {}
            sortedOrders.forEach(order => {
                newStatuses[order.id] = order.status
            })
            setPreviousStatuses(newStatuses)

            setOrders(sortedOrders)

            // Auto-select first order if none selected
            if (!selectedOrder && sortedOrders.length > 0) {
                setSelectedOrder(sortedOrders[0])
            } else if (selectedOrder) {
                // Update selected order if it still exists
                const updatedSelected = sortedOrders.find(o => o.id === selectedOrder.id)
                if (updatedSelected) {
                    setSelectedOrder(updatedSelected)
                } else {
                    // Selected order no longer active, select first one
                    setSelectedOrder(sortedOrders[0] || null)
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load orders')
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.READY:
                return 'ready'
            case OrderStatus.PREPARING:
                return 'preparing'
            case OrderStatus.PENDING:
                return 'pending'
            default:
                return 'inactive'
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
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Active Orders</h1>
                    <p className="text-gray-600 mt-1">
                        {orders.length} {orders.length === 1 ? 'order' : 'orders'} to prepare
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px] min-w-[44px]"
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
                <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                    {/* Left Panel - Active Orders List (40% on desktop, full width on mobile) */}
                    <div className="w-full lg:w-2/5 flex flex-col">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-4 border-b bg-gray-50">
                                <h2 className="font-semibold text-lg">Orders Queue</h2>
                                <p className="text-sm text-gray-600">Oldest orders first</p>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {orders.map((order) => {
                                    const isSelected = selectedOrder?.id === order.id
                                    const hasStatusChanged = previousStatuses[order.id] !== order.status

                                    return (
                                        <button
                                            key={order.id}
                                            onClick={() => setSelectedOrder(order)}
                                            className={clsx(
                                                'w-full text-left p-4 border-b transition-all duration-200 min-h-[44px]',
                                                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
                                                isSelected && 'bg-primary-50 border-l-4 border-l-primary-600',
                                                !isSelected && 'border-l-4 border-l-transparent',
                                                hasStatusChanged && 'animate-pulse'
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                                        <span className="font-semibold text-gray-900 truncate">
                                                            {order.userName}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span>
                                                            {new Date(order.createdAt).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className={clsx(
                                                    'w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200',
                                                    isSelected && 'text-primary-600 transform translate-x-1'
                                                )} />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <StatusChip
                                                    status={getStatusColor(order.status) as any}
                                                    size="sm"
                                                    showIcon
                                                />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    ₹{order.totalAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Order Details (60% on desktop, full width on mobile) */}
                    <div className="w-full lg:w-3/5 flex flex-col">
                        {selectedOrder ? (
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
                                {/* Order Header */}
                                <div className="p-4 sm:p-6 border-b bg-gray-50">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 truncate">
                                                Order #{selectedOrder.id.slice(0, 8)}
                                            </h2>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <User className="w-4 h-4 flex-shrink-0" />
                                                    <span className="font-medium truncate">{selectedOrder.userName}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                                    <span>
                                                        {new Date(selectedOrder.createdAt).toLocaleString([], {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right flex-shrink-0">
                                            <StatusChip
                                                status={getStatusColor(selectedOrder.status) as any}
                                                size="lg"
                                                showIcon
                                            />
                                            <p className="text-2xl sm:text-3xl font-bold text-primary-600 mt-2">
                                                ₹{selectedOrder.totalAmount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Order Age and Expiry */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm bg-white rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                            <span className="text-gray-600">
                                                Ordered {Math.floor((Date.now() - new Date(selectedOrder.createdAt).getTime()) / 60000)} min ago
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                            <span className="text-amber-600 font-medium">
                                                Expires: {getRemainingTime(selectedOrder.billExpiresAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                    <h3 className="font-semibold text-lg mb-4">Order Items</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <img
                                                    src={item.imageUrl || '/placeholder-product.png'}
                                                    alt={item.productName}
                                                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/placeholder-product.png'
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-600">
                                                        ₹{item.price.toFixed(2)} × {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-base sm:text-lg font-bold text-gray-900">
                                                        ₹{(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Footer */}
                                <div className="p-4 sm:p-6 border-t bg-gray-50">
                                    <div className="text-xs sm:text-sm text-gray-600">
                                        <span className="font-medium">Payment ID:</span>{' '}
                                        <span className="font-mono break-all">{selectedOrder.paymentId.slice(0, 16)}...</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm p-12 text-center h-full flex items-center justify-center">
                                <div>
                                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Select an order to view details</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ActiveOrders
