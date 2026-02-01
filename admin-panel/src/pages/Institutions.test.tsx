import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Institutions from './Institutions';
import { institutionService } from '../services/institutionService';

// Mock the institution service
vi.mock('../services/institutionService', () => ({
    institutionService: {
        getAllInstitutions: vi.fn(),
        createInstitution: vi.fn(),
        assignInstitutionAdmin: vi.fn(),
    },
}));

const mockInstitutions = [
    {
        id: '1',
        name: 'Test University',
        emailDomain: 'test.edu',
        contactEmail: 'contact@test.edu',
        contactPhone: '+1234567890',
        createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
        id: '2',
        name: 'Another University',
        emailDomain: 'another.edu',
        contactEmail: 'contact@another.edu',
        contactPhone: '+0987654321',
        createdAt: '2024-01-02T00:00:00.000Z',
    },
];

describe('Institutions - Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Test sticky header behavior during scroll
     * Validates: Requirements 3.1
     */
    it('should render table with sticky header', async () => {
        vi.mocked(institutionService.getAllInstitutions).mockResolvedValue(mockInstitutions);

        render(
            <BrowserRouter>
                <Institutions />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('data-table')).toBeInTheDocument();
        });

        const tableHeader = screen.getByTestId('table-header');
        expect(tableHeader).toBeInTheDocument();

        // Check that sticky header class is applied
        expect(tableHeader).toHaveClass('sticky');
        expect(tableHeader).toHaveClass('top-0');
        expect(tableHeader).toHaveClass('z-10');
    });

    /**
     * Test status chip color mapping
     * Validates: Requirements 3.3
     */
    it('should display status chips with correct color mapping', async () => {
        vi.mocked(institutionService.getAllInstitutions).mockResolvedValue(mockInstitutions);

        render(
            <BrowserRouter>
                <Institutions />
            </BrowserRouter>
        );

        await waitFor(() => {
            const statusChips = screen.getAllByTestId('status-chip');
            expect(statusChips.length).toBeGreaterThan(0);
        });

        const statusChips = screen.getAllByTestId('status-chip');

        // All institutions should show 'active' status
        statusChips.forEach((chip) => {
            expect(chip).toHaveAttribute('data-status', 'active');
            // Check for green color classes (active status)
            expect(chip).toHaveClass('bg-green-100');
            expect(chip).toHaveClass('text-green-800');
            expect(chip).toHaveClass('border-green-300');
        });
    });

    /**
     * Test hover action reveal
     * Validates: Requirements 3.4
     */
    it('should render action buttons in table rows', async () => {
        vi.mocked(institutionService.getAllInstitutions).mockResolvedValue(mockInstitutions);

        render(
            <BrowserRouter>
                <Institutions />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('data-table')).toBeInTheDocument();
        });

        // Check that action buttons are present
        const editButtons = screen.getAllByLabelText('Edit institution');
        const assignButtons = screen.getAllByLabelText('Assign admin');
        const deactivateButtons = screen.getAllByLabelText('Deactivate institution');

        expect(editButtons).toHaveLength(mockInstitutions.length);
        expect(assignButtons).toHaveLength(mockInstitutions.length);
        expect(deactivateButtons).toHaveLength(mockInstitutions.length);

        // Check that buttons have proper touch target sizes (44px minimum)
        editButtons.forEach((button) => {
            expect(button).toHaveClass('min-h-[44px]');
            expect(button).toHaveClass('min-w-[44px]');
        });

        assignButtons.forEach((button) => {
            expect(button).toHaveClass('min-h-[44px]');
            expect(button).toHaveClass('min-w-[44px]');
        });

        deactivateButtons.forEach((button) => {
            expect(button).toHaveClass('min-h-[44px]');
            expect(button).toHaveClass('min-w-[44px]');
        });
    });

    /**
     * Test table row rendering
     * Validates: Requirements 3.1, 3.2
     */
    it('should render all institution data in table rows', async () => {
        vi.mocked(institutionService.getAllInstitutions).mockResolvedValue(mockInstitutions);

        render(
            <BrowserRouter>
                <Institutions />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test University')).toBeInTheDocument();
        });

        // Check that all institutions are rendered
        expect(screen.getByText('Test University')).toBeInTheDocument();
        expect(screen.getByText('test.edu')).toBeInTheDocument();
        expect(screen.getByText('Another University')).toBeInTheDocument();
        expect(screen.getByText('another.edu')).toBeInTheDocument();

        // Check that table has correct number of rows
        const tableRows = screen.getAllByTestId('table-row');
        expect(tableRows).toHaveLength(mockInstitutions.length);
    });

    /**
     * Test table columns
     * Validates: Requirements 3.2
     */
    it('should display correct table columns', async () => {
        vi.mocked(institutionService.getAllInstitutions).mockResolvedValue(mockInstitutions);

        render(
            <BrowserRouter>
                <Institutions />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('data-table')).toBeInTheDocument();
        });

        // Check that all required columns are present
        expect(screen.getByText('INSTITUTION NAME')).toBeInTheDocument();
        expect(screen.getByText('DOMAIN')).toBeInTheDocument();
        expect(screen.getByText('STATUS')).toBeInTheDocument();
        expect(screen.getByText('CREATED DATE')).toBeInTheDocument();
        expect(screen.getByText('ACTIONS')).toBeInTheDocument();
    });

    /**
     * Test hover transition classes
     * Validates: Requirements 3.4
     */
    it('should apply transition classes to table rows for hover effects', async () => {
        vi.mocked(institutionService.getAllInstitutions).mockResolvedValue(mockInstitutions);

        render(
            <BrowserRouter>
                <Institutions />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId('data-table')).toBeInTheDocument();
        });

        const tableRows = screen.getAllByTestId('table-row');

        // Check that rows have transition classes for smooth hover effects
        tableRows.forEach((row) => {
            expect(row).toHaveClass('transition-colors');
            expect(row).toHaveClass('duration-fast');
        });
    });
});
