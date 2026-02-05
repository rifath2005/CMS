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
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

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
        <div className="min-h-screen bg-gray-50/50 w-full animate-fade-in">
            {/* Header / Sub-nav */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                            <Button
                                variant={currentView === 'live' ? 'default' : 'ghost'}
                                onClick={() => handleViewChange('live')}
                                className="whitespace-nowrap"
                            >
                                Live Orders
                            </Button>
                            <Button
                                variant={currentView === 'history' ? 'default' : 'ghost'}
                                onClick={() => handleViewChange('history')}
                                className="whitespace-nowrap"
                            >
                                History
                            </Button>
                            <Button
                                variant={currentView === 'menu' ? 'default' : 'ghost'}
                                onClick={() => handleViewChange('menu')}
                                className="whitespace-nowrap"
                            >
                                Menu
                            </Button>
                        </div>
                        
                        <div className="flex items-center flex-shrink-0">
                            <Button variant="ghost" size="icon" className="relative">
                                <BellIcon className="h-5 w-5" />
                                {stats.activeOrdersCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-semantic-error rounded-full" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Stats Section - Visible in Live View */}
                {currentView === 'live' && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">{stats.activeOrdersCount}</span>
                                    <span className="text-xs font-medium text-semantic-success">+5</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                                <div className="mt-2">
                                    <span className="text-2xl font-bold">{stats.completedToday}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 flex flex-col justify-between h-full">
                                <p className="text-sm font-medium text-muted-foreground">Avg. Wait Time</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">{stats.avgWaitTime}m</span>
                                    <span className="text-xs font-medium text-semantic-success">{stats.waitTimeTrend}m</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Button 
                            className="h-full w-full bg-primary hover:bg-primary/90 flex flex-col items-center justify-center gap-2 py-3"
                            onClick={() => navigate('/vendor/qr-scanner')}
                        >
                            <QrCodeIcon className="h-6 w-6" />
                            <span>Scan QR Code</span>
                        </Button>
                    </div>
                )}

                {/* Live Orders View */}
                {currentView === 'live' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Feed Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <h2 className="text-lg font-semibold">Live Feed</h2>
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                    <Button 
                                        size="sm"
                                        variant={filter === 'all' ? 'default' : 'outline'}
                                        onClick={() => setFilter('all')}
                                    >
                                        All ({activeOrders.length})
                                    </Button>
                                    <Button 
                                        size="sm"
                                        variant={filter === OrderStatus.PREPARING ? 'default' : 'outline'}
                                        onClick={() => setFilter(OrderStatus.PREPARING)}
                                        className={filter === OrderStatus.PREPARING ? "bg-semantic-warning border-semantic-warning hover:bg-semantic-warning/90" : ""}
                                    >
                                        Preparing ({activeOrders.filter(o => o.status === OrderStatus.PREPARING).length})
                                    </Button>
                                    <Button 
                                        size="sm"
                                        variant={filter === OrderStatus.READY ? 'default' : 'outline'}
                                        onClick={() => setFilter(OrderStatus.READY)}
                                        className={filter === OrderStatus.READY ? "bg-semantic-success border-semantic-success hover:bg-semantic-success/90" : ""}
                                    >
                                        Ready ({activeOrders.filter(o => o.status === OrderStatus.READY).length})
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {filteredOrders.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                        No active orders
                                    </div>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <Card key={order.id} className={cn(
                                            "border-l-4 transition-all hover:shadow-md",
                                            order.status === OrderStatus.PREPARING ? "border-l-semantic-warning bg-yellow-50/30" :
                                            order.status === OrderStatus.READY ? "border-l-semantic-success bg-green-50/30" :
                                            "border-l-gray-300"
                                        )}>
                                            <CardContent className="p-4 sm:p-5">
                                                <div className="flex justify-between items-start gap-4 mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-lg">#{order.id.slice(0, 8).toUpperCase()}</h3>
                                                            <Badge variant={
                                                                order.status === OrderStatus.READY ? "success" :
                                                                order.status === OrderStatus.PREPARING ? "warning" : "secondary"
                                                            }>
                                                                {order.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Customer: <span className="font-medium text-foreground">{order.userName || 'Guest'}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <LiveCountdown expiresAt={order.billExpiresAt} />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-4">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-sm">
                                                            <span className="font-medium">{item.productName}</span>
                                                            <span className="font-bold font-mono">x{item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2 sm:gap-3 flex-wrap">
                                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => {/* Print */}}>
                                                        Print KOT
                                                    </Button>
                                                    {order.status === OrderStatus.PENDING && (
                                                        <Button 
                                                            className="flex-1 bg-semantic-warning hover:bg-semantic-warning/90 text-white" 
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)}
                                                        >
                                                            Start Preparing
                                                        </Button>
                                                    )}
                                                    {order.status === OrderStatus.PREPARING && (
                                                        <Button 
                                                            className="flex-1 bg-semantic-success hover:bg-semantic-success/90 text-white" 
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                                                        >
                                                            Mark Ready
                                                        </Button>
                                                    )}
                                                    {order.status === OrderStatus.READY && (
                                                        <Button 
                                                            className="flex-1 bg-semantic-info hover:bg-semantic-info/90 text-white" 
                                                            onClick={() => updateOrderStatus(order.id, OrderStatus.DELIVERED)}
                                                        >
                                                            Complete
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Batch View Column */}
                        <div className="space-y-4">
                            <Card className="sticky top-24 h-fit">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                            <span className="text-lg">📊</span>
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Kitchen Batch</CardTitle>
                                            <CardDescription>Aggregated prep list</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[60vh] lg:max-h-[600px] overflow-y-auto p-4 space-y-6">
                                        {Object.entries(groupedItems).map(([category, items]) => (
                                            <div key={category}>
                                                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{category}</h4>
                                                <div className="space-y-1">
                                                    {items.map((item) => (
                                                        <div key={item.productId} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-md transition-colors">
                                                            <span className="text-sm font-medium">{item.productName}</span>
                                                            <Badge variant="secondary" className="font-mono text-sm">
                                                                {item.totalQuantity}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {combinedItems.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                All items prepared
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t bg-muted/10">
                                         <Button variant="outline" className="w-full gap-2 border-primary text-primary hover:bg-primary/5">
                                            <span>🖨️ Print Batch</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* History View */}
                {currentView === 'history' && (
                    <Card>
                        <CardHeader className="border-b bg-muted/30">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Order History</CardTitle>
                                    <CardDescription>Past orders and transactions</CardDescription>
                                </div>
                                <div className="w-full sm:w-72">
                                    <input
                                        type="text"
                                        placeholder="Search Order ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                        <tr>
                                            <th className="px-6 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('date')}>Date</th>
                                            <th className="px-6 py-3 font-medium">Order #</th>
                                            <th className="px-6 py-3 font-medium">Customer</th>
                                            <th className="px-6 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>Status</th>
                                            <th className="px-6 py-3 font-medium text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('amount')}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredAndSortedHistory.map((order) => (
                                            <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                                                    <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono">#{order.id.slice(0, 8).toUpperCase()}</td>
                                                <td className="px-6 py-4">{order.userName || 'Guest'}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={order.status === OrderStatus.DELIVERED ? 'success' : 'destructive'} className="uppercase text-[10px]">
                                                        {order.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium">₹{Number(order.totalAmount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredAndSortedHistory.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    No history found
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default VendorDashboard
