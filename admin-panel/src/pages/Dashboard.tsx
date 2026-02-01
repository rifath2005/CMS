import { useState, useEffect } from 'react'
import { canteenService } from '../services/canteenService'
import { Canteen } from '../types'
import { useAuthStore } from '../store/authStore'
import {
    Building2,
    UserCheck,
    ShoppingCart,
    AlertTriangle,
    MapPin,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { KPICard } from '../components/shared/KPICard'
import { StatusChip } from '../components/shared/StatusChip'

interface DashboardStats {
    activeCanteens: number
    pendingApprovals: number
    ordersToday: number
    lowStockAlerts: number
}

interface VendorCardData {
    id: string
    vendorId: string
    canteenName: string
    location: string
    approvalState: 'pending' | 'active' | 'inactive'
    operatingHours?: {
        open: string
        close: string
    }
}

export default function Dashboard() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState<DashboardStats>({
        activeCanteens: 0,
        pendingApprovals: 0,
        ordersToday: 0,
        lowStockAlerts: 0
    })
    const [vendors, setVendors] = useState<VendorCardData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        if (user?.institutionId) {
            loadDashboardData()
        }
    }, [user])

    const loadDashboardData = async () => {
        if (!user?.institutionId) return

        try {
            setLoading(true)
            const canteens = await canteenService.getCanteensByInstitution(user.institutionId)

            // Transform canteens to vendor card data
            const vendorData: VendorCardData[] = canteens.map(canteen => ({
                id: canteen.id,
                vendorId: canteen.vendorId,
                canteenName: canteen.name,
                location: canteen.location,
                approvalState: canteen.isActive ? 'active' : 'inactive',
                operatingHours: canteen.operatingHours
            }))

            setVendors(vendorData)

            // Calculate stats
            const activeCount = canteens.filter(c => c.isActive).length
            const pendingCount = 0 // TODO: Implement pending logic when backend supports it

            setStats({
                activeCanteens: activeCount,
                pendingApprovals: pendingCount,
                ordersToday: 0, // TODO: Fetch from orders API
                lowStockAlerts: 0 // TODO: Fetch from inventory API
            })
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)

            // Optimistic update - instant visual feedback without page reload
            setVendors(prev => prev.map(vendor =>
                vendor.vendorId === vendorId
                    ? { ...vendor, approvalState: 'active' as const }
                    : vendor
            ))

            await canteenService.approveVendor(vendorId)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve vendor')
            // Revert on error
            loadDashboardData()
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeactivate = async (vendorId: string) => {
        if (!confirm('Are you sure you want to deactivate this vendor?')) return

        try {
            setActionLoading(vendorId)

            // Optimistic update - instant visual feedback without page reload
            setVendors(prev => prev.map(vendor =>
                vendor.vendorId === vendorId
                    ? { ...vendor, approvalState: 'inactive' as const }
                    : vendor
            ))

            await canteenService.deactivateVendor(vendorId)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to deactivate vendor')
            // Revert on error
            loadDashboardData()
        } finally {
            setActionLoading(null)
        }
    }

    const handleActivate = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)

            // Optimistic update - instant visual feedback without page reload
            setVendors(prev => prev.map(vendor =>
                vendor.vendorId === vendorId
                    ? { ...vendor, approvalState: 'active' as const }
                    : vendor
            ))

            await canteenService.activateVendor(vendorId)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to activate vendor')
            // Revert on error
            loadDashboardData()
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <LoadingSpinner />

    // Organize vendors by status
    const pendingVendors = vendors.filter(v => v.approvalState === 'pending')
    const activeVendors = vendors.filter(v => v.approvalState === 'active')
    const deactivatedVendors = vendors.filter(v => v.approvalState === 'inactive')

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            {/* Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Active Canteens"
                    value={stats.activeCanteens}
                    icon={<Building2 className="h-6 w-6" />}
                    iconColor="text-blue-600"
                />
                <KPICard
                    title="Pending Vendor Approvals"
                    value={stats.pendingApprovals}
                    icon={<UserCheck className="h-6 w-6" />}
                    iconColor="text-yellow-600"
                />
                <KPICard
                    title="Orders Today"
                    value={stats.ordersToday}
                    icon={<ShoppingCart className="h-6 w-6" />}
                    iconColor="text-green-600"
                />
                <KPICard
                    title="Low-stock Alerts"
                    value={stats.lowStockAlerts}
                    icon={<AlertTriangle className="h-6 w-6" />}
                    iconColor="text-red-600"
                />
            </div>

            {/* Pending Approval Section */}
            {pendingVendors.length > 0 && (
                <VendorSection
                    title="Pending Approval"
                    vendors={pendingVendors}
                    onApprove={handleApprove}
                    onDeactivate={handleDeactivate}
                    onActivate={handleActivate}
                    actionLoading={actionLoading}
                />
            )}

            {/* Active Vendors Section */}
            <VendorSection
                title="Active Vendors"
                vendors={activeVendors}
                onApprove={handleApprove}
                onDeactivate={handleDeactivate}
                onActivate={handleActivate}
                actionLoading={actionLoading}
            />

            {/* Deactivated Vendors Section */}
            {deactivatedVendors.length > 0 && (
                <VendorSection
                    title="Deactivated Vendors"
                    vendors={deactivatedVendors}
                    onApprove={handleApprove}
                    onDeactivate={handleDeactivate}
                    onActivate={handleActivate}
                    actionLoading={actionLoading}
                />
            )}

            {vendors.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No vendors registered yet</p>
                </div>
            )}
        </div>
    )
}

