import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { Order, OrderStatus } from '../types'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { StatusChip } from '../components/shared'
import { Package, Calendar, Filter, Eye, ShoppingBag, X } from 'lucide-react'

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

    useEffect(() => {
        applyFilters()
    }, [orders, startDate, endDate, vendorFilter, statusFilter])

    useEffect(() => {
        if (!socket) return

        // Listen for order status updates with real-time refresh
        const handleOrderUpdate = (data: any) => {
            console.log('Order status update received:', data)
            // Update the specific order in the list
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
        if (!user?.id) return

        try {
            setIsLoading(true)
            const history = await orderService.getOrderHistory(user.id)
            setOrders(history)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load order history')
        } finally {
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
                return 'active'
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
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Order History</h1>

            {error && (
                <div className="mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Filter className="w-5 h-5 text-gray-600 mr-2" />
                        <h2 className="text-lg font-semibold">Filters</h2>
                    </div>
                    {(startDate || endDate || vendorFilter || statusFilter) && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center min-h-[44px] px-3"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Clear All
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vendor ID
                        </label>
                        <input
                            type="text"
                            value={vendorFilter}
                            onChange={(e) => setVendorFilter(e.target.value)}
                            placeholder="e.g., SS1, SS2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                        >
                            <option value="">All Statuses</option>
                            <option value={OrderStatus.PENDING}>Pending</option>
                            <option value={OrderStatus.PREPARING}>Preparing</option>
                            <option value={OrderStatus.READY}>Ready</option>
                            <option value={OrderStatus.DELIVERED}>Delivered</option>
                            <option value={OrderStatus.EXPIRED}>Expired</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders List - Card-based layout */}
            {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                        {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {orders.length === 0
                            ? 'Start ordering to see your history here!'
                            : 'Try adjusting your filters'}
                    </p>
                    {orders.length === 0 && (
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]"
                        >
                            Browse Products
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 mb-6">
                    {filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
                        >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h3 className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</h3>
                                        <StatusChip status={mapStatusToChipType(order.status)} size="md" showIcon />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 gap-2 sm:gap-4">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className="flex items-center">
                                            <Package className="w-4 h-4 mr-1" />
                                            Vendor: {order.vendorId}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-2xl font-bold text-primary-600">
                                        ₹{order.totalAmount.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                    </p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="border-t pt-4 mb-4">
                                <div className="space-y-3">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <img
                                                src={item.imageUrl || '/placeholder-product.png'}
                                                alt={item.productName}
                                                className="w-14 h-14 object-cover rounded"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/placeholder-product.png'
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                                                <p className="text-sm text-gray-500">Quantity: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                                            </div>
                                            <p className="font-semibold text-gray-900 whitespace-nowrap">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            {(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.READY || order.status === OrderStatus.PREPARING || order.status === OrderStatus.PENDING) && (
                                <div className="pt-4 border-t">
                                    <button
                                        onClick={() => navigate(`/bill/${order.id}`)}
                                        className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center min-h-[44px]"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View Bill
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {filteredOrders.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold mb-3">Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-primary-600">{filteredOrders.length}</p>
                            <p className="text-sm text-gray-600">Total Orders</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                {filteredOrders.filter((o) => o.status === 'DELIVERED').length}
                            </p>
                            <p className="text-sm text-gray-600">Delivered</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">
                                {filteredOrders.filter((o) => o.status === 'EXPIRED').length}
                            </p>
                            <p className="text-sm text-gray-600">Expired</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary-600">
                                ₹
                                {filteredOrders
                                    .reduce((sum, order) => sum + order.totalAmount, 0)
                                    .toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">Total Spent</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OrderHistory
