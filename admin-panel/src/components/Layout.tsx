import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Building2, Users, LogOut, BarChart3, LayoutDashboard } from 'lucide-react'

export default function Layout() {
    const { user, logout, isMainAdmin } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Building2 className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {isMainAdmin() ? 'Main Admin Panel' : 'Institution Admin Panel'}
                                </h1>
                                <p className="text-sm text-gray-600">{user?.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {isMainAdmin() ? (
                            <>
                                <Link
                                    to="/institutions"
                                    className="flex items-center space-x-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                                >
                                    <Building2 className="h-4 w-4" />
                                    <span>Institutions</span>
                                </Link>
                                <Link
                                    to="/platform-stats"
                                    className="flex items-center space-x-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    <span>Platform Stats</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center space-x-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Link>
                                <Link
                                    to="/canteens"
                                    className="flex items-center space-x-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                                >
                                    <Building2 className="h-4 w-4" />
                                    <span>Canteens</span>
                                </Link>
                                <Link
                                    to="/vendors"
                                    className="flex items-center space-x-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                                >
                                    <Users className="h-4 w-4" />
                                    <span>Vendors</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    )
}
