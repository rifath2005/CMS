import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Configure Redis connection
const redisConfig: any = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
};

export const redisClient = createClient(redisConfig);

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

// Initialize Redis connection
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Helper functions for common Redis operations
export const redisHelpers = {
  // Session management
  setSession: async (userId: string, sessionData: any, ttl: number = 86400) => {
    const key = `session:${userId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(sessionData));
  },

  getSession: async (userId: string) => {
    const key = `session:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  deleteSession: async (userId: string) => {
    const key = `session:${userId}`;
    await redisClient.del(key);
  },

  // Active orders cache
  setActiveOrders: async (vendorId: string, orderIds: string[], ttl: number = 3600) => {
    const key = `active_orders:${vendorId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(orderIds));
  },

  getActiveOrders: async (vendorId: string): Promise<string[]> => {
    const key = `active_orders:${vendorId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : [];
  },

  // Combined item list cache
  setCombinedItems: async (vendorId: string, items: Record<string, number>, ttl: number = 300) => {
    const key = `combined_items:${vendorId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(items));
  },

  getCombinedItems: async (vendorId: string): Promise<Record<string, number> | null> => {
    const key = `combined_items:${vendorId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Bill timer cache
  setBillTimer: async (orderId: string, expiresAt: Date, ttl: number = 900) => {
    const key = `bill_timer:${orderId}`;
    await redisClient.setEx(key, ttl, JSON.stringify({ expiresAt: expiresAt.toISOString(), isValid: true }));
  },

  getBillTimer: async (orderId: string) => {
    const key = `bill_timer:${orderId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  invalidateBillTimer: async (orderId: string) => {
    const key = `bill_timer:${orderId}`;
    await redisClient.del(key);
  },

  // Shopping cart cache
  setCart: async (userId: string, cartItems: any[], ttl: number = 3600) => {
    const key = `cart:${userId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(cartItems));
  },

  getCart: async (userId: string) => {
    const key = `cart:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : [];
  },

  clearCart: async (userId: string) => {
    const key = `cart:${userId}`;
    await redisClient.del(key);
  },
};

// Graceful shutdown
export const closeRedis = async () => {
  await redisClient.quit();
  console.log('Redis connection closed');
};
