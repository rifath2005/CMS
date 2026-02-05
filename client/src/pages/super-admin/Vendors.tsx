import { useState, useEffect } from 'react'
import { Search, Store, Building2, Wallet, ShoppingBag, Clock } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/shared/KPICard'
import { cn } from '../../lib/utils'
import { RefreshCw, Filter, ExternalLink } from 'lucide-react'

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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Vendors Monitor</h1>
                    <p className="text-muted-foreground mt-1">Real-time oversight of all ecosystem canteens and stores.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh Feed
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Active Vendors"
                    value={activeVendors}
                    subtitle={`out of ${vendors.length} total`}
                    icon={<Store className="w-6 h-6" />}
                    iconColor="text-primary"
                    iconBgColor="bg-primary/10"
                />

                <KPICard
                    title="Orders Today"
                    value={totalOrdersToday}
                    subtitle="Aggregated volume"
                    icon={<ShoppingBag className="w-6 h-6" />}
                    iconColor="text-orange-600"
                    iconBgColor="bg-orange-100"
                />

                <KPICard
                    title="Total Revenue"
                    value={`₹${(totalRevenue / 1000).toFixed(1)}K`}
                    subtitle="Platform platform share"
                    icon={<Wallet className="w-6 h-6" />}
                    iconColor="text-white"
                    iconBgColor="bg-primary"
                    bgColor="bg-gradient-to-br from-gray-900 to-primary/20 border-gray-800"
                />
            </div>

            {/* Filters Bar */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="p-4 flex flex-col xl:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Find by vendor or institution..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <select
                            value={institutionFilter}
                            onChange={(e) => setInstitutionFilter(e.target.value)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 w-full sm:min-w-[160px]"
                        >
                            <option value="all">Institutions</option>
                            {institutions.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 w-full sm:min-w-[140px]"
                        >
                            <option value="all">Status</option>
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
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 w-full sm:min-w-[170px]"
                        >
                             <option value="ordersToday-desc">Volume (High-Low)</option>
                             <option value="lastActive-desc">Recently Active</option>
                             <option value="revenue-desc">Revenue (High-Low)</option>
                        </select>

                        <Button variant="outline" size="icon" className="shrink-0 bg-background h-10 w-10">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVendors.map((vendor) => (
                    <Card key={vendor.id} className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-none overflow-hidden ring-1 ring-border hover:ring-primary/20">
                        <CardHeader className="p-5 pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="bg-primary/10 p-2.5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm group-hover:scale-110">
                                    <Store className="w-5 h-5" />
                                </div>
                                <Badge variant={vendor.status === 'active' ? 'success' : 'secondary'} className="rounded-md uppercase tracking-wider text-[10px] font-bold">
                                    {vendor.status}
                                </Badge>
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-foreground leading-tight line-clamp-1">{vendor.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1.5 text-xs font-semibold mt-1">
                                    <Building2 className="w-3 h-3 text-primary/60" />
                                    {vendor.institutionName}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="p-5 pt-0 space-y-4">
                             <div className="space-y-2.5 pt-4 border-t border-border">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-medium">Orders Today</span>
                                    <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded text-sm">{vendor.ordersToday}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-medium">Monthly Revenue</span>
                                    <span className="font-bold text-primary text-sm">₹{(vendor.revenue / 1000).toFixed(1)}K</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-medium">Status</span>
                                    <span className="flex items-center gap-1.5 text-foreground font-bold italic">
                                        <Clock className="w-3 h-3 text-primary/60" /> {formatLastActive(vendor.lastActive)}
                                    </span>
                                </div>
                            </div>
                            
                            <Button variant="outline" className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 font-bold group/btn">
                                <span>Monitor Activity</span>
                                <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {filteredVendors.length === 0 && (
                <Card className="border-dashed border-2 py-12 text-center bg-muted/20">
                    <CardContent>
                        <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No results found matching your filters</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default GlobalVendorsList
