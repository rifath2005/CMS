import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';
import { Building2 } from 'lucide-react';

describe('KPICard Component', () => {
    describe('Basic Rendering', () => {
        it('should render with required props', () => {
            render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 data-testid="test-icon" />}
                />
            );

            expect(screen.getByText('Test Metric')).toBeInTheDocument();
            expect(screen.getByText('100')).toBeInTheDocument();
            expect(screen.getByTestId('test-icon')).toBeInTheDocument();
        });

        it('should render with string value', () => {
            render(
                <KPICard
                    title="Revenue"
                    value="₹50,000"
                    icon={<Building2 />}
                />
            );

            expect(screen.getByText('₹50,000')).toBeInTheDocument();
        });

        it('should render with numeric value', () => {
            render(
                <KPICard
                    title="Count"
                    value={42}
                    icon={<Building2 />}
                />
            );

            expect(screen.getByText('42')).toBeInTheDocument();
        });
    });

    describe('Trend Indicator', () => {
        it('should render trend indicator when provided', () => {
            render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                    trend={{
                        value: 12,
                        direction: 'up',
                        label: 'vs last month',
                    }}
                />
            );

            expect(screen.getByText('↑ 12%')).toBeInTheDocument();
            expect(screen.getByText('vs last month')).toBeInTheDocument();
        });

        it('should render upward trend with green color', () => {
            const { container } = render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                    trend={{
                        value: 15,
                        direction: 'up',
                        label: 'increase',
                    }}
                />
            );

            const trendElement = screen.getByText('↑ 15%');
            expect(trendElement).toHaveClass('text-green-600');
        });

        it('should render downward trend with red color', () => {
            const { container } = render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                    trend={{
                        value: 8,
                        direction: 'down',
                        label: 'decrease',
                    }}
                />
            );

            const trendElement = screen.getByText('↓ 8%');
            expect(trendElement).toHaveClass('text-red-600');
        });

        it('should not render trend indicator when not provided', () => {
            render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                />
            );

            expect(screen.queryByText(/vs/)).not.toBeInTheDocument();
        });
    });

    describe('Styling and Layout', () => {
        it('should apply hover shadow transition', () => {
            const { container } = render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                />
            );

            const card = screen.getByTestId('kpi-card');
            expect(card).toHaveClass('hover:shadow-lg');
            expect(card).toHaveClass('transition-shadow');
            expect(card).toHaveClass('duration-base');
        });

        it('should apply custom background color', () => {
            const { container } = render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                    bgColor="bg-blue-50"
                />
            );

            const card = screen.getByTestId('kpi-card');
            expect(card).toHaveClass('bg-blue-50');
        });

        it('should apply default white background when not specified', () => {
            const { container } = render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                />
            );

            const card = screen.getByTestId('kpi-card');
            expect(card).toHaveClass('bg-white');
        });

        it('should apply custom icon color', () => {
            const { container } = render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                    iconColor="text-blue-600"
                />
            );

            const iconContainer = container.querySelector('.text-blue-600');
            expect(iconContainer).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        it('should have proper spacing using 8px grid system', () => {
            const { container } = render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                />
            );

            const card = screen.getByTestId('kpi-card');
            expect(card).toHaveClass('p-3'); // 24px = 3 × 8px
        });

        it('should render value with large font size', () => {
            render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                />
            );

            const value = screen.getByTestId('kpi-value');
            expect(value).toHaveClass('text-3xl'); // 2rem = 32px
            expect(value).toHaveClass('font-bold');
        });

        it('should render title with smaller font size', () => {
            render(
                <KPICard
                    title="Test Metric"
                    value={100}
                    icon={<Building2 />}
                />
            );

            const title = screen.getByText('Test Metric');
            expect(title).toHaveClass('text-sm'); // 0.875rem = 14px
            expect(title).toHaveClass('font-medium');
        });
    });
});
