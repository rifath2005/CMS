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
    ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'

const UserLayout = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const { balance: walletBalance, setBalance } = useWalletStore()
    const { items } = useCartStore()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                <div className="max-w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        {/* Left: CMS Title */}
                        <div className="flex items-center">
                            <h1 className="text-lg font-bold">CMS - Student</h1>
                        </div>

                        {/* Right: User Info and Logout */}
                        <div className="hidden md:flex items-center space-x-3">
                            {/* Wallet Balance */}
                            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                                <Wallet className="w-4 h-4" />
                                <span className="text-sm font-semibold">₹{walletBalance.toFixed(2)}</span>
                            </div>
                            
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
                                className="p-2 rounded-lg hover:bg-blue-500"
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-blue-500">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {/* User Info - Mobile */}
                            <div className="px-3 py-2 mb-2 bg-blue-500/30 rounded-lg">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-xs text-blue-100">{user?.email}</p>
                                
                                {/* Wallet Balance - Mobile */}
                                <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-blue-400">
                                    <Wallet className="w-4 h-4" />
                                    <span className="text-sm font-semibold">Wallet: ₹{walletBalance.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Navigation Links */}
                            {navigation.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${isActive(item.href) ? 'bg-blue-500' : 'hover:bg-blue-500'
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
                                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-blue-500 w-full text-left mt-2 border-t border-blue-500 pt-3"
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
                                            ? 'bg-blue-100 text-blue-700 font-semibold'
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

            {/* Floating Cart Button - Only on canteens page */}
            {cartItemCount > 0 && location.pathname === '/dashboard' && (
                <Link
                    to="/cart"
                    className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 
                             bg-gradient-to-r from-blue-600 to-blue-700 text-white 
                             px-4 py-2.5 rounded-full shadow-lg 
                             hover:shadow-xl hover:scale-105 
                             transition-all duration-300 
                             flex items-center space-x-2 group"
                >
                    <div className="relative">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {cartItemCount}
                        </span>
                    </div>
                    <span className="font-medium">View cart</span>
                    <span className="text-sm opacity-90">({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            )}
        </div>
    )
}

export default UserLayout
