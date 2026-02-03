import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Key, Ban, CheckCircle, XCircle, Building2 } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface InstitutionAdmin {
    id: string
    name: string
    email: string
    institutionId: string
    institutionName: string
    status: 'active' | 'disabled'
    lastLogin?: string
    createdAt: string
}

interface Institution {
    id: string
    name: string
}

const InstitutionAdmins = () => {
    const [admins, setAdmins] = useState<InstitutionAdmin[]>([])
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
    const [institutionFilter, setInstitutionFilter] = useState<string>('all')

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedAdmin, setSelectedAdmin] = useState<InstitutionAdmin | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        institutionId: '',
        password: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // TODO: Implement API calls
            // const [adminsRes, institutionsRes] = await Promise.all([
            //   api.get('/super-admin/institution-admins'),
            //   api.get('/super-admin/institutions')
            // ])
            // setAdmins(adminsRes.data)
            // setInstitutions(institutionsRes.data)

            // Mock data
            setInstitutions([
                { id: '1', name: 'ABC University' },
                { id: '2', name: 'XYZ College' },
                { id: '3', name: 'Tech Institute' }
            ])

            setAdmins([
                {
                    id: '1',
                    name: 'John Smith',
                    email: 'john.smith@abc.edu',
                    institutionId: '1',
                    institutionName: 'ABC University',
                    status: 'active',
                    lastLogin: '2024-02-01T10:30:00Z',
                    createdAt: '2024-01-15T08:00:00Z'
                },
                {
                    id: '2',
                    name: 'Sarah Johnson',
                    email: 'sarah.j@xyz.edu',
                    institutionId: '2',
                    institutionName: 'XYZ College',
                    status: 'active',
                    lastLogin: '2024-02-02T14:20:00Z',
                    createdAt: '2024-01-20T09:00:00Z'
                },
                {
                    id: '3',
                    name: 'Mike Davis',
                    email: 'mike.d@tech.edu',
                    institutionId: '3',
                    institutionName: 'Tech Institute',
                    status: 'disabled',
                    lastLogin: '2024-01-25T16:45:00Z',
                    createdAt: '2023-12-10T10:00:00Z'
                }
            ])
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredAdmins = admins.filter(admin => {
        const matchesSearch =
            admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            admin.institutionName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || admin.status === statusFilter
        const matchesInstitution = institutionFilter === 'all' || admin.institutionId === institutionFilter
        return matchesSearch && matchesStatus && matchesInstitution
    })

    const handleAddAdmin = async () => {
        try {
            // TODO: Implement API call
            // await api.post('/super-admin/institution-admins', formData)
            console.log('Adding admin:', formData)
            setShowAddModal(false)
            setFormData({ name: '', email: '', institutionId: '', password: '' })
            fetchData()
        } catch (error) {
            console.error('Failed to add admin:', error)
        }
    }

    const handleEditAdmin = async () => {
        try {
            // TODO: Implement API call
            // await api.patch(`/super-admin/institution-admins/${selectedAdmin?.id}`, formData)
            console.log('Editing admin:', selectedAdmin?.id, formData)
            setShowEditModal(false)
            setSelectedAdmin(null)
            fetchData()
        } catch (error) {
            console.error('Failed to edit admin:', error)
        }
    }

    const handleResetPassword = async () => {
        try {
            // TODO: Implement API call
            // await api.post(`/super-admin/institution-admins/${selectedAdmin?.id}/reset-password`, {
            //   password: formData.password
            // })
            console.log('Resetting password for:', selectedAdmin?.id)
            setShowResetPasswordModal(false)
            setSelectedAdmin(null)
            setFormData({ ...formData, password: '' })
        } catch (error) {
            console.error('Failed to reset password:', error)
        }
    }

    const handleToggleStatus = async (admin: InstitutionAdmin) => {
        try {
            const newStatus = admin.status === 'active' ? 'disabled' : 'active'
            // TODO: Implement API call
            // await api.patch(`/super-admin/institution-admins/${admin.id}/status`, { status: newStatus })
            console.log('Toggling status:', admin.id, newStatus)
            fetchData()
        } catch (error) {
            console.error('Failed to toggle status:', error)
        }
    }

    const handleDeleteAdmin = async () => {
        try {
            // TODO: Implement API call
            // await api.delete(`/super-admin/institution-admins/${selectedAdmin?.id}`)
            console.log('Deleting admin:', selectedAdmin?.id)
            setShowDeleteModal(false)
            setSelectedAdmin(null)
            fetchData()
        } catch (error) {
            console.error('Failed to delete admin:', error)
        }
    }

    const openEditModal = (admin: InstitutionAdmin) => {
        setSelectedAdmin(admin)
        setFormData({
            name: admin.name,
            email: admin.email,
            institutionId: admin.institutionId,
            password: ''
        })
        setShowEditModal(true)
    }

    const openResetPasswordModal = (admin: InstitutionAdmin) => {
        setSelectedAdmin(admin)
        setFormData({ ...formData, password: '' })
        setShowResetPasswordModal(true)
    }

    const openDeleteModal = (admin: InstitutionAdmin) => {
        setSelectedAdmin(admin)
        setShowDeleteModal(true)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Institution Admins</h1>
                <p className="text-gray-600 mt-2">Manage institution administrator accounts</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>

                    <select
                        value={institutionFilter}
                        onChange={(e) => setInstitutionFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Institutions</option>
                        {institutions.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Admin
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Admins</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{admins.length}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Admins</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {admins.filter(a => a.status === 'active').length}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Disabled Admins</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {admins.filter(a => a.status === 'disabled').length}
                            </p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-lg">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Admin
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {admin.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {admin.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">
                                                {admin.institutionName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {admin.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {admin.lastLogin
                                            ? new Date(admin.lastLogin).toLocaleString()
                                            : 'Never'
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(admin.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(admin)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Edit"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => openResetPasswordModal(admin)}
                                                className="text-purple-600 hover:text-purple-900"
                                                title="Reset Password"
                                            >
                                                <Key className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(admin)}
                                                className={admin.status === 'active'
                                                    ? 'text-orange-600 hover:text-orange-900'
                                                    : 'text-green-600 hover:text-green-900'
                                                }
                                                title={admin.status === 'active' ? 'Disable' : 'Enable'}
                                            >
                                                <Ban className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(admin)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredAdmins.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No admins found</p>
                    </div>
                )}
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Institution Admin</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="John Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="john@institution.edu"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Institution
                                </label>
                                <select
                                    value={formData.institutionId}
                                    onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Select Institution</option>
                                    {institutions.map(inst => (
                                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddAdmin}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Add Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Admin Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Institution Admin</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Institution
                                </label>
                                <select
                                    value={formData.institutionId}
                                    onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    {institutions.map(inst => (
                                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEditModal(false)
                                    setSelectedAdmin(null)
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditAdmin}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                        <p className="text-gray-600 mb-4">
                            Reset password for <strong>{selectedAdmin?.name}</strong>
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowResetPasswordModal(false)
                                    setSelectedAdmin(null)
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetPassword}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Delete Admin</h2>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete <strong>{selectedAdmin?.name}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setSelectedAdmin(null)
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAdmin}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InstitutionAdmins
