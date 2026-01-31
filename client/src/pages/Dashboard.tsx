import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import { userService } from '../services/userService'
import { Order, UserStats } from '../types'
import { useWebSocket } from '../contexts/WebSocketContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import {
    ShoppingBag,
    TrendingUp,
    Clock,
    CheckCircle,
    Package,
    ArrowRight,
    Receipt
} from 'lucide-react'

const Dashboard = () => {
    const navigate = useNavigate()
    const { socket } = useWebSocket()

    const [activeOrders, setActiveOrders] = useState<Order[]>([])
    const [stats, setStats] = useState<UserStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    useEffect(() => {
        if (!socket) return

        // Listen for order status updates
        socket.on('orderStatusUpdate', (data: any) => {
            // Refresh active orders when status changes
            fetchActiveOrders()
        })

        return () => {
            socket.off('orderStatusUpdate')
        }
    }, [socket])

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true)
            const [ordersData, statsData] = await Promise.all([
                orderService.getActiveOrders(),
                userService.getUserStats(),
            ])
            setActiveOrders(ordersData)
            setStats(statsData)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load dashboard data')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchActiveOrders = async () => {
        try {
            const ordersData = await orderService.getActiveOrders()
            setActiveOrders(ordersData)
        } catch (err: any) {
            console.error('Failed to refresh active orders:', err)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'READY':
                return 'bg-green-100 text-green-800 border-green-300'
            case 'PREPARING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300'
            case 'PENDING':
                return 'bg-blue-100 text-blue-800 border-blue-300'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'READY':
                return <CheckCircle className="w-5 h-5" />
            case 'PREPARING':
                return <Clock className="w-5 h-5" />
            case 'PENDING':
                return <Package className="w-5 h-5" />
            default:
                return <Package className="w-5 h-5" />
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
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            {error && (
                <div className="mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
                            <ShoppingBag className="w-8 h-8 text-primary-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                        <p className="text-sm text-gray-500 mt-1">All time</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Total Spending</h3>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">₹{stats.totalSpending.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mt-1">All time</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Active Orders</h3>
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
                        <p className="text-sm text-gray-500 mt-1">In progress</p>
                    </div>
                </div>
            )}

            {/* Active Orders */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Active Orders</h2>
                    <button
                        onClick={() => navigate('/orders')}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
                    >
                        View All
                        <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                </div>

                {activeOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No active orders</h3>
                        <p className="text-gray-500 mb-6">Place an order to see it here!</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center"
                        >
                            Browse Products
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeOrders.map((order) => (
                            <div
                                key={order.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">
                                            Order #{order.id.slice(0, 8)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Vendor: {order.vendorId} • {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 ${getStatusColor(
                                                order.status
                                            )}`}
                                        >
                                            {getStatusIcon(order.status)}
                                            <span>{order.status}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <img
                                                src={item.imageUrl || '/placeholder-product.png'}
                                                alt={item.productName}
                                                className="w-10 h-10 object-cover rounded"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/placeholder-product.png'
                                                }}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{item.productName}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-medium">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t">
                                    <p className="font-bold text-lg">
                                        Total: <span className="text-primary-600">₹{order.totalAmount.toFixed(2)}</span>
                                    </p>
                                    <button
                                        onClick={() => navigate(`/bill/${order.id}`)}
                                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center"
                                    >
                                        <Receipt className="w-4 h-4 mr-1" />
                                        View Bill
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => navigate('/products')}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                                Browse Products
                            </h3>
                            <p className="text-gray-600 text-sm">Explore available items from canteens</p>
                        </div>
                        <ShoppingBag className="w-10 h-10 text-primary-600" />
                    </div>
                </button>

                <button
                    onClick={() => navigate('/orders')}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                                Order History
                            </h3>
                            <p className="text-gray-600 text-sm">View your past orders and receipts</p>
                        </div>
                        <Receipt className="w-10 h-10 text-primary-600" />
                    </div>
                </button>
            </div>
        </div>
    )
}

export default Dashboard
