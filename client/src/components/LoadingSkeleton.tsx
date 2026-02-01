import React from 'react';

interface LoadingSkeletonProps {
    variant?: 'text' | 'title' | 'avatar' | 'card' | 'product' | 'table';
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
            case 'product':
                return (
                    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
                        <div className="skeleton h-48 w-full rounded-none" />
                        <div className="p-4 space-y-3">
                            <div className="skeleton-title" />
                            <div className="skeleton-text" />
                            <div className="skeleton-text w-1/2" />
                            <div className="skeleton h-11 w-full rounded-lg" />
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
