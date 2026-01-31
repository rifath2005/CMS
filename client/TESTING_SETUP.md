# Testing Setup Guide for Canteen Client

## Overview

This guide explains how to set up and run tests for the Canteen Management System client application.

## Prerequisites

The client uses:
- **Vitest** - Fast unit test framework for Vite projects
- **React Testing Library** - For testing React components
- **jsdom** - For DOM simulation in tests

## Installation

Install the required testing dependencies:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

## Configuration

### 1. Update `vite.config.ts`

Add the test configuration to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
```

### 2. Create Test Setup File

Create `src/test/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

### 3. Update `package.json`

Add test scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 4. Update `tsconfig.json`

Ensure your `tsconfig.json` includes test files:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test Products.test.tsx
```

## Test Structure

### Products Page Tests

The `Products.test.tsx` file includes comprehensive tests for:

1. **Product Loading**
   - Loading spinner display
   - Successful product fetching
   - Error handling

2. **Product Display (Requirements 5.1)**
   - Product images, prices, and availability
   - Out of stock badges
   - Low stock warnings
   - Placeholder images

3. **Search and Filter**
   - Search by product name/description
   - Filter by category
   - Empty state handling

4. **Add to Cart (Requirements 5.2)**
   - Adding products to cart
   - Preventing out-of-stock additions
   - Cart status display

5. **Property-Based Tests**
   - **Property 19**: Institutional Product Isolation
   - **Property 16**: Out-of-Stock Cart Prevention

## Writing New Tests

### Example Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Component Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks()
  })

  it('should do something', async () => {
    render(<YourComponent />)
    
    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
    
    // Simulate user interactions
    await userEvent.click(screen.getByRole('button'))
    
    // Assert expectations
    expect(mockFunction).toHaveBeenCalled()
  })
})
```

## Mocking

### Mocking Services

```typescript
vi.mock('../services/productService', () => ({
  productService: {
    getProducts: vi.fn(),
    getProductById: vi.fn(),
  }
}))
```

### Mocking Zustand Stores

```typescript
vi.mock('../store/cartStore', () => ({
  useCartStore: vi.fn(() => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
  }))
}))
```

## Coverage Goals

According to the design document:

- **Critical paths** (Order, Payment, Bill): 95%+
- **Authentication Service**: 90%+
- **Other services**: 85%+

## Continuous Integration

Tests should run:
- On every commit (unit tests)
- On every pull request (all tests)
- Before deployment (integration tests)

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure all dependencies are installed
   - Check import paths are correct

2. **Timeout errors**
   - Increase timeout in test: `it('test', async () => {...}, 10000)`
   - Check for unresolved promises

3. **Mock not working**
   - Ensure mock is defined before component import
   - Use `vi.clearAllMocks()` in `beforeEach`

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Next Steps

After setting up testing:

1. Run `npm test` to execute all tests
2. Review test coverage with `npm run test:coverage`
3. Add tests for new components as you build them
4. Ensure all tests pass before committing code
