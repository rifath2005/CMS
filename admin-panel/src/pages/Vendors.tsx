import { useState, useEffect } from 'react'
import { canteenService } from '../services/canteenService'
import { Canteen } from '../types'
import { useAuthStore } from '../store/authStore'
import { Building2, MapPin, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'

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
            await canteenService.approveVendor(vendorId)
            loadCanteens()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve vendor')
        } finally {
            setActionLoading(null)
        }
    }

    const handleDeactivate = async (vendorId: string) => {
        if (!confirm('Are you sure you want to deactivate this vendor?')) return

        try {
            setActionLoading(vendorId)
            await canteenService.deactivateVendor(vendorId)
            loadCanteens()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to deactivate vendor')
        } finally {
            setActionLoading(null)
        }
    }

    const handleActivate = async (vendorId: string) => {
        try {
            setActionLoading(vendorId)
            await canteenService.activateVendor(vendorId)
            loadCanteens()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to activate vendor')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Vendor Management</h1>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vendor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
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
                        {canteens.map((canteen) => (
                            <tr key={canteen.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{canteen.name}</div>
                                            <div className="text-sm text-gray-500">ID: {canteen.vendorId}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        {canteen.location}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${canteen.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {canteen.isActive ? (
                                            <>
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Inactive
                                            </>
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {canteen.isActive ? (
                                        <button
                                            onClick={() => handleDeactivate(canteen.vendorId)}
                                            disabled={actionLoading === canteen.vendorId}
                                            className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-red-700 hover:bg-red-50 disabled:opacity-50"
                                        >
                                            <UserX className="h-4 w-4 mr-1" />
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleActivate(canteen.vendorId)}
                                            disabled={actionLoading === canteen.vendorId}
                                            className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-green-700 hover:bg-green-50 disabled:opacity-50"
                                        >
                                            <UserCheck className="h-4 w-4 mr-1" />
                                            Activate
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {canteens.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No vendors found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
