import { useEffect, useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

interface TimerProps {
    expiresAt: string
    onExpire?: () => void
}

const Timer: React.FC<TimerProps> = ({ expiresAt, onExpire }) => {
    const [remainingSeconds, setRemainingSeconds] = useState(0)
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        const calculateRemaining = () => {
            const now = new Date().getTime()
            const expiry = new Date(expiresAt).getTime()
            const diff = Math.max(0, Math.floor((expiry - now) / 1000))

            setRemainingSeconds(diff)

            if (diff === 0 && !isExpired) {
                setIsExpired(true)
                onExpire?.()
            }
        }

        calculateRemaining()
        const interval = setInterval(calculateRemaining, 1000)

        return () => clearInterval(interval)
    }, [expiresAt, isExpired, onExpire])

    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60

    const isWarning = remainingSeconds <= 300 && remainingSeconds > 60 // Last 5 minutes
    const isCritical = remainingSeconds <= 60 && remainingSeconds > 0 // Last minute

    if (isExpired) {
        return (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-red-900 mb-2">Bill Expired</h3>
                <p className="text-red-700">This bill has expired and can no longer be used for delivery.</p>
            </div>
        )
    }

    return (
        <div
            className={clsx(
                'rounded-lg p-6 text-center border-2 transition-colors',
                isCritical && 'bg-red-50 border-red-300 animate-pulse',
                isWarning && !isCritical && 'bg-yellow-50 border-yellow-300',
                !isWarning && !isCritical && 'bg-green-50 border-green-300'
            )}
        >
            <Clock
                className={clsx(
                    'w-10 h-10 mx-auto mb-3',
                    isCritical && 'text-red-600',
                    isWarning && !isCritical && 'text-yellow-600',
                    !isWarning && !isCritical && 'text-green-600'
                )}
            />
            <h3 className="text-sm font-medium text-gray-600 mb-2">Time Remaining</h3>
            <div
                className={clsx(
                    'text-5xl font-bold mb-2',
                    isCritical && 'text-red-600',
                    isWarning && !isCritical && 'text-yellow-600',
                    !isWarning && !isCritical && 'text-green-600'
                )}
            >
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <p
                className={clsx(
                    'text-sm font-medium',
                    isCritical && 'text-red-700',
                    isWarning && !isCritical && 'text-yellow-700',
                    !isWarning && !isCritical && 'text-green-700'
                )}
            >
                {isCritical && 'Hurry! Bill expires soon!'}
                {isWarning && !isCritical && 'Please collect your order soon'}
                {!isWarning && !isCritical && 'Valid for 15 minutes'}
            </p>
        </div>
    )
}

export default Timer
