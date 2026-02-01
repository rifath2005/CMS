import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderService } from '../services/orderService'
import Scanner from '../components/Scanner'
import LoadingSpinner from '../components/LoadingSpinner'
import { CheckCircle, XCircle } from 'lucide-react'

type ScannerState = 'scanning' | 'verifying' | 'success' | 'error'

const QRScanner = () => {
    const navigate = useNavigate()
    const [state, setState] = useState<ScannerState>('scanning')
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [errorReason, setErrorReason] = useState<'expired' | 'invalid' | 'other'>('other')
    const [orderId, setOrderId] = useState<string>('')

    useEffect(() => {
        // Auto-return to orders after 2 seconds on success
        if (state === 'success') {
            const timer = setTimeout(() => {
                navigate('/orders')
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [state, navigate])

    const handleScan = async (qrData: string) => {
        setState('verifying')
        setErrorMessage('')

        try {
            // Verify QR code
            const result = await orderService.verifyQRCode(qrData)

            if (!result.isValid) {
                setErrorMessage('Invalid or expired QR code')
                setErrorReason('expired')
                setState('error')
                return
            }

            // Confirm delivery
            await orderService.confirmDelivery(result.orderId)
            setOrderId(result.orderId)
            setState('success')
        } catch (err: any) {
            const errorMsg = err.response?.data?.error?.message || 'Failed to verify QR code'
            setErrorMessage(errorMsg)

            // Determine error reason from error message
            if (errorMsg.toLowerCase().includes('expired')) {
                setErrorReason('expired')
            } else if (errorMsg.toLowerCase().includes('invalid')) {
                setErrorReason('invalid')
            } else {
                setErrorReason('other')
            }

            setState('error')
        }
    }

    const handleRetry = () => {
        setState('scanning')
        setErrorMessage('')
    }

    const handleClose = () => {
        navigate('/orders')
    }

    // Scanning state - fullscreen camera-first interface
    if (state === 'scanning') {
        return (
            <Scanner
                onScan={handleScan}
                onClose={handleClose}
            />
        )
    }

    // Verifying state
    if (state === 'verifying') {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" className="mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Verifying QR Code...</h2>
                    <p className="text-gray-500">Please wait while we process the delivery</p>
                </div>
            </div>
        )
    }

    // Success state - green confirmation screen with 2-second auto-return
    if (state === 'success') {
        return (
            <div className="fixed inset-0 bg-green-600 flex items-center justify-center z-50">
                <div className="text-center text-white px-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Order Delivered!</h2>
                    <p className="text-xl mb-2">Order #{orderId.slice(0, 8)}</p>
                    <p className="text-green-100">Returning to orders...</p>
                </div>
            </div>
        )
    }

    // Error state - clear error message with failure reason
    if (state === 'error') {
        return (
            <div className="fixed inset-0 bg-red-600 flex items-center justify-center z-50 p-6">
                <div className="text-center text-white max-w-md">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6">
                        <XCircle className="w-16 h-16 text-red-600" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Scan Failed</h2>

                    {errorReason === 'expired' && (
                        <>
                            <p className="text-2xl font-semibold mb-2">QR Code Expired</p>
                            <p className="text-red-100 mb-6">
                                This bill has expired. Please ask the customer to contact support or place a new order.
                            </p>
                        </>
                    )}

                    {errorReason === 'invalid' && (
                        <>
                            <p className="text-2xl font-semibold mb-2">Invalid QR Code</p>
                            <p className="text-red-100 mb-6">
                                This QR code is not valid. Please ensure the customer is showing the correct digital bill.
                            </p>
                        </>
                    )}

                    {errorReason === 'other' && (
                        <>
                            <p className="text-2xl font-semibold mb-2">Verification Failed</p>
                            <p className="text-red-100 mb-6">{errorMessage}</p>
                        </>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleRetry}
                            className="w-full bg-white text-red-600 px-8 py-4 rounded-lg hover:bg-red-50 transition-colors font-semibold text-lg min-h-[56px]"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-full bg-red-700 text-white px-8 py-4 rounded-lg hover:bg-red-800 transition-colors font-medium min-h-[56px]"
                        >
                            Back to Orders
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null
}

export default QRScanner
