# Canteen Management System - Client

Modern React frontend for the Canteen Management System with real-time updates via WebSocket.

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

## Features

- 🔐 Authentication (Login/Register)
- 🛍️ Product browsing and cart management
- 💳 UPI payment integration
- 📱 Digital bill with QR code and 15-minute timer
- 📊 Order history and filtering
- 👤 User profile management
- 🔄 Real-time updates via WebSocket
- 📱 Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
cd client
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

The app will be available at `http://localhost:3001`

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
client/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/         # React contexts
│   │   └── WebSocketContext.tsx
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── DigitalBill.tsx
│   │   ├── OrderHistory.tsx
│   │   └── Profile.tsx
│   ├── services/         # API service layer
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   ├── paymentService.ts
│   │   └── userService.ts
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts
│   │   └── cartStore.ts
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

## State Management

### Auth Store (Zustand)
- User authentication state
- JWT token management
- Persisted to localStorage

### Cart Store (Zustand)
- Shopping cart items
- Add/remove/update quantities
- Calculate totals
- Persisted to localStorage

### WebSocket Context
- Real-time connection management
- Order status updates
- Bill timer updates
- Stock change notifications
- Bill expiration alerts

## API Integration

All API calls go through the `api.ts` service which:
- Adds authentication headers automatically
- Handles 401 errors (logout and redirect)
- Provides consistent error handling

## WebSocket Events

### Received Events:
- `connected` - Connection confirmation
- `order:status-update` - Order status changes
- `bill:timer-update` - Timer countdown updates
- `product:stock-update` - Product stock changes
- `bill:expired` - Bill expiration notification

## Styling

Uses Tailwind CSS with custom utility classes:
- `.btn` - Base button styles
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary button
- `.btn-danger` - Danger/delete button
- `.input` - Form input styles
- `.card` - Card container styles

## Development Guidelines

1. **Component Structure**: Keep components small and focused
2. **Type Safety**: Use TypeScript types for all props and state
3. **Error Handling**: Always handle API errors gracefully
4. **Loading States**: Show loading indicators for async operations
5. **Responsive Design**: Test on mobile and desktop viewports
6. **Accessibility**: Use semantic HTML and ARIA labels

## Next Steps

Implement the following pages in order:
1. Task 19.2: Authentication pages (Login/Register)
2. Task 19.3: Product browsing page
3. Task 19.4: Shopping cart page
4. Task 19.5: Payment integration
5. Task 19.6: Digital bill display
6. Task 19.7: Order history page
7. Task 19.8: User dashboard
8. Task 19.9: Profile management

## License

MIT
