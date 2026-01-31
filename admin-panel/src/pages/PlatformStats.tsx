import { useState, useEffect } from 'react'
import { institutionService } from '../services/institutionService'
import { PlatformStats } from '../types'
import { Building2, Users, ShoppingBag, DollarSign } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'

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
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Platform Statistics</h1>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Building2 className="h-8 w-8 text-blue-600" />}
                        title="Total Institutions"
                        value={stats.totalInstitutions}
                        bgColor="bg-blue-50"
                    />
                    <StatCard
                        icon={<Users className="h-8 w-8 text-green-600" />}
                        title="Total Users"
                        value={stats.totalUsers}
                        bgColor="bg-green-50"
                    />
                    <StatCard
                        icon={<ShoppingBag className="h-8 w-8 text-purple-600" />}
                        title="Total Orders"
                        value={stats.totalOrders}
                        bgColor="bg-purple-50"
                    />
                    <StatCard
                        icon={<DollarSign className="h-8 w-8 text-yellow-600" />}
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        bgColor="bg-yellow-50"
                    />
                </div>
            )}

            <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
                <p className="text-gray-600">
                    The platform is currently serving {stats?.totalInstitutions} institutions with{' '}
                    {stats?.totalCanteens} active canteens. A total of {stats?.totalUsers} users have
                    placed {stats?.totalOrders} orders, generating ₹{stats?.totalRevenue.toLocaleString()}{' '}
                    in revenue.
                </p>
            </div>
        </div>
    )
}

function StatCard({
    icon,
    title,
    value,
    bgColor,
}: {
    icon: React.ReactNode
    title: string
    value: string | number
    bgColor: string
}) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className={`${bgColor} rounded-lg p-3 w-fit mb-4`}>{icon}</div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    )
}
