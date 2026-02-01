import { useState, useEffect } from 'react'
import { institutionService } from '../services/institutionService'
import { PlatformStats } from '../types'
import { Building2, Users, ShoppingBag, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { KPICard } from '../components/shared'

export default function PlatformStatsPage() {
    const [stats, setStats] = useState<PlatformStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            setLoading(true)
            const data = await institutionService.getPlatformStats()
            setStats(data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load platform statistics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="max-h-[200vh]">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Platform Statistics</h1>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            {stats && (
                <>
                    {/* 12-column responsive grid layout for KPI cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <KPICard
                            icon={<Building2 className="h-6 w-6" />}
                            title="Total Institutions"
                            value={stats.totalInstitutions}
                            iconColor="text-blue-600"
                            bgColor="bg-white"
                        />
                        <KPICard
                            icon={<Building2 className="h-6 w-6" />}
                            title="Active Institutions"
                            value={stats.totalInstitutions}
                            iconColor="text-green-600"
                            bgColor="bg-white"
                            trend={{
                                value: 12,
                                direction: 'up',
                                label: 'vs last month'
                            }}
                        />
                        <KPICard
                            icon={<Users className="h-6 w-6" />}
                            title="Active Vendors"
                            value={stats.totalCanteens}
                            iconColor="text-purple-600"
                            bgColor="bg-white"
                            trend={{
                                value: 8,
                                direction: 'up',
                                label: 'vs last month'
                            }}
                        />
                        <KPICard
                            icon={<ShoppingBag className="h-6 w-6" />}
                            title="Total Orders Today"
                            value={stats.totalOrders}
                            iconColor="text-orange-600"
                            bgColor="bg-white"
                            trend={{
                                value: 15,
                                direction: 'up',
                                label: 'vs yesterday'
                            }}
                        />
                    </div>

                    {/* Platform Overview Section */}
                    <div className="bg-white rounded-lg shadow p-3 mb-3">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Platform Overview</h2>
                        <p className="text-gray-600">
                            The platform is currently serving {stats.totalInstitutions} institutions with{' '}
                            {stats.totalCanteens} active canteens. A total of {stats.totalUsers} users have
                            placed {stats.totalOrders} orders, generating ₹{stats.totalRevenue.toLocaleString()}{' '}
                            in revenue.
                        </p>
                    </div>

                    {/* Additional Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg shadow p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-900">User Metrics</h3>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Users</span>
                                    <span className="text-sm font-semibold text-gray-900">{stats.totalUsers}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Revenue Metrics</h3>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Revenue</span>
                                    <span className="text-sm font-semibold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
