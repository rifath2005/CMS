import { useState, useEffect } from 'react'
import { Search, Building2, MoreHorizontal } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { Download, Filter, UserPlus } from 'lucide-react'

interface UserData {
    id: string
    name: string
    email: string
    institutionId: string
    institutionName: string
    role: 'student' | 'faculty' | 'staff'
    walletBalance: number
    status: 'active' | 'suspended'
    lastActive: string
}

interface Institution {
    id: string
    name: string
}

const GlobalUsersList = () => {
    const [users, setUsers] = useState<UserData[]>([])
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'faculty' | 'staff'>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
    const [institutionFilter, setInstitutionFilter] = useState<string>('all')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [usersRes, instRes] = await Promise.all([
                api.get('/super-admin/users'),
                api.get('/institutions')
            ]);
            
            if (usersRes.data.success) {
                setUsers(usersRes.data.data);
            }
            setInstitutions(instRes.data.data);
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setIsLoading(false)
        }
    }



    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter
        const matchesInstitution = institutionFilter === 'all' || user.institutionId === institutionFilter
        return matchesSearch && matchesRole && matchesStatus && matchesInstitution
    })

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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Users Directory</h1>
                    <p className="text-muted-foreground mt-1">Cross-institutional user management and oversight.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 shrink-0">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                    <Button className="gap-2 shadow-xl shadow-primary/20">
                        <UserPlus className="w-5 h-5" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="p-4 flex flex-col xl:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Find by name, email or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <select
                            value={institutionFilter}
                            onChange={(e) => setInstitutionFilter(e.target.value)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 w-full sm:w-[180px]"
                        >
                            <option value="all">All Institutions</option>
                            {institutions.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 w-full sm:w-[130px]"
                        >
                            <option value="all">All Roles</option>
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="staff">Staff</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 w-full sm:w-[130px]"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>

                        <Button variant="outline" size="icon" className="shrink-0 bg-background h-10 w-10">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">User Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Organization</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Role & Balance</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-white">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p className="font-medium">No users found in directory</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/10 transition-colors group/row">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-gradient-to-tr from-primary to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white group-hover/row:scale-110 transition-transform">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-[15px] font-bold text-foreground leading-tight">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-medium text-foreground">
                                                <Building2 className="w-4 h-4 mr-2 text-primary/60" />
                                                {user.institutionName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1.5">
                                                <Badge variant="secondary" className={cn(
                                                    "rounded-md text-[10px] font-bold uppercase tracking-wider px-2 py-0 border-none",
                                                    user.role === 'faculty' ? 'bg-purple-100 text-purple-700' : 
                                                    user.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                )}>
                                                    {user.role}
                                                </Badge>
                                                <div className="flex items-center text-sm font-bold text-foreground">
                                                    <span className="text-muted-foreground text-[10px] mr-1">₹</span>
                                                    {user.walletBalance.toLocaleString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    user.status === 'active' ? "bg-semantic-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-semantic-error shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                                )} />
                                                <span className={cn(
                                                    "text-sm font-semibold capitalize",
                                                    user.status === 'active' ? "text-semantic-success" : "text-semantic-error"
                                                )}>{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end opacity-0 group-hover/row:opacity-100 transition-all duration-300 translate-x-2 group-hover/row:translate-x-0">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5">
                                                    <MoreHorizontal className="w-5 h-5" />
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
        </div>
    )
}

export default GlobalUsersList
