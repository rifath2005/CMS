import { useState, useEffect } from 'react'
import { Search, Store, TrendingUp, Eye, Building2, Filter } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface Vendor {
    id: string
    name: string
    institutionId: string
    institutionName: string
    status: 'active' | 'inactive' | 'suspended'
    ordersToday: number
    totalOrders: number
    revenue: number
    lastActive?: string
    createdAt: string
    productsCount: number
}

interface Institution {
    id: string
    name: string
}

const Vendors = () => {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all')
    const [institutionFilter, setInstitutionFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<'name' | 'ordersToday' | 'lastActive'>('ordersToday')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // TODO: Implement API calls
            // const [vendorsRes, institutionsRes] = await Promise.all([
            //   api.get('/super-admin/vendors'),
            //   api.get('/super-admin/institutions')
            // ])
            // setVendors(vendorsRes.data)
            // setInstitutions(institutionsRes.data)

            // Mock data
            setInstitutions([
                { id: '1', name: 'ABC University' },
                { id: '2', name: 'XYZ College' },
                { id: '3', name: 'Tech Institute' }
            ])

            setVendors([
                {
                    id: '1',
                    name: 'Main Cafeteria',
                    institutionId: '1',
                    institutionName: 'ABC University',
                    status: 'active',
                    ordersToday: 45,
                    totalOrders: 1250,
                    revenue: 125000,
                    lastActive: '2024-02-03T09:30:00Z',
                    createdAt: '2024-01-15T08:00:00Z',
                    productsCount: 35
                },
                {
                    id: '2',
                    name: 'Coffee Corner',
                    institutionId: '1',
                    institutionName: 'ABC University',
                    status: 'active',
                    ordersToday: 28,
                    totalOrders: 890,
                    revenue: 45000,
                    lastActive: '2024-02-03T10:15:00Z',
                    createdAt: '2024-01-20T09:00:00Z',
                    productsCount: 18
                },
                {
                    id: '3',
                    name: 'Student Canteen',
                    institutionId: '2',
                    institutionName: 'XYZ College',
                    status: 'active',
                    ordersToday: 32,
                    totalOrders: 670,
                    revenue: 67000,
                    lastActive: '2024-02-03T08:45:00Z',
                    createdAt: '2024-02-01T10:00:00Z',
                    productsCount: 42
                },
                {
                    id: '4',
                    name: 'Snack Bar',
                    institutionId: '2',
                    institutionName: 'XYZ College',
                    status: 'inactive',
                    ordersToday: 0,
                    totalOrders: 234,
                    revenue: 12000,
                    lastActive: '2024-01-28T16:30:00Z',
                    createdAt: '2024-01-10T11:00:00Z',
                    productsCount: 12
                },
                {
                    id: '5',
                    name: 'Tech Cafe',
                    institutionId: '3',
                    institutionName: 'Tech Institute',
                    status: 'active',
                    ordersToday: 52,
                    totalOrders: 1450,
                    revenue: 156000,
                    lastActive: '2024-02-03T11:00:00Z',
                    createdAt: '2023-12-10T10:00:00Z',
                    productsCount: 48
                },
                {
                    id: '6',
                    name: 'Food Court',
                    institutionId: '3',
                    institutionName: 'Tech Institute',
                    status: 'suspended',
                    ordersToday: 0,
                    totalOrders: 890,
                    revenue: 89000,
                    lastActive: '2024-01-20T14:20:00Z',
                    createdAt: '2023-11-15T09:00:00Z',
                    productsCount: 56
                }
            ])
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredVendors = vendors
        .filter(vendor => {
            const matchesSearch =
                vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.institutionName.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter
            const matchesInstitution = institutionFilter === 'all' || vendor.institutionId === institutionFilter
            return matchesSearch && matchesStatus && matchesInstitution
        })
        .sort((a, b) => {
            let aValue: any = a[sortField]
            let bValue: any = b[sortField]

            if (sortField === 'lastActive') {
                aValue = a.lastActive ? new Date(a.lastActive).getTime() : 0
                bValue = b.lastActive ? new Date(b.lastActive).getTime() : 0
            }

            const modifier = sortOrder === 'asc' ? 1 : -1
            return aValue > bValue ? modifier : -modifier
        })

    const totalOrdersToday = vendors.reduce((sum, v) => sum + v.ordersToday, 0)
    const activeVendors = vendors.filter(v => v.status === 'active').length
    const totalRevenue = vendors.reduce((sum, v) => sum + v.revenue, 0)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800'
            case 'inactive':
                return 'bg-gray-100 text-gray-800'
            case 'suspended':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const formatLastActive = (lastActive?: string) => {
        if (!lastActive) return 'Never'

        const now = new Date()
        const then = new Date(lastActive)
        const diffMs = now.getTime() - then.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) return `${diffMins} min ago`
        if (diffHours < 24) return `${diffHours} hr ago`
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        return then.toLocaleDateString()
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
                <h1 className="text-3xl font-bold text-gray-900">Vendors Overview</h1>
                <p className="text-gray-600 mt-2">Platform-wide vendor monitoring (read-only)</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Vendors</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{vendors.length}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <Store className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Vendors</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{activeVendors}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <Store className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Orders Today</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{totalOrdersToday}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                ₹{(totalRevenue / 1000).toFixed(0)}K
                            </p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
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
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
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

                    <select
                        value={`${sortField}-${sortOrder}`}
                        onChange={(e) => {
                            const [field, order] = e.target.value.split('-')
                            setSortField(field as any)
                            setSortOrder(order as any)
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="ordersToday-desc">Most Orders Today</option>
                        <option value="ordersToday-asc">Least Orders Today</option>
                        <option value="lastActive-desc">Recently Active</option>
                        <option value="lastActive-asc">Least Active</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                    </select>
                </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Orders Today
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Orders
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Products
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Active
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVendors.map((vendor) => (
                                <tr key={vendor.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-purple-100 p-2 rounded-lg">
                                                <Store className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {vendor.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {vendor.id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">
                                                {vendor.institutionName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                                            {vendor.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {vendor.ordersToday}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {vendor.totalOrders.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {vendor.productsCount}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            ₹{(vendor.revenue / 1000).toFixed(1)}K
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {formatLastActive(vendor.lastActive)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                            title="View Details"
                                        >
                                            <Eye className="w-5 h-5" />
                                            <span className="text-xs">View</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredVendors.length === 0 && (
                    <div className="text-center py-12">
                        <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No vendors found</p>
                    </div>
                )}
            </div>

            {/* Info Banner */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Filter className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">Read-Only View</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            This is a monitoring view only. Vendor management (products, pricing, etc.) is handled by Institution Admins.
                            Use this page to monitor vendor activity across all institutions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Vendors
