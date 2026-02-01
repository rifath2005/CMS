import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { WebSocketProvider } from './contexts/WebSocketContext'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import DigitalBill from './pages/DigitalBill'
import OrderHistory from './pages/OrderHistory'
import Profile from './pages/Profile'

// Layout
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    const { isAuthenticated } = useAuthStore()

    return (
        <Router>
            <WebSocketProvider>
                <Routes>
                    {/* Public routes */}
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
                    />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/bill/:orderId" element={<DigitalBill />} />
                            <Route path="/orders" element={<OrderHistory />} />
                            <Route path="/profile" element={<Profile />} />
                        </Route>
                    </Route>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </WebSocketProvider>
        </Router>
    )
}

export default App
