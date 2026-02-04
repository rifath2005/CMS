import { useState, useEffect } from 'react'
import { Search, Store, Building2, Wallet, ShoppingBag, Clock } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'

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

const GlobalVendorsList = () => {
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
        setIsLoading(true)
        try {
            const [vendorsRes, institutionsRes] = await Promise.all([
                api.get('/super-admin/vendors'),
                api.get('/institutions')
            ]);
            
            setVendors(vendorsRes.data.data);
            setInstitutions(institutionsRes.data.data);
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

    const formatLastActive = (lastActive?: string) => {
        if (!lastActive) return 'Never'
        const now = new Date()
        const then = new Date(lastActive)
        const diffMs = now.getTime() - then.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Vendors Monitor</h1>
                    <p className="text-gray-500 mt-1">Real-time status of all ecosystem vendors.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                     <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Store className="w-24 h-24" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Vendors</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{activeVendors}<span className="text-lg text-gray-400 font-normal">/{vendors.length}</span></h3>
                    </div>
                </div>

                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingBag className="w-24 h-24" />
                    </div>
                    <div>
                         <p className="text-sm font-medium text-gray-500">Orders Today</p>
                         <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalOrdersToday}</h3>
                    </div>
                </div>

                 <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg shadow-indigo-200 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <div>
                         <p className="text-sm font-medium text-indigo-100">Total Revenue</p>
                         <h3 className="text-3xl font-bold mt-1">₹{(totalRevenue / 1000).toFixed(1)}K</h3>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search vendors or institutions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>

                     <select
                        value={`${sortField}-${sortOrder}`}
                        onChange={(e) => {
                            const [field, order] = e.target.value.split('-')
                            setSortField(field as any)
                            setSortOrder(order as any)
                        }}
                         className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                         <option value="ordersToday-desc">Volume (High-Low)</option>
                         <option value="lastActive-desc">Recently Active</option>
                         <option value="revenue-desc">Revenue (High-Low)</option>
                    </select>
                </div>
            </div>

            {/* Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVendors.map((vendor) => (
                    <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Store className="w-6 h-6" />
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                                vendor.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {vendor.status}
                            </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{vendor.name}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                            <Building2 className="w-3.5 h-3.5" />
                            {vendor.institutionName}
                        </div>
                        
                         <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Orders Today</span>
                                <span className="font-semibold text-gray-900">{vendor.ordersToday}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Revenue</span>
                                <span className="font-semibold text-gray-900">₹{(vendor.revenue / 1000).toFixed(1)}K</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Last Active</span>
                                <span className="flex items-center gap-1 text-gray-900">
                                    <Clock className="w-3 h-3" /> {formatLastActive(vendor.lastActive)}
                                </span>
                            </div>
                        </div>
                        
                        <button className="w-full mt-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            View Details
                        </button>
                    </div>
                ))}
            </div>
             {filteredVendors.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500">No vendors found matching your filters</p>
                </div>
            )}
        </div>
    )
}

export default GlobalVendorsList
