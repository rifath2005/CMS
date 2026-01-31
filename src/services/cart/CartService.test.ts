import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { CartService, CartItem } from './CartService';

describe('CartService', () => {
  let pool: Pool;
  let redisClient: RedisClientType;
  let cartService: CartService;
  let testUserId: string;
  let testVendorId: string;
  let testProductId1: string;
  let testProductId2: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'canteen_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await redisClient.connect();

    cartService = new CartService(pool, redisClient);

    // Create test data
    const institutionResult = await pool.query(`
      INSERT INTO institutions (name, email_domain, contact_email)
      VALUES ('Test Institution', 'test.edu', 'test@test.edu')
      RETURNING id
    `);
    const institutionId = institutionResult.rows[0].id;

    const userResult = await pool.query(`
      INSERT INTO users (email, password_hash, name, role, institution_id)
      VALUES ('testuser@test.edu', 'hashedpassword', 'Test User', 'USER', $1)
      RETURNING id
    `, [institutionId]);
    testUserId = userResult.rows[0].id;

    const canteenResult = await pool.query(`
      INSERT INTO canteens (institution_id, vendor_id, name, location, is_active, is_approved)
      VALUES ($1, 'SS1', 'Test Canteen', 'Building A', true, true)
      RETURNING vendor_id
    `, [institutionId]);
    testVendorId = canteenResult.rows[0].vendor_id;

    const product1Result = await pool.query(`
      INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, is_available)
      VALUES ($1, 'Product 1', 'Description 1', 50.00, 'Food', 100, true)
      RETURNING id
    `, [testVendorId]);
    testProductId1 = product1Result.rows[0].id;

    const product2Result = await pool.query(`
      INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, is_available)
      VALUES ($1, 'Product 2', 'Description 2', 75.00, 'Beverage', 50, true)
      RETURNING id
    `, [testVendorId]);
    testProductId2 = product2Result.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM products WHERE vendor_id = $1', [testVendorId]);
    await pool.query('DELETE FROM canteens WHERE vendor_id = $1', [testVendorId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.query('DELETE FROM institutions WHERE email_domain = $1', ['test.edu']);
    await pool.end();
    await redisClient.quit();
  });

  afterEach(async () => {
    await cartService.clearCart(testUserId);
  });

  describe('addItem', () => {
    it('should add item to empty cart', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      const cart = await cartService.addItem(testUserId, item);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe(testProductId1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.totalAmount).toBe(100.00);
      expect(cart.vendorId).toBe(testVendorId);
    });

    it('should add multiple different items to cart', async () => {
      const item1: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      const item2: CartItem = {
        productId: testProductId2,
        productName: 'Product 2',
        quantity: 1,
        price: 75.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item1);
      const cart = await cartService.addItem(testUserId, item2);

      expect(cart.items).toHaveLength(2);
      expect(cart.totalAmount).toBe(175.00);
    });

    it('should increase quantity when adding same item', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      const cart = await cartService.addItem(testUserId, item);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(4);
      expect(cart.totalAmount).toBe(200.00);
    });

    it('should throw error for non-existent product', async () => {
      const item: CartItem = {
        productId: '00000000-0000-0000-0000-000000000000',
        productName: 'Invalid Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };

      await expect(cartService.addItem(testUserId, item)).rejects.toThrow('Product not found');
    });

    it('should throw error when quantity exceeds stock', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 150, // Stock is 100
        price: 50.00,
        vendorId: testVendorId
      };

      await expect(cartService.addItem(testUserId, item)).rejects.toThrow('Only 100 items available in stock');
    });

    it('should throw error for unavailable product', async () => {
      // Mark product as unavailable
      await pool.query('UPDATE products SET is_available = false WHERE id = $1', [testProductId1]);

      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };

      await expect(cartService.addItem(testUserId, item)).rejects.toThrow('Product is not available');

      // Restore availability
      await pool.query('UPDATE products SET is_available = true WHERE id = $1', [testProductId1]);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      const cart = await cartService.removeItem(testUserId, testProductId1);

      expect(cart.items).toHaveLength(0);
      expect(cart.totalAmount).toBe(0);
      expect(cart.vendorId).toBeUndefined();
    });

    it('should remove only specified item', async () => {
      const item1: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      const item2: CartItem = {
        productId: testProductId2,
        productName: 'Product 2',
        quantity: 1,
        price: 75.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item1);
      await cartService.addItem(testUserId, item2);
      const cart = await cartService.removeItem(testUserId, testProductId1);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe(testProductId2);
      expect(cart.totalAmount).toBe(75.00);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      const cart = await cartService.updateItemQuantity(testUserId, testProductId1, 5);

      expect(cart.items[0].quantity).toBe(5);
      expect(cart.totalAmount).toBe(250.00);
    });

    it('should remove item when quantity is zero', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      const cart = await cartService.updateItemQuantity(testUserId, testProductId1, 0);

      expect(cart.items).toHaveLength(0);
    });

    it('should throw error when quantity exceeds stock', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);

      await expect(
        cartService.updateItemQuantity(testUserId, testProductId1, 150)
      ).rejects.toThrow('Only 100 items available in stock');
    });

    it('should throw error for non-existent item', async () => {
      await expect(
        cartService.updateItemQuantity(testUserId, testProductId1, 5)
      ).rejects.toThrow('Item not found in cart');
    });
  });

  describe('getCart', () => {
    it('should return empty cart for new user', async () => {
      const cart = await cartService.getCart(testUserId);

      expect(cart.userId).toBe(testUserId);
      expect(cart.items).toHaveLength(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should return cart with items', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      const cart = await cartService.getCart(testUserId);

      expect(cart.items).toHaveLength(1);
      expect(cart.totalAmount).toBe(100.00);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      await cartService.clearCart(testUserId);
      const cart = await cartService.getCart(testUserId);

      expect(cart.items).toHaveLength(0);
      expect(cart.totalAmount).toBe(0);
    });
  });

  describe('validateCart', () => {
    it('should validate cart with valid items', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      const validation = await cartService.validateCart(testUserId);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect unavailable products', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      
      // Mark product as unavailable
      await pool.query('UPDATE products SET is_available = false WHERE id = $1', [testProductId1]);

      const validation = await cartService.validateCart(testUserId);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('no longer available');

      // Restore availability
      await pool.query('UPDATE products SET is_available = true WHERE id = $1', [testProductId1]);
    });

    it('should detect insufficient stock', async () => {
      const item: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 50,
        price: 50.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item);
      
      // Reduce stock
      await pool.query('UPDATE products SET stock_quantity = 10 WHERE id = $1', [testProductId1]);

      const validation = await cartService.validateCart(testUserId);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Only 10'))).toBe(true);

      // Restore stock
      await pool.query('UPDATE products SET stock_quantity = 100 WHERE id = $1', [testProductId1]);
    });
  });

  describe('getItemCount', () => {
    it('should return total item count', async () => {
      const item1: CartItem = {
        productId: testProductId1,
        productName: 'Product 1',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };

      const item2: CartItem = {
        productId: testProductId2,
        productName: 'Product 2',
        quantity: 3,
        price: 75.00,
        vendorId: testVendorId
      };

      await cartService.addItem(testUserId, item1);
      await cartService.addItem(testUserId, item2);

      const count = await cartService.getItemCount(testUserId);

      expect(count).toBe(5);
    });

    it('should return zero for empty cart', async () => {
      const count = await cartService.getItemCount(testUserId);

      expect(count).toBe(0);
    });
  });
});
