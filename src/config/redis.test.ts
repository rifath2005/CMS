import { redisClient, connectRedis, redisHelpers, closeRedis } from './redis';

describe('Redis Configuration', () => {
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await connectRedis();
    }
  });

  afterAll(async () => {
    await closeRedis();
  });

  afterEach(async () => {
    // Clean up test keys
    const keys = await redisClient.keys('test:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });

  describe('Connection', () => {
    it('should connect to Redis', async () => {
      expect(redisClient.isOpen).toBe(true);
    });

    it('should ping Redis server', async () => {
      const result = await redisClient.ping();
      expect(result).toBe('PONG');
    });
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      await redisClient.set('test:key', 'test-value');
      const value = await redisClient.get('test:key');
      expect(value).toBe('test-value');
    });

    it('should set a value with expiration', async () => {
      await redisClient.setEx('test:expiring', 1, 'value');
      const value = await redisClient.get('test:expiring');
      expect(value).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      const expiredValue = await redisClient.get('test:expiring');
      expect(expiredValue).toBeNull();
    });

    it('should delete a key', async () => {
      await redisClient.set('test:delete', 'value');
      await redisClient.del('test:delete');
      const value = await redisClient.get('test:delete');
      expect(value).toBeNull();
    });
  });

  describe('Session Helpers', () => {
    it('should set and get session data', async () => {
      const userId = 'test-user-123';
      const sessionData = {
        token: 'test-token',
        role: 'USER',
        institutionId: 'inst-123',
      };
      
      await redisHelpers.setSession(userId, sessionData, 60);
      const retrieved = await redisHelpers.getSession(userId);
      
      expect(retrieved).toEqual(sessionData);
    });

    it('should delete session data', async () => {
      const userId = 'test-user-456';
      await redisHelpers.setSession(userId, { token: 'test' }, 60);
      await redisHelpers.deleteSession(userId);
      
      const retrieved = await redisHelpers.getSession(userId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Active Orders Cache', () => {
    it('should set and get active orders', async () => {
      const vendorId = 'SS1';
      const orderIds = ['order-1', 'order-2', 'order-3'];
      
      await redisHelpers.setActiveOrders(vendorId, orderIds, 60);
      const retrieved = await redisHelpers.getActiveOrders(vendorId);
      
      expect(retrieved).toEqual(orderIds);
    });

    it('should return empty array for non-existent vendor', async () => {
      const retrieved = await redisHelpers.getActiveOrders('non-existent');
      expect(retrieved).toEqual([]);
    });
  });

  describe('Combined Items Cache', () => {
    it('should set and get combined items', async () => {
      const vendorId = 'SS1';
      const items = {
        'product-1': 5,
        'product-2': 3,
        'product-3': 10,
      };
      
      await redisHelpers.setCombinedItems(vendorId, items, 60);
      const retrieved = await redisHelpers.getCombinedItems(vendorId);
      
      expect(retrieved).toEqual(items);
    });

    it('should return null for non-existent vendor', async () => {
      const retrieved = await redisHelpers.getCombinedItems('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('Bill Timer Cache', () => {
    it('should set and get bill timer', async () => {
      const orderId = 'order-123';
      const expiresAt = new Date(Date.now() + 900000); // 15 minutes
      
      await redisHelpers.setBillTimer(orderId, expiresAt, 60);
      const retrieved = await redisHelpers.getBillTimer(orderId);
      
      expect(retrieved).toBeDefined();
      expect(retrieved.isValid).toBe(true);
      expect(new Date(retrieved.expiresAt)).toEqual(expiresAt);
    });

    it('should invalidate bill timer', async () => {
      const orderId = 'order-456';
      const expiresAt = new Date(Date.now() + 900000);
      
      await redisHelpers.setBillTimer(orderId, expiresAt, 60);
      await redisHelpers.invalidateBillTimer(orderId);
      
      const retrieved = await redisHelpers.getBillTimer(orderId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Shopping Cart Cache', () => {
    it('should set and get cart items', async () => {
      const userId = 'user-123';
      const cartItems = [
        { productId: 'p1', productName: 'Item 1', quantity: 2, price: 10 },
        { productId: 'p2', productName: 'Item 2', quantity: 1, price: 20 },
      ];
      
      await redisHelpers.setCart(userId, cartItems, 60);
      const retrieved = await redisHelpers.getCart(userId);
      
      expect(retrieved).toEqual(cartItems);
    });

    it('should clear cart', async () => {
      const userId = 'user-456';
      const cartItems = [{ productId: 'p1', quantity: 1, price: 10 }];
      
      await redisHelpers.setCart(userId, cartItems, 60);
      await redisHelpers.clearCart(userId);
      
      const retrieved = await redisHelpers.getCart(userId);
      expect(retrieved).toEqual([]);
    });
  });
});
