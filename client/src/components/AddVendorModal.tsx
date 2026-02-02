import { useState } from 'react'
import { X, Building2, MapPin, Clock, Phone, User, Mail } from 'lucide-react'

interface AddVendorModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: VendorFormData) => Promise<void>
}

export interface VendorFormData {
    name: string
    location: string
    contactPhone: string
    ownerName: string
    ownerEmail: string
    operatingHours?: {
        open: string
        close: string
    }
}

const AddVendorModal = ({ isOpen, onClose, onSubmit }: AddVendorModalProps) => {
    const [formData, setFormData] = useState<VendorFormData>({
        name: '',
        location: '',
        contactPhone: '',
        ownerName: '',
        ownerEmail: '',
        operatingHours: {
            open: '08:00',
            close: '19:00'
        }
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!formData.name.trim()) {
            setError('Canteen name is required')
            return
        }
        if (!formData.location.trim()) {
            setError('Location is required')
            return
        }
        if (!formData.contactPhone.trim()) {
            setError('Contact phone is required')
            return
        }
        if (!formData.ownerName.trim()) {
            setError('Owner name is required')
            return
        }
        if (!formData.ownerEmail.trim()) {
            setError('Owner email is required')
            return
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.ownerEmail)) {
            setError('Please enter a valid email address')
            return
        }

        try {
            setLoading(true)
            await onSubmit(formData)
            // Reset form
            setFormData({
                name: '',
                location: '',
                contactPhone: '',
                ownerName: '',
                ownerEmail: '',
                operatingHours: {
                    open: '08:00',
                    close: '19:00'
                }
            })
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to add vendor')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            setFormData({
                name: '',
                location: '',
                contactPhone: '',
                ownerName: '',
                ownerEmail: '',
                operatingHours: {
                    open: '08:00',
                    close: '19:00'
                }
            })
            setError('')
            onClose()
        }
    }

    if (!isOpen) return null

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
                            <h2 className="text-xl font-bold text-gray-900">Add New Vendor</h2>
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

                        {/* Info Alert */}
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                                <strong>Note:</strong> Name, location, contact phone, owner name, and owner email are required
                            </p>
                        </div>

                        {/* Two Column Layout for Desktop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Canteen Name */}
                            <div className="md:col-span-2">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Canteen Name *
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="name"
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
                            <div className="md:col-span-2">
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                    Location *
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g., RTC"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Contact Phone */}
                            <div>
                                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Phone *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        id="contactPhone"
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        placeholder="e.g., +91 9876543210"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Owner Name */}
                            <div>
                                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Owner Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="ownerName"
                                        value={formData.ownerName}
                                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                        placeholder="e.g., John Doe"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Owner Email */}
                            <div className="md:col-span-2">
                                <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                                    Owner Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        id="ownerEmail"
                                        value={formData.ownerEmail}
                                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                        placeholder="e.g., owner@example.com"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loading}
                                        required
                                    />
                                </div>
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
                                    <label htmlFor="open" className="block text-xs text-gray-600 mb-1">
                                        Opening Time
                                    </label>
                                    <input
                                        type="time"
                                        id="open"
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
                                    <label htmlFor="close" className="block text-xs text-gray-600 mb-1">
                                        Closing Time
                                    </label>
                                    <input
                                        type="time"
                                        id="close"
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
                                <strong>Note:</strong> The vendor will be created with a unique ID (e.g., SS1, SS2) 
                                and will require approval before becoming active.
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
                                {loading ? 'Adding...' : 'Add Vendor'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AddVendorModal
