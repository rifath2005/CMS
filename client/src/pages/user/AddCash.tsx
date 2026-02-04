import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { walletService } from '../../services/walletService'
import { useWalletStore } from '../../store/walletStore'
import { useAuthStore } from '../../store/authStore'
import ErrorAlert from '../../components/ErrorAlert'
import { Wallet, Plus, CheckCircle, ArrowLeft } from 'lucide-react'

const AddCash = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { balance, setBalance } = useWalletStore()
    
    const [amount, setAmount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const quickAmounts = [100, 250, 500, 1000]

    const handleAmountChange = (value: string) => {
        // Only allow numbers
        if (value === '' || /^\d+$/.test(value)) {
            setAmount(value)
            setError(null)
        }
    }

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString())
        setError(null)
    }

    const validateAmount = (): boolean => {
        const numAmount = parseFloat(amount)
        
        if (!amount || isNaN(numAmount)) {
            setError('Please enter a valid amount')
            return false
        }
        
        if (numAmount <= 0) {
            setError('Amount must be greater than ₹0')
            return false
        }
        
        if (numAmount > 1000) {
            setError('Amount cannot exceed ₹1000')
            return false
        }
        
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateAmount()) return
        
        if (!user?.id) {
            setError('User not authenticated')
            return
        }

        try {
            setIsLoading(true)
            setError(null)
            
            const numAmount = parseFloat(amount)
            const result = await walletService.addCash(user.id, numAmount)
            
            // Update wallet balance in store
            setBalance(result.newBalance)
            
            setSuccess(true)
            
            // Redirect to profile after 2 seconds
            setTimeout(() => {
                navigate('/profile')
            }, 2000)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to add cash to wallet')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Cash Added Successfully!</h2>
                        <p className="text-base sm:text-lg text-gray-600 mb-1">₹{amount} has been added to your wallet</p>
                        <p className="text-sm sm:text-base text-gray-500">Redirecting to profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center text-primary-600 hover:text-primary-700 mb-4 sm:mb-6 text-sm sm:text-base font-medium"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Back to Profile
                </button>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Add Cash to Wallet</h1>

                {/* Current Balance Card */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center mb-2">
                                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                                <h2 className="text-base sm:text-lg font-semibold">Current Balance</h2>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold">₹{balance.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3 sm:p-4">
                            <Wallet className="w-8 h-8 sm:w-12 sm:h-12" />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 sm:mb-6">
                        <ErrorAlert message={error} onClose={() => setError(null)} />
                    </div>
                )}

                {/* Add Cash Form */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Amount Input */}
                        <div className="mb-4 sm:mb-6">
                            <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                Enter Amount (₹1 - ₹1000)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-base sm:text-lg font-semibold">
                                    ₹
                                </span>
                                <input
                                    type="text"
                                    id="amount"
                                    value={amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-lg sm:text-xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                Minimum: ₹1 | Maximum: ₹1000
                            </p>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="mb-4 sm:mb-6">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                Quick Add
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                {quickAmounts.map((quickAmount) => (
                                    <button
                                        key={quickAmount}
                                        type="button"
                                        onClick={() => handleQuickAmount(quickAmount)}
                                        disabled={isLoading}
                                        className={`py-2.5 sm:py-3 px-4 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                                            amount === quickAmount.toString()
                                                ? 'bg-primary-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        } disabled:opacity-50`}
                                    >
                                        ₹{quickAmount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !amount}
                            className="w-full bg-primary-600 text-white py-3 sm:py-4 rounded-lg hover:bg-primary-700 font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Cash to Wallet
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Info Card */}
                <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-blue-900 mb-2 text-xs sm:text-sm">Important Information</h3>
                    <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                        <li>• Minimum amount: ₹1</li>
                        <li>• Maximum amount per transaction: ₹1000</li>
                        <li>• Cash will be instantly added to your wallet</li>
                        <li>• Use wallet balance for quick checkout</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default AddCash
