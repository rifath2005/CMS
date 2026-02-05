import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { ChartBarIcon, CurrencyRupeeIcon, ShoppingBagIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import { cache } from '../../utils/cache'

interface Analytics {
    todayStats: {
        totalOrders: number
        totalRevenue: number
        averageOrderValue: number
        completedOrders: number
    }
    weekStats: {
        totalOrders: number
        totalRevenue: number
        dailyBreakdown: Array<{
            date: string
            orders: number
            revenue: number
        }>
    }
    topProducts: Array<{
        productId: string
        productName: string
        totalSold: number
        revenue: number
    }>
    revenueByCategory: Array<{
        category: string
        revenue: number
        orderCount: number
    }>
}

const VendorAnalytics = () => {
    const { user } = useAuthStore()
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [vendorId, setVendorId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Fetch vendorId from canteen (same as Dashboard)
    useEffect(() => {
        const fetchVendorId = async () => {
            if (!user?.id) return
            
            try {
                const response = await api.get(`/canteens/user/${user.id}`)
                if (response.data.data?.vendorId) {
                    setVendorId(response.data.data.vendorId)
                    console.log('✓ VendorId:', response.data.data.vendorId)
                } else {
                    setError('Vendor ID not found')
                }
            } catch (error) {
                console.error('Failed to fetch vendorId:', error)
                setError('Failed to load vendor information')
            }
        }
        fetchVendorId()
    }, [user])

    useEffect(() => {
        if (vendorId) {
            fetchAnalytics()
        }
    }, [vendorId])

    const fetchAnalytics = async () => {
        if (!vendorId) return

        try {
            // Check cache first for instant loading
            const cacheKey = `vendor-analytics-${vendorId}`
            const cachedAnalytics = cache.get<Analytics>(cacheKey)

            if (cachedAnalytics) {
                setAnalytics(cachedAnalytics)
                setLoading(false)
                setError(null)
                // Load fresh data in background
                loadFreshAnalytics(cacheKey)
                return
            }

            setLoading(true)
            await loadFreshAnalytics(cacheKey)
        } catch (error: any) {
            console.error('Failed to fetch analytics:', error)
            setError(error.response?.data?.error?.message || 'Failed to load analytics data')
            setLoading(false)
        }
    }

    const loadFreshAnalytics = async (cacheKey: string) => {
        if (!vendorId) return

        try {
            setError(null)
            console.log('Fetching analytics for vendor:', vendorId)
            
            const response = await api.get(`/vendor/${vendorId}/analytics`)
            console.log('Analytics response:', response.data)
            
            const analyticsData = response.data.data
            setAnalytics(analyticsData)
            
            // Cache for 30 seconds (analytics can be slightly stale)
            cache.set(cacheKey, analyticsData, 30000)
        } catch (error: any) {
            console.error('Failed to fetch analytics:', error)
            console.error('Error response:', error.response?.data)
            setError(error.response?.data?.error?.message || 'Failed to load analytics data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 font-medium mb-2">Error Loading Analytics</p>
                    <p className="text-red-500 text-sm">{error}</p>
                    <button 
                        onClick={fetchAnalytics}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-medium mb-2">No Analytics Data</p>
                    <p className="text-yellow-600 text-sm">Analytics data will appear once you have orders</p>
                </div>
            </div>
        )
    }

    return (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Analytics Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600">Track your sales performance and insights</p>
            </div>

            {/* Today's Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <ShoppingBagIcon className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                        <span className="text-xs sm:text-sm opacity-80">Today</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1">{analytics.todayStats.totalOrders}</p>
                    <p className="text-xs sm:text-sm opacity-90">Total Orders</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <CurrencyRupeeIcon className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                        <span className="text-xs sm:text-sm opacity-80">Today</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1">₹{analytics.todayStats.totalRevenue.toFixed(2)}</p>
                    <p className="text-xs sm:text-sm opacity-90">Total Revenue</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <ArrowTrendingUpIcon className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                        <span className="text-xs sm:text-sm opacity-80">Today</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1">₹{analytics.todayStats.averageOrderValue.toFixed(2)}</p>
                    <p className="text-xs sm:text-sm opacity-90">Avg Order Value</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                        <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                        <span className="text-xs sm:text-sm opacity-80">Today</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold mb-1">{analytics.todayStats.completedOrders}</p>
                    <p className="text-xs sm:text-sm opacity-90">Completed Orders</p>
                </div>
            </div>

            {/* Week Stats */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Last 7 Days Performance</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{analytics.weekStats.totalOrders}</p>
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">₹{analytics.weekStats.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {analytics.weekStats.dailyBreakdown.map((day) => (
                        <div key={day.date} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded">
                            <span className="font-medium text-xs sm:text-sm">{new Date(day.date).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <span className="text-xs sm:text-sm text-gray-600">{day.orders} orders</span>
                                <span className="font-bold text-green-600 text-xs sm:text-sm">₹{day.revenue.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Top Selling Products (Last 30 Days)</h2>
                    <div className="space-y-3">
                        {analytics.topProducts.length === 0 ? (
                            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No data available</p>
                        ) : (
                            analytics.topProducts.map((product, index) => (
                                <div key={product.productId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded">
                                    <div className="flex items-center space-x-2 sm:space-x-3">
                                        <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full font-bold text-xs sm:text-sm">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-xs sm:text-sm">{product.productName}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-600">{product.totalSold} sold</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-green-600 text-xs sm:text-sm">₹{product.revenue.toFixed(2)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Revenue by Category */}
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Revenue by Category (Last 30 Days)</h2>
                    <div className="space-y-3">
                        {analytics.revenueByCategory.length === 0 ? (
                            <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No data available</p>
                        ) : (
                            analytics.revenueByCategory.map((category) => (
                                <div key={category.category} className="p-2 sm:p-3 bg-gray-50 rounded">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-xs sm:text-sm">{category.category}</span>
                                        <span className="font-bold text-green-600 text-xs sm:text-sm">₹{category.revenue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600">
                                        <span>{category.orderCount} orders</span>
                                        <span>Avg: ₹{(category.revenue / category.orderCount).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VendorAnalytics
