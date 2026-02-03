import { useState, useEffect } from 'react'
import { Search, Plus, Settings, Filter, MoreVertical, Building } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'
import { useNavigate } from 'react-router-dom'

interface Institution {
    id: string
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

const OrganizationsList = () => {
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
    const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'custom'>('all')
    const [sortField, setSortField] = useState<SortField>('createdAt')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const navigate = useNavigate()

    useEffect(() => {
        fetchInstitutions()
    }, [])

    const fetchInstitutions = async () => {
        setIsLoading(true)
        try {
            const response = await api.get('/institutions')
            setInstitutions(response.data.data)
        } catch (error: any) {
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

    const handleConfigure = (id: string) => {
        navigate(`/main-admin/organizations/${id}/configure`)
    }

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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Organizations</h1>
                    <p className="text-gray-500 mt-1">Manage platform institutions and their configurations.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium">
                    <Plus className="w-5 h-5" />
                    New Organization
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search organizations..."
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
                        <option value="suspended">Suspended</option>
                    </select>

                    <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Organizations Grid/Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Users</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendors</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredInstitutions.map((inst) => (
                                <tr key={inst.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                <Building className="w-5 h-5" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{inst.name}</div>
                                                <div className="text-xs text-gray-500">{inst.contactEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            inst.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                            {inst.status === 'active' ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm ${inst.plan === 'custom' ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                                            {inst.plan.charAt(0).toUpperCase() + inst.plan.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {inst.usersCount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {inst.vendorsCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleConfigure(inst.id)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Configure"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default OrganizationsList
