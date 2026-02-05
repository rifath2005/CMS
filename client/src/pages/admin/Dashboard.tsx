import { useState, useEffect } from 'react'
import { institutionService, DashboardStats, VendorWorkflowItem } from '../../services/institutionService'
import { canteenService } from '../../services/canteenService'
import { useAuthStore } from '../../store/authStore'
import {
    Building2,
    Clock,
    ShoppingCart,
    DollarSign,
    Plus,
    Edit,
    Power,
    Search
} from 'lucide-react'
import ErrorAlert from '../../components/ErrorAlert'
import { KPICard } from '../../components/shared/KPICard'
import { StatusChip } from '../../components/shared/StatusChip'
import AddVendorModal, { VendorFormData } from '../../components/AddVendorModal'
import EditVendorModal, { VendorData, VendorEditData } from '../../components/EditVendorModal'
import DashboardSkeleton from '../../components/DashboardSkeleton'
import { cache } from '../../utils/cache'
import { Button } from '../../components/ui/Button'

const AdminDashboard = () => {
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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null)
    const itemsPerPage = 4

    useEffect(() => {
        if (user?.institutionId) {
            loadDashboardData()
        }
    }, [user])

    const loadDashboardData = async () => {
        if (!user?.institutionId) return

        try {
            // Check cache first
            const cacheKey = `dashboard-${user.institutionId}`
            const cachedData = cache.get<{ stats: DashboardStats; vendors: VendorWorkflowItem[] }>(cacheKey)
            
            if (cachedData) {
                setStats(cachedData.stats)
                setVendors(cachedData.vendors)
                setLoading(false)
                // Load fresh data in background
                loadFreshData(cacheKey)
                return
            }

            setLoading(true)
            await loadFreshData(cacheKey)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load dashboard data')
            setLoading(false)
        }
    }

    const loadFreshData = async (cacheKey: string) => {
        if (!user?.institutionId) return

        try {
            // Load both in parallel for faster loading
            const [statsData, vendorsData] = await Promise.all([
                institutionService.getDashboardStats(user.institutionId),
                institutionService.getVendorWorkflow(user.institutionId)
            ])

            setStats(statsData)
            setVendors(vendorsData)
            
            // Cache for 30 seconds
            cache.set(cacheKey, { stats: statsData, vendors: vendorsData }, 30000)
        } finally {
            setLoading(false)
        }
    }

    const handleAddVendor = async (data: VendorFormData) => {
        if (!user?.institutionId) return

        await canteenService.createCanteen(user.institutionId, data)
        // Invalidate cache
        cache.invalidatePattern('dashboard')
        await loadDashboardData() // Refresh data
    }

    const handleEditVendor = async (canteenId: string, data: VendorEditData) => {
        await canteenService.updateCanteen(canteenId, data)
        // Invalidate cache
        cache.invalidatePattern('dashboard')
        await loadDashboardData() // Refresh data
    }

    const openEditModal = (vendor: VendorWorkflowItem) => {
        setSelectedVendor({
            id: vendor.id,
            vendorId: vendor.vendorId,
            name: vendor.name,
            location: vendor.location,
            operatingHours: vendor.operatingHours
        })
        setIsEditModalOpen(true)
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
            // Invalidate cache
            cache.invalidatePattern('dashboard')
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
            // Invalidate cache
            cache.invalidatePattern('dashboard')
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

    if (loading) return <DashboardSkeleton />

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Header */}
                <div>
                    <div className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
                        Admin / <span className="text-blue-600">Dashboard</span>
                    </div>
                    <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Institution Overview</h1>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Real-time monitoring of campus-wide canteen operations.
                    </p>
                </div>

                {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    <KPICard
                        title="Active Canteens"
                        value={stats.activeCanteens}
                        subtitle="100% capacity"
                        icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <KPICard
                        title="Pending Approvals"
                        value={stats.pendingApprovals}
                        subtitle="Action required"
                        icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
                        iconColor="text-yellow-600"
                        iconBgColor="bg-yellow-100"
                    />
                    <KPICard
                        title="Orders Today"
                        value={stats.ordersToday}
                        subtitle="Updated 2m ago"
                        icon={<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <KPICard
                        title="Daily Revenue"
                        value={`${stats.dailyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        subtitle="↑ 12.5%"
                        icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                </div>

                {/* Vendor Approval Workflow */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                <div>
                                    <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Vendor Approval Workflow</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                                        Review and manage vendor requests.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setIsAddModalOpen(true)}
                                    variant="default"
                                    size="default"
                                    className="min-h-[44px]"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add Vendor</span>
                                </Button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table View - Scrollable */}
                    <div className="hidden lg:block overflow-x-auto">
                        <div className="min-w-[900px]">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Vendor ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Vendor Info
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Location
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Applied Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedVendors.length > 0 ? (
                                        paginatedVendors.map((vendor) => (
                                            <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {vendor.vendorId}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {vendor.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            contact@{vendor.name.toLowerCase().replace(/\s+/g, '')}.com
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-900">{vendor.location}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(vendor.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <StatusChip
                                                        status={vendor.status}
                                                        size="md"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {vendor.status === 'pending' ? (
                                                            <>
                                                                <Button
                                                                    onClick={() => handleApprove(vendor.vendorId)}
                                                                    disabled={actionLoading === vendor.vendorId}
                                                                    variant="default"
                                                                    size="sm"
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeactivate(vendor.vendorId)}
                                                                    disabled={actionLoading === vendor.vendorId}
                                                                    variant="destructive"
                                                                    size="sm"
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        ) : vendor.status === 'active' ? (
                                                            <>
                                                                <button 
                                                                    onClick={() => openEditModal(vendor)}
                                                                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    title="Edit vendor"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeactivate(vendor.vendorId)}
                                                                    disabled={actionLoading === vendor.vendorId}
                                                                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    title="Deactivate vendor"
                                                                >
                                                                    <Power className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                onClick={() => handleApprove(vendor.vendorId)}
                                                                disabled={actionLoading === vendor.vendorId}
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                Activate
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center">
                                                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-600 text-sm">
                                                    {searchTerm ? 'No vendors found' : 'No vendors yet'}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden divide-y divide-gray-200">
                        {paginatedVendors.length > 0 ? (
                            paginatedVendors.map((vendor) => (
                                <div key={vendor.id} className="p-2.5 hover:bg-gray-50 transition-colors">
                                    <div className="space-y-2">
                                        {/* Vendor Header - Compact */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1 flex items-center gap-2">
                                                <div className="p-1 bg-blue-100 rounded-md flex-shrink-0">
                                                    <Building2 className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-xs text-gray-900 truncate">{vendor.name}</h3>
                                                    <p className="text-[10px] text-gray-500 truncate">ID: {vendor.vendorId}</p>
                                                </div>
                                            </div>
                                            <StatusChip status={vendor.status} size="sm" />
                                        </div>

                                        {/* Vendor Details - Compact */}
                                        <div className="space-y-1 text-[10px]">
                                            <div className="flex items-start gap-1">
                                                <span className="text-gray-500 shrink-0">Location:</span>
                                                <span className="text-gray-900 truncate">{vendor.location}</span>
                                            </div>
                                            <div className="flex items-start gap-1">
                                                <span className="text-gray-500 shrink-0">Applied:</span>
                                                <span className="text-gray-900">
                                                    {new Date(vendor.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions - Compact */}
                                        <div className="flex gap-1.5 pt-2">
                                            {vendor.status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(vendor.vendorId)}
                                                        disabled={actionLoading === vendor.vendorId}
                                                        className="flex-1 px-2 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeactivate(vendor.vendorId)}
                                                        disabled={actionLoading === vendor.vendorId}
                                                        className="flex-1 px-2 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            ) : vendor.status === 'active' ? (
                                                <>
                                                    <button 
                                                        onClick={() => openEditModal(vendor)}
                                                        className="flex-1 px-2 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeactivate(vendor.vendorId)}
                                                        disabled={actionLoading === vendor.vendorId}
                                                        className="flex-1 px-2 py-1.5 border border-red-300 text-red-700 text-xs font-medium rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Power className="h-3 w-3" />
                                                        Deactivate
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleApprove(vendor.vendorId)}
                                                    disabled={actionLoading === vendor.vendorId}
                                                    className="w-full px-2 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                >
                                                    Activate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 text-sm">
                                    {searchTerm ? 'No vendors found' : 'No vendors yet'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-3 sm:px-4 lg:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredVendors.length)} of {filteredVendors.length}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    variant="outline"
                                    size="sm"
                                    className="min-h-[36px] sm:min-h-[40px]"
                                >
                                    Prev
                                </Button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let page;
                                    if (totalPages <= 5) {
                                        page = i + 1;
                                    } else if (currentPage <= 3) {
                                        page = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        page = totalPages - 4 + i;
                                    } else {
                                        page = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] ${
                                                currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <Button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    variant="outline"
                                    size="sm"
                                    className="min-h-[36px] sm:min-h-[40px]"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add Vendor Modal */}
                <AddVendorModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddVendor}
                />

                {/* Edit Vendor Modal */}
                <EditVendorModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false)
                        setSelectedVendor(null)
                    }}
                    onSubmit={handleEditVendor}
                    vendor={selectedVendor}
                />
            </div>
        </div>
    )
}

export default AdminDashboard
