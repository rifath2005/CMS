import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useCartStore } from './store/cartStore'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { UserRole } from './types'

// Auth
import Login from './pages/Login'

// Layouts
import SuperAdminLayout from './components/layouts/SuperAdminLayout'
import AdminLayout from './components/layouts/AdminLayout'
import VendorLayout from './components/layouts/VendorLayout'
import UserLayout from './components/layouts/UserLayout'

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard'
import AllInstitutions from './pages/super-admin/Institutions'
import AllUsers from './pages/super-admin/Users'
import AuditLogs from './pages/super-admin/AuditLogs'
import SystemSettings from './pages/super-admin/Settings'

// Institution Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import Canteens from './pages/admin/Canteens'
import InstitutionStats from './pages/admin/Stats'

// Vendor Pages
import VendorDashboard from './pages/vendor/Dashboard'
import VendorProducts from './pages/vendor/Products'
import QRScanner from './pages/vendor/QRScanner'
import VendorAnalytics from './pages/vendor/Analytics'

// User Pages
import UserCanteens from './pages/user/Canteens'
import Cart from './pages/user/Cart'
import Checkout from './pages/user/Checkout'
import DigitalBill from './pages/user/DigitalBill'
import OrderHistory from './pages/user/OrderHistory'
import Profile from './pages/user/Profile'
import WalletTest from './pages/user/WalletTest'

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    const { isAuthenticated, user } = useAuthStore()
    const { setCurrentUserId } = useCartStore()

    // Load user's cart when they log in, clear when they log out
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            setCurrentUserId(user.id)
        } else {
            setCurrentUserId(null)
        }
    }, [isAuthenticated, user?.id, setCurrentUserId])

    // Redirect to appropriate dashboard based on role
    const getDefaultRoute = () => {
        if (!user) return '/login'

        switch (user.role) {
            case UserRole.MAIN_ADMIN:
                return '/super-admin/dashboard'
            case UserRole.INSTITUTION_ADMIN:
                return '/admin/dashboard'
            case UserRole.VENDOR:
                return '/vendor/dashboard'
            case UserRole.USER:
                return '/dashboard'
            default:
                return '/login'
        }
    }

    return (
        <Router>
            <WebSocketProvider>
                <Routes>
                    {/* Public routes */}
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <Login />}
                    />

                    {/* Super Admin Routes */}
                    <Route element={<ProtectedRoute allowedRoles={[UserRole.MAIN_ADMIN]} />}>
                        <Route element={<SuperAdminLayout />}>
                            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                            <Route path="/super-admin/institutions" element={<AllInstitutions />} />
                            <Route path="/super-admin/users" element={<AllUsers />} />
                            <Route path="/super-admin/audit-logs" element={<AuditLogs />} />
                            <Route path="/super-admin/settings" element={<SystemSettings />} />
                        </Route>
                    </Route>

                    {/* Institution Admin Routes */}
                    <Route element={<ProtectedRoute allowedRoles={[UserRole.INSTITUTION_ADMIN]} />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/admin/canteens" element={<Canteens />} />
                            <Route path="/admin/stats" element={<InstitutionStats />} />
                        </Route>
                    </Route>

                    {/* Vendor Routes */}
                    <Route element={<ProtectedRoute allowedRoles={[UserRole.VENDOR]} />}>
                        <Route element={<VendorLayout />}>
                            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                            <Route path="/vendor/products" element={<VendorProducts />} />
                            <Route path="/vendor/qr-scanner" element={<QRScanner />} />
                            <Route path="/vendor/analytics" element={<VendorAnalytics />} />
                        </Route>
                    </Route>

                    {/* User Routes */}
                    <Route element={<ProtectedRoute allowedRoles={[UserRole.USER]} />}>
                        <Route element={<UserLayout />}>
                            <Route path="/dashboard" element={<UserCanteens />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/bill/:orderId" element={<DigitalBill />} />
                            <Route path="/orders" element={<OrderHistory />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/wallet-test" element={<WalletTest />} />
                        </Route>
                    </Route>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to={getDefaultRoute()} />} />
                    <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
                </Routes>
            </WebSocketProvider>
        </Router>
    )
}

export default App
