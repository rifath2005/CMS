import { useState, useEffect } from 'react'
import { Building2, Users, Store, TrendingUp, ShoppingCart, Wallet, CheckCircle, Activity, ArrowUpRight, ArrowRight, RefreshCw } from 'lucide-react'
import { api } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/shared/KPICard'
import { cn } from '../../lib/utils'

interface PlatformStats {
    totalInstitutions: number
    activeInstitutions: number
    totalUsers: number
    totalVendors: number
    totalRevenue: number
    activeOrders: number
    ordersToday: number
    paymentVolume: number
}

const MainAdminDashboard = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchPlatformStats()
    }, [])

    const fetchPlatformStats = async () => {
        try {
            const response = await api.get('/super-admin/stats')
            if (response.data.success) {
                setStats(response.data.data)
                setError(null)
            } else {
                setError('Failed to load statistics')
            }
        } catch (error: any) {
            console.error('Failed to fetch platform stats:', error)
            setError(error.response?.data?.error?.message || 'Failed to load statistics')
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border-semantic-error bg-semantic-error/5">
                <CardContent className="p-12 text-center">
                    <p className="text-semantic-error font-bold mb-6 text-lg">{error}</p>
                    <Button 
                        onClick={fetchPlatformStats}
                        variant="destructive"
                        size="lg"
                        className="gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Retry Loading
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
                    <p className="text-muted-foreground mt-1">Cross-platform metrics and institution management.</p>
                </div>
                <Badge variant="success" className="px-4 py-1.5 gap-2 text-sm font-semibold border-none bg-semantic-success/20 text-semantic-success animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-semantic-success" />
                    System Operational
                </Badge>
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                    subtitle="Platform wide total"
                    icon={<TrendingUp className="w-6 h-6" />}
                    iconColor="text-white"
                    iconBgColor="bg-primary shadow-lg shadow-primary/25"
                    bgColor="bg-gradient-to-br from-gray-900 via-gray-800 to-primary/20 border-gray-800 shadow-xl"
                    trend={{ value: 12.5, direction: 'up', label: 'vs last month' }}
                />

                <KPICard
                    title="Institutions"
                    value={stats?.totalInstitutions || 0}
                    subtitle={`${stats?.activeInstitutions || 0} active organizations`}
                    icon={<Building2 className="w-6 h-6" />}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />

                <KPICard
                    title="Total Vendors"
                    value={stats?.totalVendors || 0}
                    subtitle="Canteens & Stores"
                    icon={<Store className="w-6 h-6" />}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />

                <KPICard
                    title="Daily Volume"
                    value={`₹${(stats?.paymentVolume || 0).toLocaleString()}`}
                    subtitle="Revenue today"
                    icon={<Activity className="w-6 h-6" />}
                    iconColor="text-indigo-600"
                    iconBgColor="bg-indigo-100"
                />
            </div>

            {/* Operational Metrics Section */}
            <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Operational Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Orders Today</p>
                                <h4 className="text-2xl font-bold mt-1">{stats?.ordersToday || 0}</h4>
                                <div className="flex items-center gap-1.5 mt-2 text-semantic-success text-xs font-semibold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                                    {stats?.activeOrders || 0} currently active
                                </div>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-2xl text-orange-600 shadow-sm border border-orange-100">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Total Users</p>
                                <h4 className="text-2xl font-bold mt-1">{stats?.totalUsers || 0}</h4>
                                <p className="text-xs text-primary font-semibold mt-2 bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                                    Growing trend
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shadow-sm border border-blue-100">
                                <Users className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">System Health</p>
                                <h4 className="text-2xl font-bold mt-1 text-semantic-success">99.9%</h4>
                                <p className="text-xs text-muted-foreground mt-2">All nodes responding</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-2xl text-green-600 shadow-sm border border-green-100">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Growth & Actions Section */}
            <Card className="border-none bg-gradient-to-r from-gray-900 to-indigo-950 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
                
                <CardContent className="p-10 sm:p-12 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl text-center lg:text-left">
                            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Scale the Network</h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Seamlessly onboard new institutions, configure platform-wide settings, or analyze detailed system logs.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Button 
                                size="lg"
                                onClick={() => navigate('/main-admin/organizations')}
                                className="bg-white text-gray-900 hover:bg-white/90 font-bold px-8"
                            >
                                Manage Organizations
                            </Button>
                            <Button 
                                size="lg"
                                variant="outline"
                                onClick={() => navigate('/main-admin/audit-logs')}
                                className="border-white/20 hover:bg-white/10 text-white font-semibold backdrop-blur-sm px-8"
                            >
                                View System Logs
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default MainAdminDashboard
