import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Pages
import Login from './pages/Login'
import Institutions from './pages/Institutions'
import PlatformStats from './pages/PlatformStats'
import Dashboard from './pages/Dashboard'
import Canteens from './pages/Canteens'
import Vendors from './pages/Vendors'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
    const { isAuthenticated, isMainAdmin, isInstitutionAdmin } = useAuthStore()

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" /> : <Login />}
                />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        {/* Main Admin routes */}
                        <Route path="/institutions" element={<Institutions />} />
                        <Route path="/platform-stats" element={<PlatformStats />} />

                        {/* Institution Admin routes */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/canteens" element={<Canteens />} />
                        <Route path="/vendors" element={<Vendors />} />
                    </Route>
                </Route>

                {/* Default redirect based on role */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            isMainAdmin() ? (
                                <Navigate to="/institutions" />
                            ) : isInstitutionAdmin() ? (
                                <Navigate to="/dashboard" />
                            ) : (
                                <Navigate to="/login" />
                            )
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    )
}

export default App
