import { useState, useEffect } from 'react'
import { Search, User, Filter, Ban, CheckCircle, Wallet, Building2 } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

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

const Users = () => {
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
        try {
            // TODO: Implement API calls
            // Mock data
            setInstitutions([
                { id: '1', name: 'ABC University' },
                { id: '2', name: 'XYZ College' },
                { id: '3', name: 'Tech Institute' }
            ])

            setUsers([
                {
                    id: '1',
                    name: 'John Doe',
                    email: 'john.doe@abc.edu',
                    institutionId: '1',
                    institutionName: 'ABC University',
                    role: 'student',
                    walletBalance: 450,
                    status: 'active',
                    lastActive: '2024-02-03T09:30:00Z'
                },
                {
                    id: '2',
                    name: 'Jane Smith',
                    email: 'jane.smith@abc.edu',
                    institutionId: '1',
                    institutionName: 'ABC University',
                    role: 'faculty',
                    walletBalance: 1250,
                    status: 'active',
                    lastActive: '2024-02-03T10:15:00Z'
                },
                {
                    id: '3',
                    name: 'Robert Brown',
                    email: 'robert.b@xyz.edu',
                    institutionId: '2',
                    institutionName: 'XYZ College',
                    role: 'staff',
                    walletBalance: 0,
                    status: 'suspended',
                    lastActive: '2024-01-28T16:30:00Z'
                },
                {
                    id: '4',
                    name: 'Alice Cooper',
                    email: 'alice@tech.edu',
                    institutionId: '3',
                    institutionName: 'Tech Institute',
                    role: 'student',
                    walletBalance: 2500,
                    status: 'active',
                    lastActive: '2024-02-03T11:00:00Z'
                },
                 {
                    id: '5',
                    name: 'Michael Jordan',
                    email: 'mj@tech.edu',
                    institutionId: '3',
                    institutionName: 'Tech Institute',
                    role: 'student',
                    walletBalance: 50,
                    status: 'active',
                    lastActive: '2024-02-02T14:20:00Z'
                }
            ])
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        // TODO: API call
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u))
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
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Users Overview</h1>
                <p className="text-gray-600 mt-2">Manage users across all institutions</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search users..."
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
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                    </select>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="staff">Staff</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Institution
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Wallet Balance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                    <span className="text-primary-600 font-medium">
                                                        {user.name.charAt(0)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                            {user.institutionName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm font-medium text-gray-900">
                                            <Wallet className="w-4 h-4 mr-1 text-gray-400" />
                                            ₹{user.walletBalance.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.status)}
                                            className={`${user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                                }`}
                                        >
                                            {user.status === 'active' ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Ban className="w-4 h-4" />
                                                    <span>Suspend</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Activate</span>
                                                </div>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No users found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Users
