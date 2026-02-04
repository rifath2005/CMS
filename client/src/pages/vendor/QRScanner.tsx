import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
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
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState<ScanResult | null>(null)
    const [cameraActive, setCameraActive] = useState(false)
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
    const qrCodeRegionId = 'qr-reader'

    useEffect(() => {
        // Don't auto-start camera, wait for user to click button
        return () => {
            stopCamera()
        }
    }, [])

    const checkCameraPermission = async () => {
        try {
            if (navigator.permissions && navigator.permissions.query) {
                const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
                console.log('Camera permission status:', result.state)
                return result.state
            }
            console.log('Permissions API not available, will prompt user')
            return 'prompt'
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
            stream.getTracks().forEach(track => track.stop())
            return true
        } catch (err: any) {
            console.error('❌ Basic camera access failed:', err.name, err.message)
            return false
        }
    }

    const startCamera = async () => {
        console.log('=== STARTING CAMERA ===')
        
        // Stop any existing camera first
        if (html5QrCodeRef.current) {
            console.log('Cleaning up existing scanner...')
            try {
                const state = await html5QrCodeRef.current.getState()
                if (state === 2) {
                    await html5QrCodeRef.current.stop()
                }
                await html5QrCodeRef.current.clear()
            } catch (err) {
                console.log('Cleanup error (expected):', err)
            }
            html5QrCodeRef.current = null
        }
        
        setCameraActive(true)
        
        // Wait for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 100))
        
        try {
            const element = document.getElementById(qrCodeRegionId)
            console.log('QR reader element:', element)
            
            if (!element) {
                console.error('QR reader element not found in DOM')
                setCameraActive(false)
                alert('Scanner initialization failed. Please try again.')
                return
            }

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

            console.log('Step 3: Getting available cameras...')
            const devices = await Html5Qrcode.getCameras()
            console.log('Devices found:', devices)
            
            if (!devices || devices.length === 0) {
                console.error('No cameras found')
                setCameraActive(false)
                alert('No camera found on this device.')
                return
            }

            console.log('Available cameras:', devices.length, devices)

            console.log('Step 4: Initializing Html5Qrcode...')
            html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId)
            console.log('Html5Qrcode initialized')
            
            const config = {
                fps: 10,
                qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
                    // Make the QR box 70% of the smaller dimension
                    const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdgeSize * 0.7);
                    return {
                        width: qrboxSize,
                        height: qrboxSize
                    };
                },
                aspectRatio: 1.777778, // 16:9 aspect ratio
                disableFlip: false, // Allow flipping for better detection
                videoConstraints: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            }

            console.log('Step 5: Starting camera with config:', config)
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
                errorMessage += err.message || 'Please check camera permissions.'
            }
            
            console.error('Showing alert:', errorMessage)
            alert(errorMessage)
            
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
        verifyOrder(decodedText)
    }

    const onScanError = (_errorMessage: string) => {
        // Ignore scan errors (happens continuously while scanning)
    }

    const stopCamera = async () => {
        console.log('=== STOPPING CAMERA ===')
        
        if (html5QrCodeRef.current) {
            try {
                const state = await html5QrCodeRef.current.getState()
                console.log('Scanner state:', state)
                
                if (state === 2) { // Scanner is running
                    console.log('Stopping scanner...')
                    await html5QrCodeRef.current.stop()
                }
                
                console.log('Clearing scanner...')
                await html5QrCodeRef.current.clear()
                html5QrCodeRef.current = null
                console.log('Scanner cleared')
            } catch (err) {
                console.error('Error stopping camera:', err)
            }
        }
        
        // Additional cleanup: Stop all video tracks manually
        const videoElements = document.querySelectorAll('#qr-reader video')
        videoElements.forEach((video: any) => {
            if (video.srcObject) {
                const stream = video.srcObject as MediaStream
                stream.getTracks().forEach(track => {
                    console.log('Stopping track:', track.kind, track.label)
                    track.stop()
                })
                video.srcObject = null
            }
        })
        
        setCameraActive(false)
        console.log('✅ Camera fully stopped')
    }

    const verifyOrder = async (validationToken: string) => {
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

            await stopCamera()
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.error?.message || 'Invalid QR code or order already delivered'
            })

            setTimeout(() => {
                setResult(null)
                setScanning(false)
            }, 2000)
            return
        } finally {
            setScanning(false)
        }
    }

    const handleScanAnother = async () => {
        console.log('=== SCAN ANOTHER ===')
        setResult(null)
        setScanning(false)
        // Go back to initial state - user can click "Scan QR Code" again
        setCameraActive(false)
    }

    return (
        <div className="p-6">
            <style>{`
                #qr-reader {
                    border: none !important;
                    width: 100% !important;
                    position: relative;
                    overflow: hidden;
                }
                #qr-reader video {
                    border-radius: 0.5rem;
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    display: block;
                    margin: 0 auto;
                }
                #qr-reader__dashboard_section {
                    display: none !important;
                }
                #qr-reader__scan_region {
                    border: 3px solid #3b82f6 !important;
                    border-radius: 12px !important;
                    position: relative !important;
                }
                #qr-reader__camera_selection {
                    display: none !important;
                }
                #qr-reader canvas {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    display: none !important;
                }
                /* Hide any duplicate video elements */
                #qr-reader video:not(:first-of-type) {
                    display: none !important;
                }
            `}</style>
            
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">QR Code Scanner</h1>
                <p className="text-gray-600">Scan customer QR codes to verify and complete orders</p>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Initial State - Show Scan Button */}
                {!cameraActive && !result && (
                    <div className="text-center">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 mb-6 border-2 border-blue-200">
                            <div className="mb-6">
                                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Scan</h2>
                                <p className="text-gray-600">Click the button below to open camera and scan customer QR codes</p>
                            </div>
                            
                            <button
                                onClick={startCamera}
                                className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-3 mx-auto"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Scan QR Code</span>
                            </button>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-6 mb-4">
                            <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                How it works:
                            </h3>
                            <ol className="list-decimal list-inside space-y-2 text-blue-800">
                                <li>Click "Scan QR Code" to activate camera</li>
                                <li>Allow camera permissions when prompted</li>
                                <li>Point camera at customer's QR code</li>
                                <li>Order will be verified automatically</li>
                            </ol>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-bold text-yellow-900 mb-2 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Camera Requirements:
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                                <li>HTTPS connection required (or localhost)</li>
                                <li>Camera permission must be granted</li>
                                <li>Camera must not be in use by another app</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Camera View */}
                {cameraActive && !result && (
                    <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-6 relative">
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
                                onClick={stopCamera}
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
                                    onClick={handleScanAnother}
                                    className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Scan Another
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default QRScanner