// Vendor Section Component
interface VendorSectionProps {
    title: string
    vendors: VendorCardData[]
    onApprove: (vendorId: string) => void
    onDeactivate: (vendorId: string) => void
    onActivate: (vendorId: string) => void
    actionLoading: string | null
}

function VendorSection({
    title,
    vendors,
    onApprove,
    onDeactivate,
    onActivate,
    actionLoading
}: VendorSectionProps) {
    if (vendors.length === 0) return null

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map((vendor) => (
                    <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        onApprove={onApprove}
                        onDeactivate={onDeactivate}
                        onActivate={onActivate}
                        isLoading={actionLoading === vendor.vendorId}
                    />
                ))}
            </div>
        </div>
    )
}

// Vendor Card Component
interface VendorCardProps {
    vendor: VendorCardData
    onApprove: (vendorId: string) => void
    onDeactivate: (vendorId: string) => void
    onActivate: (vendorId: string) => void
    isLoading: boolean
}

function VendorCard({ vendor, onApprove, onDeactivate, onActivate, isLoading }: VendorCardProps) {
    const getPrimaryAction = () => {
        if (vendor.approvalState === 'pending') {
            return (
                <button
                    onClick={() => onApprove(vendor.vendorId)}
                    disabled={isLoading}
                    className="w-full min-h-[44px] flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="approve-button"
                >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approve
                </button>
            )
        } else if (vendor.approvalState === 'active') {
            return (
                <button
                    onClick={() => onDeactivate(vendor.vendorId)}
                    disabled={isLoading}
                    className="w-full min-h-[44px] flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="deactivate-button"
                >
                    <XCircle className="h-5 w-5 mr-2" />
                    Deactivate
                </button>
            )
        } else {
            return (
                <button
                    onClick={() => onActivate(vendor.vendorId)}
                    disabled={isLoading}
                    className="w-full min-h-[44px] flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    data-testid="activate-button"
                >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Activate
                </button>
            )
        }
    }

    return (
        <div
            className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
            data-testid="vendor-card"
            data-vendor-id={vendor.vendorId}
        >
            {/* Vendor ID */}
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor ID</p>
                <p className="text-sm font-semibold text-gray-900" data-testid="vendor-id">
                    {vendor.vendorId}
                </p>
            </div>

            {/* Canteen Name */}
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Canteen Name</p>
                <p className="text-base font-semibold text-gray-900" data-testid="canteen-name">
                    {vendor.canteenName}
                </p>
            </div>

            {/* Location */}
            <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{vendor.location}</p>
            </div>

            {/* Operating Hours */}
            {vendor.operatingHours && (
                <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                        {vendor.operatingHours.open} - {vendor.operatingHours.close}
                    </p>
                </div>
            )}

            {/* Approval State */}
            <div>
                <StatusChip
                    status={vendor.approvalState}
                    size="md"
                    data-testid="approval-state"
                />
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
                {getPrimaryAction()}
            </div>
        </div>
    )
}
