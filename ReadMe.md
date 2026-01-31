# Canteen Management System

A campus-scale digital platform for canteen operations with time-bound digital billing, QR code-based delivery verification, and real-time order management.

## Features

- 🔐 **Multi-role Authentication** - Support for Users, Vendors, Institution Admins, and Main Admin
- 🏪 **Multi-vendor Support** - Multiple canteens per institution
- 🛒 **Shopping Cart** - Add items from different vendors
- 💳 **UPI Payment Integration** - Secure payment processing
- ⏱️ **Time-bound Digital Bills** - 15-minute validity with countdown timer
- 📱 **QR Code Delivery Verification** - Vendor scans user's QR code to confirm delivery
- 🔔 **Real-time Updates** - WebSocket-based notifications
- 📊 **Analytics Dashboard** - Sales reports and order tracking
- 📦 **Inventory Management** - Stock tracking with low-stock alerts

## Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL (Primary Database)
- Redis (Caching & Sessions)
- Socket.io (Real-time Communication)
- JWT (Authentication)

**Frontend:**
- React + TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Zustand (State Management)
- Axios (API Client)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher) - Optional for caching
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd CMS
```

### 2. Install dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Database Configuration
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SSL=true

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Session Configuration
SESSION_SECRET=your_session_secret_here
SESSION_TIMEOUT=86400

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Bill Configuration
BILL_VALIDITY_MINUTES=15

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

Create a `client/.env` file:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

### 4. Initialize the database

```bash
# Reset database and create tables
npm run db:reset

# Create test users
npm run create-users
```

## Running the Application

### Development Mode

```bash
# Start backend server (runs on port 3000)
npm run dev

# In a new terminal, start frontend (runs on port 3001)
cd client
npm run dev
```

### Production Mode

```bash
# Build backend
npm run build

# Build frontend
cd client
npm run build

# Start backend
npm start
```

## Test Credentials

After running `npm run create-users`, use these credentials:

### Regular User (Student)
- **Email:** student1@test.edu
- **Password:** password123
- **Role:** USER

### Vendor (Canteen Owner)
- **Email:** vendor1@test.edu
- **Password:** password123
- **Role:** VENDOR

### Institution Admin
- **Email:** admin@test.edu
- **Password:** password123
- **Role:** INSTITUTION_ADMIN

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Products
- `GET /api/v1/products` - Get all products
- `POST /api/v1/products` - Create product (Vendor only)
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Cart
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/:id` - Update cart item
- `DELETE /api/v1/cart/items/:id` - Remove from cart

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user's orders
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id/status` - Update order status

### Payments
- `POST /api/v1/payments/initiate` - Initiate payment
- `POST /api/v1/payments/verify` - Verify payment
- `GET /api/v1/payments/:id` - Get payment details

## Project Structure

```
CMS/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── store/         # State management
│   └── package.json
├── src/                   # Backend source code
│   ├── config/           # Configuration files
│   ├── database/         # Database schema and migrations
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── websocket/        # WebSocket server
│   └── index.ts          # Application entry point
├── scripts/              # Utility scripts
├── .env                  # Environment variables
└── package.json
```

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:reset` - Reset database and recreate tables
- `npm run create-users` - Create test users
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Key Features Explained

### Time-bound Digital Bills
- Bills are valid for 15 minutes after generation
- Real-time countdown timer displayed to users
- Automatic expiration after timeout

### QR Code Delivery Verification
- Each order generates a unique QR code
- Vendor scans the QR code on user's device
- Prevents fraudulent delivery claims
- Single-use QR codes (cannot be scanned twice)

### Real-time Updates
- WebSocket connection for live order status updates
- Instant notifications for vendors on new orders
- Live stock updates across all clients

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- For cloud databases (Render, etc.), ensure `DB_SSL=true`

### Redis Connection Issues
- Redis is optional - the app will work without it
- Rate limiting will be disabled if Redis is unavailable
- Check Redis credentials and TLS settings

### Port Already in Use
```bash
# Kill process on port 3000 (backend)
npx kill-port 3000

# Kill process on port 3001 (frontend)
npx kill-port 3001
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
