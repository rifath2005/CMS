import { Pool } from 'pg';
import { PaymentModel, PaymentStatus, CreatePaymentData } from './Payment';

describe('PaymentModel', () => {
  let pool: Pool;
  let paymentModel: PaymentModel;
  let testUserId: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'canteen_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    paymentModel = new PaymentModel(pool);

    // Create a test user
    const userResult = await pool.query(`
      INSERT INTO institutions (name, email_domain, contact_email)
      VALUES ('Test Institution', 'test.edu', 'test@test.edu')
      RETURNING id
    `);
    const institutionId = userResult.rows[0].id;

    const testUserResult = await pool.query(`
      INSERT INTO users (email, password_hash, name, role, institution_id)
      VALUES ('testuser@test.edu', 'hashedpassword', 'Test User', 'USER', $1)
      RETURNING id
    `, [institutionId]);
    testUserId = testUserResult.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM payments WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.query('DELETE FROM institutions WHERE email_domain = $1', ['test.edu']);
    await pool.end();
  });

  afterEach(async () => {
    await pool.query('DELETE FROM payments WHERE user_id = $1', [testUserId]);
  });

  describe('create', () => {
    it('should create a payment with default INITIATED status', async () => {
      const paymentData: CreatePaymentData = {
        userId: testUserId,
        amount: 100.50
      };

      const payment = await paymentModel.create(paymentData);

      expect(payment).toBeDefined();
      expect(payment.id).toBeDefined();
      expect(payment.userId).toBe(testUserId);
      expect(payment.amount).toBe(100.50);
      expect(payment.status).toBe(PaymentStatus.INITIATED);
      expect(payment.createdAt).toBeInstanceOf(Date);
    });

    it('should create a payment with specified status', async () => {
      const paymentData: CreatePaymentData = {
        userId: testUserId,
        amount: 250.00,
        status: PaymentStatus.PENDING
      };

      const payment = await paymentModel.create(paymentData);

      expect(payment.status).toBe(PaymentStatus.PENDING);
    });

    it('should create a payment with UPI transaction ID', async () => {
      const paymentData: CreatePaymentData = {
        userId: testUserId,
        amount: 150.00,
        upiTransactionId: 'UPI123456789'
      };

      const payment = await paymentModel.create(paymentData);

      expect(payment.upiTransactionId).toBe('UPI123456789');
    });
  });

  describe('findById', () => {
    it('should find a payment by ID', async () => {
      const created = await paymentModel.create({
        userId: testUserId,
        amount: 100.00
      });

      const found = await paymentModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.amount).toBe(100.00);
    });

    it('should return null for non-existent payment', async () => {
      const found = await paymentModel.findById('00000000-0000-0000-0000-000000000000');

      expect(found).toBeNull();
    });
  });

  describe('findByUpiTransactionId', () => {
    it('should find a payment by UPI transaction ID', async () => {
      const created = await paymentModel.create({
        userId: testUserId,
        amount: 200.00,
        upiTransactionId: 'UPI987654321'
      });

      const found = await paymentModel.findByUpiTransactionId('UPI987654321');

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.upiTransactionId).toBe('UPI987654321');
    });

    it('should return null for non-existent UPI transaction ID', async () => {
      const found = await paymentModel.findByUpiTransactionId('NONEXISTENT');

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update payment status', async () => {
      const created = await paymentModel.create({
        userId: testUserId,
        amount: 100.00,
        status: PaymentStatus.PENDING
      });

      const updated = await paymentModel.update(created.id, {
        status: PaymentStatus.SUCCESS,
        completedAt: new Date()
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(PaymentStatus.SUCCESS);
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should update UPI transaction ID', async () => {
      const created = await paymentModel.create({
        userId: testUserId,
        amount: 100.00
      });

      const updated = await paymentModel.update(created.id, {
        upiTransactionId: 'UPI111222333'
      });

      expect(updated?.upiTransactionId).toBe('UPI111222333');
    });

    it('should return existing payment if no updates provided', async () => {
      const created = await paymentModel.create({
        userId: testUserId,
        amount: 100.00
      });

      const updated = await paymentModel.update(created.id, {});

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(created.id);
    });
  });

  describe('findByUserId', () => {
    it('should find all payments for a user', async () => {
      await paymentModel.create({ userId: testUserId, amount: 100.00 });
      await paymentModel.create({ userId: testUserId, amount: 200.00 });
      await paymentModel.create({ userId: testUserId, amount: 300.00 });

      const payments = await paymentModel.findByUserId(testUserId);

      expect(payments).toHaveLength(3);
      expect(payments[0].amount).toBe(300.00); // Most recent first
    });

    it('should return empty array for user with no payments', async () => {
      const payments = await paymentModel.findByUserId('00000000-0000-0000-0000-000000000000');

      expect(payments).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find all payments with specific status', async () => {
      await paymentModel.create({ 
        userId: testUserId, 
        amount: 100.00, 
        status: PaymentStatus.SUCCESS 
      });
      await paymentModel.create({ 
        userId: testUserId, 
        amount: 200.00, 
        status: PaymentStatus.SUCCESS 
      });
      await paymentModel.create({ 
        userId: testUserId, 
        amount: 300.00, 
        status: PaymentStatus.FAILED 
      });

      const successPayments = await paymentModel.findByStatus(PaymentStatus.SUCCESS);
      const failedPayments = await paymentModel.findByStatus(PaymentStatus.FAILED);

      expect(successPayments.length).toBeGreaterThanOrEqual(2);
      expect(failedPayments.length).toBeGreaterThanOrEqual(1);
    });
  });
});
