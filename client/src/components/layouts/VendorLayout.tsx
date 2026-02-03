import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    Package,
    QrCode,
    BarChart3,
    LogOut,
    Menu,
    X
} from 'lucide-react'
import { useState } from 'react'


const VendorLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navigation = [
        { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/vendor/products', icon: Package },
        { name: 'QR Scanner', href: '/vendor/qr-scanner', icon: QrCode },
        { name: 'Analytics', href: '/vendor/analytics', icon: BarChart3 },
    ]



    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
                <div className="max-w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        {/* Left: CMS Title */}
                        <div className="flex items-center">
                            <h1 className="text-lg font-bold">CMS - Vendor Panel</h1>
                        </div>

                        {/* Right: User Info and Logout */}
                        <div className="hidden md:flex items-center space-x-3">
                            <div className="text-right">
                                <span className="text-sm font-medium">
                                    {user?.name} ({user?.email})
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 rounded-lg hover:bg-green-500"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-green-500">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {/* User Info - Mobile */}
                            <div className="px-3 py-2 mb-2 bg-green-500/30 rounded-lg">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-xs text-green-100">{user?.email}</p>
                            </div>

                            {/* Navigation Links */}
                            {navigation.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${isActive(item.href) ? 'bg-green-500' : 'hover:bg-green-500'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}

                            {/* Logout Button - Mobile */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-green-500 w-full text-left mt-2 border-t border-green-500 pt-3"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            <div className="flex">
                {/* Sidebar - Desktop */}
                <aside className="hidden md:block w-64 bg-white shadow-lg min-h-[calc(100vh-3.5rem)]">
                    <nav className="p-4 space-y-2">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                                            ? 'bg-green-100 text-green-700 font-semibold'
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
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default VendorLayout
