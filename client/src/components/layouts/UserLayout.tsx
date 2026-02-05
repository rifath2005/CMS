import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useWalletStore } from '../../store/walletStore'
import { useCartStore } from '../../store/cartStore'
import { walletService } from '../../services/walletService'
import {
    LayoutDashboard,
    ShoppingCart,
    History,
    User,
    LogOut,
    Menu,
    X,
    Wallet,
    ChevronRight,
    Sun,
    Bell
} from 'lucide-react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { AIAssistant } from '../AIAssistant'

const UserLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const { balance: walletBalance, setBalance } = useWalletStore()
    const { items } = useCartStore()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isAIOpen, setIsAIOpen] = useState(false)

    // Calculate total cart items
    const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)

    useEffect(() => {
        if (user?.id) {
            fetchWalletBalance()
        }
    }, [user?.id])

    const fetchWalletBalance = async () => {
        try {
            const balance = await walletService.getBalance()
            setBalance(balance.balance)
        } catch (err: any) {
            console.error('UserLayout: Failed to load wallet balance:', err)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navigation = [
        { name: 'Canteens', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Cart', href: '/cart', icon: ShoppingCart },
        { name: 'Orders', href: '/orders', icon: History },
        { name: 'Profile', href: '/profile', icon: User },
    ]

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans leading-relaxed">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100/80 z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
                {/* Brand Identity */}
                <div className="h-20 flex items-center px-8 mb-4">
                    <div className="flex items-center gap-3">
                        {/* <div className="flex -space-x-1.5">
                             <div className="w-3 h-3 rounded-full bg-orange-500 border border-white"></div>
                             <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                             <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                        </div> */}
                        <h1 className="text-xl font-black tracking-tight text-[#1E293B]">
                             <span className="text-black-500">Notin</span><span className="text-[#ff7a00]">Q</span> <span className="text-[#1E293B]">Student</span>
                        </h1>
                    </div>
                </div>

                {/* Primary Navigation */}
                <nav className="flex-1 px-2 space-y-0">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                                    active
                                        ? 'bg-[#fce2d2] text-[#ff7b00]'
                                        : 'text-[#64748B] hover:bg-gray-50/80 hover:text-[#1E293B]'
                                }`}
                            >
                                {active && (
                                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#ff7b00] rounded-r-full shadow-[2px_0_10px_rgba(0,97,255,0.3)]" />
                                )}
                                <Icon className={`w-4 h-4 transition-all duration-300 ${active ? 'text-[#0061FF]' : 'text-[#94A3B8] group-hover:text-[#475569]'}`} />
                                <span className={`font-bold text-[14px] transition-colors ${active ? 'text-[#1E293B]' : 'text-[#475569]'}`}>{item.name}</span>
                                
                                {item.name === 'Cart' && cartItemCount > 0 && (
                                    <span className="ml-auto bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Wallet & Account Section */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/30 m-2 rounded-2xl">
                     {/* Wallet Status */}
                     <div className="mb-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Active Balance</span>
                            <Wallet className="w-3 h-3 text-blue-500" />
                        </div>
                        <p className="text-lg font-black text-[#1E293B]">₹{walletBalance.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#64748B] font-bold border border-white shadow-sm overflow-hidden text-xs">
                            {user?.name?.[0] || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#1E293B] truncate">{user?.name || 'Student'}</p>
                            <p className="text-[9px] font-semibold text-[#94A3B8] truncate uppercase tracking-tighter">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content Hub */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Visual Header */}
                <header className="h-8 bg-white backdrop-blur-md border-b border-gray-100/80 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="md:hidden flex items-center gap-3">
                         <div className="flex -space-x-1">
                             <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                             <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                         </div>
                         <span className="font-black text-[#1E293B] text-lg">CMS</span>
                    </div>

                    <div className="hidden md:block">
                         <p className="text-xl font-semibold text-gray-400">Welcome, <span className="text-[#1E293B] font-black">{user?.name?.split(' ')[0]}</span> 👋</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLogout}
                            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-sm text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-bold text-sm group"
                        >
                            <LogOut className="w-2 h-2 group-hover:-translate-x-1 transition-transform" />
                            <span>Sign Out</span>
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-1 rounded-xl bg-gray-100 text-[#1E293B]"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </header>

                {/* Mobile Portal */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-20 bg-white z-40 animate-in slide-in-from-top duration-500">
                        <nav className="p-6 space-y-3">
                             {/* Mobile Wallet */}
                             <div className="mb-6 p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl text-white shadow-xl shadow-blue-200">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Your Wallet</p>
                                <p className="text-3xl font-black">₹{walletBalance.toFixed(2)}</p>
                             </div>

                             {navigation.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-5 px-6 py-5 rounded-3xl transition-all ${
                                            active ? 'bg-[#F1F5FD] text-[#0061FF] font-black shadow-sm scale-[1.02]' : 'text-[#64748B]'
                                        }`}
                                    >
                                        <Icon className="w-7 h-7" />
                                        <span className="text-xl font-bold">{item.name}</span>
                                        {item.name === 'Cart' && cartItemCount > 0 && (
                                            <span className="ml-auto bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full">{cartItemCount}</span>
                                        )}
                                    </Link>
                                )
                            })}
                             <div className="pt-8 mt-8 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-5 w-full px-6 py-5 rounded-3xl text-red-500 font-black bg-red-50/50"
                                >
                                    <LogOut className="w-7 h-7" />
                                    <span className="text-xl">Sign Out</span>
                                </button>
                             </div>
                        </nav>
                    </div>
                )}

                {/* Viewport */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-10 bg-[#F8FAFC]">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Dynamic UI Elements */}
            {cartItemCount > 0 && location.pathname === '/dashboard' && (
                <Link
                    to="/cart"
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 
                             bg-[#1E293B] text-white 
                             px-8 py-4 rounded-3xl shadow-2xl shadow-gray-900/20
                             hover:shadow-3xl hover:scale-105 active:scale-95
                             transition-all duration-300 
                             flex items-center gap-4 group"
                >
                    <div className="relative">
                        <ShoppingCart className="w-6 h-6" />
                        <span className="absolute -top-3 -right-3 bg-blue-500 text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center border-4 border-[#1E293B]">
                            {cartItemCount}
                        </span>
                    </div>
                    <span className="font-bold text-lg">Checkout Now</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            )}

            <button
                onClick={() => setIsAIOpen(true)}
                className="fixed bottom-10 right-10 z-50 
                         bg-gradient-to-tr from-purple-600 to-blue-600 text-white 
                         w-8 h-8 rounded-2xl shadow-2xl shadow-purple-500/30
                         hover:shadow-3xl hover:scale-110 active:scale-90
                         transition-all duration-300 
                         flex items-center justify-center group"
                title="Queal AI"
            >
                <SparklesIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>

            <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
        </div>
    )
}

export default UserLayout
