import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { UserRole } from '../types'

const ProtectedRoute = () => {
    const { isAuthenticated, user } = useAuthStore()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Ensure user is a vendor
    if (user?.role !== UserRole.VENDOR) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
