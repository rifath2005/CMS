import { useState } from 'react'
import { walletService } from '../../services/walletService'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'

const WalletTest = () => {
    const { user, token } = useAuthStore()
    const [balance, setBalance] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [rawResponse, setRawResponse] = useState<any>(null)

    const testWalletAPI = async () => {
        setLoading(true)
        setError(null)
        setRawResponse(null)
        
        try {
            console.log('🧪 Testing wallet API...')
            console.log('User:', user)
            console.log('Token:', token?.substring(0, 20) + '...')
            
            const result = await walletService.getBalance()
            
            console.log('✅ Success! Result:', result)
            setBalance(result.balance)
            setRawResponse(result)
        } catch (err: any) {
            console.error('❌ Error:', err)
            console.error('Error response:', err.response)
            setError(err.message || 'Unknown error')
            setRawResponse(err.response?.data || err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Wallet API Test</h1>

            <Card className="mb-6">
                <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Current User</h2>
                    <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Auth Token</h2>
                    <pre className="bg-muted p-4 rounded text-sm overflow-auto break-all">
                        {token || 'No token'}
                    </pre>
                </CardContent>
            </Card>

            <Button
                onClick={testWalletAPI}
                disabled={loading}
                variant="default"
                size="lg"
                className="w-full mb-6"
            >
                {loading ? 'Testing...' : 'Test Wallet API'}
            </Button>

            {balance !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-green-900 mb-2">✅ Success!</h2>
                    <p className="text-3xl font-bold text-green-700">₹{balance.toFixed(2)}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-red-900 mb-2">❌ Error</h2>
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {rawResponse && (
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-4">Raw Response</h2>
                        <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                            {JSON.stringify(rawResponse, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default WalletTest
