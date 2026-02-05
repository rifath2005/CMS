import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    LayoutDashboard,
    Store,
    BarChart3,
    LogOut,
    Menu,
    X,
    Sun,
    Bell
} from 'lucide-react'
import { useState } from 'react'

const AdminLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Canteens', href: '/admin/canteens', icon: Store },
        { name: 'Statistics', href: '/admin/stats', icon: BarChart3 },
    ]

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 z-20">
                {/* Brand Logo Area */}
                <div className="h-20 flex items-center px-8 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5">
                             <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div>
                             <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                        </div>
                        <h1 className="text-xl font-black tracking-tight text-[#1E293B]">
                             <span className="text-purple-700">CMS</span> <span className="text-[#1E293B]">Admin</span>
                        </h1>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 space-y-1.5">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                                    active
                                        ? 'bg-[#F1F5FD] text-[#0061FF]'
                                        : 'text-[#64748B] hover:bg-gray-50/80 hover:text-[#1E293B]'
                                }`}
                            >
                                {active && (
                                    <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#0061FF] rounded-r-full shadow-[2px_0_10px_rgba(0,97,255,0.3)]" />
                                )}
                                <Icon className={`w-5 h-5 transition-all duration-300 ${active ? 'text-[#0061FF]' : 'text-[#94A3B8] group-hover:text-[#475569]'}`} />
                                <span className={`font-bold text-[15px] ${active ? 'text-[#1E293B]' : 'text-[#475569]'}`}>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/30 m-4 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] font-bold border-2 border-white shadow-sm overflow-hidden text-sm ring-4 ring-gray-100/50">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#1E293B] truncate">{user?.name || 'Admin'}</p>
                            <p className="text-[10px] font-semibold text-[#94A3B8] truncate uppercase tracking-tighter">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all duration-300 font-bold text-sm group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Unified Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="md:hidden flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">C</div>
                         <span className="font-bold text-[#1E293B]">CMS Admin</span>
                    </div>

                    <div className="hidden md:block">
                         <p className="text-sm font-semibold text-gray-400">Panel Context: <span className="text-[#1E293B] font-black uppercase tracking-tight">Institution Admin</span></p>
                    </div>

                    <div className="flex items-center gap-3">
                         <button className="p-2.5 rounded-2xl hover:bg-gray-50 text-[#64748B] transition-all bg-white border border-gray-100 shadow-sm">
                             <Bell className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 rounded-2xl hover:bg-gray-50 text-[#64748B] transition-all bg-white border border-gray-100 shadow-sm">
                             <Sun className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-xl bg-gray-100 text-[#1E293B]"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </header>

                {/* Mobile Navigation Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-20 bg-white z-40 animate-in slide-in-from-top duration-300">
                        <nav className="p-6 space-y-2">
                             {navigation.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-5 px-6 py-5 rounded-3xl transition-all ${
                                            active ? 'bg-[#F1F5FD] text-[#0061FF] font-black shadow-sm' : 'text-[#64748B]'
                                        }`}
                                    >
                                        <Icon className="w-7 h-7" />
                                        <span className="text-xl font-bold">{item.name}</span>
                                    </Link>
                                )
                            })}
                             <div className="pt-8 mt-8 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-5 w-full px-6 py-5 rounded-3xl text-red-500 font-bold bg-red-50/50"
                                >
                                    <LogOut className="w-7 h-7" />
                                    <span className="text-xl font-bold">Sign Out</span>
                                </button>
                             </div>
                        </nav>
                    </div>
                )}

                {/* Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-10">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
