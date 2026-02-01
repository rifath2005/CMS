import { useState, useEffect } from 'react'
import { Building2, Users, Store, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface PlatformStats {
    totalInstitutions: number
    totalUsers: number
    totalVendors: number
    totalRevenue: number
    activeOrders: number
}

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchPlatformStats()
    }, [])

    const fetchPlatformStats = async () => {
        try {
            // TODO: Implement API call
            // const response = await api.get('/super-admin/stats')
            // setStats(response.data)

            // Mock data for now
            setStats({
                totalInstitutions: 3,
                totalUsers: 1250,
                totalVendors: 12,
                totalRevenue: 125000,
                activeOrders: 45
            })
        } catch (error) {
            console.error('Failed to fetch platform stats:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">Platform-wide overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Institutions</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.totalInstitutions || 0}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.totalUsers || 0}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Vendors</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.totalVendors || 0}
                            </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <Store className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                ₹{(stats?.totalRevenue || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left">
                        <Building2 className="w-6 h-6 text-primary-600 mb-2" />
                        <h3 className="font-semibold">Manage Institutions</h3>
                        <p className="text-sm text-gray-600">Add or edit institutions</p>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left">
                        <Users className="w-6 h-6 text-primary-600 mb-2" />
                        <h3 className="font-semibold">View All Users</h3>
                        <p className="text-sm text-gray-600">Manage platform users</p>
                    </button>
                    <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left">
                        <TrendingUp className="w-6 h-6 text-primary-600 mb-2" />
                        <h3 className="font-semibold">View Analytics</h3>
                        <p className="text-sm text-gray-600">Platform-wide reports</p>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SuperAdminDashboard
