# Canteen Management System - Vendor Panel

Modern React frontend for vendors to manage their canteen operations with real-time updates via WebSocket.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Socket.io Client** - Real-time WebSocket communication
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Charts and data visualization

## Features

- 🔐 Vendor authentication
- 📦 Product management (CRUD operations)
- 📋 Active orders view with real-time updates
- 🍔 Combined item list for bulk preparation
- 📱 QR code scanner for delivery verification
- 📊 Analytics dashboard with sales reports
- 🔄 Real-time updates via WebSocket
- 📱 Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:3000`
- Camera access for QR code scanning

### Installation

1. Install dependencies:
```bash
cd vendor-panel
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3002`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
vendor-panel/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorAlert.tsx
│   │   ├── ProductForm.tsx
│   │   └── Scanner.tsx
│   ├── contexts/         # React contexts
│   │   └── WebSocketContext.tsx
│   ├── pages/            # Page components
│   │   ├── VendorLogin.tsx
│   │   ├── ActiveOrders.tsx
│   │   ├── CombinedItems.tsx
│   │   ├── Products.tsx
│   │   ├── QRScanner.tsx
│   │   └── Analytics.tsx
│   ├── services/         # API service layer
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   └── analyticsService.ts
│   ├── store/            # Zustand stores
│   │   └── authStore.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Features Overview

### 1. Vendor Authentication
- Secure login for vendors only
- Role-based access control
- Session persistence

### 2. Product Management
- Add, edit, and delete products
- Upload product images
- Manage stock quantities
- Set product availability
- Category organization

### 3. Active Orders
- Real-time order notifications
- View all active orders
- Order details with customer info
- Timer showing bill expiration
- Automatic updates via WebSocket

### 4. Combined Item List
- Aggregated view of all items across orders
- Bulk preparation optimization
- Real-time quantity updates
- Visual summary cards

### 5. QR Code Scanner
- Camera-based QR scanning
- Manual code entry option
- Delivery verification
- Bill validation
- Automatic order status updates

### 6. Analytics Dashboard
- Sales reports (daily/weekly/monthly)
- Revenue metrics
- Top-selling products
- Order volume trends
- CSV export functionality

## State Management

### Auth Store (Zustand)
- Vendor authentication state
- JWT token management
- Persisted to localStorage

### WebSocket Context
- Real-time connection management
- New order notifications
- Order status updates
- Stock change notifications

## API Integration

All API calls go through the `api.ts` service which:
- Adds authentication headers automatically
- Handles 401 errors (logout and redirect)
- Provides consistent error handling

## WebSocket Events

### Received Events:
- `connected` - Connection confirmation
- `newOrder` - New order notification
- `orderStatusUpdate` - Order status changes
- `productStockUpdate` - Product stock changes

## QR Code Scanning

The QR scanner uses the device camera to scan customer bills:
- Requests camera permission
- Real-time scanning
- Manual entry fallback
- Validates bill expiration
- Confirms delivery automatically

## Analytics

The analytics dashboard provides:
- Real-time statistics
- Period-based reports (daily/weekly/monthly)
- Top products ranking
- Revenue tracking
- CSV export for external analysis

## Development Guidelines

1. **Component Structure**: Keep components small and focused
2. **Type Safety**: Use TypeScript types for all props and state
3. **Error Handling**: Always handle API errors gracefully
4. **Loading States**: Show loading indicators for async operations
5. **Responsive Design**: Test on mobile and desktop viewports
6. **Accessibility**: Use semantic HTML and ARIA labels

## Security

- JWT-based authentication
- Role verification (vendors only)
- Secure API communication
- Camera permission handling
- Session management

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers with camera support

## License

MIT
