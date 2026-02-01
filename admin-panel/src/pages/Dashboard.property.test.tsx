/**
 * Property-Based Tests for Institution Admin Dashboard
 * 
 * Feature: cms-ui-ux-enhancement
 * Property 8: Vendor card content completeness
 * Validates: Requirements 4.3
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { test, fc } from '@fast-check/vitest'
import Dashboard from './Dashboard'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { canteenService } from '../services/canteenService'
import { vi } from 'vitest'
import { UserRole } from '../types'

// Mock the services and stores
vi.mock('../store/authStore')
vi.mock('../services/canteenService')

// Arbitrary for generating vendor card data
const vendorCardArbitrary = fc.record({
    id: fc.uuid(),
    vendorId: fc.string({ minLength: 5, maxLength: 20 }),
    name: fc.string({ minLength: 3, maxLength: 50 }),
    location: fc.string({ minLength: 5, maxLength: 100 }),
    isActive: fc.boolean(),
    institutionId: fc.uuid(),
    operatingHours: fc.option(
        fc.record({
            open: fc.constantFrom('06:00', '07:00', '08:00', '09:00'),
            close: fc.constantFrom('18:00', '19:00', '20:00', '21:00', '22:00')
        }),
        { nil: undefined }
    ),
    createdAt: fc.date().map(d => d.toISOString())
})

describe('Dashboard Property Tests', () => {
    describe('Property 8: Vendor card content completeness', () => {
        test.prop([fc.array(vendorCardArbitrary, { minLength: 1, maxLength: 10 })])(
            'For any vendor card displayed, it should contain Vendor ID, Canteen Name, Approval State, and a Primary Action Button',
            async (canteens) => {
                // Setup mocks
                const mockUser = {
                    id: 'test-user-id',
                    email: 'admin@test.com',
                    name: 'Test Admin',
                    role: UserRole.INSTITUTION_ADMIN,
                    institutionId: 'test-institution-id',
                    createdAt: new Date().toISOString()
                }

                vi.mocked(useAuthStore).mockReturnValue({
                    user: mockUser,
                    isAuthenticated: true,
                    isMainAdmin: () => false,
                    isInstitutionAdmin: () => true,
                    login: vi.fn(),
                    logout: vi.fn(),
                    setUser: vi.fn()
                } as any)

                vi.mocked(canteenService.getCanteensByInstitution).mockResolvedValue(canteens as any)

                // Render the dashboard
                const { container } = render(
                    <BrowserRouter>
                        <Dashboard />
                    </BrowserRouter>
                )

                // Wait for data to load
                await screen.findByText('Dashboard')

                // Find all vendor cards
                const vendorCards = container.querySelectorAll('[data-testid="vendor-card"]')

                // Verify we have the expected number of vendor cards
                expect(vendorCards.length).toBeGreaterThan(0)

                // For each vendor card, verify it contains all required elements
                vendorCards.forEach((card, index) => {
                    const canteen = canteens[index % canteens.length]

                    // 1. Vendor ID must be present
                    const vendorIdElement = card.querySelector('[data-testid="vendor-id"]')
                    expect(vendorIdElement).toBeTruthy()
                    expect(vendorIdElement?.textContent).toBe(canteen.vendorId)

                    // 2. Canteen Name must be present
                    const canteenNameElement = card.querySelector('[data-testid="canteen-name"]')
                    expect(canteenNameElement).toBeTruthy()
                    expect(canteenNameElement?.textContent).toBe(canteen.name)

                    // 3. Approval State (Status Chip) must be present
                    const approvalStateElement = card.querySelector('[data-testid="status-chip"]')
                    expect(approvalStateElement).toBeTruthy()

                    // 4. Primary Action Button must be present
                    const actionButton = card.querySelector(
                        '[data-testid="approve-button"], [data-testid="deactivate-button"], [data-testid="activate-button"]'
                    )
                    expect(actionButton).toBeTruthy()

                    // Verify the button is properly sized for touch targets (min 44px)
                    const buttonElement = actionButton as HTMLElement
                    const styles = window.getComputedStyle(buttonElement)
                    const minHeight = parseInt(styles.minHeight)
                    expect(minHeight).toBeGreaterThanOrEqual(44)
                })
            },
            { numRuns: 100 }
        )

        test.prop([vendorCardArbitrary])(
            'Each vendor card should have exactly one primary action button based on approval state',
            async (canteen) => {
                // Setup mocks
                const mockUser = {
                    id: 'test-user-id',
                    email: 'admin@test.com',
                    name: 'Test Admin',
                    role: UserRole.INSTITUTION_ADMIN,
                    institutionId: 'test-institution-id',
                    createdAt: new Date().toISOString()
                }

                vi.mocked(useAuthStore).mockReturnValue({
                    user: mockUser,
                    isAuthenticated: true,
                    isMainAdmin: () => false,
                    isInstitutionAdmin: () => true,
                    login: vi.fn(),
                    logout: vi.fn(),
                    setUser: vi.fn()
                } as any)

                vi.mocked(canteenService.getCanteensByInstitution).mockResolvedValue([canteen] as any)

                // Render the dashboard
                const { container } = render(
                    <BrowserRouter>
                        <Dashboard />
                    </BrowserRouter>
                )

                // Wait for data to load
                await screen.findByText('Dashboard')

                // Find the vendor card
                const vendorCard = container.querySelector('[data-testid="vendor-card"]')
                expect(vendorCard).toBeTruthy()

                // Count action buttons
                const approveButton = vendorCard?.querySelector('[data-testid="approve-button"]')
                const deactivateButton = vendorCard?.querySelector('[data-testid="deactivate-button"]')
                const activateButton = vendorCard?.querySelector('[data-testid="activate-button"]')

                const buttonCount = [approveButton, deactivateButton, activateButton].filter(Boolean).length

                // Should have exactly one action button
                expect(buttonCount).toBe(1)

                // Verify correct button based on state
                if (canteen.isActive) {
                    expect(deactivateButton).toBeTruthy()
                } else {
                    expect(activateButton).toBeTruthy()
                }
            },
            { numRuns: 100 }
        )
    })
})
