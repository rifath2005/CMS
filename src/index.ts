import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateEnv } from './config/env';
import { pool, closePool } from './config/database';
import { connectRedis, closeRedis } from './config/redis';
import { initializeDatabase, checkDatabaseTables } from './database/init';
import { createAuthRouter } from './routes/auth.routes';
import { createInstitutionRouter } from './routes/institution.routes';
import { createCanteenRouter } from './routes/canteen.routes';
import { createProductRouter } from './routes/product.routes';
import { createPaymentRoutes } from './routes/payment.routes';
import { createCartRoutes } from './routes/cart.routes';
import { createOrderRoutes } from './routes/order.routes';
import { createBillRoutes } from './routes/bill.routes';
import { createVendorRoutes } from './routes/vendor.routes';
import { createOrderHistoryRoutes } from './routes/orderHistory.routes';
import { createProfileRoutes } from './routes/profile.routes';
import { WebSocketServer } from './websocket';
import { apiRateLimiter } from './middleware/rateLimiter';
import { OrderExpirationService } from './services/order/OrderExpirationService';
import { setWebSocketServer } from './services/order/WalletOrderService';

const app: Application = express();
const httpServer = createServer(app);

// Initialize WebSocket server
let wsServer: WebSocketServer;

// Initialize Order Expiration Service
let orderExpirationService: OrderExpirationService;

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
      institutions: '/api/v1/institutions',
      canteens: '/api/v1/canteens',
      products: '/api/v1/products',
      payments: '/api/v1/payments',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      bills: '/api/v1/bills',
      vendor: '/api/v1/vendor',
      orderHistory: '/api/v1/order-history',
      profile: '/api/v1/profile',
    },
    websocket: {
      enabled: true,
      endpoint: '/socket.io',
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

// Wallet routes
import { createWalletRouter } from './routes/wallet.routes';
app.use('/api/v1/wallet', createWalletRouter(pool));

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

    // Try to connect to Redis (non-blocking)
    try {
      await connectRedis();
      console.log('✓ Redis connected');
    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : String(redisError);
      console.warn('⚠ Redis connection failed - continuing without cache:', errorMessage);
    }

    // Test database connection
    try {
      await pool.query('SELECT NOW()');
      console.log('✓ Database connected');

      // Check if tables exist, if not initialize
      const tablesExist = await checkDatabaseTables();
      if (!tablesExist) {
        console.log('Database tables not found, initializing...');
        await initializeDatabase();
      } else {
        console.log('✓ Database tables already exist');
      }
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error('✗ Database connection failed:', errorMessage);
      console.log('⚠ Server will start but database operations will fail');
    }

    // Initialize WebSocket server
    wsServer = new WebSocketServer(httpServer);
    console.log('✓ WebSocket server initialized');

    // Set WebSocket server instance for services
    setWebSocketServer(wsServer);

    // Initialize and start Order Expiration Service
    orderExpirationService = new OrderExpirationService(pool);
    orderExpirationService.start();

    // Start server
    httpServer.listen(config.port, () => {
      console.log(`\n🚀 Server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🌐 API Base URL: ${config.apiBaseUrl}`);
      console.log(`🔌 WebSocket server ready\n`);
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
    // Stop Order Expiration Service
    if (orderExpirationService) {
      orderExpirationService.stop();
    }
    
    // Close WebSocket server
    if (wsServer) {
      await wsServer.close();
    }
    
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

// Export for testing
export { app, httpServer, wsServer };
export default app;
