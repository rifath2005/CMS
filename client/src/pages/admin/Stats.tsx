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
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { cn } from '../../lib/utils'

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
                        <Button
                            onClick={() => setTimeRange('today')}
                            variant={timeRange === 'today' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                                "text-xs sm:text-sm",
                                timeRange !== 'today' && "text-muted-foreground"
                            )}
                        >
                            Today
                        </Button>
                        <Button
                            onClick={() => setTimeRange('week')}
                            variant={timeRange === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                                "text-xs sm:text-sm",
                                timeRange !== 'week' && "text-muted-foreground"
                            )}
                        >
                            Week
                        </Button>
                        <Button
                            onClick={() => setTimeRange('month')}
                            variant={timeRange === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                                "text-xs sm:text-sm",
                                timeRange !== 'month' && "text-muted-foreground"
                            )}
                        >
                            Month
                        </Button>
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
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        ₹{stats.dailyRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Orders</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.ordersToday}</p>
                                </div>
                                <ShoppingCart className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default InstitutionStats
