import { Pool } from 'pg';
import { OrderModel, OrderStatus, CreateOrderData, OrderItem } from './Order';
import { v4 as uuidv4 } from 'uuid';

describe('OrderModel', () => {
  let pool: Pool;
  let orderModel: OrderModel;
  let testUserId: string;
  let testVendorId: string;
  let testPaymentId: string;
  let testProductId: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'canteen_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    orderModel = new OrderModel(pool);

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

    const paymentResult = await pool.query(`
      INSERT INTO payments (user_id, amount, status, upi_transaction_id, completed_at)
      VALUES ($1, 100.00, 'SUCCESS', 'UPI123', NOW())
      RETURNING id
    `, [testUserId]);
    testPaymentId = paymentResult.rows[0].id;
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
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [testUserId]);
    await pool.query('DELETE FROM orders WHERE user_id = $1', [testUserId]);
  });

  describe('create', () => {
    it('should create an order with items', async () => {
      const items: OrderItem[] = [
        {
          productId: testProductId,
          productName: 'Test Product',
          quantity: 2,
          price: 50.00,
          imageUrl: 'http://example.com/image.jpg'
        }
      ];

      const orderData: CreateOrderData = {
        userId: testUserId,
        vendorId: testVendorId,
        items,
        totalAmount: 100.00,
        paymentId: testPaymentId,
        qrCode: 'QR_CODE_DATA',
        validationToken: uuidv4()
      };

      const order = await orderModel.create(orderData);

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.userId).toBe(testUserId);
      expect(order.vendorId).toBe(testVendorId);
      expect(order.totalAmount).toBe(100.00);
      expect(order.paymentId).toBe(testPaymentId);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].productName).toBe('Test Product');
      expect(order.items[0].quantity).toBe(2);
      expect(order.billGeneratedAt).toBeInstanceOf(Date);
      expect(order.billExpiresAt).toBeInstanceOf(Date);
    });

    it('should create order with multiple items', async () => {
      const items: OrderItem[] = [
        {
          productId: testProductId,
          productName: 'Product 1',
          quantity: 2,
          price: 50.00
        },
        {
          productId: testProductId,
          productName: 'Product 2',
          quantity: 1,
          price: 30.00
        }
      ];

      const orderData: CreateOrderData = {
        userId: testUserId,
        vendorId: testVendorId,
        items,
        totalAmount: 130.00,
        paymentId: testPaymentId,
        qrCode: 'QR_CODE_DATA',
        validationToken: uuidv4()
      };

      const order = await orderModel.create(orderData);

      expect(order.items).toHaveLength(2);
      expect(order.totalAmount).toBe(130.00);
    });

    it('should set bill expiration to 15 minutes after generation', async () => {
      const items: OrderItem[] = [
        {
          productId: testProductId,
          productName: 'Test Product',
          quantity: 1,
          price: 50.00
        }
      ];

      const orderData: CreateOrderData = {
        userId: testUserId,
        vendorId: testVendorId,
        items,
        totalAmount: 50.00,
        paymentId: testPaymentId,
        qrCode: 'QR_CODE_DATA',
        validationToken: uuidv4()
      };

      const order = await orderModel.create(orderData);

      const timeDiff = order.billExpiresAt.getTime() - order.billGeneratedAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000;

      expect(timeDiff).toBeCloseTo(fifteenMinutes, -2);
    });
  });

  describe('findById', () => {
    it('should find order by ID', async () => {
      const created = await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{
          productId: testProductId,
          productName: 'Test Product',
          quantity: 1,
          price: 50.00
        }],
        totalAmount: 50.00,
        paymentId: testPaymentId,
        qrCode: 'QR_CODE',
        validationToken: uuidv4()
      });

      const found = await orderModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.items).toHaveLength(1);
    });

    it('should return null for non-existent order', async () => {
      const found = await orderModel.findById('00000000-0000-0000-0000-000000000000');

      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all orders for a user', async () => {
      await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P1', quantity: 1, price: 50 }],
        totalAmount: 50,
        paymentId: testPaymentId,
        qrCode: 'QR1',
        validationToken: uuidv4()
      });

      await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P2', quantity: 1, price: 60 }],
        totalAmount: 60,
        paymentId: testPaymentId,
        qrCode: 'QR2',
        validationToken: uuidv4()
      });

      const orders = await orderModel.findByUserId(testUserId);

      expect(orders.length).toBeGreaterThanOrEqual(2);
      expect(orders.every(o => o.userId === testUserId)).toBe(true);
    });
  });

  describe('findByVendorId', () => {
    it('should find all orders for a vendor', async () => {
      await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P1', quantity: 1, price: 50 }],
        totalAmount: 50,
        paymentId: testPaymentId,
        qrCode: 'QR1',
        validationToken: uuidv4()
      });

      const orders = await orderModel.findByVendorId(testVendorId);

      expect(orders.length).toBeGreaterThanOrEqual(1);
      expect(orders.every(o => o.vendorId === testVendorId)).toBe(true);
    });
  });

  describe('findByStatus', () => {
    it('should find orders by status', async () => {
      const order = await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P1', quantity: 1, price: 50 }],
        totalAmount: 50,
        paymentId: testPaymentId,
        status: OrderStatus.PREPARING,
        qrCode: 'QR1',
        validationToken: uuidv4()
      });

      const orders = await orderModel.findByStatus(OrderStatus.PREPARING);

      expect(orders.some(o => o.id === order.id)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update order status', async () => {
      const order = await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P1', quantity: 1, price: 50 }],
        totalAmount: 50,
        paymentId: testPaymentId,
        qrCode: 'QR1',
        validationToken: uuidv4()
      });

      const updated = await orderModel.update(order.id, {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date()
      });

      expect(updated?.status).toBe(OrderStatus.DELIVERED);
      expect(updated?.deliveredAt).toBeInstanceOf(Date);
    });

    it('should update QR scanned flag', async () => {
      const order = await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P1', quantity: 1, price: 50 }],
        totalAmount: 50,
        paymentId: testPaymentId,
        qrCode: 'QR1',
        validationToken: uuidv4()
      });

      const updated = await orderModel.update(order.id, {
        isQrScanned: true
      });

      expect(updated?.isQrScanned).toBe(true);
    });
  });

  describe('findByValidationToken', () => {
    it('should find order by validation token', async () => {
      const validationToken = uuidv4();
      
      const order = await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P1', quantity: 1, price: 50 }],
        totalAmount: 50,
        paymentId: testPaymentId,
        qrCode: 'QR1',
        validationToken
      });

      const found = await orderModel.findByValidationToken(validationToken);

      expect(found).toBeDefined();
      expect(found?.id).toBe(order.id);
      expect(found?.validationToken).toBe(validationToken);
    });

    it('should return null for invalid token', async () => {
      const found = await orderModel.findByValidationToken('INVALID_TOKEN');

      expect(found).toBeNull();
    });
  });

  describe('findActiveByVendorId', () => {
    it('should find only active orders for vendor', async () => {
      const order1 = await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P1', quantity: 1, price: 50 }],
        totalAmount: 50,
        paymentId: testPaymentId,
        status: OrderStatus.PENDING,
        qrCode: 'QR1',
        validationToken: uuidv4()
      });

      const order2 = await orderModel.create({
        userId: testUserId,
        vendorId: testVendorId,
        items: [{ productId: testProductId, productName: 'P2', quantity: 1, price: 60 }],
        totalAmount: 60,
        paymentId: testPaymentId,
        status: OrderStatus.DELIVERED,
        qrCode: 'QR2',
        validationToken: uuidv4()
      });

      const activeOrders = await orderModel.findActiveByVendorId(testVendorId);

      expect(activeOrders.some(o => o.id === order1.id)).toBe(true);
      expect(activeOrders.some(o => o.id === order2.id)).toBe(false);
    });
  });
});
