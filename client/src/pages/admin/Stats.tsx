import { useState, useEffect } from 'react'
import { institutionService, DashboardStats } from '../../services/institutionService'
import { useAuthStore } from '../../store/authStore'
import {
    TrendingUp,
    TrendingDown,
    Users,
    ShoppingCart,
    DollarSign,
    Building2,
    Calendar,
    BarChart3
} from 'lucide-react'
import ErrorAlert from '../../components/ErrorAlert'
import { KPICard } from '../../components/shared/KPICard'
import DashboardSkeleton from '../../components/DashboardSkeleton'
import { cache } from '../../utils/cache'

const InstitutionStats = () => {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<DashboardStats>({
        activeCanteens: 0,
        pendingApprovals: 0,
        ordersToday: 0,
        dailyRevenue: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')

    useEffect(() => {
        if (user?.institutionId) {
            loadStats()
        }
    }, [user, timeRange])

    const loadStats = async () => {
        if (!user?.institutionId) return

        try {
            // Check cache first
            const cacheKey = `stats-${user.institutionId}-${timeRange}`
            const cachedData = cache.get<DashboardStats>(cacheKey)
            
            if (cachedData) {
                setStats(cachedData)
                setLoading(false)
                // Load fresh data in background
                loadFreshStats(cacheKey)
                return
            }

            setLoading(true)
            await loadFreshStats(cacheKey)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load statistics')
            setLoading(false)
        }
    }

    const loadFreshStats = async (cacheKey: string) => {
        if (!user?.institutionId) return

        try {
            const data = await institutionService.getDashboardStats(user.institutionId)
            setStats(data)
            // Cache for 30 seconds
            cache.set(cacheKey, data, 30000)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <DashboardSkeleton />

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">
                            Admin / <span className="text-blue-600">Statistics</span>
                        </div>
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Institution Statistics</h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Analytics and insights for your institution
                        </p>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        <button
                            onClick={() => setTimeRange('today')}
                            className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                timeRange === 'today'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setTimeRange('week')}
                            className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                timeRange === 'week'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setTimeRange('month')}
                            className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                timeRange === 'month'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Month
                        </button>
                    </div>
                </div>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            {/* Overview KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={`$${stats.dailyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtitle="↑ 12.5% vs last period"
                    icon={<DollarSign className="h-6 w-6" />}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <KPICard
                    title="Total Orders"
                    value={stats.ordersToday}
                    subtitle="↑ 8.2% vs last period"
                    icon={<ShoppingCart className="h-6 w-6" />}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <KPICard
                    title="Active Canteens"
                    value={stats.activeCanteens}
                    subtitle="100% operational"
                    icon={<Building2 className="h-6 w-6" />}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
                <KPICard
                    title="Avg Order Value"
                    value={stats.ordersToday > 0 ? `$${(stats.dailyRevenue / stats.ordersToday).toFixed(2)}` : '$0.00'}
                    subtitle="↑ 5.3% vs last period"
                    icon={<TrendingUp className="h-6 w-6" />}
                    iconColor="text-orange-600"
                    iconBgColor="bg-orange-100"
                />
            </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {/* Revenue Trend */}
                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">This Period</span>
                            <span className="text-lg font-bold text-gray-900">
                                ${stats.dailyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium">+12.5%</span>
                            <span className="text-gray-600">vs last period</span>
                        </div>
                    </div>
                </div>

                    {/* Order Volume */}
                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Order Volume</h3>
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Orders</span>
                            <span className="text-lg font-bold text-gray-900">
                                {stats.ordersToday}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600 font-medium">+8.2%</span>
                            <span className="text-gray-600">vs last period</span>
                        </div>
                    </div>
                </div>
            </div>

                {/* Canteen Performance */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Canteen Performance</h3>
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                    {/* Sample canteen performance data */}
                    {[
                        { name: 'Main Canteen', orders: 45, revenue: 1250, trend: 'up' },
                        { name: 'Engineering Block', orders: 32, revenue: 890, trend: 'up' },
                        { name: 'Medical Campus', orders: 28, revenue: 780, trend: 'down' },
                        { name: 'Sports Complex', orders: 15, revenue: 420, trend: 'up' },
                    ].map((canteen, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900">{canteen.name}</h4>
                                    <p className="text-sm text-gray-600">{canteen.orders} orders</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">
                                        ${canteen.revenue.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-1 text-sm">
                                        {canteen.trend === 'up' ? (
                                            <>
                                                <TrendingUp className="h-3 w-3 text-green-600" />
                                                <span className="text-green-600">+5.2%</span>
                                            </>
                                        ) : (
                                            <>
                                                <TrendingDown className="h-3 w-3 text-red-600" />
                                                <span className="text-red-600">-2.1%</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <h4 className="font-medium text-gray-900">Active Users</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">1,248</p>
                    <p className="text-sm text-gray-600 mt-1">↑ 15% this month</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <h4 className="font-medium text-gray-900">Peak Hours</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">12-2 PM</p>
                    <p className="text-sm text-gray-600 mt-1">Lunch rush time</p>
                </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <h4 className="font-medium text-gray-900">Growth Rate</h4>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">+12.5%</p>
                        <p className="text-sm text-gray-600 mt-1">Month over month</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InstitutionStats
