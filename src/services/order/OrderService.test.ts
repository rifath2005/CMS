import { Pool } from 'pg';
import { OrderService } from './OrderService';
import { OrderStatus } from '../../models/Order';
import { PaymentStatus } from '../../models/Payment';
import { CartService, CartItem } from '../cart/CartService';
import { PaymentService } from '../payment/PaymentService';

describe('OrderService', () => {
  let pool: Pool;
  let orderService: OrderService;
  let cartService: CartService;
  let paymentService: PaymentService;
  let testUserId: string;
  let testVendorId: string;
  let testProductId: string;
  let testPaymentId: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'canteen_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    orderService = new OrderService(pool);
    cartService = new CartService(pool);
    paymentService = new PaymentService(pool);

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

    const productResult = await pool.query(`
      INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, is_available)
      VALUES ($1, 'Test Product', 'Test Description', 50.00, 'Food', 100, true)
      RETURNING id
    `, [testVendorId]);
    testProductId = productResult.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [testUserId]);
    await pool.query('DELETE FROM orders WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM payments WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM products WHERE vendor_id = $1', [testVendorId]);
    await pool.query('DELETE FROM canteens WHERE vendor_id = $1', [testVendorId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.query('DELETE FROM institutions WHERE email_domain = $1', ['test.edu']);
    await pool.end();
  });

  afterEach(async () => {
    await cartService.clearCart(testUserId);
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [testUserId]);
    await pool.query('DELETE FROM orders WHERE user_id = $1', [testUserId]);
  });

  describe('createOrder', () => {
    it('should create order with successful payment', async () => {
      // Add items to cart
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      // Create successful payment
      const paymentIntent = await paymentService.initiatePayment(testUserId, 100.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      // Create order
      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      expect(result.order).toBeDefined();
      expect(result.order.userId).toBe(testUserId);
      expect(result.order.vendorId).toBe(testVendorId);
      expect(result.order.totalAmount).toBe(100.00);
      expect(result.order.status).toBe(OrderStatus.PENDING);
      expect(result.order.items).toHaveLength(1);
      expect(result.qrCodeDataUrl).toBeDefined();
      expect(result.qrCodeDataUrl).toContain('data:image/png');

      // Verify cart is cleared
      const cart = await cartService.getCart(testUserId);
      expect(cart.items).toHaveLength(0);
    });

    it('should throw error for non-successful payment', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);

      await expect(
        orderService.createOrder({
          userId: testUserId,
          paymentId: paymentIntent.payment.id
        })
      ).rejects.toThrow('Payment must be successful');
    });

    it('should throw error for empty cart', async () => {
      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      await expect(
        orderService.createOrder({
          userId: testUserId,
          paymentId: paymentIntent.payment.id
        })
      ).rejects.toThrow('Cart is empty');
    });

    it('should throw error when payment amount does not match order total', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 2,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      // Create payment with wrong amount
      const paymentIntent = await paymentService.initiatePayment(testUserId, 75.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      await expect(
        orderService.createOrder({
          userId: testUserId,
          paymentId: paymentIntent.payment.id
        })
      ).rejects.toThrow('does not match order total');
    });
  });

  describe('getOrderById', () => {
    it('should get order by ID', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      const order = await orderService.getOrderById(result.order.id);

      expect(order.id).toBe(result.order.id);
      expect(order.items).toHaveLength(1);
    });

    it('should throw error for non-existent order', async () => {
      await expect(
        orderService.getOrderById('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Order not found');
    });
  });

  describe('verifyDelivery', () => {
    it('should verify delivery with valid token', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      const delivered = await orderService.verifyDelivery(
        result.order.id,
        result.order.validationToken
      );

      expect(delivered.status).toBe(OrderStatus.DELIVERED);
      expect(delivered.isQrScanned).toBe(true);
      expect(delivered.deliveredAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid validation token', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      await expect(
        orderService.verifyDelivery(result.order.id, 'INVALID_TOKEN')
      ).rejects.toThrow('Invalid validation token');
    });

    it('should throw error for already delivered order', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      await orderService.verifyDelivery(result.order.id, result.order.validationToken);

      await expect(
        orderService.verifyDelivery(result.order.id, result.order.validationToken)
      ).rejects.toThrow('Order already delivered');
    });

    it('should throw error for expired bill', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      // Manually expire the bill
      await pool.query(
        'UPDATE orders SET bill_expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), result.order.id]
      );

      await expect(
        orderService.verifyDelivery(result.order.id, result.order.validationToken)
      ).rejects.toThrow('Bill has expired');
    });
  });

  describe('isBillValid', () => {
    it('should return true for valid bill', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      const isValid = await orderService.isBillValid(result.order.id);

      expect(isValid).toBe(true);
    });

    it('should return false for expired bill', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      // Expire the bill
      await pool.query(
        'UPDATE orders SET bill_expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), result.order.id]
      );

      const isValid = await orderService.isBillValid(result.order.id);

      expect(isValid).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time in seconds', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      const remainingTime = await orderService.getRemainingTime(result.order.id);

      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(900); // 15 minutes = 900 seconds
    });

    it('should return 0 for expired bill', async () => {
      const item: CartItem = {
        productId: testProductId,
        productName: 'Test Product',
        quantity: 1,
        price: 50.00,
        vendorId: testVendorId
      };
      await cartService.addItem(testUserId, item);

      const paymentIntent = await paymentService.initiatePayment(testUserId, 50.00);
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, paymentIntent.payment.id]
      );

      const result = await orderService.createOrder({
        userId: testUserId,
        paymentId: paymentIntent.payment.id
      });

      // Expire the bill
      await pool.query(
        'UPDATE orders SET bill_expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), result.order.id]
      );

      const remainingTime = await orderService.getRemainingTime(result.order.id);

      expect(remainingTime).toBe(0);
    });
  });
});
