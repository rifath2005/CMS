import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { useWebSocket } from '../contexts/WebSocketContext'
import { ShoppingCart, Home, Package, User, LogOut, History } from 'lucide-react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useState } from 'react'
import { AIAssistant } from './AIAssistant'

const Layout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuthStore()
    const { getTotalItems } = useCartStore()
    const { isConnected } = useWebSocket()
    const cartItemCount = getTotalItems()
    const [isAIOpen, setIsAIOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/products', icon: Package, label: 'Products' },
        { path: '/orders', icon: History, label: 'Orders' },
        { path: '/profile', icon: User, label: 'Profile' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-primary-600">
                                Canteen MS
                            </h1>
                            {isConnected && (
                                <span className="ml-3 flex items-center text-xs text-green-600">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></span>
                                    Live
                                </span>
                            )}
                        </div>

                        {/* Navigation */}
                        <nav className="hidden md:flex space-x-4">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = location.pathname === item.path
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={clsx(
                                            'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        )}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Right side */}
                        <div className="flex items-center space-x-4">
                            {/* AI Assistant Button */}
                            <button
                                onClick={() => setIsAIOpen(true)}
                                className="relative p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors group"
                                title="AI Assistant"
                            >
                                <SparklesIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                                    AI
                                </span>
                            </button>

                            {/* Cart */}
                            <Link
                                to="/cart"
                                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartItemCount}
                                    </span>
                                )}
                            </Link>

                            {/* User menu */}
                            <div className="flex items-center space-x-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile navigation */}
                <div className="md:hidden border-t border-gray-200">
                    <nav className="flex justify-around py-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        'flex flex-col items-center px-3 py-2 text-xs font-medium transition-colors',
                                        isActive ? 'text-primary-600' : 'text-gray-600'
                                    )}
                                >
                                    <Icon className="w-5 h-5 mb-1" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-center text-sm text-gray-500">
                        © 2024 Canteen Management System. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* AI Assistant Modal */}
            <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
        </div>
    )
}

export default Layout
