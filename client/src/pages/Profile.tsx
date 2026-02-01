import { useState, useEffect } from 'react'
import { userService } from '../services/userService'
import { useAuthStore } from '../store/authStore'
import { User } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { User as UserIcon, Mail, Building, Save, CheckCircle } from 'lucide-react'

const Profile = () => {
    const { user: authUser, updateUser } = useAuthStore()

    const [profile, setProfile] = useState<User | null>(null)
    const [name, setName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        if (!authUser?.id) {
            setError('User not authenticated')
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            const profileData = await userService.getProfile(authUser.id)
            setProfile(profileData)
            setName(profileData.name)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load profile')
        } finally {
            setIsLoading(false)
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
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="max-w-2xl mx-auto">
                <ErrorAlert message="Failed to load profile" />
            </div>
        )
    }

    const hasChanges = name.trim() !== profile.name

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>

            {error && (
                <div className="mb-6">
                    <ErrorAlert message={error} onClose={() => setError(null)} />
                </div>
            )}

            {successMessage && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{successMessage}</p>
                </div>
            )}

            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-6">Account Information</h2>

                <form onSubmit={handleSubmit}>
                    {/* Name Field (Editable) */}
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    {/* Email Field (Read-only) */}
                    <div className="mb-6">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                id="email"
                                value={profile.email}
                                disabled
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Institutional email cannot be changed
                        </p>
                    </div>

                    {/* Institution Field (Read-only) */}
                    <div className="mb-6">
                        <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                            Institution ID
                        </label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                id="institution"
                                value={profile.institutionId}
                                disabled
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Role Badge */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <span className="inline-block px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                            {profile.role}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    {hasChanges && (
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSaving ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isSaving}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* Account Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Account Details</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Account Created</span>
                        <span className="font-medium">
                            {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">User ID</span>
                        <span className="font-medium font-mono text-xs">{profile.id}</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-gray-600">Account Status</span>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">Need Help?</h3>
                <p className="text-sm text-blue-800">
                    If you need to update your email or institution, please contact your institution administrator.
                </p>
            </div>
        </div>
    )
}

export default Profile
