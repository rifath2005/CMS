import { useState, useEffect } from 'react'
import { Search, FileText, Filter, Clock, Building2, User } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

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
        try {
            // TODO: Implement API calls
            // Mock data
            setInstitutions([
                { id: '1', name: 'ABC University' },
                { id: '2', name: 'XYZ College' },
                { id: '3', name: 'Tech Institute' }
            ])

            setLogs([
                {
                    id: '1',
                    timestamp: '2024-02-03T14:30:00Z',
                    actorName: 'Super Admin',
                    actorRole: 'Super Admin',
                    institutionName: 'ABC University',
                    actionType: 'UPDATE_CONFIG',
                    description: 'Updated ordering hours for ABC University',
                    ipAddress: '192.168.1.10'
                },
                {
                    id: '2',
                    timestamp: '2024-02-03T14:15:00Z',
                    actorName: 'John Doe',
                    actorRole: 'Institution Admin',
                    institutionName: 'XYZ College',
                    actionType: 'SUSPEND_VENDOR',
                    description: 'Suspended vendor "Snack Bar" due to hygiene issue',
                    ipAddress: '10.0.0.5'
                },
                {
                    id: '3',
                    timestamp: '2024-02-03T13:45:00Z',
                    actorName: 'System',
                    actorRole: 'System',
                    institutionName: 'Tech Institute',
                    actionType: 'AUTO_LOCK',
                    description: 'Account locked for user "Alice" after 5 failed attempts',
                    ipAddress: '-'
                },
                {
                    id: '4',
                    timestamp: '2024-02-03T12:00:00Z',
                    actorName: 'Jane Smith',
                    actorRole: 'Institution Admin',
                    institutionName: 'ABC University',
                    actionType: 'APPROVE_USER',
                    description: 'Approved new faculty registration',
                    ipAddress: '192.168.1.15'
                },
                {
                    id: '5',
                    timestamp: '2024-02-03T11:30:00Z',
                    actorName: 'Vendor Manager',
                    actorRole: 'Vendor',
                    institutionName: 'XYZ College',
                    actionType: 'UPDATE_MENU',
                    description: 'Updated prices for Breakfast Menu',
                    ipAddress: '10.0.0.8'
                }
            ])
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
        const matchesInstitution = institutionFilter === 'all' || log.institutionName === institutionFilter // Note: simplified match by name for mock
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
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-600 mt-2">Monitor all system activities and security events</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={institutionFilter}
                        onChange={(e) => setInstitutionFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Institutions</option>
                        {institutions.map(inst => (
                            <option key={inst.id} value={inst.name}>{inst.name}</option>
                        ))}
                    </select>

                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Actions</option>
                        <option value="UPDATE_CONFIG">Configuration Updates</option>
                        <option value="SUSPEND_VENDOR">Suspensions</option>
                        <option value="AUTO_LOCK">Security Events</option>
                        <option value="APPROVE_USER">User Management</option>
                        <option value="UPDATE_MENU">Menu Updates</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{log.actorName}</div>
                                                <div className="text-xs text-gray-500">{log.actorRole}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                         <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            {log.institutionName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {log.actionType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {log.description}
                                        <div className="text-xs text-gray-400 mt-1">IP: {log.ipAddress}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredLogs.length === 0 && (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No logs found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AuditLogs
