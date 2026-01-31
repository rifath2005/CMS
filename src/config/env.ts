import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'canteen_management',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'your_session_secret_here',
    timeout: parseInt(process.env.SESSION_TIMEOUT || '86400'),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // Bill Configuration
  bill: {
    validityMinutes: parseInt(process.env.BILL_VALIDITY_MINUTES || '15'),
  },

  // File Upload
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5'),
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // Payment Gateway
  payment: {
    gatewayUrl: process.env.PAYMENT_GATEWAY_URL || '',
    gatewayKey: process.env.PAYMENT_GATEWAY_KEY || '',
    gatewaySecret: process.env.PAYMENT_GATEWAY_SECRET || '',
  },

  // Notification
  notification: {
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD || '10'),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required environment variables
export const validateEnv = () => {
  const required = [
    'DB_PASSWORD',
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
