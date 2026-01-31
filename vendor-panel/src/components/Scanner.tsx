import { useState, useRef, useEffect } from 'react'
import { Camera, X } from 'lucide-react'

interface ScannerProps {
    onScan: (data: string) => void
    onClose: () => void
}

const Scanner: React.FC<ScannerProps> = ({ onScan, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [hasPermission, setHasPermission] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        startCamera()
        return () => {
            stopCamera()
        }
    }, [])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            setHasPermission(true)
        } catch (err) {
            console.error('Camera access error:', err)
            setError('Unable to access camera. Please check permissions.')
            setHasPermission(false)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
    }

    const handleManualInput = () => {
        const qrData = prompt('Enter QR code data manually:')
        if (qrData) {
            onScan(qrData)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">Scan QR Code</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {hasPermission === null && (
                        <div className="text-center py-12">
                            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
                            <p className="text-gray-600">Requesting camera access...</p>
                        </div>
                    )}

                    {hasPermission === false && (
                        <div className="text-center py-12">
                            <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={handleManualInput}
                                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Enter Code Manually
                            </button>
                        </div>
                    )}

                    {hasPermission && (
                        <div>
                            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-96 object-cover"
                                />
                                <div className="absolute inset-0 border-4 border-primary-500 m-12 rounded-lg pointer-events-none" />
                            </div>

                            <div className="text-center">
                                <p className="text-gray-600 mb-4">
                                    Position the QR code within the frame
                                </p>
                                <button
                                    onClick={handleManualInput}
                                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                                >
                                    Or enter code manually
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Scanner
