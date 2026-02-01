import { useState, useRef, useEffect } from 'react'
import { X, Camera } from 'lucide-react'
// @ts-ignore - react-qr-scanner types may not be available
import QrReader from 'react-qr-scanner'

interface ScannerProps {
    onScan: (data: string) => void
    onClose: () => void
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(false)

    useEffect(() => {
        // Request camera permission on mount
        checkCameraPermission()
    }, [])

    const checkCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            })
            // Stop the stream immediately, we just wanted to check permission
            stream.getTracks().forEach((track) => track.stop())
            setHasPermission(true)
        } catch (err) {
            console.error('Camera access error:', err)
            setError('Unable to access camera. Please check permissions.')
            setHasPermission(false)
        }
    }

    const handleScan = (data: any) => {
        if (data && !isScanning) {
            setIsScanning(true)
            // Extract the text from the scan result
            const qrData = typeof data === 'string' ? data : data?.text || data?.data
            if (qrData) {
                onScan(qrData)
            }
        }
    }

    const handleError = (err: any) => {
        console.error('QR Scanner error:', err)
        if (!error) {
            setError('Failed to scan QR code. Please try again.')
        }
    }

    const handleStartScan = () => {
        setIsScanning(false)
        setError(null)
    }

    return (
        <div className="fixed inset-0 bg-black flex flex-col z-50">
            {/* Header with close button */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/70 to-transparent">
                <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Close scanner"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
            </div>

            {/* Camera view */}
            <div className="flex-1 flex items-center justify-center relative">
                {hasPermission === null && (
                    <div className="text-center text-white">
                        <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                        <p className="text-lg">Requesting camera access...</p>
                    </div>
                )}

                {hasPermission === false && (
                    <div className="text-center text-white px-6">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <p className="text-xl font-semibold mb-2">Camera Access Denied</p>
                        <p className="text-white/80 mb-6">{error}</p>
                        <p className="text-sm text-white/60">
                            Please enable camera permissions in your browser settings and refresh the page.
                        </p>
                    </div>
                )}

                {hasPermission && (
                    <>
                        {/* QR Scanner */}
                        <div className="w-full h-full relative">
                            <QrReader
                                delay={300}
                                onError={handleError}
                                onScan={handleScan}
                                style={{ width: '100%', height: '100%' }}
                                constraints={{
                                    video: { facingMode: 'environment' }
                                }}
                            />

                            {/* Scanning frame overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-64 h-64 md:w-80 md:h-80">
                                    {/* Corner brackets */}
                                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg"></div>

                                    {/* Scanning line animation */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-scan"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-center">
                            <p className="text-white text-lg font-medium mb-2">
                                Position QR code within the frame
                            </p>
                            <p className="text-white/80 text-sm">
                                The scanner will automatically detect and verify the code
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Primary Scan button (for manual trigger if needed) */}
            {hasPermission && (
                <div className="absolute bottom-24 left-0 right-0 flex justify-center px-6">
                    <button
                        onClick={handleStartScan}
                        disabled={isScanning}
                        className="bg-primary-600 text-white px-12 py-4 rounded-full hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] min-w-[200px]"
                    >
                        {isScanning ? 'Scanning...' : 'Scan'}
                    </button>
                </div>
            )}

            {/* Add custom animation for scanning line */}
            <style>{`
                @keyframes scan {
                    0% {
                        transform: translateY(0);
                    }
                    100% {
                        transform: translateY(256px);
                    }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
                @media (min-width: 768px) {
                    @keyframes scan {
                        0% {
                            transform: translateY(0);
                        }
                        100% {
                            transform: translateY(320px);
                        }
                    }
                }
            `}</style>
        </div>
    )
}

export default Scanner
