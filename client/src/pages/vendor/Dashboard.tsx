import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { Order, OrderStatus } from '../../types'
import api from '../../services/api'
import { QrCodeIcon, BellIcon, ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import VendorDashboardSkeleton from '../../components/VendorDashboardSkeleton'
import { LiveCountdown } from '../../components/LiveCountdown'
import { cache } from '../../utils/cache'

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
            // Check cache first for instant loading
            const cacheKey = `vendor-dashboard-${vendorId}`
            const cachedData = cache.get<{
                orders: Order[]
                stats: VendorStats
                items: CombinedItem[]
            }>(cacheKey)

            if (cachedData) {
                setActiveOrders(cachedData.orders)
                setStats(cachedData.stats)
                setCombinedItems(cachedData.items)
                setLoading(false)
                // Load fresh data in background
                loadFreshDashboardData(cacheKey)
                return
            }

            setLoading(true)
            await loadFreshDashboardData(cacheKey)
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
            setLoading(false)
        }
    }

    const loadFreshDashboardData = async (cacheKey: string) => {
        if (!vendorId) return

        try {
            // Parallel fetching for faster response
            const [ordersRes, statsRes, itemsRes] = await Promise.all([
                api.get(`/vendor/${vendorId}/active-orders`),
                api.get(`/vendor/${vendorId}/stats`),
                api.get(`/vendor/${vendorId}/combined-items`)
            ])

            const orders = ordersRes.data.data
            const items = itemsRes.data.data
            const realStats = statsRes.data.data

            const stats = {
                activeOrdersCount: realStats.activeOrdersCount,
                completedToday: realStats.completedToday,
                avgWaitTime: realStats.avgWaitTime,
                waitTimeTrend: 0
            }

            setActiveOrders(orders)
            setCombinedItems(items)
            setStats(stats)

            // Cache for 15 seconds (vendor data changes frequently)
            cache.set(cacheKey, { orders, stats, items }, 15000)
        } finally {
            setLoading(false)
        }
    }

    const fetchOrderHistory = async () => {
        if (!vendorId) return

        try {
            // Check cache first
            const cacheKey = `vendor-history-${vendorId}`
            const cachedHistory = cache.get<Order[]>(cacheKey)

            if (cachedHistory) {
                setOrderHistory(cachedHistory)
                return
            }

            const response = await api.get(`/vendor/${vendorId}/order-history`)
            const history = response.data.data
            setOrderHistory(history)
            
            // Cache for 60 seconds (history doesn't change as frequently)
            cache.set(cacheKey, history, 60000)
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
            // Optimistic update for instant UI feedback
            setActiveOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status } : order
            ))

            await api.patch(`/orders/${orderId}/status`, { status })
            
            // Invalidate cache and refresh
            cache.invalidatePattern('vendor-dashboard')
            fetchDashboardData()
        } catch (error) {
            console.error('Failed to update order status:', error)
            // Revert on error
            fetchDashboardData()
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
        <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0 flex-1 min-w-0">
                        <button 
                            onClick={() => handleViewChange('live')}
                            className={`px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                                currentView === 'live' 
                                    ? 'text-white bg-blue-600 shadow-md' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <span className="hidden sm:inline">Live Orders</span>
                            <span className="sm:hidden">Live</span>
                        </button>
                        <button 
                            onClick={() => handleViewChange('history')}
                            className={`px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base font-medium rounded-lg transition-colors whitespace-nowrap ${
                                currentView === 'history' 
                                    ? 'text-white bg-blue-600 shadow-md' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            History
                        </button>
                        <button 
                            onClick={() => handleViewChange('menu')}
                            className={`px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base font-medium rounded-lg transition-colors whitespace-nowrap ${
                                currentView === 'menu' 
                                    ? 'text-white bg-blue-600 shadow-md' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Menu
                        </button>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                            <button className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
                                <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                {stats.activeOrdersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 rounded-full text-[10px] sm:text-xs text-white flex items-center justify-center font-medium">
                                        {stats.activeOrdersCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-full overflow-x-hidden w-full">
                {/* Stats Cards - Show only in Live Orders view */}
                {currentView === 'live' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 max-w-full">
                        {/* Stats Cards */}
                        <div className="bg-white rounded-lg shadow p-3 sm:p-4 min-w-0">
                            <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Active Orders</p>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-2xl sm:text-3xl font-bold">{stats.activeOrdersCount}</p>
                                <span className="text-xs sm:text-sm text-green-600 font-medium">+5</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-3 sm:p-4 min-w-0">
                            <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Completed Today</p>
                            <p className="text-2xl sm:text-3xl font-bold">{stats.completedToday}</p>
                        </div>

                        <div className="bg-white rounded-lg shadow p-3 sm:p-4 min-w-0">
                            <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Avg. Wait Time</p>
                            <div className="flex items-baseline space-x-2">
                                <p className="text-2xl sm:text-3xl font-bold">{stats.avgWaitTime}m</p>
                                <span className="text-xs sm:text-sm text-green-600 font-medium">{stats.waitTimeTrend}m</span>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-lg shadow p-3 sm:p-4 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition min-w-0" onClick={() => navigate('/vendor/qr-scanner')}>
                            <div className="text-center text-white">
                                <QrCodeIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-1" />
                                <p className="text-xs sm:text-sm font-medium">Open QR Scanner</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Live Orders View - Fully Responsive */}
                {currentView === 'live' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-full">
                        {/* Live Orders Feed */}
                        <div className="lg:col-span-2 min-w-0">
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                                    <h2 className="text-base sm:text-lg font-bold">Live Orders Feed</h2>
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => setFilter('all')}
                                            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded flex-shrink-0 ${
                                                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            All ({activeOrders.length})
                                        </button>
                                        <button
                                            onClick={() => setFilter(OrderStatus.PREPARING)}
                                            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded flex-shrink-0 ${
                                                filter === OrderStatus.PREPARING ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            Preparing ({activeOrders.filter(o => o.status === OrderStatus.PREPARING).length})
                                        </button>
                                        <button
                                            onClick={() => setFilter(OrderStatus.READY)}
                                            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded flex-shrink-0 ${
                                                filter === OrderStatus.READY ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            Ready ({activeOrders.filter(o => o.status === OrderStatus.READY).length})
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 max-h-[600px] overflow-y-auto">
                                {filteredOrders.length === 0 ? (
                                    <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
                                        No active orders
                                    </div>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className={`border-2 rounded-lg p-3 sm:p-4 min-w-0 ${
                                                order.status === OrderStatus.PREPARING ? 'border-yellow-300 bg-yellow-50' :
                                                order.status === OrderStatus.READY ? 'border-green-300 bg-green-50' :
                                                'border-gray-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3 gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className="font-bold text-base sm:text-lg truncate">#{order.id.slice(0, 8).toUpperCase()}</h3>
                                                        <span className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded border flex-shrink-0 ${getStatusColor(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                                                        CUSTOMER: {order.userName || order.userId.slice(0, 8).toUpperCase()}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <LiveCountdown expiresAt={order.billExpiresAt} />
                                                </div>
                                            </div>

                                                <div className="space-y-2 mb-3 sm:mb-4">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center space-x-2 min-w-0">
                                                            <span className="font-bold text-blue-600 text-sm sm:text-base flex-shrink-0">{item.quantity}x</span>
                                                            <span className="font-medium text-sm sm:text-base truncate">{item.productName}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <button
                                                        onClick={() => {/* Print KOT */}}
                                                        className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                                                    >
                                                        PRINT KOT
                                                    </button>
                                                    {order.status === OrderStatus.PENDING && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)}
                                                            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 whitespace-nowrap"
                                                        >
                                                            START PREPARING
                                                        </button>
                                                    )}
                                                    {order.status === OrderStatus.PREPARING && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                                                            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 whitespace-nowrap"
                                                        >
                                                            MARK READY
                                                        </button>
                                                    )}
                                                    {order.status === OrderStatus.READY && (
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.DELIVERED)}
                                                            className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 whitespace-nowrap"
                                                        >
                                                            MARK DELIVERED
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Batch View */}
                    <div className="bg-white rounded-lg shadow overflow-hidden min-w-0">
                        <div className="border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <div className="flex items-center space-x-2">
                                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-600 font-bold text-sm sm:text-base">📊</span>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-sm sm:text-base truncate">Batch View</h2>
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">Aggregated quantities for cooking</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 sm:p-4 lg:p-6 max-h-[600px] overflow-y-auto">
                            {Object.entries(groupedItems).map(([category, items]) => (
                                <div key={category} className="mb-4 sm:mb-6">
                                    <h3 className="text-xs sm:text-sm font-bold text-blue-600 mb-2 sm:mb-3 uppercase">{category}</h3>
                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <div key={item.productId} className="flex items-center justify-between">
                                                <span className="text-xs sm:text-sm">{item.productName}</span>
                                                <span className="font-bold text-blue-600 text-sm sm:text-base">{item.totalQuantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {combinedItems.length === 0 && (
                                <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
                                    No items to prepare
                                </div>
                            )}

                            {combinedItems.length > 0 && (
                                <button className="w-full mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50">
                                    🖨️ Print Batch Summary
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* Order History View - Fully Responsive */}
                {currentView === 'history' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold">Order History</h2>
                                    <p className="text-xs sm:text-sm text-gray-600">Completed and delivered orders</p>
                                </div>
                                <div className="w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Search by Order ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            {filteredAndSortedHistory.length === 0 ? (
                                <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base px-3 sm:px-4 lg:px-6">
                                    {searchQuery ? 'No orders found matching your search' : 'No order history available'}
                                </div>
                            ) : (
                                <div className="min-w-full inline-block align-middle">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                    Order ID
                                                </th>
                                                <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                                    Customer
                                                </th>
                                                <th 
                                                    className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                                    onClick={() => handleSort('status')}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Status</span>
                                                        {sortField === 'status' ? (
                                                            sortDirection === 'asc' ? 
                                                                <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" /> : 
                                                                <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                                        ) : (
                                                            <ChevronUpDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                                    onClick={() => handleSort('date')}
                                                >
                                                    <div className="flex items-center space-x-1">
                                                        <span>Date & Time</span>
                                                        {sortField === 'date' ? (
                                                            sortDirection === 'asc' ? 
                                                                <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" /> : 
                                                                <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                                        ) : (
                                                            <ChevronUpDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                                    onClick={() => handleSort('amount')}
                                                >
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <span>Total</span>
                                                        {sortField === 'amount' ? (
                                                            sortDirection === 'asc' ? 
                                                                <ChevronUpIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" /> : 
                                                                <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                                        ) : (
                                                            <ChevronUpDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredAndSortedHistory.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                                                            #{order.id.slice(0, 8).toUpperCase()}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <div className="text-xs sm:text-sm text-gray-900">{order.userName || 'Guest'}</div>
                                                    </td>
                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <span className={`px-2 sm:px-3 py-1 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${
                                                            order.status === OrderStatus.DELIVERED 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <div className="text-xs sm:text-sm text-gray-900">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-[10px] sm:text-xs text-gray-500">
                                                            {new Date(order.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                        <div className="text-xs sm:text-sm font-bold text-green-600">
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
