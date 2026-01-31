import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { WebSocketProvider } from './contexts/WebSocketContext'

// Pages
import VendorLogin from './pages/VendorLogin'
import ActiveOrders from './pages/ActiveOrders'
import CombinedItems from './pages/CombinedItems'
import Products from './pages/Products'
import QRScanner from './pages/QRScanner'
import Analytics from './pages/Analytics'

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
                        element={isAuthenticated ? <Navigate to="/orders" /> : <VendorLogin />}
                    />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/orders" element={<ActiveOrders />} />
                            <Route path="/combined-items" element={<CombinedItems />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/scanner" element={<QRScanner />} />
                            <Route path="/analytics" element={<Analytics />} />
                        </Route>
                    </Route>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/orders" />} />
                    <Route path="*" element={<Navigate to="/orders" />} />
                </Routes>
            </WebSocketProvider>
        </Router>
    )
}

export default App
