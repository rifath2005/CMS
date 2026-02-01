import React from 'react';
import { CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react';
import { OrderStatus } from '../../types';
import clsx from 'clsx';

export interface OrderStatusTimelineProps {
    currentStatus: OrderStatus;
    size?: 'sm' | 'md' | 'lg';
    orientation?: 'vertical' | 'horizontal';
}

interface StatusStep {
    status: OrderStatus;
    label: string;
    icon: React.ReactNode;
}

const statusSteps: StatusStep[] = [
    {
        status: OrderStatus.PENDING,
        label: 'Order Placed',
        icon: <Package className="w-full h-full" />,
    },
    {
        status: OrderStatus.PREPARING,
        label: 'Preparing',
        icon: <Clock className="w-full h-full" />,
    },
    {
        status: OrderStatus.READY,
        label: 'Ready for Pickup',
        icon: <Truck className="w-full h-full" />,
    },
    {
        status: OrderStatus.DELIVERED,
        label: 'Delivered',
        icon: <CheckCircle className="w-full h-full" />,
    },
];

const getStatusIndex = (status: OrderStatus): number => {
    const index = statusSteps.findIndex((step) => step.status === status);
    return index !== -1 ? index : -1;
};

const isStepCompleted = (stepIndex: number, currentIndex: number, isExpired: boolean): boolean => {
    if (isExpired) return false;
    return stepIndex <= currentIndex;
};

const isStepActive = (stepIndex: number, currentIndex: number, isExpired: boolean): boolean => {
    if (isExpired) return false;
    return stepIndex === currentIndex;
};

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
    currentStatus,
    size = 'md',
    orientation = 'vertical',
}) => {
    const isExpired = currentStatus === OrderStatus.EXPIRED;
    const currentIndex = getStatusIndex(currentStatus);

    const sizeConfig = {
        sm: { node: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-xs', line: 'w-0.5' },
        md: { node: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-sm', line: 'w-1' },
        lg: { node: 'w-12 h-12', icon: 'w-6 h-6', text: 'text-base', line: 'w-1' },
    };

    const config = sizeConfig[size];

    if (isExpired) {
        return (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                    <p className="font-semibold text-red-800">Order Expired</p>
                    <p className="text-sm text-red-600">This order was not picked up in time</p>
                </div>
            </div>
        );
    }

    if (orientation === 'horizontal') {
        return (
            <div className="flex items-center justify-between w-full">
                {statusSteps.map((step, index) => {
                    const completed = isStepCompleted(index, currentIndex, isExpired);
                    const active = isStepActive(index, currentIndex, isExpired);

                    return (
                        <React.Fragment key={step.status}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={clsx(
                                        'rounded-full flex items-center justify-center transition-all duration-300',
                                        config.node,
                                        completed
                                            ? 'bg-green-600 text-white'
                                            : active
                                                ? 'bg-yellow-500 text-white ring-4 ring-yellow-200'
                                                : 'bg-gray-200 text-gray-400'
                                    )}
                                >
                                    <div className={config.icon}>{step.icon}</div>
                                </div>
                                <p
                                    className={clsx(
                                        'mt-2 text-center font-medium',
                                        config.text,
                                        completed || active ? 'text-gray-900' : 'text-gray-400'
                                    )}
                                >
                                    {step.label}
                                </p>
                            </div>
                            {index < statusSteps.length - 1 && (
                                <div
                                    className={clsx(
                                        'flex-1 h-1 mx-2 transition-all duration-300',
                                        completed ? 'bg-green-600' : 'bg-gray-200'
                                    )}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }

    // Vertical orientation
    return (
        <div className="flex flex-col space-y-4">
            {statusSteps.map((step, index) => {
                const completed = isStepCompleted(index, currentIndex, isExpired);
                const active = isStepActive(index, currentIndex, isExpired);

                return (
                    <div key={step.status} className="flex items-start">
                        <div className="flex flex-col items-center mr-4">
                            <div
                                className={clsx(
                                    'rounded-full flex items-center justify-center transition-all duration-300',
                                    config.node,
                                    completed
                                        ? 'bg-green-600 text-white'
                                        : active
                                            ? 'bg-yellow-500 text-white ring-4 ring-yellow-200'
                                            : 'bg-gray-200 text-gray-400'
                                )}
                            >
                                <div className={config.icon}>{step.icon}</div>
                            </div>
                            {index < statusSteps.length - 1 && (
                                <div
                                    className={clsx(
                                        'h-12 transition-all duration-300',
                                        config.line,
                                        completed ? 'bg-green-600' : 'bg-gray-200'
                                    )}
                                />
                            )}
                        </div>
                        <div className="flex-1 pt-1">
                            <p
                                className={clsx(
                                    'font-medium',
                                    config.text,
                                    completed || active ? 'text-gray-900' : 'text-gray-400'
                                )}
                            >
                                {step.label}
                            </p>
                            {active && (
                                <p className="text-xs text-yellow-600 mt-1">In progress...</p>
                            )}
                            {completed && !active && (
                                <p className="text-xs text-green-600 mt-1">Completed</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
