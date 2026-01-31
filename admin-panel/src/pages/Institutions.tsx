import { useState, useEffect } from 'react'
import { institutionService, CreateInstitutionData, AssignAdminData } from '../services/institutionService'
import { Institution } from '../types'
import { Plus, Building2, Mail, Phone, Users } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'

export default function Institutions() {
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showAssignAdminModal, setShowAssignAdminModal] = useState(false)
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)

    useEffect(() => {
        loadInstitutions()
    }, [])

    const loadInstitutions = async () => {
        try {
            setLoading(true)
            const data = await institutionService.getAllInstitutions()
            setInstitutions(data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load institutions')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateInstitution = async (data: CreateInstitutionData) => {
        try {
            await institutionService.createInstitution(data)
            setShowCreateModal(false)
            loadInstitutions()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create institution')
        }
    }

    const handleAssignAdmin = async (data: AssignAdminData) => {
        try {
            await institutionService.assignInstitutionAdmin(data)
            setShowAssignAdminModal(false)
            setSelectedInstitution(null)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to assign admin')
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Institutions</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    <Plus className="h-5 w-5" />
                    <span>Create Institution</span>
                </button>
            </div>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {institutions.map((institution) => (
                    <div key={institution.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <Building2 className="h-8 w-8 text-blue-600" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{institution.name}</h3>
                                    <p className="text-sm text-gray-500">{institution.emailDomain}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            {institution.contactEmail && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Mail className="h-4 w-4" />
                                    <span>{institution.contactEmail}</span>
                                </div>
                            )}
                            {institution.contactPhone && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Phone className="h-4 w-4" />
                                    <span>{institution.contactPhone}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                setSelectedInstitution(institution)
                                setShowAssignAdminModal(true)
                            }}
                            className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                        >
                            <Users className="h-4 w-4" />
                            <span>Assign Admin</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* Create Institution Modal */}
            {showCreateModal && (
                <CreateInstitutionModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateInstitution}
                />
            )}

            {/* Assign Admin Modal */}
            {showAssignAdminModal && selectedInstitution && (
                <AssignAdminModal
                    institution={selectedInstitution}
                    onClose={() => {
                        setShowAssignAdminModal(false)
                        setSelectedInstitution(null)
                    }}
                    onAssign={handleAssignAdmin}
                />
            )}
        </div>
    )
}

// Create Institution Modal Component
function CreateInstitutionModal({
    onClose,
    onCreate,
}: {
    onClose: () => void
    onCreate: (data: CreateInstitutionData) => void
}) {
    const [formData, setFormData] = useState<CreateInstitutionData>({
        name: '',
        emailDomain: '',
        contactEmail: '',
        contactPhone: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onCreate(formData)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Institution</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Institution Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="University Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Domain *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.emailDomain}
                            onChange={(e) => setFormData({ ...formData, emailDomain: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="university.edu"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email
                        </label>
                        <input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="contact@university.edu"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+1234567890"
                        />
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
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Assign Admin Modal Component
function AssignAdminModal({
    institution,
    onClose,
    onAssign,
}: {
    institution: Institution
    onClose: () => void
    onAssign: (data: AssignAdminData) => void
}) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onAssign({
            ...formData,
            institutionId: institution.id,
        })
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Assign Institution Admin</h2>
                <p className="text-gray-600 mb-4">For {institution.name}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`admin@${institution.emailDomain}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
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
                            Assign Admin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
