import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PlatformStatsPage from './PlatformStats';
import { institutionService } from '../services/institutionService';

// Mock the institution service
vi.mock('../services/institutionService', () => ({
    institutionService: {
        getPlatformStats: vi.fn(),
    },
}));

describe('PlatformStatsPage', () => {
    const mockStats = {
        totalInstitutions: 10,
        totalUsers: 500,
        totalCanteens: 25,
        totalOrders: 1200,
        totalRevenue: 50000,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('KPI Card Rendering', () => {
        it('should render all four KPI cards with correct data', async () => {
            vi.mocked(institutionService.getPlatformStats).mockResolvedValue(mockStats);

            render(<PlatformStatsPage />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            // Check that all four KPI cards are rendered
            expect(screen.getByText('Total Institutions')).toBeInTheDocument();
            expect(screen.getByText('Active Institutions')).toBeInTheDocument();
            expect(screen.getByText('Active Vendors')).toBeInTheDocument();
            expect(screen.getByText('Total Orders Today')).toBeInTheDocument();

            // Verify the values are displayed correctly
            const kpiValues = screen.getAllByTestId('kpi-value');
            expect(kpiValues).toHaveLength(4);
            expect(kpiValues[0]).toHaveTextContent('10'); // Total Institutions
            expect(kpiValues[1]).toHaveTextContent('10'); // Active Institutions
            expect(kpiValues[2]).toHaveTextContent('25'); // Active Vendors (totalCanteens)
            expect(kpiValues[3]).toHaveTextContent('1200'); // Total Orders Today
        });

        it('should render KPI cards with trend indicators', async () => {
            vi.mocked(institutionService.getPlatformStats).mockResolvedValue(mockStats);

            render(<PlatformStatsPage />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            // Check for trend indicators
            expect(screen.getByText('vs last month')).toBeInTheDocument();
            expect(screen.getByText('vs yesterday')).toBeInTheDocument();
        });
    });

    describe('Responsive Grid Layout', () => {
        it('should render KPI cards in a responsive grid', async () => {
            vi.mocked(institutionService.getPlatformStats).mockResolvedValue(mockStats);

            const { container } = render(<PlatformStatsPage />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            // Find the grid container
            const gridContainer = container.querySelector('.grid');
            expect(gridContainer).toBeInTheDocument();

            // Check for responsive grid classes
            expect(gridContainer).toHaveClass('grid-cols-1');
            expect(gridContainer).toHaveClass('sm:grid-cols-2');
            expect(gridContainer).toHaveClass('lg:grid-cols-4');
        });

        it('should render all KPI cards within the grid', async () => {
            vi.mocked(institutionService.getPlatformStats).mockResolvedValue(mockStats);

            render(<PlatformStatsPage />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            // Verify all KPI cards are rendered
            const kpiCards = screen.getAllByTestId('kpi-card');
            expect(kpiCards).toHaveLength(4);
        });
    });

    describe('Loading and Error States', () => {
        it('should display loading spinner while fetching data', () => {
            vi.mocked(institutionService.getPlatformStats).mockImplementation(
                () => new Promise(() => { }) // Never resolves
            );

            render(<PlatformStatsPage />);

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('should display error message when API call fails', async () => {
            const errorMessage = 'Failed to load platform statistics';
            vi.mocked(institutionService.getPlatformStats).mockRejectedValue({
                response: { data: { message: errorMessage } },
            });

            render(<PlatformStatsPage />);

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });
        });
    });

    describe('Dashboard Layout Optimization', () => {
        it('should limit dashboard height to maximum 2 viewport heights', async () => {
            vi.mocked(institutionService.getPlatformStats).mockResolvedValue(mockStats);

            const { container } = render(<PlatformStatsPage />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            // Check for max-height constraint
            const mainContainer = container.querySelector('.max-h-\\[200vh\\]');
            expect(mainContainer).toBeInTheDocument();
        });

        it('should render platform overview section', async () => {
            vi.mocked(institutionService.getPlatformStats).mockResolvedValue(mockStats);

            render(<PlatformStatsPage />);

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            });

            expect(screen.getByText('Platform Overview')).toBeInTheDocument();
            expect(
                screen.getByText(/The platform is currently serving/i)
            ).toBeInTheDocument();
        });
    });
});
