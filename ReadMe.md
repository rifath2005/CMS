# Canteen Management System

A campus-scale digital platform designed to streamline canteen operations, reduce wait times, manage crowds, and ensure payment authenticity through a time-bound digital billing workflow.

## Features

- **Role-Based Access Control**: Main Admin, Institution Admin, Vendor, and User roles
- **Institutional Email Authentication**: Secure registration with institutional email validation
- **Prepaid UPI Orders**: Payment verification before order creation
- **Time-Bound Digital Bills**: 15-minute validity window with countdown timer
- **QR Code Delivery Verification**: Vendors scan user's QR code to confirm delivery
- **Real-Time Synchronization**: WebSocket-based updates across all interfaces
- **Combined Item List**: Aggregated view for efficient vendor preparation
- **Order History & Analytics**: Comprehensive tracking and reporting

## Technology Stack

- **Backend**: Node.js, TypeScript, Express
- **Database**: PostgreSQL
- **Cache**: Redis
- **Testing**: Jest, fast-check (property-based testing)
- **Real-Time**: Socket.io (planned)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd canteen-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start PostgreSQL and Redis services:
```bash
# PostgreSQL
sudo service postgresql start

# Redis
sudo service redis-server start
```

5. Initialize the database:
```bash
npm run db:init
```

## Configuration

Edit the `.env` file with your configuration:

### Required Variables
- `DB_PASSWORD`: PostgreSQL database password
- `JWT_SECRET`: Secret key for JWT token generation
- `SESSION_SECRET`: Secret key for session management

### Optional Variables
- `PORT`: Server port (default: 3000)
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)

## Database Schema

The system uses the following tables:
- `institutions`: Campus institutions
- `users`: All system users with roles
- `canteens`: Canteen information with vendor IDs
- `products`: Product catalog with inventory
- `payments`: Payment transactions
- `orders`: Orders with time-bound bills and QR codes
- `order_items`: Individual items within orders

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Base
- `GET /api/v1` - API information

## Project Structure

```
canteen-management-system/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # PostgreSQL configuration
│   │   ├── redis.ts     # Redis configuration
│   │   └── env.ts       # Environment variables
│   ├── database/        # Database schema and initialization
│   │   ├── schema.sql   # Database schema
│   │   └── init.ts      # Database initialization scripts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Core type definitions
│   ├── utils/           # Utility functions
│   │   ├── errors.ts    # Custom error classes
│   │   └── validators.ts # Validation functions
│   └── index.ts         # Application entry point
├── SD/                  # Specification documents
│   ├── requirements.md  # Requirements document
│   ├── design.md        # Design document
│   └── tasks.md         # Implementation tasks
├── .env.example         # Example environment variables
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Jest configuration
└── README.md           # This file
```

## Testing Strategy

The project uses a dual testing approach:

### Unit Tests
- Specific examples demonstrating correct behavior
- Edge cases (empty carts, zero stock, boundary times)
- Error conditions (invalid inputs, failed payments)

### Property-Based Tests
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Uses fast-check library

## Development Workflow

1. Read the requirements and design documents in the `SD/` folder
2. Follow the implementation tasks in `SD/tasks.md`
3. Write tests before implementing features (TDD)
4. Run tests frequently to ensure correctness
5. Use property-based tests to discover edge cases

## Database Management

### Initialize Database
```bash
npm run db:init
```

### Reset Database (Development Only)
```bash
npm run db:reset
```

### Run Migrations
```bash
npm run db:migrate
```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- HTTPS required in production
- Rate limiting enabled
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- CORS configuration

## Performance

- Database connection pooling (max 20 connections)
- Redis caching for frequently accessed data
- Indexed database queries
- Query timeout: 5 seconds
- API timeout: 30 seconds

## License

MIT

## Support

For issues and questions, please refer to the specification documents in the `SD/` folder or contact the development team.
