import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { Order, OrderStatus } from '../../types'
import api from '../../services/api'
import { QrCodeIcon, BellIcon, ClockIcon, ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import VendorDashboardSkeleton from '../../components/VendorDashboardSkeleton'

interface VendorStats {
    activeOrdersCount: number
    completedToday: number
    avgWaitTime: number
    waitTimeTrend: number
}

interface CombinedItem {
    productId: string
    productName: string
    totalQuantity: number
    category?: string
}

// Extend User type to include vendorId (already in User type now)

const VendorDashboard = () => {
    const { user } = useAuthStore()
    const { onOrderUpdate } = useWebSocket()
    const navigate = useNavigate()
    const [activeOrders, setActiveOrders] = useState<Order[]>([])
    const [stats, setStats] = useState<VendorStats>({
        activeOrdersCount: 0,
        completedToday: 0,
        avgWaitTime: 0,
        waitTimeTrend: 0
    })
    const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | OrderStatus>('all')
    const [vendorId, setVendorId] = useState<string | null>(null)
    const [currentView, setCurrentView] = useState<'live' | 'history' | 'menu'>('live')
    const [orderHistory, setOrderHistory] = useState<Order[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [sortField, setSortField] = useState<'status' | 'date' | 'amount'>('date')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    useEffect(() => {
        if (user?.id) {
            fetchVendorId()
        }
    }, [user])

    useEffect(() => {
        if (vendorId) {
            fetchDashboardData()
        }
    }, [vendorId])

    const fetchVendorId = async () => {
        try {
            const response = await api.get(`/canteens/user/${user?.id}`)
            if (response.data.data) {
                setVendorId(response.data.data.vendorId)
            }
        } catch (error) {
            console.error('Failed to fetch vendor ID:', error)
            setLoading(false)
        }
    }

    useEffect(() => {
        const cleanup = onOrderUpdate(() => {
            fetchDashboardData()
        })
        return cleanup
    }, [onOrderUpdate])

    const fetchDashboardData = async () => {
        if (!vendorId) return

        try {
            setLoading(true)
            const [ordersRes, , itemsRes] = await Promise.all([
                api.get(`/vendor/${vendorId}/active-orders`),
                api.get(`/vendor/${vendorId}/stats`),
                api.get(`/vendor/${vendorId}/combined-items`)
            ])

            setActiveOrders(ordersRes.data.data)
            setCombinedItems(itemsRes.data.data)
            
            // Mock stats for now - you can enhance backend to provide these
            setStats({
                activeOrdersCount: ordersRes.data.data.length,
                completedToday: 142,
                avgWaitTime: 12,
                waitTimeTrend: -2
            })
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchOrderHistory = async () => {
        if (!vendorId) return

        try {
            const response = await api.get(`/vendor/${vendorId}/order-history`)
            setOrderHistory(response.data.data)
        } catch (error) {
            console.error('Failed to fetch order history:', error)
        }
    }

    const handleViewChange = (view: 'live' | 'history' | 'menu') => {
        setCurrentView(view)
        if (view === 'history') {
            fetchOrderHistory()
        } else if (view === 'menu') {
            navigate('/vendor/products')
        }
    }

    const handleSort = (field: 'status' | 'date' | 'amount') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    const filteredAndSortedHistory = orderHistory
        .filter(order => 
            order.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            let comparison = 0
            
            if (sortField === 'status') {
                comparison = a.status.localeCompare(b.status)
            } else if (sortField === 'date') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            } else if (sortField === 'amount') {
                comparison = Number(a.totalAmount) - Number(b.totalAmount)
            }
            
            return sortDirection === 'asc' ? comparison : -comparison
        })

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status })
            fetchDashboardData()
        } catch (error) {
            console.error('Failed to update order status:', error)
        }
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING: return 'bg-gray-100 text-gray-800 border-gray-300'
            case OrderStatus.PREPARING: return 'bg-yellow-100 text-yellow-800 border-yellow-300'
            case OrderStatus.READY: return 'bg-green-100 text-green-800 border-green-300'
            case OrderStatus.DELIVERED: return 'bg-blue-100 text-blue-800 border-blue-300'
            case OrderStatus.EXPIRED: return 'bg-red-100 text-red-800 border-red-300'
            default: return 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date()
        const expires = new Date(expiresAt)
        const diff = expires.getTime() - now.getTime()
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        
        if (diff < 0) return { text: 'EXPIRED', color: 'text-red-600', isDelayed: true }
        if (diff > 600000) return { text: `${minutes}:${seconds.toString().padStart(2, '0')}`, color: 'text-green-600', isDelayed: false }
        return { text: `${minutes}:${seconds.toString().padStart(2, '0')}`, color: 'text-red-600', isDelayed: true }
    }

    const filteredOrders = filter === 'all' 
        ? activeOrders 
        : activeOrders.filter(order => order.status === filter)

    const groupedItems = combinedItems.reduce((acc, item) => {
        const category = item.category || 'OTHER'
        if (!acc[category]) acc[category] = []
        acc[category].push(item)
        return acc
    }, {} as Record<string, CombinedItem[]>)

    if (loading) {
        return <VendorDashboardSkeleton />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {user?.name || 'Main Campus Canteen'}
                        </h1>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => handleViewChange('live')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                    currentView === 'live' 
                                        ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Live Orders
                            </button>
                            <button 
                                onClick={() => handleViewChange('history')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                                    currentView === 'history' 
                                        ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                History
                            </button>
                            <button 
                                onClick={() => handleViewChange('menu')}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                            >
                                Menu Control
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
                            <BellIcon className="h-6 w-6" />
                            {stats.activeOrdersCount > 0 && (
                                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                    {stats.activeOrdersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Stats Cards - Show only in Live Orders view */}
                {currentView === 'live' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                        {/* Stats Cards */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-3xl font-bold">{stats.activeOrdersCount}</p>
                                <span className="text-sm text-green-600 font-medium">+5</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Completed Today</p>
                            <p className="text-3xl font-bold">{stats.completedToday}</p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-4">
                            <p className="text-sm text-gray-600 mb-1">Avg. Wait Time</p>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-3xl font-bold">{stats.avgWaitTime}m</p>
                                <span className="text-sm text-green-600 font-medium">{stats.waitTimeTrend}m</span>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-lg shadow p-4 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition" onClick={() => navigate('/vendor/qr-scanner')}>
                            <div className="text-center text-white">
                                <QrCodeIcon className="h-10 w-10 mx-auto mb-1" />
                                <p className="text-sm font-medium">Open QR Scanner</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Live Orders View */}
                {currentView === 'live' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Live Orders Feed */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow">
                                <div className="border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold">Live Orders Feed</h2>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setFilter('all')}
                                            className={`px-3 py-1 text-sm rounded ${
                                                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            All ({activeOrders.length})
                                        </button>
                                        <button
                                            onClick={() => setFilter(OrderStatus.PREPARING)}
                                            className={`px-3 py-1 text-sm rounded ${
                                                filter === OrderStatus.PREPARING ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            Preparing ({activeOrders.filter(o => o.status === OrderStatus.PREPARING).length})
                                        </button>
                                        <button
                                            onClick={() => setFilter(OrderStatus.READY)}
                                            className={`px-3 py-1 text-sm rounded ${
                                                filter === OrderStatus.READY ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            Ready ({activeOrders.filter(o => o.status === OrderStatus.READY).length})
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                                {filteredOrders.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No active orders
                                    </div>
                                ) : (
                                    filteredOrders.map((order) => {
                                        const timeInfo = getTimeRemaining(order.billExpiresAt)
                                        return (
                                            <div
                                                key={order.id}
                                                className={`border-2 rounded-lg p-4 ${
                                                    order.status === OrderStatus.PREPARING ? 'border-yellow-300 bg-yellow-50' :
                                                    order.status === OrderStatus.READY ? 'border-green-300 bg-green-50' :
                                                    timeInfo.isDelayed ? 'border-red-300 bg-red-50' :
                                                    'border-gray-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="font-bold text-lg">#{order.id.slice(0, 8).toUpperCase()}</h3>
                                                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">CUSTOMER: {order.userId.slice(0, 8).toUpperCase()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`flex items-center space-x-1 ${timeInfo.color} font-medium`}>
                                                            <ClockIcon className="h-4 w-4" />
                                                            <span>{timeInfo.text}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center space-x-2">
                                                            <span className="font-bold text-blue-600">{item.quantity}x</span>
                                                            <span className="font-medium">{item.productName}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => {/* Print KOT */}}
                                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                                    >
                                                        PRINT KOT
                                                    </button>
                                                    {order.status === OrderStatus.PENDING && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)}
                                                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700"
                                                        >
                                                            START PREPARING
                                                        </button>
                                                    )}
                                                    {order.status === OrderStatus.PREPARING && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                                                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                        >
                                                            MARK READY
                                                        </button>
                                                    )}
                                                    {order.status === OrderStatus.READY && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.DELIVERED)}
                                                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                                        >
                                                            MARK DELIVERED
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Batch View */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                                    <span className="text-blue-600 font-bold">📊</span>
                                </div>
                                <div>
                                    <h2 className="font-bold">Batch View</h2>
                                    <p className="text-xs text-gray-500">Aggregated quantities for cooking</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 max-h-[600px] overflow-y-auto">
                            {Object.entries(groupedItems).map(([category, items]) => (
                                <div key={category} className="mb-6">
                                    <h3 className="text-sm font-bold text-blue-600 mb-3 uppercase">{category}</h3>
                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <div key={item.productId} className="flex items-center justify-between">
                                                <span className="text-sm">{item.productName}</span>
                                                <span className="font-bold text-blue-600">{item.totalQuantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {combinedItems.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No items to prepare
                                </div>
                            )}

                            {combinedItems.length > 0 && (
                                <button className="w-full mt-4 px-4 py-3 text-sm font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50">
                                    🖨️ Print Batch Summary
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* Order History View */}
                {currentView === 'history' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">Order History</h2>
                                    <p className="text-sm text-gray-600">Completed and delivered orders</p>
                                </div>
                                <div className="w-64">
                                    <input
                                        type="text"
                                        placeholder="Search by Order ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {filteredAndSortedHistory.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    {searchQuery ? 'No orders found matching your search' : 'No order history available'}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Order ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th 
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                    onClick={() => handleSort('status')}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Status</span>
                                                        {sortField === 'status' ? (
                                                            sortDirection === 'asc' ? 
                                                                <ChevronUpIcon className="h-4 w-4 text-blue-600" /> : 
                                                                <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                                                        ) : (
                                                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                    onClick={() => handleSort('date')}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Date & Time</span>
                                                        {sortField === 'date' ? (
                                                            sortDirection === 'asc' ? 
                                                                <ChevronUpIcon className="h-4 w-4 text-blue-600" /> : 
                                                                <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                                                        ) : (
                                                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                    onClick={() => handleSort('amount')}
                                                >
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <span>Total Amount</span>
                                                        {sortField === 'amount' ? (
                                                            sortDirection === 'asc' ? 
                                                                <ChevronUpIcon className="h-4 w-4 text-blue-600" /> : 
                                                                <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                                                        ) : (
                                                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredAndSortedHistory.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            #{order.id.slice(0, 8).toUpperCase()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{order.userName || 'Guest'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            order.status === OrderStatus.DELIVERED 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(order.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="text-sm font-bold text-green-600">
                                                            ₹{Number(order.totalAmount).toFixed(2)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VendorDashboard
