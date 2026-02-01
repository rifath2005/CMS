import React, { useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

export interface StepConfig {
    title: string;
    description?: string;
    content: React.ReactNode;
    isValid?: boolean;
}

export interface StepDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    steps: StepConfig[];
    currentStep: number;
    onStepChange: (step: number) => void;
    onComplete?: () => void;
}

export const StepDrawer: React.FC<StepDrawerProps> = ({
    isOpen,
    onClose,
    steps,
    currentStep,
    onStepChange,
    onComplete,
}) => {
    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const canGoNext = currentStep < steps.length - 1 && (steps[currentStep].isValid ?? true);
    const canGoPrevious = currentStep > 0;
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (canGoNext) {
            onStepChange(currentStep + 1);
        } else if (isLastStep && (steps[currentStep].isValid ?? true)) {
            onComplete?.();
        }
    };

    const handlePrevious = () => {
        if (canGoPrevious) {
            onStepChange(currentStep - 1);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-slow"
                onClick={onClose}
                data-testid="drawer-backdrop"
            />

            {/* Drawer */}
            <div
                className={clsx(
                    'fixed right-0 top-0 z-50 h-full bg-white shadow-xl transition-transform duration-slow',
                    'w-full md:w-[480px]',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
                data-testid="step-drawer"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {steps[currentStep]?.title}
                        </h2>
                        {steps[currentStep]?.description && (
                            <p className="mt-1 text-sm text-gray-500">
                                {steps[currentStep].description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Close drawer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                        {steps.map((_, index) => (
                            <React.Fragment key={index}>
                                <div
                                    className={clsx(
                                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                                        index < currentStep && 'bg-blue-600 text-white',
                                        index === currentStep && 'bg-blue-600 text-white',
                                        index > currentStep && 'bg-gray-200 text-gray-600'
                                    )}
                                >
                                    {index + 1}
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={clsx(
                                            'h-1 flex-1 rounded',
                                            index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                                        )}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {steps[currentStep]?.content}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4">
                    <div className="flex justify-between gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={!canGoPrevious}
                            className={clsx(
                                'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-fast',
                                canGoPrevious
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'cursor-not-allowed bg-gray-50 text-gray-400'
                            )}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!canGoNext && !isLastStep}
                            className={clsx(
                                'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-fast',
                                (canGoNext || (isLastStep && (steps[currentStep].isValid ?? true)))
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'cursor-not-allowed bg-gray-300 text-gray-500'
                            )}
                        >
                            {isLastStep ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
