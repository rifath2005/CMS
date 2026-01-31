import { useState, useEffect } from 'react'
import { canteenService, CreateCanteenData } from '../services/canteenService'
import { Canteen } from '../types'
import { useAuthStore } from '../store/authStore'
import { Plus, Building2, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'

export default function Canteens() {
    const { user } = useAuthStore()
    const [canteens, setCanteens] = useState<Canteen[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)

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
            setError(err.response?.data?.message || 'Failed to load canteens')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCanteen = async (data: CreateCanteenData) => {
        try {
            await canteenService.createCanteen(data)
            setShowCreateModal(false)
            loadCanteens()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create canteen')
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Canteens</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    <Plus className="h-5 w-5" />
                    <span>Register Canteen</span>
                </button>
            </div>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {canteens.map((canteen) => (
                    <div key={canteen.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Building2 className="h-8 w-8 text-blue-600" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{canteen.name}</h3>
                                    <p className="text-sm text-gray-500">ID: {canteen.vendorId}</p>
                                </div>
                            </div>
                            {canteen.isActive ? (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                                <XCircle className="h-6 w-6 text-red-600" />
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{canteen.location}</span>
                            </div>
                            {canteen.operatingHours && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        {canteen.operatingHours.open} - {canteen.operatingHours.close}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${canteen.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {canteen.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {canteens.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No canteens registered yet</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                        Register your first canteen
                    </button>
                </div>
            )}

            {/* Create Canteen Modal */}
            {showCreateModal && user?.institutionId && (
                <CreateCanteenModal
                    institutionId={user.institutionId}
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateCanteen}
                />
            )}
        </div>
    )
}

// Create Canteen Modal Component
function CreateCanteenModal({
    institutionId,
    onClose,
    onCreate,
}: {
    institutionId: string
    onClose: () => void
    onCreate: (data: CreateCanteenData) => void
}) {
    const [formData, setFormData] = useState<CreateCanteenData>({
        institutionId,
        name: '',
        location: '',
        operatingHours: {
            open: '08:00',
            close: '20:00',
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onCreate(formData)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Register Canteen</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Canteen Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Student Canteen 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Building A, Ground Floor"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Opening Time
                            </label>
                            <input
                                type="time"
                                value={formData.operatingHours?.open}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        operatingHours: {
                                            ...formData.operatingHours!,
                                            open: e.target.value,
                                        },
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Closing Time
                            </label>
                            <input
                                type="time"
                                value={formData.operatingHours?.close}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        operatingHours: {
                                            ...formData.operatingHours!,
                                            close: e.target.value,
                                        },
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
