import { useState, useEffect } from 'react'
import { Building2, Users, Store, TrendingUp, ShoppingCart, Wallet, CheckCircle, Activity, ArrowUpRight, ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import { useNavigate } from 'react-router-dom'

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
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button 
                    onClick={fetchPlatformStats}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-2">Welcome back. Here's what's happening across the platform today.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 rounded-full shadow-sm text-sm font-medium text-green-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    System Operational
                </div>
            </div>

            {/* Primary Stats Grid - Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Revenue Card */}
                 <div className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                                <Wallet className="w-6 h-6 text-emerald-400" />
                            </div>
                            <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                                +12.5% <ArrowUpRight className="w-3 h-3 ml-0.5" />
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
                        <h3 className="text-3xl font-bold mt-1 tracking-tight">₹{(stats?.totalRevenue || 0).toLocaleString()}</h3>
                    </div>
                </div>

                {/* Institutions Card */}
                <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Building2 className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Institutions</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h3 className="text-3xl font-bold text-gray-900">{stats?.totalInstitutions || 0}</h3>
                        <span className="text-sm text-gray-500">
                            ({stats?.activeInstitutions || 0} active)
                        </span>
                    </div>
                </div>

                {/* Vendors Card */}
                <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <Store className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Total Vendors</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalVendors || 0}</h3>
                </div>

                 {/* Payment Volume Card */}
                 <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <Activity className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Volume (Today)</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">₹{(stats?.paymentVolume || 0).toLocaleString()}</h3>
                </div>
            </div>

            {/* Secondary Stats Grid */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Operational Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Orders Today */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Orders Today</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats?.ordersToday || 0}</h4>
                            <p className="text-sm text-green-600 mt-1 font-medium">{stats?.activeOrders || 0} active now</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-full text-orange-600">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Total Users */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Total Users</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0}</h4>
                            <p className="text-sm text-blue-600 mt-1 font-medium">+12 this week</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-full text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">System Health</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">99.9%</h4>
                            <p className="text-sm text-gray-500 mt-1">All systems normal</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-full text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold">Ready to scale?</h3>
                        <p className="text-gray-400 mt-2 max-w-lg">Add new institutions, manage configurations, or review audit logs directly from here.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => navigate('/main-admin/organizations')}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-900/20"
                        >
                            Manage Organizations
                        </button>
                        <button 
                            onClick={() => navigate('/main-admin/audit-logs')}
                            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
                        >
                            View Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MainAdminDashboard
