import React from 'react';
import clsx from 'clsx';

export type StatusType = 'active' | 'inactive' | 'pending' | 'ready' | 'preparing' | 'expired';
export type StatusSize = 'sm' | 'md' | 'lg';

export interface StatusChipProps {
    status: StatusType;
    size?: StatusSize;
    showIcon?: boolean;
}

const statusConfig: Record<StatusType, { bg: string; text: string; border: string; label: string }> = {
    active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'Active',
    },
    ready: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        label: 'Ready',
    },
    pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        label: 'Pending',
    },
    preparing: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        label: 'Preparing',
    },
    inactive: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-300',
        label: 'Inactive',
    },
    expired: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        label: 'Expired',
    },
};

const sizeConfig: Record<StatusSize, { padding: string; fontSize: string }> = {
    sm: { padding: 'px-2 py-0.5', fontSize: 'text-xs' },
    md: { padding: 'px-3 py-1', fontSize: 'text-sm' },
    lg: { padding: 'px-4 py-2', fontSize: 'text-base' },
};

export const StatusChip: React.FC<StatusChipProps> = ({
    status,
    size = 'md',
    showIcon = false,
}) => {
    const config = statusConfig[status];
    const sizeStyles = sizeConfig[size];

    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1 rounded-full border font-medium transition-all duration-200',
                config.bg,
                config.text,
                config.border,
                sizeStyles.padding,
                sizeStyles.fontSize
            )}
            data-testid="status-chip"
            data-status={status}
        >
            {showIcon && (
                <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
            )}
            {config.label}
        </span>
    );
};
