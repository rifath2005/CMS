import { Pool } from 'pg';
import { BillService } from './BillService';
import { OrderService } from '../order/OrderService';
import { CartService, CartItem } from '../cart/CartService';
import { PaymentService } from '../payment/PaymentService';
import { PaymentStatus } from '../../models/Payment';

describe('BillService', () => {
  let pool: Pool;
  let billService: BillService;
  let orderService: OrderService;
  let cartService: CartService;
  let paymentService: PaymentService;
  let testUserId: string;
  let testVendorId: string;
  let testProductId: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'canteen_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    billService = new BillService(pool);
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

  async function createTestOrder() {
    const item: CartItem = {
      productId: testProductId,
      productName: 'Test Product',
      quantity: 2,
      price: 50.00,
      vendorId: testVendorId
    };
    await cartService.addItem(testUserId, item);

    const paymentIntent = await paymentService.initiatePayment(testUserId, 100.00);
    await pool.query(
      'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
      [PaymentStatus.SUCCESS, paymentIntent.payment.id]
    );

    return orderService.createOrder({
      userId: testUserId,
      paymentId: paymentIntent.payment.id
    });
  }

  describe('generateBill', () => {
    it('should generate digital bill from order', async () => {
      const orderResult = await createTestOrder();

      const bill = await billService.generateBill(orderResult.order.id);

      expect(bill).toBeDefined();
      expect(bill.orderId).toBe(orderResult.order.id);
      expect(bill.userId).toBe(testUserId);
      expect(bill.userName).toBe('Test User');
      expect(bill.vendorId).toBe(testVendorId);
      expect(bill.totalAmount).toBe(100.00);
      expect(bill.items).toHaveLength(1);
      expect(bill.qrCode).toBeDefined();
      expect(bill.validationToken).toBeDefined();
      expect(bill.isValid).toBe(true);
      expect(bill.isDelivered).toBe(false);
    });

    it('should calculate remaining time correctly', async () => {
      const orderResult = await createTestOrder();

      const bill = await billService.generateBill(orderResult.order.id);

      expect(bill.remainingSeconds).toBeGreaterThan(0);
      expect(bill.remainingSeconds).toBeLessThanOrEqual(900); // 15 minutes
    });

    it('should mark bill as invalid when expired', async () => {
      const orderResult = await createTestOrder();

      // Expire the bill
      await pool.query(
        'UPDATE orders SET bill_expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), orderResult.order.id]
      );

      const bill = await billService.generateBill(orderResult.order.id);

      expect(bill.isValid).toBe(false);
      expect(bill.remainingSeconds).toBe(0);
    });

    it('should mark bill as delivered when order is delivered', async () => {
      const orderResult = await createTestOrder();

      // Mark as delivered
      await pool.query(
        'UPDATE orders SET status = $1, delivered_at = NOW() WHERE id = $2',
        ['DELIVERED', orderResult.order.id]
      );

      const bill = await billService.generateBill(orderResult.order.id);

      expect(bill.isDelivered).toBe(true);
      expect(bill.isValid).toBe(false);
    });
  });

  describe('getBillByOrderId', () => {
    it('should get bill by order ID', async () => {
      const orderResult = await createTestOrder();

      const bill = await billService.getBillByOrderId(orderResult.order.id);

      expect(bill.orderId).toBe(orderResult.order.id);
    });

    it('should throw error for non-existent order', async () => {
      await expect(
        billService.getBillByOrderId('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Order not found');
    });
  });

  describe('checkBillValidity', () => {
    it('should return true for valid bill', async () => {
      const orderResult = await createTestOrder();

      const isValid = await billService.checkBillValidity(orderResult.order.id);

      expect(isValid).toBe(true);
    });

    it('should return false for expired bill', async () => {
      const orderResult = await createTestOrder();

      await pool.query(
        'UPDATE orders SET bill_expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), orderResult.order.id]
      );

      const isValid = await billService.checkBillValidity(orderResult.order.id);

      expect(isValid).toBe(false);
    });

    it('should return false for delivered order', async () => {
      const orderResult = await createTestOrder();

      await pool.query(
        'UPDATE orders SET status = $1, delivered_at = NOW() WHERE id = $2',
        ['DELIVERED', orderResult.order.id]
      );

      const isValid = await billService.checkBillValidity(orderResult.order.id);

      expect(isValid).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time in seconds', async () => {
      const orderResult = await createTestOrder();

      const remainingTime = await billService.getRemainingTime(orderResult.order.id);

      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(900);
    });

    it('should return 0 for expired bill', async () => {
      const orderResult = await createTestOrder();

      await pool.query(
        'UPDATE orders SET bill_expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), orderResult.order.id]
      );

      const remainingTime = await billService.getRemainingTime(orderResult.order.id);

      expect(remainingTime).toBe(0);
    });
  });

  describe('markBillAsExpired', () => {
    it('should mark bill as expired', async () => {
      const orderResult = await createTestOrder();

      await billService.markBillAsExpired(orderResult.order.id);

      const bill = await billService.generateBill(orderResult.order.id);

      expect(bill.isValid).toBe(false);
    });
  });

  describe('verifyQRCode', () => {
    it('should verify valid QR code', async () => {
      const orderResult = await createTestOrder();

      const qrData = JSON.stringify({
        orderId: orderResult.order.id,
        validationToken: orderResult.order.validationToken,
        userId: testUserId,
        vendorId: testVendorId,
        timestamp: new Date().toISOString()
      });

      const result = await billService.verifyQRCode(qrData);

      expect(result.isValid).toBe(true);
      expect(result.orderId).toBe(orderResult.order.id);
    });

    it('should reject invalid validation token', async () => {
      const orderResult = await createTestOrder();

      const qrData = JSON.stringify({
        orderId: orderResult.order.id,
        validationToken: 'INVALID_TOKEN',
        userId: testUserId,
        vendorId: testVendorId,
        timestamp: new Date().toISOString()
      });

      const result = await billService.verifyQRCode(qrData);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Invalid validation token');
    });

    it('should reject expired bill', async () => {
      const orderResult = await createTestOrder();

      await pool.query(
        'UPDATE orders SET bill_expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), orderResult.order.id]
      );

      const qrData = JSON.stringify({
        orderId: orderResult.order.id,
        validationToken: orderResult.order.validationToken,
        userId: testUserId,
        vendorId: testVendorId,
        timestamp: new Date().toISOString()
      });

      const result = await billService.verifyQRCode(qrData);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('expired');
    });

    it('should reject already delivered order', async () => {
      const orderResult = await createTestOrder();

      await pool.query(
        'UPDATE orders SET status = $1, delivered_at = NOW() WHERE id = $2',
        ['DELIVERED', orderResult.order.id]
      );

      const qrData = JSON.stringify({
        orderId: orderResult.order.id,
        validationToken: orderResult.order.validationToken,
        userId: testUserId,
        vendorId: testVendorId,
        timestamp: new Date().toISOString()
      });

      const result = await billService.verifyQRCode(qrData);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('already delivered');
    });
  });

  describe('confirmDelivery', () => {
    it('should confirm delivery with valid token', async () => {
      const orderResult = await createTestOrder();

      await billService.confirmDelivery(
        orderResult.order.id,
        orderResult.order.validationToken
      );

      const bill = await billService.generateBill(orderResult.order.id);

      expect(bill.isDelivered).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      const orderResult = await createTestOrder();

      await expect(
        billService.confirmDelivery(orderResult.order.id, 'INVALID_TOKEN')
      ).rejects.toThrow('Invalid validation token');
    });

    it('should throw error for already delivered order', async () => {
      const orderResult = await createTestOrder();

      await billService.confirmDelivery(
        orderResult.order.id,
        orderResult.order.validationToken
      );

      await expect(
        billService.confirmDelivery(
          orderResult.order.id,
          orderResult.order.validationToken
        )
      ).rejects.toThrow('Order already delivered');
    });

    it('should throw error for expired bill', async () => {
      const orderResult = await createTestOrder();

      await pool.query(
        'UPDATE orders SET bill_expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), orderResult.order.id]
      );

      await expect(
        billService.confirmDelivery(
          orderResult.order.id,
          orderResult.order.validationToken
        )
      ).rejects.toThrow('Bill has expired');
    });
  });
});
