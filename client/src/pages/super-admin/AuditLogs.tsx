import { useState, useEffect } from 'react'
import { Search, FileText, Clock, Building2, User, ShieldAlert, Activity } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { RefreshCw, Download, Filter } from 'lucide-react'

interface AuditLog {
    id: string
    timestamp: string
    actorName: string
    actorRole: string
    institutionName: string
    actionType: string
    description: string
    ipAddress: string
}

interface Institution {
    id: string
    name: string
}

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [institutionFilter, setInstitutionFilter] = useState<string>('all')
    const [actionFilter, setActionFilter] = useState<string>('all')

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const [logsRes, institutionsRes] = await Promise.all([
                api.get('/super-admin/audit-logs'),
                api.get('/institutions')
            ]);
            
            if (logsRes.data.success) {
                // Map backend logs to frontend interface
                const mappedLogs = logsRes.data.data.map((log: any) => ({
                    id: log.id,
                    timestamp: log.timestamp,
                    actorName: log.adminEmail || 'System',
                    actorRole: log.adminId ? 'Admin' : 'System',
                    institutionName: log.institutionId ? 'Institution' : 'Platform', // Backend doesn't give name here yet
                    actionType: log.changeType,
                    description: `${log.section}: ${log.fieldName} changed`,
                    ipAddress: log.ipAddress || '-'
                }));
                setLogs(mappedLogs);
            }
                setInstitutions(institutionsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch logs:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.actionType.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesInstitution = institutionFilter === 'all' || log.institutionName === institutionFilter
        const matchesAction = actionFilter === 'all' || log.actionType === actionFilter
        return matchesSearch && matchesInstitution && matchesAction
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
                    <p className="text-muted-foreground mt-1">Platform-wide security trail and activity monitoring.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh Logs
                </Button>
            </div>

            {/* Filters Bar */}
            <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by actor, description or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            value={institutionFilter}
                            onChange={(e) => setInstitutionFilter(e.target.value)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 min-w-[150px]"
                        >
                            <option value="all">Organizations</option>
                            {institutions.map(inst => (
                                <option key={inst.id} value={inst.name}>{inst.name}</option>
                            ))}
                        </select>

                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-10 min-w-[150px]"
                        >
                            <option value="all">Action Types</option>
                            <option value="UPDATE_CONFIG">Config Updates</option>
                            <option value="SUSPEND_VENDOR">Suspensions</option>
                            <option value="AUTO_LOCK">Security Events</option>
                        </select>
                        
                        <Button variant="outline" className="gap-2 h-10 border-primary/20 text-primary hover:bg-primary/5 font-bold">
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline / List */}
            <div className="space-y-3">
                {filteredLogs.map((log) => (
                    <Card key={log.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-border group overflow-hidden">
                        <CardContent className="p-5 flex items-start gap-4">
                            <div className={cn(
                                "p-3 rounded-xl flex-shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                log.actionType.includes('SUSPEND') || log.actionType.includes('LOCK') 
                                ? 'bg-semantic-error/10 text-semantic-error ring-1 ring-semantic-error/20' 
                                : log.actionType.includes('UPDATE') 
                                ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                : 'bg-muted text-muted-foreground ring-1 ring-border'
                            )}>
                                {log.actionType.includes('SUSPEND') || log.actionType.includes('LOCK') ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1.5">
                                    <h4 className="text-[13px] font-bold text-foreground font-mono tracking-tight bg-muted/50 px-2 py-0.5 rounded border border-border self-start md:self-auto uppercase">{log.actionType}</h4>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <Clock className="w-3.5 h-3.5 opacity-60" />
                                        {new Date(log.timestamp).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <p className="text-foreground text-[14px] leading-relaxed font-medium mb-3">{log.description}</p>
                                
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                     <Badge variant="secondary" className="gap-1.5 py-1 px-2 font-bold bg-background shadow-xs ring-1 ring-border">
                                        <User className="w-3 h-3 text-primary/60" />
                                        <span className="text-foreground">{log.actorName}</span>
                                        <span className="text-muted-foreground/60 text-[10px]">({log.actorRole})</span>
                                    </Badge>
                                    <Badge variant="outline" className="gap-1.5 py-1 px-2 font-bold border-primary/20 text-primary bg-primary/5">
                                        <Building2 className="w-3 h-3 text-primary/60" />
                                        {log.institutionName}
                                    </Badge>
                                    <Badge variant="secondary" className="gap-1.5 py-1 px-2 font-mono font-bold bg-muted/30 text-muted-foreground">
                                        IP: {log.ipAddress}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
             {filteredLogs.length === 0 && (
                <Card className="border-dashed border-2 py-16 text-center bg-muted/10">
                    <CardContent>
                        <Activity className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-muted-foreground font-bold">No security events found matching your criteria</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search query</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default AuditLogs
