import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { UserRole } from '../types'

export default function ProtectedRoute() {
    const { isAuthenticated, user } = useAuthStore()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Only allow Main Admin and Institution Admin
    if (user?.role !== UserRole.MAIN_ADMIN && user?.role !== UserRole.INSTITUTION_ADMIN) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}
