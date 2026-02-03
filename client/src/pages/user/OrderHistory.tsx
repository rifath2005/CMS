import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../../services/orderService'
import { Order, OrderStatus } from '../../types'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { useAuthStore } from '../../store/authStore'
import ErrorAlert from '../../components/ErrorAlert'
import { StatusChip } from '../../components/shared'
import { Package, Calendar, Filter, ShoppingBag, X } from 'lucide-react'

const OrderHistory = () => {
    const navigate = useNavigate()
    const { socket } = useWebSocket()
    const { user } = useAuthStore()

    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [vendorFilter, setVendorFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')

    useEffect(() => {
        fetchOrderHistory()
    }, [])

    // Refetch when page becomes visible (user navigates back to this page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchOrderHistory()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        // Also refetch when component mounts (navigation)
        fetchOrderHistory()

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [user?.id])

    useEffect(() => {
        applyFilters()
    }, [orders, startDate, endDate, vendorFilter, statusFilter])

    useEffect(() => {
        if (!socket) return

        const handleOrderUpdate = (data: any) => {
            console.log('Order status update received:', data)
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.id === data.orderId ? { ...order, status: data.status } : order
                )
            )
        }

        socket.on('order:status-update', handleOrderUpdate)

        return () => {
            socket.off('order:status-update', handleOrderUpdate)
        }
    }, [socket])

    const fetchOrderHistory = async () => {
        if (!user?.id) {
            setIsLoading(false)
            return
        }

        try {
            const history = await orderService.getOrderHistory(user.id)
            setOrders(history)
            setIsLoading(false)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load order history')
            setIsLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = [...orders]

        // Filter by date range
        if (startDate) {
            filtered = filtered.filter(
                (order) => new Date(order.createdAt) >= new Date(startDate)
            )
        }
        if (endDate) {
            filtered = filtered.filter(
                (order) => new Date(order.createdAt) <= new Date(endDate)
            )
        }

        // Filter by vendor
        if (vendorFilter) {
            filtered = filtered.filter((order) =>
                order.vendorId.toLowerCase().includes(vendorFilter.toLowerCase())
            )
        }

        // Filter by status
        if (statusFilter) {
            filtered = filtered.filter((order) => order.status === statusFilter)
        }

        // Sort by most recent first
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setFilteredOrders(filtered)
    }

    const clearFilters = () => {
        setStartDate('')
        setEndDate('')
        setVendorFilter('')
        setStatusFilter('')
    }

    const mapStatusToChipType = (status: OrderStatus): 'active' | 'inactive' | 'pending' | 'ready' | 'preparing' | 'expired' => {
        switch (status) {
            case OrderStatus.DELIVERED:
                return 'active' // This will show as green "Delivered"
            case OrderStatus.READY:
                return 'ready'
            case OrderStatus.PREPARING:
                return 'preparing'
            case OrderStatus.PENDING:
                return 'pending'
            case OrderStatus.EXPIRED:
                return 'expired'
            default:
                return 'inactive'
        }
    }

    if (isLoading) {
        return (
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Order History</h1>
                    
                    {/* Skeleton Filters */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 animate-pulse">
                        <div className="h-5 sm:h-6 bg-gray-200 rounded w-24 sm:w-32 mb-3 sm:mb-4"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i}>
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mb-2"></div>
                                    <div className="h-10 sm:h-11 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Skeleton Orders */}
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200 animate-pulse">
                                <div className="flex justify-between mb-3 sm:mb-4">
                                    <div className="flex-1">
                                        <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 sm:w-40 mb-2"></div>
                                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-48 sm:w-64"></div>
                                    </div>
                                    <div className="h-6 sm:h-8 bg-gray-200 rounded w-20 sm:w-24"></div>
                                </div>
                                <div className="border-t pt-3 sm:pt-4">
                                    <div className="space-y-2 sm:space-y-3">
                                        {[...Array(2)].map((_, j) => (
                                            <div key={j} className="flex gap-2 sm:gap-3">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded"></div>
                                                <div className="flex-1">
                                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32 mb-2"></div>
                                                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-20 sm:w-24"></div>
                                                </div>
                                                <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 sm:w-16"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <div className="max-w-6xl mx-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Order History</h1>

            {error && (
                <div className="mb-4 sm:mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center">
                        <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mr-2" />
                        <h2 className="text-base sm:text-lg font-semibold">Filters</h2>
                    </div>
                    {(startDate || endDate || vendorFilter || statusFilter) && (
                        <button
                            onClick={clearFilters}
                            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center min-h-[44px] px-2 sm:px-3"
                        >
                            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Clear All
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Vendor ID
                        </label>
                        <input
                            type="text"
                            value={vendorFilter}
                            onChange={(e) => setVendorFilter(e.target.value)}
                            placeholder="e.g., SS1, SS2"
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                            style={{ 
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                                fontWeight: '400',
                                fontSize: '14px'
                            }}
                        >
                            <option value="" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif', fontWeight: '400', fontSize: '14px' }}>All Statuses</option>
                            <option value={OrderStatus.DELIVERED} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif', fontWeight: '400', fontSize: '14px' }}>Delivered</option>
                            <option value={OrderStatus.EXPIRED} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif', fontWeight: '400', fontSize: '14px' }}>Expired</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders List - Card-based layout */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
                    <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                        {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                        {orders.length === 0
                            ? 'Start ordering to see your history here!'
                            : 'Try adjusting your filters'}
                    </p>
                    {orders.length === 0 && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-primary-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
                        >
                            Browse Products
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    {filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md border border-gray-200"
                        >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                                        <h3 className="text-base sm:text-lg font-semibold">Order #{order.id?.slice(0, 8) || 'N/A'}</h3>
                                        <StatusChip status={mapStatusToChipType(order.status)} size="md" showIcon />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-600 gap-2 sm:gap-4">
                                        <div className="flex items-center">
                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : 'N/A'}
                                        </div>
                                        <div className="flex items-center">
                                            <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                            Vendor: {order.vendorId}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-xl sm:text-2xl font-bold text-primary-600">
                                        ₹{typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : parseFloat(order.totalAmount).toFixed(2)}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                    </p>
                                </div>
                            </div>

                            {/* Order Items - No images */}
                            <div className="border-t pt-3 sm:pt-4">
                                <div className="space-y-2">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm sm:text-base">{item.productName}</p>
                                                <p className="text-xs sm:text-sm text-gray-500">Quantity: {item.quantity} × ₹{typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}</p>
                                            </div>
                                            <p className="font-semibold text-gray-900 whitespace-nowrap ml-4 text-sm sm:text-base">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </div>
    )
}

export default OrderHistory
