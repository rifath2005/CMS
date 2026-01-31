import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateEnv } from './config/env';
import { pool, closePool } from './config/database';
import { connectRedis, closeRedis } from './config/redis';
import { initializeDatabase, checkDatabaseTables } from './database/init';
import { createAuthRouter } from './routes/auth.routes';
import { createPaymentRoutes } from './routes/payment.routes';
import { createCartRoutes } from './routes/cart.routes';
import { createOrderRoutes } from './routes/order.routes';
import { createBillRoutes } from './routes/bill.routes';
import { createVendorRoutes } from './routes/vendor.routes';
import { createOrderHistoryRoutes } from './routes/orderHistory.routes';
import { createProfileRoutes } from './routes/profile.routes';

const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes will be added here
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Canteen Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      auth: '/api/v1/auth',
<<<<<<< HEAD
      payments: '/api/v1/payments',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      bills: '/api/v1/bills',
      vendor: '/api/v1/vendor',
      orderHistory: '/api/v1/order-history',
      profile: '/api/v1/profile',
=======
      institutions: '/api/v1/institutions',
      canteens: '/api/v1/canteens',
      products: '/api/v1/products',
>>>>>>> 020ba3cdb878a136d1edaf6429d2829ba9dec49b
    },
  });
});

// Mount routes
app.use('/api/v1/auth', createAuthRouter(pool));
app.use('/api/v1/institutions', createInstitutionRouter(pool));
app.use('/api/v1/canteens', createCanteenRouter(pool));
app.use('/api/v1/products', createProductRouter(pool));

// Mount Member 2 routes (Tasks 8-17)
app.use('/api/v1/payments', createPaymentRoutes(pool));
app.use('/api/v1/cart', createCartRoutes(pool));
app.use('/api/v1/orders', createOrderRoutes(pool));
app.use('/api/v1/bills', createBillRoutes(pool));
app.use('/api/v1/vendor', createVendorRoutes(pool));
app.use('/api/v1/order-history', createOrderHistoryRoutes(pool));
app.use('/api/v1/profile', createProfileRoutes(pool));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      details: config.nodeEnv === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      timestamp: new Date().toISOString(),
    },
  });
});

// Initialize and start server
const startServer = async () => {
  try {
    // Validate environment variables
    validateEnv();
    console.log('Environment variables validated');

    // Connect to Redis
    await connectRedis();
    console.log('Redis connected');

    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connected');

    // Check if tables exist, if not initialize
    const tablesExist = await checkDatabaseTables();
    if (!tablesExist) {
      console.log('Database tables not found, initializing...');
      await initializeDatabase();
    } else {
      console.log('Database tables already exist');
    }

    // Start server
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`API Base URL: ${config.apiBaseUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  
  try {
    await closePool();
    await closeRedis();
    console.log('All connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();

export default app;
