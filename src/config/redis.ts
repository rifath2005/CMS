import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Configure Redis connection
const redisConfig: any = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    tls: process.env.REDIS_TLS === 'true' ? {
      rejectUnauthorized: false, // Required for Redis Cloud
    } : undefined,
    reconnectStrategy: (retries: number) => {
      // Stop retrying after 3 attempts
      if (retries > 3) {
        console.log('Redis: Max reconnection attempts reached, giving up');
        return false;
      }
      // Wait 1 second between retries
      return 1000;
    },
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to connect to Redis:', errorMessage);
    throw error;
  }
};

// Helper functions for common Redis operations (Graceful fallback if Redis is down)
export const redisHelpers = {
  // Session management
  setSession: async (userId: string, sessionData: any, ttl: number = 86400) => {
    if (!redisClient.isOpen) {
      console.warn('Skipping setSession: Redis not connected');
      return;
    }
    const key = `session:${userId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(sessionData));
  },

  getSession: async (userId: string) => {
    if (!redisClient.isOpen) return null;
    const key = `session:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  deleteSession: async (userId: string) => {
    if (!redisClient.isOpen) return;
    const key = `session:${userId}`;
    await redisClient.del(key);
  },

  // Active orders cache
  setActiveOrders: async (vendorId: string, orderIds: string[], ttl: number = 3600) => {
    if (!redisClient.isOpen) return;
    const key = `active_orders:${vendorId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(orderIds));
  },

  getActiveOrders: async (vendorId: string): Promise<string[]> => {
    if (!redisClient.isOpen) return [];
    const key = `active_orders:${vendorId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : [];
  },

  // Combined item list cache
  setCombinedItems: async (vendorId: string, items: Record<string, number>, ttl: number = 300) => {
    if (!redisClient.isOpen) return;
    const key = `combined_items:${vendorId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(items));
  },

  getCombinedItems: async (vendorId: string): Promise<Record<string, number> | null> => {
    if (!redisClient.isOpen) return null;
    const key = `combined_items:${vendorId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Bill timer cache
  setBillTimer: async (orderId: string, expiresAt: Date, ttl: number = 900) => {
    if (!redisClient.isOpen) return;
    const key = `bill_timer:${orderId}`;
    await redisClient.setEx(key, ttl, JSON.stringify({ expiresAt: expiresAt.toISOString(), isValid: true }));
  },

  getBillTimer: async (orderId: string) => {
    if (!redisClient.isOpen) return null;
    const key = `bill_timer:${orderId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  invalidateBillTimer: async (orderId: string) => {
    if (!redisClient.isOpen) return;
    const key = `bill_timer:${orderId}`;
    await redisClient.del(key);
  },

  // Shopping cart cache
  setCart: async (userId: string, cartItems: any[], ttl: number = 3600) => {
    if (!redisClient.isOpen) return;
    const key = `cart:${userId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(cartItems));
  },

  getCart: async (userId: string) => {
    if (!redisClient.isOpen) return [];
    const key = `cart:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : [];
  },

  clearCart: async (userId: string) => {
    if (!redisClient.isOpen) return;
    const key = `cart:${userId}`;
    await redisClient.del(key);
  },

  // OTP management for password reset
  setOTP: async (email: string, otp: string, ttl: number = 600) => {
    if (!redisClient.isOpen) return;
    const key = `otp:${email}`;
    await redisClient.setEx(key, ttl, otp);
  },

  getOTP: async (email: string): Promise<string | null> => {
    if (!redisClient.isOpen) return null;
    const key = `otp:${email}`;
    return await redisClient.get(key);
  },

  deleteOTP: async (email: string) => {
    if (!redisClient.isOpen) return;
    const key = `otp:${email}`;
    await redisClient.del(key);
  },

  // Reset token management
  setResetToken: async (email: string, token: string, ttl: number = 900) => {
    if (!redisClient.isOpen) return;
    const key = `reset_token:${email}`;
    await redisClient.setEx(key, ttl, token);
  },

  getResetToken: async (email: string): Promise<string | null> => {
    if (!redisClient.isOpen) return null;
    const key = `reset_token:${email}`;
    return await redisClient.get(key);
  },

  deleteResetToken: async (email: string) => {
    if (!redisClient.isOpen) return;
    const key = `reset_token:${email}`;
    await redisClient.del(key);
  },
};

// Graceful shutdown
export const closeRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('✓ Redis connection closed');
    }
  } catch (error) {
    console.log('Redis was not connected, skipping close');
  }
};
