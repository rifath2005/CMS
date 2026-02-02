import { useState, useEffect } from 'react'
import { canteenService, Canteen } from '../../services/canteenService'
import { useAuthStore } from '../../store/authStore'
import { Building2, MapPin, UserCheck, UserX, Search } from 'lucide-react'
import ErrorAlert from '../../components/ErrorAlert'
import { StatusChip } from '../../components/shared/StatusChip'
import DashboardSkeleton from '../../components/DashboardSkeleton'
import { cache } from '../../utils/cache'

const Vendors = () => {
    const { user } = useAuthStore()
    const [vendors, setVendors] = useState<Canteen[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')

    useEffect(() => {
        if (user?.institutionId) {
            loadVendors()
        }
    }, [user])

    const loadVendors = async () => {
        if (!user?.institutionId) return

        try {
            // Check cache first
            const cacheKey = `vendors-${user.institutionId}`
            const cachedData = cache.get<Canteen[]>(cacheKey)
            
            if (cachedData) {
                setVendors(cachedData)
                setLoading(false)
                // Load fresh data in background
                loadFreshVendors(cacheKey)
                return
            }

            setLoading(true)
            await loadFreshVendors(cacheKey)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load vendors')
            setLoading(false)
        }
    }

    const loadFreshVendors = async (cacheKey: string) => {
        if (!user?.institutionId) return

        try {
            const data = await canteenService.getCanteensByInstitution(user.institutionId)
            setVendors(data)
            // Cache for 30 seconds
            cache.set(cacheKey, data, 30000)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)
            await canteenService.approveVendor(vendorId)
            // Invalidate cache
            cache.invalidatePattern('vendors')
            cache.invalidatePattern('dashboard')
            await loadVendors()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to approve vendor')
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeactivate = async (vendorId: string) => {
        if (!confirm('Are you sure you want to deactivate this vendor?')) return

        try {
            setActionLoading(vendorId)
            await canteenService.deactivateVendor(vendorId)
            // Invalidate cache
            cache.invalidatePattern('vendors')
            cache.invalidatePattern('dashboard')
            await loadVendors()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to deactivate vendor')
        } finally {
            setActionLoading(null)
        }
    }

    const handleActivate = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)
            await canteenService.activateVendor(vendorId)
            // Invalidate cache
            cache.invalidatePattern('vendors')
            cache.invalidatePattern('dashboard')
            await loadVendors()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to activate vendor')
        } finally {
            setActionLoading(null)
        }
    }

    // Filter vendors
    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = 
            vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.location.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilter = 
            filterStatus === 'all' ||
            (filterStatus === 'pending' && !vendor.isApproved) ||
            (filterStatus === 'active' && vendor.isApproved && vendor.isActive) ||
            (filterStatus === 'inactive' && vendor.isApproved && !vendor.isActive)

        return matchesSearch && matchesFilter
    })

    if (loading) return <DashboardSkeleton />

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Header */}
                <div>
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">
                        Admin / <span className="text-blue-600">Vendors</span>
                    </div>
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Vendor Management</h1>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Manage vendor access and permissions
                    </p>
                </div>

                {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search vendors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="sm:w-48">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Vendors Table - Responsive */}
                {filteredVendors.length > 0 ? (
                    <>
                        {/* Desktop Table View - Scrollable */}
                        <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-x-auto">
                            <div className="min-w-[800px]">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vendor
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredVendors.map((vendor) => (
                                            <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center">
                                                        <div className="p-1.5 bg-blue-100 rounded-lg mr-2 flex-shrink-0">
                                                            <Building2 className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {vendor.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                ID: {vendor.vendorId}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                                                        <span className="truncate">{vendor.location}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusChip
                                                        status={vendor.isApproved ? (vendor.isActive ? 'active' : 'inactive') : 'pending'}
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {!vendor.isApproved ? (
                                                            <button
                                                                onClick={() => handleApprove(vendor.vendorId)}
                                                                disabled={actionLoading === vendor.vendorId}
                                                                className="inline-flex items-center px-2.5 py-1.5 border border-green-300 rounded-md text-xs text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                                                            >
                                                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                                                Approve
                                                            </button>
                                                        ) : vendor.isActive ? (
                                                            <button
                                                                onClick={() => handleDeactivate(vendor.vendorId)}
                                                                disabled={actionLoading === vendor.vendorId}
                                                                className="inline-flex items-center px-2.5 py-1.5 border border-red-300 rounded-md text-xs text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
                                                            >
                                                                <UserX className="h-3.5 w-3.5 mr-1" />
                                                                Deactivate
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleActivate(vendor.vendorId)}
                                                                disabled={actionLoading === vendor.vendorId}
                                                                className="inline-flex items-center px-2.5 py-1.5 border border-green-300 rounded-md text-xs text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                                                            >
                                                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                                                Activate
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3">
                            {filteredVendors.map((vendor) => (
                                <div
                                    key={vendor.id}
                                    className="bg-white rounded-lg border border-gray-200 p-2.5"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="p-1 bg-blue-100 rounded-md flex-shrink-0">
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-xs text-gray-900 truncate">
                                                    {vendor.name}
                                                </h3>
                                                <p className="text-[10px] text-gray-500 truncate">
                                                    ID: {vendor.vendorId}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusChip
                                            status={vendor.isApproved ? (vendor.isActive ? 'active' : 'inactive') : 'pending'}
                                            size="sm"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5 mb-2">
                                        <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                        <p className="text-[10px] text-gray-600 truncate">{vendor.location}</p>
                                    </div>

                                    <div className="flex gap-1.5 pt-2 border-t border-gray-200">
                                        {!vendor.isApproved ? (
                                            <button
                                                onClick={() => handleApprove(vendor.vendorId)}
                                                disabled={actionLoading === vendor.vendorId}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                                            >
                                                <UserCheck className="h-3 w-3" />
                                                Approve
                                            </button>
                                        ) : vendor.isActive ? (
                                            <button
                                                onClick={() => handleDeactivate(vendor.vendorId)}
                                                disabled={actionLoading === vendor.vendorId}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-red-300 text-red-700 text-xs font-medium rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                                            >
                                                <UserX className="h-3 w-3" />
                                                Deactivate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivate(vendor.vendorId)}
                                                disabled={actionLoading === vendor.vendorId}
                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                            >
                                                <UserCheck className="h-3 w-3" />
                                                Activate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
                        <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                            {searchTerm || filterStatus !== 'all' ? 'No vendors found' : 'No vendors yet'}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600">
                            {searchTerm || filterStatus !== 'all' 
                                ? 'Try adjusting your search or filter' 
                                : 'Vendors will appear here once they register'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Vendors
