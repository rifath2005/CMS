import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { Order, OrderStatus } from '../../types'
import api from '../../services/api'
import { ClockIcon } from '@heroicons/react/24/outline'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

interface VendorUser {
    id: string
    vendorId?: string
    name: string
}

const ActiveOrders = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { onOrderUpdate, onNewOrder } = useWebSocket()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | OrderStatus>('all')
    const [vendorId, setVendorId] = useState<string | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Fetch vendorId from user or from canteen
    useEffect(() => {
        const fetchVendorId = async () => {
            if ((user as VendorUser)?.vendorId) {
                setVendorId((user as VendorUser).vendorId!)
                console.log('✓ VendorId from user:', (user as VendorUser).vendorId)
            } else if (user?.id) {
                // Fallback: fetch from canteen
                try {
                    const response = await api.get(`/canteens/user/${user.id}`)
                    if (response.data.data?.vendorId) {
                        setVendorId(response.data.data.vendorId)
                        console.log('✓ VendorId from canteen:', response.data.data.vendorId)
                    }
                } catch (error) {
                    console.error('Failed to fetch vendorId:', error)
                }
            }
        }
        fetchVendorId()
    }, [user])

    // Update current time every second for countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (vendorId) {
            fetchOrders()
        }
    }, [vendorId])

    useEffect(() => {
        const cleanupUpdate = onOrderUpdate(() => {
            console.log('📢 Order status updated, refreshing...')
            fetchOrders()
        })
        const cleanupNew = onNewOrder((data) => {
            console.log('📢 New order received:', data)
            fetchOrders()
        })
        return () => {
            if (cleanupUpdate) cleanupUpdate()
            if (cleanupNew) cleanupNew()
        }
    }, [onOrderUpdate, onNewOrder, vendorId])

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
        const expires = new Date(expiresAt)
        const diff = expires.getTime() - currentTime.getTime()
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
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Active Orders</h1>
                <p className="text-sm sm:text-base text-gray-600">View and manage all active orders</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                <Button
                    onClick={() => setFilter('all')}
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                >
                    All ({orders.length})
                </Button>
                <Button
                    onClick={() => setFilter(OrderStatus.PENDING)}
                    variant={filter === OrderStatus.PENDING ? 'secondary' : 'ghost'}
                    size="sm"
                >
                    Pending ({orders.filter(o => o.status === OrderStatus.PENDING).length})
                </Button>
                <Button
                    onClick={() => setFilter(OrderStatus.PREPARING)}
                    variant={filter === OrderStatus.PREPARING ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(filter === OrderStatus.PREPARING && 'bg-semantic-warning hover:bg-semantic-warning/90')}
                >
                    Preparing ({orders.filter(o => o.status === OrderStatus.PREPARING).length})
                </Button>
                <Button
                    onClick={() => setFilter(OrderStatus.READY)}
                    variant={filter === OrderStatus.READY ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(filter === OrderStatus.READY && 'bg-semantic-success hover:bg-semantic-success/90')}
                >
                    Ready ({orders.filter(o => o.status === OrderStatus.READY).length})
                </Button>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
                        No active orders
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <Card key={order.id} className={cn(
                            "border-l-4 hover:shadow-lg transition-shadow",
                            order.status === OrderStatus.PENDING && "border-l-gray-400",
                            order.status === OrderStatus.PREPARING && "border-l-semantic-warning",
                            order.status === OrderStatus.READY && "border-l-semantic-success"
                        )}>
                            <CardContent className="p-3 sm:p-4">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-sm sm:text-base">#{order.id.slice(0, 8).toUpperCase()}</h3>
                                    <Badge 
                                        variant={
                                            order.status === OrderStatus.PENDING ? 'secondary' :
                                            order.status === OrderStatus.PREPARING ? 'warning' :
                                            order.status === OrderStatus.READY ? 'success' :
                                            order.status === OrderStatus.DELIVERED ? 'default' :
                                            'destructive'
                                        }
                                        className="text-[10px] sm:text-xs"
                                    >
                                        {order.status}
                                    </Badge>
                                </div>

                                {/* Customer & Time Info */}
                                <div className="mb-2 space-y-1.5">
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Customer name</p>
                                        <p className="text-xs sm:text-sm font-bold">{order.userName || 'Guest'}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                        <span className="text-muted-foreground">Order Time</span>
                                        <span className="font-semibold">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-red-50 rounded p-1.5">
                                        <span className="text-[10px] sm:text-xs font-medium text-gray-700">Expires In</span>
                                        <div className="flex items-center space-x-1">
                                            <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-semantic-error" />
                                            <span className="text-xs sm:text-sm font-bold text-semantic-error">{getTimeRemaining(order.billExpiresAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="mb-2 bg-muted/50 rounded p-2">
                                    <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-2">Order Items</p>
                                    <div className="space-y-1.5">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="text-xs sm:text-sm">
                                                <span className="font-bold text-primary text-xs sm:text-sm mr-1.5">{item.quantity}×</span>
                                                <span className="font-medium">{item.productName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div>
                                    {order.status === OrderStatus.PENDING && (
                                        <Button
                                            onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARING)}
                                            variant="default"
                                            size="default"
                                            className="w-full bg-semantic-warning hover:bg-semantic-warning/90 text-xs sm:text-sm"
                                        >
                                            Start Preparing
                                        </Button>
                                    )}
                                    {order.status === OrderStatus.PREPARING && (
                                        <Button
                                            onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                                            variant="default"
                                            size="default"
                                            className="w-full bg-semantic-success hover:bg-semantic-success/90 text-xs sm:text-sm"
                                        >
                                            Mark Ready
                                        </Button>
                                    )}
                                    {order.status === OrderStatus.READY && (
                                        <Button
                                            onClick={() => navigate('/vendor/qr-scanner')}
                                            variant="default"
                                            size="default"
                                            className="w-full text-xs sm:text-sm"
                                        >
                                            Open QR Scanner
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

export default ActiveOrders
