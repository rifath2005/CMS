import { useState, useEffect } from 'react'
import { institutionService, CreateInstitutionData, AssignAdminData } from '../services/institutionService'
import { Institution } from '../types'
import { Plus, Edit, Users, Trash2 } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { DataTable, ColumnDef, StatusChip, StepDrawer, StepConfig } from '../components/shared'

export default function Institutions() {
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showCreateDrawer, setShowCreateDrawer] = useState(false)
    const [showAssignAdminModal, setShowAssignAdminModal] = useState(false)
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormData] = useState<CreateInstitutionData>({
        name: '',
        emailDomain: '',
        contactEmail: '',
        contactPhone: '',
    })
    const [adminData, setAdminData] = useState({
        email: '',
        password: '',
        name: '',
    })

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

    const handleCreateInstitution = async () => {
        try {
            await institutionService.createInstitution(formData)
            setShowCreateDrawer(false)
            setCurrentStep(0)
            setFormData({
                name: '',
                emailDomain: '',
                contactEmail: '',
                contactPhone: '',
            })
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

    const handleCloseDrawer = () => {
        setShowCreateDrawer(false)
        setCurrentStep(0)
        setFormData({
            name: '',
            emailDomain: '',
            contactEmail: '',
            contactPhone: '',
        })
    }

    // Define table columns
    const columns: ColumnDef<Institution>[] = [
        {
            key: 'name',
            header: 'Institution Name',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.name}</span>
                </div>
            ),
        },
        {
            key: 'emailDomain',
            header: 'Domain',
            accessor: (row) => <span className="text-gray-600">{row.emailDomain}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            accessor: () => <StatusChip status="active" size="sm" />,
            align: 'center',
        },
        {
            key: 'createdAt',
            header: 'Created Date',
            accessor: (row) => (
                <span className="text-gray-600">
                    {new Date(row.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            // Edit functionality placeholder
                        }}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Edit institution"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelectedInstitution(row)
                            setShowAssignAdminModal(true)
                        }}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-green-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Assign admin"
                    >
                        <Users className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            // Deactivate functionality placeholder
                        }}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Deactivate institution"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
            align: 'right',
        },
    ]

    // Define step drawer steps
    const steps: StepConfig[] = [
        {
            title: 'Basic Info',
            description: 'Enter the institution name and email domain',
            isValid: formData.name.trim() !== '' && formData.emailDomain.trim() !== '',
            content: (
                <div className="space-y-4">
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
                </div>
            ),
        },
        {
            title: 'Contact & Domain',
            description: 'Add contact information for the institution',
            isValid: true, // Optional fields
            content: (
                <div className="space-y-4">
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
                </div>
            ),
        },
        {
            title: 'Admin Assignment',
            description: 'Assign an administrator for this institution',
            isValid: adminData.name.trim() !== '' && adminData.email.trim() !== '' && adminData.password.trim() !== '',
            content: (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={adminData.name}
                            onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
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
                            value={adminData.email}
                            onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`admin@${formData.emailDomain || 'university.edu'}`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                        </label>
                        <input
                            type="password"
                            required
                            value={adminData.password}
                            onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
            ),
        },
    ]

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Institutions</h1>
                <button
                    onClick={() => setShowCreateDrawer(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 min-h-[44px]"
                >
                    <Plus className="h-5 w-5" />
                    <span>Create Institution</span>
                </button>
            </div>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            <div className="bg-white rounded-lg shadow">
                <DataTable
                    columns={columns}
                    data={institutions}
                    stickyHeader={true}
                    zebraStriping={false}
                    hoverActions={true}
                />
            </div>

            {/* Create Institution Step Drawer */}
            <StepDrawer
                isOpen={showCreateDrawer}
                onClose={handleCloseDrawer}
                steps={steps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                onComplete={handleCreateInstitution}
            />

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
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 min-h-[44px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 min-h-[44px]"
                        >
                            Assign Admin
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
