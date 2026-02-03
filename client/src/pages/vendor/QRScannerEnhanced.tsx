import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { CheckCircleIcon, XCircleIcon, QrCodeIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ScanResult {
    success: boolean
    orderId?: string
    message: string
    orderDetails?: {
        userName: string
        items: Array<{ productName: string; quantity: number }>
        totalAmount: number
    }
}

const QRScannerEnhanced = () => {
    const [manualCode, setManualCode] = useState('')
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState<ScanResult | null>(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const scanIntervalRef = useRef<number>()

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            })
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
            
            setStream(mediaStream)
            setCameraActive(true)
            startScanning()
        } catch (err) {
            console.error('Camera access error:', err)
            alert('Unable to access camera. Please grant camera permissions or use manual input.')
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
        }
        setCameraActive(false)
    }

    const startScanning = () => {
        scanIntervalRef.current = window.setInterval(() => {
            scanFrame()
        }, 500) // Scan every 500ms
    }

    const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current || !cameraActive) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            
            // Simple QR code detection using contrast analysis
            // This is a basic implementation - for production, use a proper QR library
            const code = detectQRCode(imageData)
            
            if (code) {
                handleQRCodeDetected(code)
            }
        }
    }

    // Basic QR code detection (simplified - in production use jsQR or similar)
    const detectQRCode = (imageData: ImageData): string | null => {
        // This is a placeholder - you would use a proper QR detection library here
        // For now, we'll just return null and rely on manual input
        return null
    }

    const handleQRCodeDetected = async (code: string) => {
        stopCamera()
        await verifyOrder(code)
    }

    const handleManualScan = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!manualCode.trim()) return

        await verifyOrder(manualCode.trim())
        setManualCode('')
    }

    const verifyOrder = async (validationToken: string) => {
        setScanning(true)
        setResult(null)

        try {
            const response = await api.post(`/orders/verify-qr`, {
                validationToken
            })

            setResult({
                success: true,
                orderId: response.data.data.orderId,
                message: 'Order verified and marked as delivered!',
                orderDetails: response.data.data
            })
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.error?.message || 'Invalid QR code or order already delivered'
            })
        } finally {
            setScanning(false)
        }
    }

    const handleClearResult = () => {
        setResult(null)
        setManualCode('')
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">QR Code Scanner</h1>
                <p className="text-gray-600">Scan customer QR codes to verify and complete orders</p>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Camera Scanner */}
                {!cameraActive && !result && (
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                                <QrCodeIcon className="h-12 w-12 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
                            <p className="text-gray-600">Choose scanning method</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={startCamera}
                                className="flex flex-col items-center justify-center p-6 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition"
                            >
                                <CameraIcon className="h-12 w-12 text-blue-600 mb-2" />
                                <span className="font-medium text-blue-600">Use Camera</span>
                                <span className="text-sm text-gray-500 mt-1">Scan with device camera</span>
                            </button>

                            <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg">
                                <QrCodeIcon className="h-12 w-12 text-gray-600 mb-2" />
                                <span className="font-medium text-gray-600">Manual Entry</span>
                                <span className="text-sm text-gray-500 mt-1">Enter code below</span>
                            </div>
                        </div>

                        {/* Manual Input Form */}
                        <form onSubmit={handleManualScan} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Validation Code</label>
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Enter validation code"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-lg font-mono"
                                    disabled={scanning}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={scanning || !manualCode.trim()}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {scanning ? 'Verifying...' : 'Verify Order'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Camera View */}
                {cameraActive && (
                    <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden mb-6">
                        <div className="relative">
                            <video
                                ref={videoRef}
                                className="w-full"
                                style={{ maxHeight: '60vh' }}
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            
                            {/* Scanning overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-64 h-64 border-4 border-blue-500 rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                                            Position QR code here
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {scanning && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="bg-white rounded-lg p-6 text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-700 font-medium">Verifying...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-800 flex justify-between items-center">
                            <p className="text-white text-sm">Scanning for QR codes...</p>
                            <button
                                onClick={stopCamera}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center space-x-2"
                            >
                                <XMarkIcon className="h-5 w-5" />
                                <span>Stop</span>
                            </button>
                        </div>

                        {/* Manual input while camera is active */}
                        <div className="p-4 bg-gray-800 border-t border-gray-700">
                            <form onSubmit={handleManualScan} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Or enter code manually"
                                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                    disabled={scanning}
                                />
                                <button
                                    type="submit"
                                    disabled={scanning || !manualCode.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-600"
                                >
                                    Verify
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Result Display */}
                {result && (
                    <div className={`rounded-lg shadow-lg p-6 ${
                        result.success ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
                    }`}>
                        <div className="flex items-start space-x-4">
                            <div className={`flex-shrink-0 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                {result.success ? (
                                    <CheckCircleIcon className="h-12 w-12" />
                                ) : (
                                    <XCircleIcon className="h-12 w-12" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-xl font-bold mb-2 ${
                                    result.success ? 'text-green-800' : 'text-red-800'
                                }`}>
                                    {result.success ? 'Success!' : 'Verification Failed'}
                                </h3>
                                <p className={`mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                    {result.message}
                                </p>

                                {result.success && result.orderDetails && (
                                    <div className="bg-white rounded-lg p-4 mb-4">
                                        <p className="font-medium mb-2">Order ID: #{result.orderId?.slice(0, 8).toUpperCase()}</p>
                                        <p className="text-sm text-gray-600 mb-2">Customer: {result.orderDetails.userName}</p>
                                        <div className="border-t pt-2 mt-2">
                                            <p className="font-medium mb-2">Items:</p>
                                            {result.orderDetails.items.map((item, idx) => (
                                                <div key={idx} className="text-sm text-gray-700">
                                                    {item.quantity}x {item.productName}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <p className="font-bold">Total: ₹{result.orderDetails.totalAmount}</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleClearResult}
                                    className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Scan Another
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                {!cameraActive && !result && (
                    <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="font-bold text-blue-900 mb-3">How to use:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-blue-800">
                            <li>Click "Use Camera" to scan with your device camera</li>
                            <li>Or enter the validation code manually</li>
                            <li>Position the QR code within the frame</li>
                            <li>Order will be automatically verified and marked as delivered</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    )
}

export default QRScannerEnhanced
