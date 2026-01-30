import express, { Application } from 'express';
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
import { apiRateLimiter } from './middleware/rateLimiter';

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
      institutions: '/api/v1/institutions',
      canteens: '/api/v1/canteens',
      products: '/api/v1/products',
    },
  });
});

// Mount routes
app.use('/api/v1/auth', createAuthRouter(pool));
app.use('/api/v1/institutions', createInstitutionRouter(pool));
app.use('/api/v1/canteens', createCanteenRouter(pool));
app.use('/api/v1/products', createProductRouter(pool));

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
