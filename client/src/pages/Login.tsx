import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)

    // Clear error timeout on component unmount
    useEffect(() => {
        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current)
            }
        }
    }, [])

    // Function to clear error after delay
    const clearErrorAfterDelay = () => {
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current)
        }
        errorTimeoutRef.current = setTimeout(() => {
            setError('')
        }, 3000) // Clear after 3 seconds
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Clear any existing error timeout
        if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current)
        }

        setError('')
        setLoading(true)

        try {
            const authData = await authService.login(email, password)
            setAuth(authData)
            navigate('/dashboard')
        } catch (err: any) {
            console.error('Login error:', err);

            // Handle different types of errors with user-friendly messages
            let errorMessage = 'Incorrect Credentials'

            if (err.response?.status === 401) {
                errorMessage = 'Incorrect Credentials'
            } else if (err.response?.status === 404) {
                errorMessage = 'Account not found'
            } else if (err.response?.status === 403) {
                errorMessage = 'Access denied'
            } else if (err.response?.status >= 500) {
                errorMessage = 'Server error. Please try again later.'
            } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
                errorMessage = 'Connection error. Please check your internet connection.'
            } else if (err.message?.includes('timeout')) {
                errorMessage = 'Request timeout. Please try again.'
            }

            setError(errorMessage);
            clearErrorAfterDelay(); // Auto-clear error after 3 seconds
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #ceaaf0ff 0%, #9bb5ff 25%, #667eea 50%, #764ba2 75%, #102e64ff 100%)'
            }}
        >
            {/* Blurred background overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(105, 90, 213, 0.3) 0%, rgba(77, 107, 190, 0.3) 25%, rgba(44, 79, 234, 0.3) 50%, rgba(24, 103, 148, 0.3) 75%, rgba(86, 53, 148, 0.3) 100%)',
                    filter: 'blur(1px)'
                }}
            ></div>

            {/* Clear content area */}
            <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col space-y-2 text-center mb-8">
                        <h1 className="text-4xl font-bold tracking-tight text-white">
                            Login
                        </h1>
                        <p className="text-sm text-white/80">
                            Enter your email below to login to your account
                        </p>
                    </div>

                    <div
                        className="rounded-lg shadow-2xl p-6 border border-white/30"
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)'
                        }}
                    >
                        {error && (
                            <div
                                className="mb-6 p-3 rounded-md text-sm border relative"
                                style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    borderColor: 'rgba(239, 68, 68, 0.4)',
                                    color: '#fecaca'
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{error}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError('')
                                            if (errorTimeoutRef.current) {
                                                clearTimeout(errorTimeoutRef.current)
                                            }
                                        }}
                                        className="ml-2 text-white/60 hover:text-white transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm text-white placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        borderColor: 'rgba(255, 255, 255, 0.3)'
                                    }}
                                    placeholder="sample@mail.com"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="flex h-10 w-full rounded-md border px-3 pr-10 py-2 text-sm text-white placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.15)',
                                            borderColor: 'rgba(255, 255, 255, 0.3)'
                                        }}
                                        placeholder="••••••••"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/60 hover:text-white transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-2 w-2" />
                                        ) : (
                                            <Eye className="h-2 w-2" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 text-white h-10 px-4 py-2 w-full border border-white/30"
                                style={{
                                    background: 'rgba(0, 0, 0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(50, 52, 52, 1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(0, 0, 0)'
                                }}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                    </div>

                    <p className="mt-4 px-8 text-center text-sm text-white/60">
                        Canteen Management System
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
