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
    iconBgColor = 'bg-primary-50',
}) => {
    return (
        <div
            className={clsx(
                'rounded-lg border border-gray-200 p-2.5 sm:p-3 lg:p-4',
                'transition-all duration-base hover-elevate',
                'hover:shadow-lg hover:border-primary-200',
                'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
                bgColor
            )}
            data-testid="kpi-card"
            tabIndex={0}
            role="article"
            aria-label={`${title}: ${value}`}
        >
            {/* Mobile: Vertical Layout */}
            <div className="flex flex-col gap-2 sm:hidden">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-600 truncate flex-1">
                        {title}
                    </p>
                    <div
                        className={clsx(
                            'flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0',
                            iconBgColor,
                            iconColor
                        )}
                    >
                        {icon}
                    </div>
                </div>
                <div>
                    <p className="text-xl font-bold text-gray-900 leading-tight" data-testid="kpi-value">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <span
                                className={clsx(
                                    'text-[10px] font-medium',
                                    trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-[10px] text-gray-500 truncate">{trend.label}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tablet & Desktop: Horizontal Layout */}
            <div className="hidden sm:flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 transition-colors duration-base truncate">
                        {title}
                    </p>
                    <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 transition-all duration-base" data-testid="kpi-value">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-gray-500 truncate">{subtitle}</p>
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
                        'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg flex-shrink-0 ml-2',
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

export default KPICard;
