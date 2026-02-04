import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useCartStore } from './store/cartStore'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { UserRole } from './types'

// Auth
import Login from './pages/Login'

// Layouts
import MainAdminLayout from './components/layouts/MainAdminLayout'
import AdminLayout from './components/layouts/AdminLayout'
import VendorLayout from './components/layouts/VendorLayout'
import UserLayout from './components/layouts/UserLayout'

// Main Admin Pages (Refactored)
import MainAdminDashboard from './pages/super-admin/Dashboard'
import OrganizationsList from './pages/super-admin/Institutions'
import GlobalUsersList from './pages/super-admin/Users'
import AuditLogs from './pages/super-admin/AuditLogs'
import SystemSettings from './pages/super-admin/Settings'
import OrgConfiguration from './pages/super-admin/InstitutionConfig'
import OrgAdminsList from './pages/super-admin/InstitutionAdmins'
import GlobalVendorsList from './pages/super-admin/Vendors'

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
import AddCash from './pages/user/AddCash'
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
                return '/main-admin/dashboard'
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

                    {/* Main Admin Routes */}
                    <Route element={<ProtectedRoute allowedRoles={[UserRole.MAIN_ADMIN]} />}>
                        <Route element={<MainAdminLayout />}>
                            <Route path="/main-admin/dashboard" element={<MainAdminDashboard />} />
                            <Route path="/main-admin/organizations" element={<OrganizationsList />} />
                            <Route path="/main-admin/organizations/:id/configure" element={<OrgConfiguration />} />
                            <Route path="/main-admin/org-admins" element={<OrgAdminsList />} />
                            <Route path="/main-admin/vendors" element={<GlobalVendorsList />} />
                            <Route path="/main-admin/users" element={<GlobalUsersList />} />
                            <Route path="/main-admin/audit-logs" element={<AuditLogs />} />
                            <Route path="/main-admin/system-settings" element={<SystemSettings />} />
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
                            <Route path="/add-cash" element={<AddCash />} />
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
