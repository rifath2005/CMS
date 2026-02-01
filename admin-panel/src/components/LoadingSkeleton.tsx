import React from 'react';

interface LoadingSkeletonProps {
    variant?: 'text' | 'title' | 'avatar' | 'card' | 'table' | 'kpi';
    count?: number;
    className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    variant = 'text',
    count = 1,
    className = '',
}) => {
    const renderSkeleton = () => {
        switch (variant) {
            case 'text':
                return <div className={`skeleton-text ${className}`} />;
            case 'title':
                return <div className={`skeleton-title ${className}`} />;
            case 'avatar':
                return <div className={`skeleton-avatar ${className}`} />;
            case 'card':
                return <div className={`skeleton-card ${className}`} />;
            case 'kpi':
                return (
                    <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-4 w-24" />
                                <div className="skeleton h-8 w-32" />
                                <div className="skeleton h-3 w-20" />
                            </div>
                            <div className="skeleton h-12 w-12 rounded-lg" />
                        </div>
                    </div>
                );
            case 'table':
                return (
                    <div className={`space-y-3 ${className}`}>
                        <div className="skeleton h-12 w-full" />
                        <div className="skeleton h-16 w-full" />
                        <div className="skeleton h-16 w-full" />
                        <div className="skeleton h-16 w-full" />
                    </div>
                );
            default:
                return <div className={`skeleton ${className}`} />;
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>
            ))}
        </>
    );
};

export default LoadingSkeleton;
