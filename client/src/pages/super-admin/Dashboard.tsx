import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Users, Store, TrendingUp, ShoppingCart, Wallet, CheckCircle, Activity, ArrowUpRight } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import axios from 'axios'

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

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate()

    console.log('Dashboard Render:', { isLoading, stats, error })

    useEffect(() => {
        console.log('Dashboard mounted, fetching stats...')
        fetchPlatformStats()
    }, [])

    const fetchPlatformStats = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                navigate('/login')
                return
            }

            const response = await axios.get('/api/v1/super-admin/stats', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.data.success) {
                setStats(response.data.data)
                setError(null)
            } else {
                setError('Failed to load statistics')
            }
        } catch (error: any) {
            console.error('Failed to fetch platform stats:', error)
            
            if (error.response?.status === 401) {
                // Token expired or invalid - redirect to login
                localStorage.removeItem('token') // Clear invalid token
                localStorage.removeItem('user')  // Clear user data if stored
                navigate('/login')
                return
            }

            if (error.response?.status === 500) {
                setError('Server error. Please try again later.')
            } else {
                setError(error.response?.data?.error?.message || 'Failed to load statistics')
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-500">Loading Dashboard...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Dashboard</div>
                    <div className="text-gray-600">{error}</div>
                    <button 
                        onClick={fetchPlatformStats}
                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
                    <p className="text-gray-600 mt-2">Real-time platform performance metrics</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span>System Operational</span>
                </div>
            </div>

            {/* Primary Stats Grid - Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Revenue Card - Premium Gold/Yellow Gradient */}
                 <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="text-yellow-100 font-medium text-sm">Total Revenue</p>
                            <h3 className="text-3xl font-bold mt-1">₹{(stats?.totalRevenue || 0).toLocaleString()}</h3>
                        </div>
                        <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center text-sm text-yellow-100 bg-white/10 w-fit px-2 py-1 rounded-lg">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        <span>All time</span>
                    </div>
                </div>

                {/* Institutions Card - Corporate Blue Gradient */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="text-blue-100 font-medium text-sm">Institutions</p>
                            <h3 className="text-3xl font-bold mt-1">{stats?.totalInstitutions || 0}</h3>
                        </div>
                        <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-blue-100">
                        {stats?.activeInstitutions || 0} active currently
                    </p>
                </div>

                {/* Vendors Card - Vibrant Purple Gradient */}
                <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="text-purple-100 font-medium text-sm">Total Vendors</p>
                            <h3 className="text-3xl font-bold mt-1">{stats?.totalVendors || 0}</h3>
                        </div>
                        <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <Store className="w-5 h-5 text-white" />
                        </div>
                    </div>
                     <p className="text-sm text-purple-100">
                        Across all institutions
                    </p>
                </div>

                 {/* Payment Volume Card - Emerald Green Gradient */}
                 <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="text-emerald-100 font-medium text-sm">Vol (Today)</p>
                            <h3 className="text-3xl font-bold mt-1">₹{(stats?.paymentVolume || 0).toLocaleString()}</h3>
                        </div>
                        <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                    </div>
                     <div className="flex items-center text-sm text-emerald-100 bg-white/10 w-fit px-2 py-1 rounded-lg">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        <span>Daily processing</span>
                    </div>
                </div>
            </div>

            {/* Secondary Stats Grid */}
            <h2 className="text-lg font-semibold text-gray-800 mt-8">Operational Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Orders Today */}
                 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-100 p-3 rounded-full">
                            <ShoppingCart className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Today</span>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-bold text-gray-900">{stats?.ordersToday || 0}</h4>
                        <p className="text-sm text-gray-500">Orders placed</p>
                    </div>
                     <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Active Now:</span>
                        <span className="font-semibold text-gray-900">{stats?.activeOrders || 0}</span>
                    </div>
                </div>

                {/* Total Users */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                         <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</h4>
                        <p className="text-sm text-gray-500">Registered Users</p>
                    </div>
                     <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Growth:</span>
                        <span className="font-semibold text-green-600">+12%</span>
                    </div>
                </div>

                 <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                         <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Health</span>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-2xl font-bold text-gray-900">99.9%</h4>
                        <p className="text-sm text-gray-500">Uptime</p>
                    </div>
                     <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-semibold text-green-600">Healthy</span>
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-gray-50 rounded-xl p-6 border border-dashed border-gray-300 flex flex-col justify-center items-center text-center space-y-4">
                    <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                    <button className="w-full py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
                        Add Institution
                    </button>
                    <button className="w-full py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
                        View Audit Logs
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SuperAdminDashboard
