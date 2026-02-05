import { useState, useEffect } from 'react'
import { Search, Plus, Settings, Filter, MoreVertical, Building, Users, Mail, ShieldCheck, X, Check, Globe, MapPin, Phone } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

interface Institution {
    id: string
    name: string
    domain: string
    status: 'active' | 'suspended'
    plan: 'free' | 'custom'
    usersCount: number
    vendorsCount: number
    createdAt: string
    contactEmail?: string
    contactPhone?: string
    address?: string
}

interface InstitutionAdmin {
    id: string
    name: string
    email: string
    status: 'active' | 'disabled'
}

const OrganizationsList = () => {
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
    const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'custom'>('all')
    const [sortField, setSortField] = useState<keyof Institution>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const navigate = useNavigate()

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)
    const [showAdminModal, setShowAdminModal] = useState(false)
    const [activeInstAdmins, setActiveInstAdmins] = useState<InstitutionAdmin[]>([])
    const [isAdminLoading, setIsAdminLoading] = useState(false)

    // Form states
    const [newInst, setNewInst] = useState({
        name: '',
        domain: '',
        contactEmail: '',
        contactPhone: '',
        address: ''
    })

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

    const handleAddInstitution = async () => {
        try {
            await api.post('/institutions', newInst)
            setShowAddModal(false)
            setNewInst({ name: '', domain: '', contactEmail: '', contactPhone: '', address: '' })
            fetchInstitutions()
        } catch (error) {
            console.error('Failed to add institution:', error)
        }
    }

    const fetchAdmins = async (instId: string) => {
        setIsAdminLoading(true)
        try {
            const response = await api.get(`/super-admin/org-admins?institutionId=${instId}`)
            setActiveInstAdmins(response.data.data)
        } catch (error) {
            console.error('Failed to fetch admins:', error)
        } finally {
            setIsAdminLoading(false)
        }
    }

    const filteredInstitutions = institutions
        .filter(inst => {
            const matchesSearch = inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                inst.domain?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || inst.status === statusFilter
            const matchesPlan = planFilter === 'all' || inst.plan === planFilter
            return matchesSearch && matchesStatus && matchesPlan
        })
        .sort((a, b) => {
            const aValue = a[sortField] || ''
            const bValue = b[sortField] || ''
            const modifier = sortOrder === 'asc' ? 1 : -1
            return aValue > bValue ? modifier : -modifier
        })

    const handleConfigure = (id: string) => {
        navigate(`/main-admin/organizations/${id}/configure`)
    }

    const handleManageAdmins = (inst: Institution) => {
        setSelectedInstitution(inst)
        setShowAdminModal(true)
        fetchAdmins(inst.id)
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Organizations</h1>
                    <p className="text-muted-foreground mt-1">Platform-wide management of institutions and their configurations.</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="gap-2 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5" />
                    New Organization
                </Button>
            </div>

            {/* Filters Bar */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or domain..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 min-w-[140px]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>

                        <select
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value as any)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 min-w-[140px]"
                        >
                            <option value="all">All Plans</option>
                            <option value="free">Free</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Organizations Grid/Table */}
            <Card className="border-none shadow-xl shadow-gray-200/50">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Institution</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Domain</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Usage</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-white">
                            {filteredInstitutions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                        No organizations found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredInstitutions.map((inst) => (
                                    <tr key={inst.id} className="hover:bg-muted/20 transition-colors group/row">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/5 group-hover/row:scale-110 transition-transform">
                                                    <Building className="w-5 h-5" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-[15px] font-bold text-foreground leading-tight">{inst.name}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{inst.contactEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-medium font-mono text-foreground">@{inst.domain}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={inst.status === 'active' ? 'success' : 'destructive'} className="rounded-md uppercase tracking-wider text-[10px]">
                                                {inst.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Users</span>
                                                    <span className="text-sm font-bold">{inst.usersCount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vendors</span>
                                                    <span className="text-sm font-bold">{inst.vendorsCount}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-all duration-300 translate-x-2 group-hover/row:translate-x-0">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => handleManageAdmins(inst)}
                                                    className="h-9 w-9 text-blue-600 hover:bg-blue-50"
                                                    title="Manage Admins"
                                                >
                                                    <ShieldCheck className="w-4.5 h-4.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => handleConfigure(inst.id)}
                                                    className="h-9 w-9 text-primary hover:bg-primary/10"
                                                    title="Permissions"
                                                >
                                                    <Settings className="w-4.5 h-4.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                                    <MoreVertical className="w-4.5 h-4.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Institution Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg shadow-2xl overflow-hidden border-none animate-in zoom-in-95 duration-300">
                        <CardHeader className="p-8 bg-muted/30 border-b relative">
                            <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/50 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <CardTitle className="text-2xl font-black">Register New Institution</CardTitle>
                            <CardDescription>Initialize a new instance on the CMS platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Institution Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Stanford University"
                                        value={newInst.name}
                                        onChange={e => setNewInst({...newInst, name: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:bg-background transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Email Domain</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">@</span>
                                        <input 
                                            type="text" 
                                            placeholder="stanford.edu"
                                            value={newInst.domain}
                                            onChange={e => setNewInst({...newInst, domain: e.target.value})}
                                            className="w-full pl-9 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:bg-background transition-all font-medium font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Contact Email</label>
                                    <input 
                                        type="email" 
                                        placeholder="admin@institution.com"
                                        value={newInst.contactEmail}
                                        onChange={e => setNewInst({...newInst, contactEmail: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:bg-background transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1 font-bold h-11">Discard</Button>
                                <Button onClick={handleAddInstitution} className="flex-1 font-bold h-11 shadow-lg shadow-primary/20">Create Institution</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Manage Admins Modal */}
            {showAdminModal && selectedInstitution && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <Card className="w-full max-w-2xl shadow-2xl overflow-hidden border-none animate-in zoom-in-95 duration-300">
                        <CardHeader className="p-8 bg-muted/30 border-b relative">
                            <button onClick={() => setShowAdminModal(false)} className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/50 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black">{selectedInstitution.name} Admins</CardTitle>
                                    <CardDescription>Manage administrative access for this organization.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[400px] overflow-y-auto p-8">
                                {isAdminLoading ? (
                                    <div className="flex justify-center py-12"><LoadingSpinner size="md" /></div>
                                ) : activeInstAdmins.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">No administrators assigned yet.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {activeInstAdmins.map(admin => (
                                            <div key={admin.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-border transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center font-bold text-primary shadow-sm">
                                                        {admin.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">{admin.name}</p>
                                                        <p className="text-xs font-medium text-muted-foreground">{admin.email}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={admin.status === 'active' ? 'success' : 'secondary'} className="rounded-md uppercase tracking-widest text-[10px] font-bold">
                                                    {admin.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-8 bg-muted/10 border-t flex justify-end">
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Assign New Admin
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default OrganizationsList
