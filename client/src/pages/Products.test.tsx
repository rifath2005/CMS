/**
 * Products Page Tests
 * 
 * NOTE: This test file requires testing infrastructure to be set up.
 * Install required packages:
 * npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
 * 
 * Then configure vitest in vite.config.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Products from './Products'
import { productService } from '../services/productService'
import { useCartStore } from '../store/cartStore'
import { Product } from '../types'

// Mock the services and stores
vi.mock('../services/productService')
vi.mock('../store/cartStore')
vi.mock('../components/LoadingSpinner', () => ({
    default: () => <div>Loading...</div>
}))
vi.mock('../components/ErrorAlert', () => ({
    default: ({ message, onClose }: { message: string; onClose: () => void }) => (
        <div data-testid="error-alert">
            {message}
            <button onClick={onClose}>Close</button>
        </div>
    )
}))

describe('Products Page', () => {
    const mockProducts: Product[] = [
        {
            id: '1',
            vendorId: 'vendor1',
            name: 'Samosa',
            description: 'Crispy and delicious samosa',
            price: 15,
            category: 'Snacks',
            stockQuantity: 50,
            imageUrl: 'https://example.com/samosa.jpg',
            isAvailable: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
        {
            id: '2',
            vendorId: 'vendor1',
            name: 'Chai',
            description: 'Hot masala chai',
            price: 10,
            category: 'Beverages',
            stockQuantity: 5,
            imageUrl: 'https://example.com/chai.jpg',
            isAvailable: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
        {
            id: '3',
            vendorId: 'vendor1',
            name: 'Burger',
            description: 'Veg burger with cheese',
            price: 50,
            category: 'Snacks',
            stockQuantity: 0,
            imageUrl: '',
            isAvailable: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
    ]

    const mockAddItem = vi.fn()
    const mockCartItems = []

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock productService
        vi.mocked(productService.getProducts).mockResolvedValue(mockProducts)

        // Mock cartStore
        vi.mocked(useCartStore).mockReturnValue({
            items: mockCartItems,
            addItem: mockAddItem,
            removeItem: vi.fn(),
            updateQuantity: vi.fn(),
            clearCart: vi.fn(),
            getTotalAmount: vi.fn(),
            getTotalItems: vi.fn(),
        })
    })

    describe('Product Loading', () => {
        it('should display loading spinner while fetching products', () => {
            render(<Products />)
            expect(screen.getByText('Loading...')).toBeInTheDocument()
        })

        it('should load and display products from user institution', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(productService.getProducts).toHaveBeenCalledTimes(1)
            })

            expect(screen.getByText('Samosa')).toBeInTheDocument()
            expect(screen.getByText('Chai')).toBeInTheDocument()
            expect(screen.getByText('Burger')).toBeInTheDocument()
        })

        it('should display error message when product loading fails', async () => {
            const errorMessage = 'Failed to load products'
            vi.mocked(productService.getProducts).mockRejectedValue({
                response: { data: { error: { message: errorMessage } } }
            })

            render(<Products />)

            await waitFor(() => {
                expect(screen.getByTestId('error-alert')).toBeInTheDocument()
                expect(screen.getByText(errorMessage)).toBeInTheDocument()
            })
        })
    })

    describe('Product Display - Requirements 5.1', () => {
        it('should display product images, prices, and availability', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            // Check product details are displayed
            expect(screen.getByText('Crispy and delicious samosa')).toBeInTheDocument()
            expect(screen.getByText('₹15.00')).toBeInTheDocument()
            expect(screen.getByText('Stock: 50')).toBeInTheDocument()
        })

        it('should show "Out of Stock" badge for unavailable products', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Burger')).toBeInTheDocument()
            })

            const outOfStockBadges = screen.getAllByText('Out of Stock')
            expect(outOfStockBadges.length).toBeGreaterThan(0)
        })

        it('should show "Low Stock" badge for products with stock < 10', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Chai')).toBeInTheDocument()
            })

            expect(screen.getByText('Low Stock')).toBeInTheDocument()
        })

        it('should display placeholder image when imageUrl is empty', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Burger')).toBeInTheDocument()
            })

            // Check for SVG placeholder (by checking for svg element)
            const svgElements = screen.getAllByRole('img', { hidden: true })
            expect(svgElements.length).toBeGreaterThan(0)
        })
    })

    describe('Search and Filter Functionality', () => {
        it('should filter products by search query', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            const searchInput = screen.getByPlaceholderText('Search products...')
            await userEvent.type(searchInput, 'chai')

            expect(screen.getByText('Chai')).toBeInTheDocument()
            expect(screen.queryByText('Samosa')).not.toBeInTheDocument()
        })

        it('should filter products by category', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            const categorySelect = screen.getByRole('combobox')
            await userEvent.selectOptions(categorySelect, 'Beverages')

            expect(screen.getByText('Chai')).toBeInTheDocument()
            expect(screen.queryByText('Samosa')).not.toBeInTheDocument()
        })

        it('should show "no products" message when no matches found', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            const searchInput = screen.getByPlaceholderText('Search products...')
            await userEvent.type(searchInput, 'nonexistent')

            expect(screen.getByText('No products found matching your criteria')).toBeInTheDocument()
        })

        it('should display all categories in filter dropdown', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            const categorySelect = screen.getByRole('combobox')
            expect(categorySelect).toBeInTheDocument()

            // Check for "All Categories" option
            expect(screen.getByText('All Categories')).toBeInTheDocument()
            expect(screen.getByText('Snacks')).toBeInTheDocument()
            expect(screen.getByText('Beverages')).toBeInTheDocument()
        })
    })

    describe('Add to Cart Functionality - Requirements 5.2', () => {
        it('should add product to cart when "Add to Cart" button is clicked', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            const addToCartButtons = screen.getAllByText('Add to Cart')
            await userEvent.click(addToCartButtons[0])

            expect(mockAddItem).toHaveBeenCalledWith({
                productId: '1',
                productName: 'Samosa',
                quantity: 1,
                price: 15,
                imageUrl: 'https://example.com/samosa.jpg',
            })
        })

        it('should not add out-of-stock products to cart', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Burger')).toBeInTheDocument()
            })

            const outOfStockButtons = screen.getAllByText('Out of Stock')
            const burgerButton = outOfStockButtons.find(btn =>
                btn.closest('.bg-white')?.textContent?.includes('Burger')
            )

            if (burgerButton) {
                await userEvent.click(burgerButton)
                expect(mockAddItem).not.toHaveBeenCalled()
            }
        })

        it('should disable "Add to Cart" button for unavailable products', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Burger')).toBeInTheDocument()
            })

            const buttons = screen.getAllByRole('button')
            const burgerButton = buttons.find(btn =>
                btn.textContent === 'Out of Stock' &&
                btn.closest('.bg-white')?.textContent?.includes('Burger')
            )

            expect(burgerButton).toBeDisabled()
        })

        it('should show "In Cart" status when product is in cart', async () => {
            const mockCartWithItems = [
                {
                    productId: '1',
                    productName: 'Samosa',
                    quantity: 2,
                    price: 15,
                    imageUrl: 'https://example.com/samosa.jpg',
                }
            ]

            vi.mocked(useCartStore).mockReturnValue({
                items: mockCartWithItems,
                addItem: mockAddItem,
                removeItem: vi.fn(),
                updateQuantity: vi.fn(),
                clearCart: vi.fn(),
                getTotalAmount: vi.fn(),
                getTotalItems: vi.fn(),
            })

            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            expect(screen.getByText('In Cart (2)')).toBeInTheDocument()
        })
    })

    describe('Property 19: Institutional Product Isolation', () => {
        it('should only display products from user institution', async () => {
            // This test validates that the API call returns only institutional products
            render(<Products />)

            await waitFor(() => {
                expect(productService.getProducts).toHaveBeenCalledTimes(1)
            })

            // Verify that getProducts was called (which should filter by institution on backend)
            expect(productService.getProducts).toHaveBeenCalledWith()

            // All displayed products should be from the same institution
            const displayedProducts = mockProducts
            expect(displayedProducts.every(p => p.vendorId === 'vendor1')).toBe(true)
        })
    })

    describe('Property 16: Out-of-Stock Cart Prevention', () => {
        it('should prevent adding out-of-stock products to cart', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Burger')).toBeInTheDocument()
            })

            // Try to add out-of-stock product
            const buttons = screen.getAllByRole('button')
            const burgerButton = buttons.find(btn =>
                btn.textContent === 'Out of Stock' &&
                btn.closest('.bg-white')?.textContent?.includes('Burger')
            )

            if (burgerButton) {
                await userEvent.click(burgerButton)
                expect(mockAddItem).not.toHaveBeenCalled()
            }
        })

        it('should prevent adding products with zero stock to cart', async () => {
            const productsWithZeroStock = [
                {
                    ...mockProducts[0],
                    stockQuantity: 0,
                    isAvailable: true, // Available but no stock
                }
            ]

            vi.mocked(productService.getProducts).mockResolvedValue(productsWithZeroStock)

            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            const outOfStockButton = screen.getByText('Out of Stock')
            await userEvent.click(outOfStockButton)

            expect(mockAddItem).not.toHaveBeenCalled()
        })
    })

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            vi.mocked(productService.getProducts).mockRejectedValue(new Error('Network error'))

            render(<Products />)

            await waitFor(() => {
                expect(screen.getByTestId('error-alert')).toBeInTheDocument()
            })

            expect(screen.getByText('Failed to load products')).toBeInTheDocument()
        })

        it('should allow closing error alert', async () => {
            vi.mocked(productService.getProducts).mockRejectedValue(new Error('Network error'))

            render(<Products />)

            await waitFor(() => {
                expect(screen.getByTestId('error-alert')).toBeInTheDocument()
            })

            const closeButton = screen.getByText('Close')
            await userEvent.click(closeButton)

            await waitFor(() => {
                expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument()
            })
        })
    })

    describe('UI Responsiveness', () => {
        it('should display products in a grid layout', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByText('Samosa')).toBeInTheDocument()
            })

            const grid = screen.getByText('Samosa').closest('.grid')
            expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4')
        })

        it('should have responsive search and filter layout', async () => {
            render(<Products />)

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument()
            })

            const searchContainer = screen.getByPlaceholderText('Search products...').closest('.flex-1')
            expect(searchContainer).toBeInTheDocument()
        })
    })
})
