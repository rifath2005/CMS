import { useState, useEffect } from 'react'
import { Search, FileText, Clock, Building2, User, ShieldAlert, Activity } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'

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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
                    <p className="text-gray-500 mt-1">Security trail and platform activity monitoring.</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <select
                        value={institutionFilter}
                        onChange={(e) => setInstitutionFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Institutions</option>
                        {institutions.map(inst => (
                            <option key={inst.id} value={inst.name}>{inst.name}</option>
                        ))}
                    </select>

                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Actions</option>
                        <option value="UPDATE_CONFIG">Config Updates</option>
                        <option value="SUSPEND_VENDOR">Suspensions</option>
                        <option value="AUTO_LOCK">Security Events</option>
                    </select>
                    
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 font-medium">
                        Export
                        <FileText className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Timeline / List */}
            <div className="space-y-4">
                {filteredLogs.map((log) => (
                    <div key={log.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl flex-shrink-0 ${
                                log.actionType.includes('SUSPEND') || log.actionType.includes('LOCK') 
                                ? 'bg-red-50 text-red-600' 
                                : log.actionType.includes('UPDATE') 
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-gray-50 text-gray-600'
                            }`}>
                                {log.actionType.includes('SUSPEND') || log.actionType.includes('LOCK') ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900 font-mono">{log.actionType}</h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{log.description}</p>
                                
                                <div className="flex flex-wrap gap-3 text-xs">
                                     <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-gray-600 border border-gray-100">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="font-medium text-gray-900">{log.actorName}</span>
                                        <span className="text-gray-400">({log.actorRole})</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg text-indigo-700 border border-indigo-100">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                        {log.institutionName}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-gray-500 border border-gray-100 font-mono">
                                        IP: {log.ipAddress}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
             {filteredLogs.length === 0 && (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <p className="text-gray-500">No audit logs matching your criteria</p>
                </div>
            )}
        </div>
    )
}

export default AuditLogs
