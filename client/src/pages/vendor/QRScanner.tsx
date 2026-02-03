import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { CheckCircleIcon, XCircleIcon, QrCodeIcon, CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Html5Qrcode } from 'html5-qrcode'

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

const QRScanner = () => {
    const [manualCode, setManualCode] = useState('')
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState<ScanResult | null>(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [manualMode, setManualMode] = useState(false)
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
    const qrCodeRegionId = 'qr-reader'

    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    const checkCameraPermission = async () => {
        try {
            // Check if Permissions API is available
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
                console.log('Camera permission status:', result.state)
                return result.state
            }
            console.log('Permissions API not available, will prompt user')
            return 'prompt' // Default to prompt if API not available
        } catch (err) {
            console.log('Permissions API error (this is normal on some browsers):', err)
            return 'prompt'
        }
    }

    const testBasicCameraAccess = async () => {
        console.log('Testing basic camera access with getUserMedia...')
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            console.log('✅ Basic camera access works!', stream)
            // Stop the test stream
            stream.getTracks().forEach(track => track.stop())
            return true
        } catch (err: any) {
            console.error('❌ Basic camera access failed:', err.name, err.message)
            return false
        }
    }

    const startCamera = async () => {
        console.log('=== STARTING CAMERA ===')
        
        // First, set cameraActive to true so the div renders
        setCameraActive(true)
        
        // Wait for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 100))
        
        try {
            // Check if the element exists
            const element = document.getElementById(qrCodeRegionId)
            console.log('QR reader element:', element)
            
            if (!element) {
                console.error('QR reader element not found in DOM')
                setCameraActive(false)
                alert('Scanner initialization failed. Please try again.')
                return
            }

            // Test basic camera access first
            console.log('Step 1: Testing basic camera access...')
            const basicAccessWorks = await testBasicCameraAccess()
            if (!basicAccessWorks) {
                setCameraActive(false)
                alert('Basic camera access failed. Please check:\n' +
                      '1. Camera is not being used by another app\n' +
                      '2. Camera permissions are granted\n' +
                      '3. Your device has a working camera')
                return
            }

            // Check permission status
            console.log('Step 2: Checking camera permission...')
            const permissionStatus = await checkCameraPermission()
            console.log('Permission status:', permissionStatus)
            
            if (permissionStatus === 'denied') {
                setCameraActive(false)
                alert('Camera permission was previously denied. Please enable camera access in your browser settings:\n\n' +
                      '1. Click the lock/info icon in the address bar\n' +
                      '2. Find Camera permissions\n' +
                      '3. Change to "Allow"\n' +
                      '4. Refresh the page and try again')
                return
            }

            // Get available cameras
            console.log('Step 3: Getting available cameras...')
            const devices = await Html5Qrcode.getCameras()
            console.log('Devices found:', devices)
            
            if (!devices || devices.length === 0) {
                console.error('No cameras found')
                setCameraActive(false)
                alert('No camera found on this device. Please use manual entry.')
                return
            }

            console.log('Available cameras:', devices.length, devices)

            // Initialize Html5Qrcode
            console.log('Step 4: Initializing Html5Qrcode...')
            html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId)
            console.log('Html5Qrcode initialized')
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            }

            console.log('Step 5: Starting camera with config:', config)
            // Try to start with environment camera (back camera)
            await html5QrCodeRef.current.start(
                { facingMode: 'environment' },
                config,
                onScanSuccess,
                onScanError
            )

            console.log('✅ Camera started successfully!')
        } catch (err: any) {
            console.error('=== CAMERA ERROR ===')
            console.error('Error name:', err.name)
            console.error('Error message:', err.message)
            console.error('Full error:', err)
            
            setCameraActive(false)
            
            // Provide more specific error messages
            let errorMessage = 'Unable to access camera. '
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings and try again.'
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage += 'No camera found on this device.'
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage += 'Camera is already in use by another application.'
            } else if (err.name === 'OverconstrainedError') {
                errorMessage += 'Camera constraints could not be satisfied.'
            } else if (err.name === 'NotSupportedError') {
                errorMessage += 'Camera access is not supported on this browser. Please use HTTPS or try a different browser.'
            } else {
                errorMessage += err.message || 'Please grant camera permissions or use manual input.'
            }
            
            console.error('Showing alert:', errorMessage)
            alert(errorMessage)
            
            // Clean up if initialization failed
            if (html5QrCodeRef.current) {
                try {
                    console.log('Cleaning up Html5Qrcode...')
                    await html5QrCodeRef.current.clear()
                } catch (clearErr) {
                    console.error('Error clearing scanner:', clearErr)
                }
                html5QrCodeRef.current = null
            }
        }
    }

    const onScanSuccess = (decodedText: string) => {
        console.log('QR Code detected:', decodedText)
        // Verify the order
        verifyOrder(decodedText)
    }

    const onScanError = (_errorMessage: string) => {
        // Ignore scan errors (happens continuously while scanning)
    }

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop()
                html5QrCodeRef.current.clear()
                html5QrCodeRef.current = null
            } catch (err) {
                console.error('Error stopping camera:', err)
            }
        }
        setCameraActive(false)
    }

    const handleManualScan = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!manualCode.trim()) return

        await verifyOrder(manualCode.trim())
        setManualCode('')
    }

    const verifyOrder = async (validationToken: string) => {
        // Prevent multiple simultaneous verifications
        if (scanning) return
        
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

            // Stop camera after successful scan
            await stopCamera()
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.error?.message || 'Invalid QR code or order already delivered'
            })

            // Clear error after 2 seconds and continue scanning
            setTimeout(() => {
                setResult(null)
                setScanning(false)
            }, 2000)
            return
        } finally {
            setScanning(false)
        }
    }

    const handleClearResult = () => {
        setResult(null)
        setManualCode('')
        setCameraActive(false)
        setManualMode(false)
    }

    const handleManualModeToggle = () => {
        setManualMode(true)
    }

    const handleBackToModes = async () => {
        await stopCamera()
        setManualMode(false)
        setManualCode('')
    }

    return (
        <div className="p-6">
            <style>{`
                #qr-reader {
                    border: none !important;
                }
                #qr-reader video {
                    border-radius: 0.5rem;
                }
                #qr-reader__dashboard_section {
                    display: none !important;
                }
                #qr-reader__scan_region {
                    border: 2px solid #3b82f6 !important;
                }
            `}</style>
            
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">QR Code Scanner</h1>
                <p className="text-gray-600">Scan customer QR codes to verify and complete orders</p>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Mode Selection - Show when no mode is active and no result */}
                {!cameraActive && !manualMode && !result && (
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                                <QrCodeIcon className="h-12 w-12 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
                            <p className="text-gray-600">Choose scanning method</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={startCamera}
                                className="flex flex-col items-center justify-center p-6 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition"
                            >
                                <CameraIcon className="h-12 w-12 text-blue-600 mb-2" />
                                <span className="font-medium text-blue-600">Use Camera</span>
                                <span className="text-sm text-gray-500 mt-1">Scan with device camera</span>
                            </button>

                            <button
                                onClick={handleManualModeToggle}
                                className="flex flex-col items-center justify-center p-6 border-2 border-gray-600 rounded-lg hover:bg-gray-50 transition"
                            >
                                <QrCodeIcon className="h-12 w-12 text-gray-600 mb-2" />
                                <span className="font-medium text-gray-600">Manual Entry</span>
                                <span className="text-sm text-gray-500 mt-1">Enter code manually</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Manual Entry Mode */}
                {manualMode && !result && (
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-4">
                                <QrCodeIcon className="h-12 w-12 text-gray-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Manual Entry</h2>
                            <p className="text-gray-600">Enter the validation code</p>
                        </div>

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
                                    autoFocus
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={handleBackToModes}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-lg"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={scanning || !manualCode.trim()}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {scanning ? 'Verifying...' : 'Verify Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Camera View */}
                {cameraActive && !result && (
                    <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-6">
                        {/* QR Code Scanner Container */}
                        <div id={qrCodeRegionId} className="w-full"></div>

                        {scanning && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-700 font-medium">Verifying...</p>
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-gray-800 flex justify-between items-center">
                            <p className="text-white text-sm">📷 Camera scanning automatically</p>
                            <button
                                onClick={handleBackToModes}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center space-x-2"
                            >
                                <XMarkIcon className="h-5 w-5" />
                                <span>Stop</span>
                            </button>
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
                {!cameraActive && !manualMode && !result && (
                    <>
                        <div className="bg-blue-50 rounded-lg p-6 mb-4">
                            <h3 className="font-bold text-blue-900 mb-3">How to use:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-blue-800">
                                <li>Click "Use Camera" to activate your device camera for automatic scanning</li>
                                <li>Or click "Manual Entry" to type the validation code</li>
                                <li>Position the QR code within the camera frame for auto-detection</li>
                                <li>Order will be verified and marked as delivered automatically</li>
                            </ol>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <h4 className="font-bold text-yellow-900 mb-2">⚠️ Camera Requirements:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                                <li>HTTPS connection required (or localhost for testing)</li>
                                <li>Camera permission must be granted</li>
                                <li>Camera must not be in use by another app</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h4 className="font-bold text-gray-900 mb-2">🔧 Troubleshooting:</h4>
                            <div className="space-y-2 text-sm text-gray-700">
                                <p><strong>Camera not working?</strong></p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                    <li>Check the lock icon in your browser's address bar</li>
                                    <li>Click it and ensure Camera is set to "Allow"</li>
                                    <li>Refresh the page and try again</li>
                                    <li>If still not working, use "Manual Entry" instead</li>
                                </ol>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default QRScanner
