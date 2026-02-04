import { useState, useEffect } from 'react'
import { institutionService, DashboardStats } from '../../services/institutionService'
import { useAuthStore } from '../../store/authStore'
import {
    Users,
    ShoppingCart,
    DollarSign,
    Building2,
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
                        value={`₹${stats.dailyRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        subtitle={`${timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'}`}
                        icon={<DollarSign className="h-6 w-6" />}
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <KPICard
                        title="Total Orders"
                        value={stats.ordersToday}
                        subtitle={`${timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'}`}
                        icon={<ShoppingCart className="h-6 w-6" />}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <KPICard
                        title="Active Canteens"
                        value={stats.activeCanteens}
                        subtitle={`${stats.pendingApprovals} pending approval`}
                        icon={<Building2 className="h-6 w-6" />}
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <KPICard
                        title="Avg Order Value"
                        value={stats.ordersToday > 0 ? `₹${(stats.dailyRevenue / stats.ordersToday).toFixed(2)}` : '₹0.00'}
                        subtitle="Per order average"
                        icon={<Users className="h-6 w-6" />}
                        iconColor="text-orange-600"
                        iconBgColor="bg-orange-100"
                    />
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{stats.dailyRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.ordersToday}</p>
                            </div>
                            <ShoppingCart className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InstitutionStats
