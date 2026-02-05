import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Determine SSL configuration based on environment
const getSSLConfig = () => {
  const sslEnabled = process.env.DB_SSL === 'true';
  
  if (!sslEnabled) {
    return false;
  }
  
  // For Render.com and other cloud providers that require SSL
  // rejectUnauthorized: false allows self-signed certificates
  return {
    rejectUnauthorized: false,
  };
};

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'canteen_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: getSSLConfig(),
  max: 10, // Reduced for free tier
  min: 2, // Keep at least 2 connections alive for background tasks
  idleTimeoutMillis: 120000, // Increased to 2 minutes to prevent premature closure
  connectionTimeoutMillis: 120000, // 2 minutes for free tier wake-up
  // Additional settings for better reliability
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Force UTF8 encoding to handle special characters
  client_encoding: 'UTF8',
};

export const pool = new Pool(poolConfig);

// Log connection configuration (without sensitive data)
console.log('Database configuration:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  ssl: poolConfig.ssl ? 'enabled' : 'disabled',
});

// Test database connection on startup
pool.on('connect', (client) => {
  console.log('✓ Database connected successfully');
  // Set client encoding to UTF8 to handle special characters
  client.query('SET CLIENT_ENCODING TO UTF8').catch((err) => {
    console.error('Failed to set client encoding:', err);
  });
});

pool.on('error', (err: Error) => {
  console.error('✗ Unexpected database error:', err.message);
  // Don't exit in production, let the app handle reconnection
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Test initial connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('✓ Database connection test successful');
    client.release();
  } catch (err) {
    console.error('✗ Database connection test failed:', err instanceof Error ? err.message : err);
    if (process.env.NODE_ENV !== 'production') {
      console.error('Please check your database configuration in .env file');
      console.error('Required: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
      console.error('For Render.com: Set DB_SSL=true');
    }
  }
})();

// Helper function to execute queries with better error handling
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Only log in development to avoid cluttering production logs
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { 
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
        duration: `${duration}ms`, 
        rows: result.rowCount 
      });
    }
    
    return result;
  } catch (error) {
    console.error('Query error:', { 
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
      error: error instanceof Error ? error.message : error 
    });
    throw error;
  }
};

// Helper function for transactions with better error handling
export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
export const closePool = async () => {
  try {
    await pool.end();
    console.log('✓ Database pool closed gracefully');
  } catch (error) {
    console.error('✗ Error closing database pool:', error instanceof Error ? error.message : error);
  }
};

// Helper function for tests to get a new pool instance
export const getPool = (): Pool => {
  return pool;
};

// Health check function for monitoring
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error instanceof Error ? error.message : error);
    return false;
  }
};

// Export configuration for debugging
export const getDatabaseConfig = () => ({
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  ssl: poolConfig.ssl ? 'enabled' : 'disabled',
  maxConnections: poolConfig.max,
});
