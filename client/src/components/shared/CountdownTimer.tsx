import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

export type CountdownSize = 'sm' | 'md' | 'lg';

export interface CountdownTimerProps {
    expiresAt: Date;
    onExpire?: () => void;
    size?: CountdownSize;
}

const sizeConfig: Record<CountdownSize, string> = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    expiresAt,
    onExpire,
    size = 'lg',
}) => {
    const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
    const [isExpired, setIsExpired] = useState<boolean>(false);

    useEffect(() => {
        const calculateRemaining = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = Math.floor((expiry - now) / 1000);

            if (diff <= 0) {
                setRemainingSeconds(0);
                if (!isExpired) {
                    setIsExpired(true);
                    onExpire?.();
                }
                return 0;
            }

            setRemainingSeconds(diff);
            return diff;
        };

        // Initial calculation
        calculateRemaining();

        // Update every second
        const interval = setInterval(() => {
            calculateRemaining();
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, isExpired, onExpire]);

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Determine color based on remaining time
    const getColorClass = () => {
        if (isExpired) {
            return 'text-red-600';
        }
        if (remainingSeconds <= 300) { // 5 minutes or less
            return 'text-amber-600';
        }
        return 'text-green-600';
    };

    return (
        <div
            className="flex flex-col items-center justify-center"
            data-testid="countdown-timer"
        >
            <div
                className={clsx(
                    'font-bold tabular-nums',
                    sizeConfig[size],
                    getColorClass()
                )}
                data-testid="countdown-display"
                data-expired={isExpired}
                data-remaining-seconds={remainingSeconds}
            >
                {formattedTime}
            </div>
            <div className="mt-1 text-sm font-medium text-gray-600">
                {isExpired ? 'Expired' : 'Time Remaining'}
            </div>
        </div>
    );
};
