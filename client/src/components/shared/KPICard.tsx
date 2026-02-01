import React from 'react';
import clsx from 'clsx';

export interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down';
        label: string;
    };
    bgColor?: string;
    iconColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    icon,
    trend,
    bgColor = 'bg-white',
    iconColor = 'text-primary-600',
}) => {
    return (
        <div
            className={clsx(
                'rounded-lg border border-gray-200 p-3 transition-shadow duration-base',
                'hover:shadow-lg',
                bgColor
            )}
            data-testid="kpi-card"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900" data-testid="kpi-value">
                        {value}
                    </p>
                    {trend && (
                        <div className="mt-1 flex items-center gap-1">
                            <span
                                className={clsx(
                                    'text-xs font-medium',
                                    trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-gray-500">{trend.label}</span>
                        </div>
                    )}
                </div>
                <div
                    className={clsx(
                        'flex h-12 w-12 items-center justify-center rounded-lg',
                        'bg-primary-50',
                        iconColor
                    )}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
};
