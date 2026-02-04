import { useState, useEffect } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

interface LiveCountdownProps {
    expiresAt: string
}

interface TimeInfo {
    text: string
    color: string
    isDelayed: boolean
}

export const LiveCountdown = ({ expiresAt }: LiveCountdownProps) => {
    const [timeInfo, setTimeInfo] = useState<TimeInfo>({ text: '', color: '', isDelayed: false })

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date()
            const expires = new Date(expiresAt)
            const diff = expires.getTime() - now.getTime()
            const minutes = Math.floor(diff / 60000)
            const seconds = Math.floor((diff % 60000) / 1000)
            
            if (diff < 0) {
                return { text: 'EXPIRED', color: 'text-red-600', isDelayed: true }
            }
            
            const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`
            
            if (diff > 600000) { // More than 10 minutes
                return { text: timeText, color: 'text-green-600', isDelayed: false }
            }
            
            return { text: timeText, color: 'text-red-600', isDelayed: true }
        }

        // Initial calculation
        setTimeInfo(calculateTime())

        // Update every second
        const interval = setInterval(() => {
            setTimeInfo(calculateTime())
        }, 1000)

        return () => clearInterval(interval)
    }, [expiresAt])

    return (
        <div className={`flex items-center space-x-1 ${timeInfo.color} font-medium`}>
            <ClockIcon className="h-4 w-4" />
            <span>{timeInfo.text}</span>
        </div>
    )
}
