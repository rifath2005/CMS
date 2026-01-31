import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { Order } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { Package, Calendar, Filter, Eye, ShoppingBag } from 'lucide-react'

const OrderHistory = () => {
    const navigate = useNavigate()

    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [vendorFilter, setVendorFilter] = useState('')

    useEffect(() => {
        fetchOrderHistory()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [orders, startDate, endDate, vendorFilter])

    const fetchOrderHistory = async () => {
        try {
            setIsLoading(true)
            const history = await orderService.getOrderHistory()
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

        setFilteredOrders(filtered)
    }

    const clearFilters = () => {
        setStartDate('')
        setEndDate('')
        setVendorFilter('')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED':
                return 'bg-green-100 text-green-800'
            case 'EXPIRED':
                return 'bg-red-100 text-red-800'
            case 'READY':
                return 'bg-blue-100 text-blue-800'
            case 'PREPARING':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
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
                <div className="flex items-center mb-4">
                    <Filter className="w-5 h-5 text-gray-600 mr-2" />
                    <h2 className="text-lg font-semibold">Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {(startDate || endDate || vendorFilter) && (
                    <button
                        onClick={clearFilters}
                        className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Orders List */}
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
                            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Browse Products
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</h3>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                order.status
                                            )}`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center">
                                            <Package className="w-4 h-4 mr-1" />
                                            Vendor: {order.vendorId}
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
                                                <p className="font-medium text-gray-900">{item.productName}</p>
                                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            {order.status === 'DELIVERED' && (
                                <div className="mt-4 pt-4 border-t">
                                    <button
                                        onClick={() => navigate(`/bill/${order.id}`)}
                                        className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
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
