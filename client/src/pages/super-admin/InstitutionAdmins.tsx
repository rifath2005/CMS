import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Key, CheckCircle, XCircle, Building2, ShieldCheck, Mail } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'

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

const OrgAdminsList = () => {
    const [admins, setAdmins] = useState<InstitutionAdmin[]>([])
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
    const [institutionFilter, setInstitutionFilter] = useState<string>('all')

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)

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
        setIsLoading(true)
        try {
            const [adminsRes, institutionsRes] = await Promise.all([
                api.get('/super-admin/org-admins'),
                api.get('/institutions')
            ]);
            
            setAdmins(adminsRes.data.data);
            setInstitutions(institutionsRes.data.data);
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

     /* --- Handlers (Mock) --- */
    const handleAddAdmin = async () => {
        console.log('Adding admin:', formData)
        setShowAddModal(false)
        setFormData({ name: '', email: '', institutionId: '', password: '' })
    }

    // ... other handlers similar to original ...

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Organization Admins</h1>
                    <p className="text-gray-500 mt-1">Manage access for institution administrators.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    New Admin
                </button>
            </div>

            {/* Stats Overview */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Admins</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{admins.length}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Accounts</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{admins.filter(a => a.status === 'active').length}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Disabled</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{admins.filter(a => a.status === 'disabled').length}</h3>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl text-gray-600">
                        <XCircle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                 <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
                 <div className="flex gap-3 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                    </select>

                    <select
                        value={institutionFilter}
                        onChange={(e) => setInstitutionFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Institutions</option>
                        {institutions.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold">
                                                {admin.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {admin.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900 font-medium">
                                            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                            {admin.institutionName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            admin.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {admin.status === 'active' ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                         {admin.lastLogin
                                            ? new Date(admin.lastLogin).toLocaleDateString() + ' ' + new Date(admin.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : <span className="text-gray-400 italic">Never</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Reset Password">
                                                <Key className="w-4 h-4" />
                                            </button>
                                             <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Simple Add Modal Placeholder (Full implementation would be similar to original but styled) */}
             {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 text-center">Add Administrator</h2>
                         <div className="space-y-4">
                            <input type="text" placeholder="Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                             <input type="email" placeholder="Email Address" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                             <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-600">
                                <option value="">Select Organization</option>
                                <option value="1">ABC University</option>
                             </select>
                        </div>
                        <div className="flex gap-4 mt-8">
                             <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-200 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddAdmin}
                                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                            >
                                Create Account
                            </button>
                        </div>
                    </div>
                </div>
             )}
        </div>
    )
}

export default OrgAdminsList
