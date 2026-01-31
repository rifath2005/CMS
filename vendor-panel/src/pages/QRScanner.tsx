import { useState } from 'react'
import { orderService } from '../services/orderService'
import Scanner from '../components/Scanner'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { QrCode, CheckCircle, XCircle, Camera } from 'lucide-react'

const QRScanner = () => {
    const [showScanner, setShowScanner] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [lastScannedOrder, setLastScannedOrder] = useState<string | null>(null)

    const handleScan = async (qrData: string) => {
        setShowScanner(false)
        setError(null)
        setSuccessMessage(null)
        setIsVerifying(true)

        try {
            // Verify QR code
            const result = await orderService.verifyQRCode(qrData)

            if (!result.isValid) {
                setError('Invalid or expired QR code. Please check with the customer.')
                return
            }

            // Confirm delivery
            await orderService.confirmDelivery(result.orderId)
            setLastScannedOrder(result.orderId)
            setSuccessMessage(`Order #${result.orderId.slice(0, 8)} delivered successfully!`)

            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000)
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to verify QR code')
        } finally {
            setIsVerifying(false)
        }
    }

    const handleManualEntry = () => {
        const qrData = prompt('Enter QR code data:')
        if (qrData) {
            handleScan(qrData)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">QR Code Scanner</h1>

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

            {isVerifying ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <LoadingSpinner size="lg" className="mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Verifying QR Code...</h2>
                    <p className="text-gray-500">Please wait while we process the delivery</p>
                </div>
            ) : (
                <>
                    {/* Scanner Card */}
                    <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
                                <QrCode className="w-10 h-10 text-primary-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Scan Customer's QR Code</h2>
                            <p className="text-gray-600 mb-6">
                                Scan the QR code from the customer's digital bill to confirm delivery
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center"
                                >
                                    <Camera className="w-5 h-5 mr-2" />
                                    Open Camera Scanner
                                </button>
                                <button
                                    onClick={handleManualEntry}
                                    className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Enter Code Manually
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h3 className="font-semibold text-lg mb-4">How to Use</h3>
                        <ol className="space-y-3 text-gray-700">
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full mr-3 flex-shrink-0 text-sm font-bold">
                                    1
                                </span>
                                <span>Ask the customer to show their digital bill with the QR code</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full mr-3 flex-shrink-0 text-sm font-bold">
                                    2
                                </span>
                                <span>Click "Open Camera Scanner" and position the QR code in the frame</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full mr-3 flex-shrink-0 text-sm font-bold">
                                    3
                                </span>
                                <span>The system will automatically verify the bill and confirm delivery</span>
                            </li>
                            <li className="flex items-start">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full mr-3 flex-shrink-0 text-sm font-bold">
                                    4
                                </span>
                                <span>Hand over the order to the customer</span>
                            </li>
                        </ol>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
                        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                            <li>Bills are valid for 15 minutes after payment</li>
                            <li>Expired bills cannot be scanned - customer must contact support</li>
                            <li>Each QR code can only be scanned once</li>
                            <li>Ensure the order matches the customer's bill before scanning</li>
                        </ul>
                    </div>

                    {/* Last Scanned Order */}
                    {lastScannedOrder && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                <span className="text-sm text-green-800">
                                    Last delivered: Order #{lastScannedOrder.slice(0, 8)}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <Scanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    )
}

export default QRScanner
