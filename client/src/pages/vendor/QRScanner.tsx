import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { QrCode, Camera, X, CheckCircle, AlertCircle, Info, RefreshCw } from 'lucide-react'

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
    const lastScannedTokenRef = useRef<string | null>(null)
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

    const onScanSuccess = async (decodedText: string) => {
        console.log('QR Code detected:', decodedText)
        
        // Check if we already processed this token
        if (lastScannedTokenRef.current === decodedText) {
            console.log('Duplicate scan detected, ignoring...')
            return
        }
        
        // Store the token to prevent duplicate processing
        lastScannedTokenRef.current = decodedText
        
        // Immediately stop camera to prevent multiple scans
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.pause(true)
                console.log('Camera paused after QR detection')
            } catch (err) {
                console.log('Error pausing camera:', err)
            }
        }
        
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
        lastScannedTokenRef.current = null // Reset the last scanned token
        // Go back to initial state - user can click "Scan QR Code" again
        setCameraActive(false)
    }

    return (
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
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
            
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">QR Code Scanner</h1>
                <p className="text-sm sm:text-base text-gray-600">Scan customer QR codes to verify and complete orders</p>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Initial State - Show Scan Button */}
                {!cameraActive && !result && (
                    <div className="space-y-6">
                        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                            <CardContent className="p-8 sm:p-12 text-center">
                                <div className="mb-6">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                                        <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Ready to Scan</h2>
                                    <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                                        Open the camera to scan customer QR codes and mark orders as delivered instantly.
                                    </p>
                                </div>
                                
                                <Button
                                    onClick={startCamera}
                                    size="lg"
                                    className="px-8 py-6 text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-105 transition-all duration-300 gap-3"
                                >
                                    <Camera className="w-6 h-6" />
                                    <span>Start Scanner</span>
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-muted/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Info className="w-4 h-4 text-primary" />
                                        Instructions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                        <li>Position QR code within the frame</li>
                                        <li>Hold steady for automatic detection</li>
                                        <li>Review verified order details</li>
                                        <li>System updates in real-time</li>
                                    </ol>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-semantic-warning" />
                                        Requirements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                        <li>Secure HTTPS connection</li>
                                        <li>Granted camera permissions</li>
                                        <li>Good lighting conditions</li>
                                        <li>Valid customer QR code</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Camera View */}
                {cameraActive && !result && (
                    <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-4 sm:mb-6 relative">
                        <div id={qrCodeRegionId} className="w-full"></div>

                        {scanning && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-4 sm:p-6 text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                                    <p className="text-gray-700 font-medium text-sm sm:text-base">Verifying...</p>
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-muted border-t flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-semantic-success animate-pulse" />
                                <p className="text-sm font-medium text-muted-foreground">Camera Active</p>
                            </div>
                            <Button
                                onClick={stopCamera}
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                <span>Stop Camera</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Result Display */}
                {result && (
                    <Card className={cn(
                        "border-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4",
                        result.success ? "border-semantic-success bg-green-50/50" : "border-semantic-error bg-red-50/50"
                    )}>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                                <div className={cn(
                                    "p-3 rounded-full",
                                    result.success ? "bg-semantic-success/20 text-semantic-success" : "bg-semantic-error/20 text-semantic-error"
                                )}>
                                    {result.success ? (
                                        <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12" />
                                    ) : (
                                        <XCircleIcon className="h-10 w-10 sm:h-12 sm:w-12" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className={cn(
                                            "text-xl font-bold mb-1",
                                            result.success ? "text-green-900" : "text-red-900"
                                        )}>
                                            {result.success ? 'Order Verified' : 'Verification Failed'}
                                        </h3>
                                        <p className={cn(
                                            "text-sm sm:text-base",
                                            result.success ? "text-green-700" : "text-red-700"
                                        )}>
                                            {result.message}
                                        </p>
                                    </div>

                                    {result.success && result.orderDetails && (
                                        <Card className="bg-white/80 shadow-sm border-none">
                                            <CardContent className="p-4 space-y-4">
                                                <div className="flex justify-between items-center border-b pb-2">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Order ID</p>
                                                        <p className="font-mono font-bold text-lg">#{result.orderId?.slice(0, 8).toUpperCase()}</p>
                                                    </div>
                                                    <Badge variant="success">Delivered</Badge>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <p className="text-sm">
                                                        <span className="text-muted-foreground mr-2">Customer:</span>
                                                        <span className="font-bold">{result.orderDetails.userName}</span>
                                                    </p>
                                                    
                                                    <div className="space-y-1.5">
                                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Items</p>
                                                        {result.orderDetails.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span>{item.productName}</span>
                                                                <span className="font-bold">x{item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t flex justify-between items-center text-lg">
                                                    <span className="font-medium">Total Paid</span>
                                                    <span className="font-bold text-primary">₹{result.orderDetails.totalAmount}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Button
                                        onClick={handleScanAnother}
                                        variant="outline"
                                        className="w-full sm:w-auto gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Scan Another
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default QRScanner
