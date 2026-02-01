import { useState, useEffect } from 'react'
import { canteenService } from '../services/canteenService'
import { Canteen } from '../types'
import { useAuthStore } from '../store/authStore'
import { Building2, MapPin, UserCheck, UserX } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { DataTable, ColumnDef } from '../components/shared/DataTable'
import { StatusChip } from '../components/shared/StatusChip'

export default function Vendors() {
    const { user } = useAuthStore()
    const [canteens, setCanteens] = useState<Canteen[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

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
            setError(err.response?.data?.message || 'Failed to load vendors')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)

            // Optimistic update - instant visual feedback
            setCanteens(prev => prev.map(canteen =>
                canteen.vendorId === vendorId
                    ? { ...canteen, isActive: true }
                    : canteen
            ))

            await canteenService.approveVendor(vendorId)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve vendor')
            // Revert on error
            loadCanteens()
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeactivate = async (vendorId: string) => {
        if (!confirm('Are you sure you want to deactivate this vendor?')) return

        try {
            setActionLoading(vendorId)

            // Optimistic update - instant visual feedback
            setCanteens(prev => prev.map(canteen =>
                canteen.vendorId === vendorId
                    ? { ...canteen, isActive: false }
                    : canteen
            ))

            await canteenService.deactivateVendor(vendorId)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to deactivate vendor')
            // Revert on error
            loadCanteens()
        } finally {
            setActionLoading(null)
        }
    }

    const handleActivate = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)

            // Optimistic update - instant visual feedback
            setCanteens(prev => prev.map(canteen =>
                canteen.vendorId === vendorId
                    ? { ...canteen, isActive: true }
                    : canteen
            ))

            await canteenService.activateVendor(vendorId)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to activate vendor')
            // Revert on error
            loadCanteens()
        } finally {
            setActionLoading(null)
        }
    }

    const columns: ColumnDef<Canteen>[] = [
        {
            key: 'vendor',
            header: 'Vendor',
            accessor: (canteen) => (
                <div className="flex items-center">
                    <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                        <div className="text-sm font-medium text-gray-900">{canteen.name}</div>
                        <div className="text-sm text-gray-500">ID: {canteen.vendorId}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'location',
            header: 'Location',
            accessor: (canteen) => (
                <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {canteen.location}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (canteen) => (
                <StatusChip
                    status={canteen.isActive ? 'active' : 'inactive'}
                    size="md"
                    showIcon
                />
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            accessor: (canteen) => (
                <div className="flex items-center gap-2">
                    {canteen.isActive ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDeactivate(canteen.vendorId)
                            }}
                            disabled={actionLoading === canteen.vendorId}
                            className="inline-flex items-center px-3 py-1.5 min-h-[44px] border border-red-300 rounded-md text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors duration-200"
                        >
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleActivate(canteen.vendorId)
                            }}
                            disabled={actionLoading === canteen.vendorId}
                            className="inline-flex items-center px-3 py-1.5 min-h-[44px] border border-green-300 rounded-md text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors duration-200"
                        >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                        </button>
                    )}
                </div>
            ),
        },
    ]

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Vendor Management</h1>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {canteens.length > 0 ? (
                    <DataTable
                        columns={columns}
                        data={canteens}
                        stickyHeader={true}
                        zebraStriping={true}
                        hoverActions={false}
                    />
                ) : (
                    <div className="text-center py-12">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No vendors found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
