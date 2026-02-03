import { useState, useEffect } from 'react'
import { Search, Plus, Eye, Settings, Ban, Trash2, Filter, Download } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Institution {
    id: number
    name: string
    status: 'active' | 'suspended'
    plan: 'free' | 'custom'
    usersCount: number
    vendorsCount: number
    createdAt: string
    contactEmail?: string
    contactPhone?: string
}

type SortField = 'name' | 'status' | 'plan' | 'usersCount' | 'vendorsCount' | 'createdAt'
type SortOrder = 'asc' | 'desc'

const Institutions = () => {
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
    const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'custom'>('all')
    const [sortField, setSortField] = useState<SortField>('createdAt')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showSuspendModal, setShowSuspendModal] = useState(false)
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)

    useEffect(() => {
        fetchInstitutions()
    }, [])

    const fetchInstitutions = async () => {
        try {
            // TODO: Implement API call
            // const response = await api.get('/super-admin/institutions')
            // setInstitutions(response.data)

            // Mock data for now
            setInstitutions([
                {
                    id: 1,
                    name: 'ABC University',
                    status: 'active',
                    plan: 'custom',
                    usersCount: 450,
                    vendorsCount: 5,
                    createdAt: '2024-01-15',
                    contactEmail: 'admin@abc.edu',
                    contactPhone: '+91-9876543210'
                },
                {
                    id: 2,
                    name: 'XYZ College',
                    status: 'active',
                    plan: 'free',
                    usersCount: 300,
                    vendorsCount: 3,
                    createdAt: '2024-02-20',
                    contactEmail: 'contact@xyz.edu',
                    contactPhone: '+91-9876543211'
                },
                {
                    id: 3,
                    name: 'Tech Institute',
                    status: 'suspended',
                    plan: 'custom',
                    usersCount: 500,
                    vendorsCount: 4,
                    createdAt: '2023-12-10',
                    contactEmail: 'info@tech.edu',
                    contactPhone: '+91-9876543212'
                }
            ])
        } catch (error) {
            console.error('Failed to fetch institutions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredInstitutions = institutions
        .filter(inst => {
            const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || inst.status === statusFilter
            const matchesPlan = planFilter === 'all' || inst.plan === planFilter
            return matchesSearch && matchesStatus && matchesPlan
        })
        .sort((a, b) => {
            const aValue = a[sortField]
            const bValue = b[sortField]
            const modifier = sortOrder === 'asc' ? 1 : -1
            return aValue > bValue ? modifier : -modifier
        })

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
                <h1 className="text-3xl font-bold text-gray-900">Institutions</h1>
                <p className="text-gray-600 mt-2">Manage all institutions on the platform</p>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search institutions..."
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
                        <option value="suspended">Suspended</option>
                    </select>

                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Plans</option>
                        <option value="free">Free</option>
                        <option value="custom">Custom</option>
                    </select>

                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        <Plus className="w-5 h-5" />
                        Add Institution
                    </button>
                </div>
            </div>

            {/* Institutions Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                    Plan
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                    Users
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                    Vendors
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                                    Created
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInstitutions.map((institution) => (
                                <tr key={institution.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {institution.name}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {institution.contactEmail}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${institution.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {institution.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${institution.plan === 'custom'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {institution.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                                        {institution.usersCount}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                                        {institution.vendorsCount}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                                        {new Date(institution.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => window.location.href = `/super-admin/institutions/${institution.id}`}
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => window.location.href = `/super-admin/institutions/${institution.id}/config`}
                                                className="text-gray-600 hover:text-gray-900 p-1"
                                                title="Configure"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-orange-600 hover:text-orange-900 p-1 hidden sm:block"
                                                title="Suspend"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-900 p-1 hidden sm:block"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredInstitutions.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No institutions found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Institutions
