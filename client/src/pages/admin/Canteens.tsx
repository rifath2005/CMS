import { useState, useEffect } from 'react'
import { canteenService, Canteen } from '../../services/canteenService'
import { useAuthStore } from '../../store/authStore'
import { Building2, MapPin, Clock, Plus, Edit, CheckCircle, XCircle } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorAlert from '../../components/ErrorAlert'
import { StatusChip } from '../../components/shared/StatusChip'
import AddVendorModal, { VendorFormData } from '../../components/AddVendorModal'

const Canteens = () => {
    const { user } = useAuthStore()
    const [canteens, setCanteens] = useState<Canteen[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    useEffect(() => {
        if (user?.institutionId) {
            loadCanteens()
        }
    }, [user])

    const loadCanteens = async () => {
        if (!user?.institutionId) return

        try {
            setLoading(true)
            const data = await canteenService.getCanteensByInstitution(user.institutionId)
            setCanteens(data)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load canteens')
        } finally {
            setLoading(false)
        }
    }

    const handleAddCanteen = async (data: VendorFormData) => {
        if (!user?.institutionId) return

        await canteenService.createCanteen(user.institutionId, data)
        await loadCanteens() // Refresh data
    }

    const handleApprove = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)
            await canteenService.approveVendor(vendorId)
            await loadCanteens()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to approve canteen')
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeactivate = async (vendorId: string) => {
        if (!confirm('Are you sure you want to deactivate this canteen?')) return

        try {
            setActionLoading(vendorId)
            await canteenService.deactivateVendor(vendorId)
            await loadCanteens()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to deactivate canteen')
        } finally {
            setActionLoading(null)
        }
    }

    const handleActivate = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)
            await canteenService.activateVendor(vendorId)
            await loadCanteens()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to activate canteen')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">
                            Admin / <span className="text-blue-600">Canteens</span>
                        </div>
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Canteen Management</h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Manage canteens in your institution
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] text-sm font-medium whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Canteen</span>
                    </button>
                </div>

                {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                {/* Canteens Grid - Responsive */}
                {canteens.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {canteens.map((canteen) => (
                            <div
                                key={canteen.id}
                                className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-lg transition-shadow"
                            >
                                {/* Canteen Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                                {canteen.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">
                                                ID: {canteen.vendorId}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Canteen Details */}
                                <div className="space-y-2 mb-3">
                                    {/* Location */}
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs sm:text-sm text-gray-600 break-words">{canteen.location}</p>
                                    </div>

                                    {/* Operating Hours */}
                                    {canteen.operatingHours && (
                                        <div className="flex items-start gap-2">
                                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs sm:text-sm text-gray-600">
                                                {canteen.operatingHours.open} - {canteen.operatingHours.close}
                                            </p>
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div className="pt-1">
                                        <StatusChip
                                            status={canteen.isApproved ? (canteen.isActive ? 'active' : 'inactive') : 'pending'}
                                            size="sm"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                                    {!canteen.isApproved ? (
                                        <button
                                            onClick={() => handleApprove(canteen.vendorId)}
                                            disabled={actionLoading === canteen.vendorId}
                                            className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors min-h-[40px]"
                                        >
                                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            Approve
                                        </button>
                                    ) : canteen.isActive ? (
                                        <>
                                            <button className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors min-h-[40px]">
                                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeactivate(canteen.vendorId)}
                                                disabled={actionLoading === canteen.vendorId}
                                                className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 border border-red-300 text-red-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors min-h-[40px]"
                                            >
                                                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                Deactivate
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleActivate(canteen.vendorId)}
                                            disabled={actionLoading === canteen.vendorId}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors min-h-[40px]"
                                        >
                                            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            Activate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
                        <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No canteens found</h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                            Get started by adding your first canteen
                        </p>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px]"
                        >
                            <Plus className="h-4 w-4" />
                            Add Canteen
                        </button>
                    </div>
                )}

                {/* Add Canteen Modal */}
                <AddVendorModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddCanteen}
                />
            </div>
        </div>
    )
}

export default Canteens
