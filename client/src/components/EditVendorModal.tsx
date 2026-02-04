import { useState, useEffect } from 'react'
import { X, Building2, MapPin, Clock } from 'lucide-react'

interface EditVendorModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (vendorId: string, data: VendorEditData) => Promise<void>
    vendor: VendorData | null
}

export interface VendorData {
    id: string
    vendorId: string
    name: string
    location: string
    operatingHours?: {
        open: string
        close: string
    }
}

export interface VendorEditData {
    name: string
    location: string
    operatingHours?: {
        open: string
        close: string
    }
}

const EditVendorModal = ({ isOpen, onClose, onSubmit, vendor }: EditVendorModalProps) => {
    const [formData, setFormData] = useState<VendorEditData>({
        name: '',
        location: '',
        operatingHours: {
            open: '08:00',
            close: '19:00'
        }
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Update form when vendor changes
    useEffect(() => {
        if (vendor) {
            setFormData({
                name: vendor.name,
                location: vendor.location,
                operatingHours: vendor.operatingHours || {
                    open: '08:00',
                    close: '19:00'
                }
            })
        }
    }, [vendor])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!vendor) return

        // Validation
        if (!formData.name.trim()) {
            setError('Canteen name is required')
            return
        }
        if (!formData.location.trim()) {
            setError('Location is required')
            return
        }

        try {
            setLoading(true)
            await onSubmit(vendor.id, formData)
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to update vendor')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            setError('')
            onClose()
        }
    }

    if (!isOpen || !vendor) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Edit Vendor</h2>
                                <p className="text-sm text-gray-500">Vendor ID: {vendor.vendorId}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Canteen Name */}
                        <div>
                            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                                Canteen Name *
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Pragul canteen"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-2">
                                Location *
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="edit-location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g., RTC"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Operating Hours */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="inline h-4 w-4 mr-1" />
                                Operating Hours
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="edit-open" className="block text-xs text-gray-600 mb-1">
                                        Opening Time
                                    </label>
                                    <input
                                        type="time"
                                        id="edit-open"
                                        value={formData.operatingHours?.open || '08:00'}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            operatingHours: {
                                                ...formData.operatingHours!,
                                                open: e.target.value
                                            }
                                        })}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-close" className="block text-xs text-gray-600 mb-1">
                                        Closing Time
                                    </label>
                                    <input
                                        type="time"
                                        id="edit-close"
                                        value={formData.operatingHours?.close || '19:00'}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            operatingHours: {
                                                ...formData.operatingHours!,
                                                close: e.target.value
                                            }
                                        })}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Info Note */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700">
                                <strong>Note:</strong> Changes will be applied immediately after saving.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[44px]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-[44px]"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default EditVendorModal
