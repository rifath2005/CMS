import { Pool } from 'pg';
import { PaymentService } from './PaymentService';
import { PaymentStatus } from '../../models/Payment';
import { UpiWebhookPayload } from './UpiGateway';

describe('Payment Status Tracking', () => {
  let pool: Pool;
  let paymentService: PaymentService;
  let testUserId: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'canteen_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    paymentService = new PaymentService(pool);

    // Create test institution and user
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

  describe('Payment Lifecycle - Success Flow', () => {
    it('should track payment from INITIATED to SUCCESS', async () => {
      // Step 1: Initiate payment
      const intent = await paymentService.initiatePayment(testUserId, 100.00);
      expect(intent.payment.status).toBe(PaymentStatus.INITIATED);

      // Step 2: Simulate webhook for successful payment
      const webhookPayload: UpiWebhookPayload = {
        transactionId: 'UPI_SUCCESS_123',
        paymentId: intent.payment.id,
        status: 'success',
        amount: 100.00,
        timestamp: new Date().toISOString(),
        signature: 'test_signature'
      };

      const updated = await paymentService.processWebhook(webhookPayload);
      expect(updated.status).toBe(PaymentStatus.SUCCESS);
      expect(updated.upiTransactionId).toBe('UPI_SUCCESS_123');
      expect(updated.completedAt).toBeInstanceOf(Date);

      // Step 3: Verify payment is successful
      const isSuccessful = await paymentService.isPaymentSuccessful(intent.payment.id);
      expect(isSuccessful).toBe(true);
    });
  });

  describe('Payment Lifecycle - Failure Flow', () => {
    it('should track payment from INITIATED to FAILED', async () => {
      // Step 1: Initiate payment
      const intent = await paymentService.initiatePayment(testUserId, 150.00);
      expect(intent.payment.status).toBe(PaymentStatus.INITIATED);

      // Step 2: Simulate webhook for failed payment
      const webhookPayload: UpiWebhookPayload = {
        transactionId: 'UPI_FAILED_456',
        paymentId: intent.payment.id,
        status: 'failed',
        amount: 150.00,
        timestamp: new Date().toISOString(),
        signature: 'test_signature'
      };

      const updated = await paymentService.processWebhook(webhookPayload);
      expect(updated.status).toBe(PaymentStatus.FAILED);
      expect(updated.completedAt).toBeInstanceOf(Date);

      // Step 3: Verify payment is not successful
      const isSuccessful = await paymentService.isPaymentSuccessful(intent.payment.id);
      expect(isSuccessful).toBe(false);
    });
  });

  describe('Payment Lifecycle - Cancellation Flow', () => {
    it('should track payment from INITIATED to CANCELLED', async () => {
      // Step 1: Initiate payment
      const intent = await paymentService.initiatePayment(testUserId, 200.00);
      expect(intent.payment.status).toBe(PaymentStatus.INITIATED);

      // Step 2: Simulate webhook for cancelled payment
      const webhookPayload: UpiWebhookPayload = {
        transactionId: 'UPI_CANCELLED_789',
        paymentId: intent.payment.id,
        status: 'cancelled',
        amount: 200.00,
        timestamp: new Date().toISOString(),
        signature: 'test_signature'
      };

      const updated = await paymentService.processWebhook(webhookPayload);
      expect(updated.status).toBe(PaymentStatus.CANCELLED);
      expect(updated.completedAt).toBeInstanceOf(Date);

      // Step 3: Verify payment is not successful
      const isSuccessful = await paymentService.isPaymentSuccessful(intent.payment.id);
      expect(isSuccessful).toBe(false);
    });
  });

  describe('Payment Status Queries', () => {
    it('should filter payments by status', async () => {
      // Create multiple payments with different statuses
      const intent1 = await paymentService.initiatePayment(testUserId, 100.00);
      const intent2 = await paymentService.initiatePayment(testUserId, 200.00);
      const intent3 = await paymentService.initiatePayment(testUserId, 300.00);

      // Update statuses
      await paymentService.processWebhook({
        transactionId: 'UPI_1',
        paymentId: intent1.payment.id,
        status: 'success',
        amount: 100.00,
        timestamp: new Date().toISOString(),
        signature: 'sig1'
      });

      await paymentService.processWebhook({
        transactionId: 'UPI_2',
        paymentId: intent2.payment.id,
        status: 'failed',
        amount: 200.00,
        timestamp: new Date().toISOString(),
        signature: 'sig2'
      });

      // Query by status
      const successPayments = await paymentService.getPaymentsByStatus(PaymentStatus.SUCCESS);
      const failedPayments = await paymentService.getPaymentsByStatus(PaymentStatus.FAILED);
      const initiatedPayments = await paymentService.getPaymentsByStatus(PaymentStatus.INITIATED);

      expect(successPayments.some(p => p.id === intent1.payment.id)).toBe(true);
      expect(failedPayments.some(p => p.id === intent2.payment.id)).toBe(true);
      expect(initiatedPayments.some(p => p.id === intent3.payment.id)).toBe(true);
    });

    it('should get all payments for a user with various statuses', async () => {
      // Create payments
      await paymentService.initiatePayment(testUserId, 100.00);
      await paymentService.initiatePayment(testUserId, 200.00);
      await paymentService.initiatePayment(testUserId, 300.00);

      const userPayments = await paymentService.getUserPayments(testUserId);

      expect(userPayments.length).toBeGreaterThanOrEqual(3);
      expect(userPayments.every(p => p.userId === testUserId)).toBe(true);
    });
  });

  describe('Payment Status Immutability', () => {
    it('should not change status of already completed payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);

      // Mark as SUCCESS
      await paymentService.processWebhook({
        transactionId: 'UPI_FINAL',
        paymentId: intent.payment.id,
        status: 'success',
        amount: 100.00,
        timestamp: new Date().toISOString(),
        signature: 'sig'
      });

      // Verify returns SUCCESS without querying gateway
      const status = await paymentService.verifyPayment(intent.payment.id);
      expect(status).toBe(PaymentStatus.SUCCESS);
    });

    it('should not change status of failed payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);

      // Mark as FAILED
      await paymentService.processWebhook({
        transactionId: 'UPI_FAILED_FINAL',
        paymentId: intent.payment.id,
        status: 'failed',
        amount: 100.00,
        timestamp: new Date().toISOString(),
        signature: 'sig'
      });

      // Verify returns FAILED without querying gateway
      const status = await paymentService.verifyPayment(intent.payment.id);
      expect(status).toBe(PaymentStatus.FAILED);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple webhook calls for same payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);

      const webhookPayload: UpiWebhookPayload = {
        transactionId: 'UPI_DUPLICATE',
        paymentId: intent.payment.id,
        status: 'success',
        amount: 100.00,
        timestamp: new Date().toISOString(),
        signature: 'sig'
      };

      // First webhook
      const updated1 = await paymentService.processWebhook(webhookPayload);
      expect(updated1.status).toBe(PaymentStatus.SUCCESS);

      // Second webhook (duplicate)
      const updated2 = await paymentService.processWebhook(webhookPayload);
      expect(updated2.status).toBe(PaymentStatus.SUCCESS);
      expect(updated2.id).toBe(updated1.id);
    });

    it('should track payment with zero decimal amount', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100);
      expect(intent.payment.amount).toBe(100);
      expect(intent.payment.status).toBe(PaymentStatus.INITIATED);
    });

    it('should track payment with decimal amount', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 99.99);
      expect(intent.payment.amount).toBe(99.99);
      expect(intent.payment.status).toBe(PaymentStatus.INITIATED);
    });
  });
});
