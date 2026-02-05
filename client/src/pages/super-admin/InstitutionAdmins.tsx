import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Key, CheckCircle, XCircle, Building2, ShieldCheck, Mail, RefreshCw, UserPlus, Filter } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { KPICard } from '../../components/shared/KPICard'
import { cn } from '../../lib/utils'

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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Organization Admins</h1>
                    <p className="text-muted-foreground mt-1">Manage administrative access control per institution.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="gap-2 shadow-xl shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" />
                        New Administrator
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Admins"
                    value={admins.length}
                    subtitle="Platform platform administrators"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    iconColor="text-primary"
                    iconBgColor="bg-primary/10"
                />

                <KPICard
                    title="Active Accounts"
                    value={admins.filter(a => a.status === 'active').length}
                    subtitle="Currently authorized"
                    icon={<CheckCircle className="w-6 h-6" />}
                    iconColor="text-semantic-success"
                    iconBgColor="bg-semantic-success/10"
                />

                <KPICard
                    title="Disabled Accounts"
                    value={admins.filter(a => a.status === 'disabled').length}
                    subtitle="Access revoked"
                    icon={<XCircle className="w-6 h-6" />}
                    iconColor="text-semantic-error"
                    iconBgColor="bg-semantic-error/10"
                />
            </div>

            {/* Filters Bar */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Find by name, email or org..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 min-w-[130px]"
                        >
                            <option value="all">Status</option>
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                        </select>

                        <select
                            value={institutionFilter}
                            onChange={(e) => setInstitutionFilter(e.target.value)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 min-w-[160px]"
                        >
                            <option value="all">Organizations</option>
                            {institutions.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>

                        <Button variant="outline" size="icon" className="shrink-0 bg-background h-10 w-10">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Admins Table */}
            <Card className="border-none shadow-xl shadow-gray-200/50">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Admin Identity</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Organization</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Login Activity</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-white">
                            {filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                        No administrators found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-muted/10 transition-colors group/row">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-11 w-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold border border-primary/5 group-hover/row:scale-110 transition-transform">
                                                    {admin.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-[15px] font-bold text-foreground leading-tight">{admin.name}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 font-medium">
                                                        <Mail className="w-3 h-3 opacity-60" />
                                                        {admin.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-[14px] text-foreground font-bold">
                                                <Building2 className="w-4 h-4 mr-2 text-primary/60" />
                                                {admin.institutionName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={admin.status === 'active' ? 'success' : 'secondary'} className="rounded-md uppercase tracking-wider text-[10px] font-bold">
                                                {admin.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                             {admin.lastLogin
                                                ? <div className="flex flex-col">
                                                    <span className="text-foreground font-bold">{new Date(admin.lastLogin).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{new Date(admin.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                  </div>
                                                : <span className="text-muted-foreground italic text-xs">Never Active</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-all duration-300 translate-x-2 group-hover/row:translate-x-0">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5" title="Modify">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-600 hover:bg-amber-50" title="Security Credentials">
                                                    <Key className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-semantic-error hover:bg-semantic-error/10" title="Revoke Access">
                                                    <Trash2 className="w-4 h-4" />
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
            
            {/* Add Modal */}
             {showAddModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl overflow-hidden border-none animate-in zoom-in-95 duration-300">
                        <CardHeader className="text-center p-8 bg-muted/30 border-b">
                            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-2xl font-bold">New Administrator</CardTitle>
                            <CardDescription>Grant administrative privileges for an organization</CardDescription>
                        </CardHeader>
                         <CardContent className="p-8 space-y-4">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Full Name</p>
                                    <input type="text" placeholder="e.g. John Doe" className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:bg-background transition-all font-medium text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Email Address</p>
                                    <input type="email" placeholder="john@university.edu" className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:bg-background transition-all font-medium text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Target Organization</p>
                                    <select className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:bg-background transition-all font-bold text-sm text-foreground appearance-none">
                                        <option value="">Choose an institution...</option>
                                        {institutions.map(inst => (
                                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 font-bold h-11"
                                >
                                    Discard
                                </Button>
                                <Button
                                    onClick={handleAddAdmin}
                                    className="flex-1 font-bold h-11 shadow-lg shadow-primary/20"
                                >
                                    Create Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
             )}
        </div>
    )
}

export default OrgAdminsList
