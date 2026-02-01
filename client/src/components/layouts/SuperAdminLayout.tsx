import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    Building2,
    Users,
    FileText,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react'
import { useState } from 'react'

const SuperAdminLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navigation = [
        { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
        { name: 'Institutions', href: '/super-admin/institutions', icon: Building2 },
        { name: 'All Users', href: '/super-admin/users', icon: Users },
        { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText },
        { name: 'Settings', href: '/super-admin/settings', icon: Settings },
    ]

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">CMS - Super Admin</h1>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-4">
                            <span className="text-sm">
                                {user?.name} ({user?.email})
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg hover:bg-purple-500"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-purple-500">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${isActive(item.href)
                                                ? 'bg-purple-500'
                                                : 'hover:bg-purple-500'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-purple-500 w-full text-left"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            <div className="flex">
                {/* Sidebar - Desktop */}
                <aside className="hidden md:block w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)]">
                    <nav className="p-4 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                                            ? 'bg-purple-100 text-purple-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default SuperAdminLayout
