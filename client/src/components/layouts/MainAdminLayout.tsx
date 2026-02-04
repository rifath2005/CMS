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
    X,
    Store,
    ShieldCheck
} from 'lucide-react'
import { useState } from 'react'

const MainAdminLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navigation = [
        { name: 'Dashboard', href: '/main-admin/dashboard', icon: LayoutDashboard },
        { name: 'Organizations', href: '/main-admin/organizations', icon: Building2 },
        { name: 'Org Admins', href: '/main-admin/org-admins', icon: ShieldCheck },
        { name: 'Vendors', href: '/main-admin/vendors', icon: Store },
        { name: 'Users', href: '/main-admin/users', icon: Users },
        { name: 'Audit Logs', href: '/main-admin/audit-logs', icon: FileText },
        { name: 'System Settings', href: '/main-admin/system-settings', icon: Settings },
    ]

    const isActive = (path: string) => {
        if (location.pathname === path) return true
        // Active for sub-routes (e.g. org configuration)
        if (path !== '/main-admin/dashboard' && location.pathname.startsWith(path)) return true
        return false
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-gray-900 text-white shadow-2xl z-20 transition-all duration-300">
                {/* Brand */}
                <div className="h-16 flex items-center px-6 bg-gray-900 border-b border-gray-800">
                    <div className="bg-gradient-to-tr from-blue-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-purple-500/30">
                        <span className="font-bold text-white text-lg">C</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        CMS Admin
                    </span>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                                    active
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
                                }`}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                                <span className="font-medium">{item.name}</span>
                                {active && (
                                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-glow animate-pulse" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-gray-50/50">
                {/* Mobile Header */}
                <header className="md:hidden bg-gray-900 text-white h-16 flex items-center justify-between px-4 shadow-md z-30">
                    <span className="font-bold text-lg">CMS Admin</span>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-gray-800"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </header>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-gray-900 text-white shadow-2xl z-40 border-t border-gray-800">
                        <nav className="p-4 space-y-2">
                             {navigation.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                                            active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                             <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Sign Out</span>
                            </button>
                        </nav>
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default MainAdminLayout
