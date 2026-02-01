import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { UserRole } from '../types'

interface ProtectedRouteProps {
    allowedRoles?: UserRole[]
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuthStore()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // If no specific roles are required, just check authentication
    if (!allowedRoles || allowedRoles.length === 0) {
        return <Outlet />
    }

    // Check if user's role is in the allowed roles
    if (user && allowedRoles.includes(user.role)) {
        return <Outlet />
    }

    // User doesn't have permission, redirect to their default dashboard
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

    return <Navigate to={getDefaultRoute()} replace />
}

export default ProtectedRoute
