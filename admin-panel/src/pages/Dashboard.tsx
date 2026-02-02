import { useState, useEffect } from 'react'
import { institutionService, DashboardStats, VendorWorkflowItem } from '../services/institutionService'
import { canteenService } from '../services/canteenService'
import { useAuthStore } from '../store/authStore'
import {
    Building2,
    Clock,
    ShoppingCart,
    DollarSign,
    Plus,
    Edit,
    Power,
    Search,
    Filter
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { KPICard } from '../components/shared/KPICard'
import { StatusChip } from '../components/shared/StatusChip'

export default function Dashboard() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<DashboardStats>({
        activeCanteens: 0,
        pendingApprovals: 0,
        ordersToday: 0,
        dailyRevenue: 0
    })
    const [vendors, setVendors] = useState<VendorWorkflowItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 4

    useEffect(() => {
        if (user?.institutionId) {
            loadDashboardData()
        }
    }, [user])

    const loadDashboardData = async () => {
        if (!user?.institutionId) return

        try {
            setLoading(true)
            const [statsData, vendorsData] = await Promise.all([
                institutionService.getDashboardStats(user.institutionId),
                institutionService.getVendorWorkflow(user.institutionId)
            ])

            setStats(statsData)
            setVendors(vendorsData)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)

            // Optimistic update
            setVendors(prev => prev.map(vendor =>
                vendor.vendorId === vendorId
                    ? { ...vendor, isApproved: true, isActive: true, status: 'active' as const }
                    : vendor
            ))

            await canteenService.approveVendor(vendorId)
            await loadDashboardData() // Refresh to update stats
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to approve vendor')
            loadDashboardData()
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeactivate = async (vendorId: string) => {
        if (!confirm('Are you sure you want to deactivate this vendor?')) return

        try {
            setActionLoading(vendorId)

            // Optimistic update
            setVendors(prev => prev.map(vendor =>
                vendor.vendorId === vendorId
                    ? { ...vendor, isActive: false, status: 'inactive' as const }
                    : vendor
            ))

            await canteenService.deactivateVendor(vendorId)
            await loadDashboardData()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to deactivate vendor')
            loadDashboardData()
        } finally {
            setActionLoading(null)
        }
    }

    // Filter vendors based on search
    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Pagination
    const totalPages = Math.ceil(filteredVendors.length / itemsPerPage)
    const paginatedVendors = filteredVendors.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="text-sm text-gray-500 mb-2">
                    Admin / <span className="text-blue-600">Dashboard</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Institution Overview</h1>
                <p className="text-gray-600 mt-1">
                    Real-time monitoring of campus-wide canteen operations and vendor approvals.
                </p>
            </div>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Active Canteens"
                    value={stats.activeCanteens}
                    subtitle="100% capacity"
                    icon={<Building2 className="h-6 w-6" />}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <KPICard
                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    subtitle="Action required"
                    icon={<Clock className="h-6 w-6" />}
                    iconColor="text-yellow-600"
                    iconBgColor="bg-yellow-100"
                />
                <KPICard
                    title="Orders Today"
                    value={stats.ordersToday}
                    subtitle="Updated 2m ago"
                    icon={<ShoppingCart className="h-6 w-6" />}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <KPICard
                    title="Daily Revenue"
                    value={`$${stats.dailyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subtitle="↑ 12.5% vs yesterday"
                    icon={<DollarSign className="h-6 w-6" />}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
            </div>

            {/* Vendor Approval Workflow */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Vendor Approval Workflow</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Review and manage new vendor onboarding requests.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <Filter className="h-4 w-4" />
                                <span className="text-sm font-medium">Filter</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Plus className="h-4 w-4" />
                                <span className="text-sm font-medium">Add Vendor</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendor ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendor Info
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Canteen Assignment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Applied Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedVendors.length > 0 ? (
                                paginatedVendors.map((vendor) => (
                                    <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-gray-900">
                                                {vendor.vendorId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {vendor.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    contact@{vendor.name.toLowerCase().replace(/\s+/g, '')}.com
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{vendor.location}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(vendor.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusChip
                                                status={vendor.status}
                                                size="md"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {vendor.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(vendor.vendorId)}
                                                            disabled={actionLoading === vendor.vendorId}
                                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeactivate(vendor.vendorId)}
                                                            disabled={actionLoading === vendor.vendorId}
                                                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    </>
                                                ) : vendor.status === 'active' ? (
                                                    <>
                                                        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeactivate(vendor.vendorId)}
                                                            disabled={actionLoading === vendor.vendorId}
                                                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <Power className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleApprove(vendor.vendorId)}
                                                        disabled={actionLoading === vendor.vendorId}
                                                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">
                                            {searchTerm ? 'No vendors found matching your search' : 'No vendors registered yet'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 rounded-lg transition-colors ${
                                        currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
