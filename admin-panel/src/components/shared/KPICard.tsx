import React from 'react';
import clsx from 'clsx';

export interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        direction: 'up' | 'down';
        label: string;
    };
    bgColor?: string;
    iconColor?: string;
    iconBgColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    bgColor = 'bg-white',
    iconColor = 'text-primary-600',
    iconBgColor = 'bg-blue-50',
}) => {
    return (
        <div
            className={clsx(
                'rounded-lg border border-gray-200 p-3',
                'transition-all duration-base hover-elevate',
                'hover:shadow-lg hover:border-blue-200',
                'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
                bgColor
            )}
            data-testid="kpi-card"
            tabIndex={0}
            role="article"
            aria-label={`${title}: ${value}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 transition-colors duration-base">
                        {title}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-gray-900 transition-all duration-base" data-testid="kpi-value">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="mt-1 flex items-center gap-1 transition-all duration-base">
                            <span
                                className={clsx(
                                    'text-xs font-medium transition-colors duration-base',
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
                        iconBgColor,
                        'transition-all duration-base',
                        'group-hover:scale-110',
                        iconColor
                    )}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
};
