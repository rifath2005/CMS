import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../../services/userService'
import { walletService } from '../../services/walletService'
import { useAuthStore } from '../../store/authStore'
import { useWalletStore } from '../../store/walletStore'
import { User } from '../../types'
import ErrorAlert from '../../components/ErrorAlert'
import { User as UserIcon, Mail, Building, Save, CheckCircle, Wallet, Plus } from 'lucide-react'

const Profile = () => {
    const navigate = useNavigate()
    const { user: authUser, updateUser } = useAuthStore()
    const { balance: walletBalance, setBalance } = useWalletStore()

    const [profile, setProfile] = useState<User | null>(null)
    const [name, setName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchProfile()
        fetchWalletBalance()
    }, [])

    const fetchProfile = async () => {
        if (!authUser?.id) {
            setError('User not authenticated')
            setIsLoading(false)
            return
        }

        try {
            const profileData = await userService.getProfile(authUser.id)
            setProfile(profileData)
            setName(profileData.name)
            setIsLoading(false)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load profile')
            setIsLoading(false)
        }
    }

    const fetchWalletBalance = async () => {
        try {
            const balance = await walletService.getBalance()
            setBalance(balance.balance)
        } catch (err: any) {
            console.error('Failed to load wallet balance:', err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)

        if (!name.trim()) {
            setError('Name cannot be empty')
            return
        }

        if (!authUser?.id) {
            setError('User not authenticated')
            return
        }

        try {
            setIsSaving(true)
            const updatedProfile = await userService.updateProfile(authUser.id, { name: name.trim() })
            setProfile(updatedProfile)
            updateUser(updatedProfile)
            setSuccessMessage('Profile updated successfully!')

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        if (profile) {
            setName(profile.name)
            setError(null)
            setSuccessMessage(null)
        }
    }

    if (isLoading) {
        return (
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Profile</h1>
                    
                    {/* Skeleton Profile Form */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 animate-pulse">
                        <div className="h-5 sm:h-6 bg-gray-200 rounded w-36 sm:w-48 mb-4 sm:mb-6"></div>
                        
                        {/* Name Field Skeleton */}
                        <div className="mb-4 sm:mb-6">
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mb-2"></div>
                            <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
                        </div>
                        
                        {/* Email Field Skeleton */}
                        <div className="mb-4 sm:mb-6">
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-2"></div>
                            <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
                        </div>
                        
                        {/* Institution Field Skeleton */}
                        <div className="mb-4 sm:mb-6">
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-28 mb-2"></div>
                            <div className="h-10 sm:h-12 bg-gray-200 rounded"></div>
                        </div>
                        
                        {/* Role Badge Skeleton */}
                        <div className="mb-4 sm:mb-6">
                            <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 sm:w-16 mb-2"></div>
                            <div className="h-7 sm:h-8 bg-gray-200 rounded w-20 sm:w-24"></div>
                        </div>
                    </div>
                    
                    {/* Skeleton Account Details */}
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 animate-pulse">
                        <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 sm:w-40 mb-3 sm:mb-4"></div>
                        <div className="space-y-2 sm:space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between py-2 border-b">
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32"></div>
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-32 sm:w-40"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                <div className="max-w-2xl mx-auto">
                    <ErrorAlert message="Failed to load profile" />
                </div>
            </div>
        )
    }

    const hasChanges = name.trim() !== profile.name

    return (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <div className="max-w-2xl mx-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Profile</h1>

            {error && (
                <div className="mb-4 sm:mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {successMessage && (
                <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-green-800">{successMessage}</p>
                </div>
            )}

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center mb-2">
                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            <h2 className="text-base sm:text-lg font-semibold">Wallet Balance</h2>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold">₹{walletBalance.toFixed(2)}</p>
                        <p className="text-xs sm:text-sm opacity-90 mt-1">Available for instant payments</p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3 sm:p-4">
                        <Wallet className="w-8 h-8 sm:w-12 sm:h-12" />
                    </div>
                </div>
                <button
                    onClick={() => navigate('/add-cash')}
                    className="w-full bg-white text-purple-600 py-2 sm:py-2.5 rounded-lg hover:bg-gray-100 font-semibold text-sm sm:text-base transition-all flex items-center justify-center"
                >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Add Cash to Wallet
                </button>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Account Information</h2>

                <form onSubmit={handleSubmit}>
                    {/* Name Field (Editable) */}
                    <div className="mb-4 sm:mb-6">
                        <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Full Name
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    {/* Email Field (Read-only) */}
                    <div className="mb-4 sm:mb-6">
                        <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            <input
                                type="email"
                                id="email"
                                value={profile.email}
                                disabled
                                className="w-full pl-12 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                            Institutional email cannot be changed
                        </p>
                    </div>

                    {/* Institution Field (Read-only) */}
                    <div className="mb-4 sm:mb-6">
                        <label htmlFor="institution" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Institution ID
                        </label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            <input
                                type="text"
                                id="institution"
                                value={profile.institutionId}
                                disabled
                                className="w-full pl-12 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Role Badge */}
                    <div className="mb-4 sm:mb-6">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Role</label>
                        <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-100 text-primary-800 rounded-full text-xs sm:text-sm font-medium">
                            {profile.role}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    {hasChanges && (
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-primary-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isSaving}
                                className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Account Details</h2>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Account Created</span>
                        <span className="font-medium">
                            {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">User ID</span>
                        <span className="font-medium font-mono text-[10px] sm:text-xs break-all">{profile.id}</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-gray-600">Account Status</span>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-[10px] sm:text-xs font-medium">
                            Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Help Text */}
            <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-blue-900 mb-2 text-xs sm:text-sm">Need Help?</h3>
                <p className="text-xs sm:text-sm text-blue-800">
                    If you need to update your email or institution, please contact your institution administrator.
                </p>
            </div>
        </div>
        </div>
    )
}

export default Profile
