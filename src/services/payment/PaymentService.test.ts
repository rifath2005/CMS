import { Pool } from 'pg';
import { PaymentService } from './PaymentService';
import { PaymentStatus } from '../../models/Payment';
import { UpiWebhookPayload } from './UpiGateway';

describe('PaymentService', () => {
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

  describe('initiatePayment', () => {
    it('should create payment and return UPI payment intent', async () => {
      const result = await paymentService.initiatePayment(testUserId, 100.50);

      expect(result.payment).toBeDefined();
      expect(result.payment.userId).toBe(testUserId);
      expect(result.payment.amount).toBe(100.50);
      expect(result.payment.status).toBe(PaymentStatus.INITIATED);
      expect(result.upiLink).toBeDefined();
      expect(result.upiLink).toContain('upi://pay');
      expect(result.qrCode).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw error for zero amount', async () => {
      await expect(
        paymentService.initiatePayment(testUserId, 0)
      ).rejects.toThrow('Payment amount must be greater than zero');
    });

    it('should throw error for negative amount', async () => {
      await expect(
        paymentService.initiatePayment(testUserId, -50)
      ).rejects.toThrow('Payment amount must be greater than zero');
    });
  });

  describe('verifyPayment', () => {
    it('should return current status for non-existent payment', async () => {
      await expect(
        paymentService.verifyPayment('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Payment not found');
    });

    it('should return SUCCESS status for completed payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);
      
      // Manually update payment to SUCCESS for testing
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, intent.payment.id]
      );

      const status = await paymentService.verifyPayment(intent.payment.id);
      expect(status).toBe(PaymentStatus.SUCCESS);
    });

    it('should return PENDING status for pending payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);
      
      const status = await paymentService.verifyPayment(intent.payment.id);
      expect(status).toBe(PaymentStatus.INITIATED);
    });
  });

  describe('getPaymentDetails', () => {
    it('should return payment details', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 150.00);
      
      const details = await paymentService.getPaymentDetails(intent.payment.id);

      expect(details).toBeDefined();
      expect(details.id).toBe(intent.payment.id);
      expect(details.amount).toBe(150.00);
      expect(details.userId).toBe(testUserId);
    });

    it('should throw error for non-existent payment', async () => {
      await expect(
        paymentService.getPaymentDetails('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Payment not found');
    });
  });

  describe('processWebhook', () => {
    it('should update payment status from webhook', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 200.00);

      const webhookPayload: UpiWebhookPayload = {
        transactionId: 'UPI123456789',
        paymentId: intent.payment.id,
        status: 'success',
        amount: 200.00,
        timestamp: new Date().toISOString(),
        signature: 'test_signature'
      };

      const updated = await paymentService.processWebhook(webhookPayload);

      expect(updated.status).toBe(PaymentStatus.SUCCESS);
      expect(updated.upiTransactionId).toBe('UPI123456789');
      expect(updated.completedAt).toBeInstanceOf(Date);
    });

    it('should handle failed payment webhook', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 200.00);

      const webhookPayload: UpiWebhookPayload = {
        transactionId: 'UPI987654321',
        paymentId: intent.payment.id,
        status: 'failed',
        amount: 200.00,
        timestamp: new Date().toISOString(),
        signature: 'test_signature'
      };

      const updated = await paymentService.processWebhook(webhookPayload);

      expect(updated.status).toBe(PaymentStatus.FAILED);
    });
  });

  describe('processRefund', () => {
    it('should process refund for successful payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 300.00);
      
      // Update to SUCCESS with UPI transaction ID
      await pool.query(
        'UPDATE payments SET status = $1, upi_transaction_id = $2, completed_at = NOW() WHERE id = $3',
        [PaymentStatus.SUCCESS, 'UPI111222333', intent.payment.id]
      );

      const refund = await paymentService.processRefund(intent.payment.id, 300.00);

      expect(refund).toBeDefined();
      expect(refund.paymentId).toBe(intent.payment.id);
      expect(refund.amount).toBe(300.00);
      expect(refund.status).toBe('INITIATED');
    });

    it('should throw error for non-existent payment', async () => {
      await expect(
        paymentService.processRefund('00000000-0000-0000-0000-000000000000', 100)
      ).rejects.toThrow('Payment not found');
    });

    it('should throw error for non-successful payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);

      await expect(
        paymentService.processRefund(intent.payment.id, 100)
      ).rejects.toThrow('Can only refund successful payments');
    });

    it('should throw error for refund amount exceeding payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);
      
      await pool.query(
        'UPDATE payments SET status = $1, upi_transaction_id = $2, completed_at = NOW() WHERE id = $3',
        [PaymentStatus.SUCCESS, 'UPI444555666', intent.payment.id]
      );

      await expect(
        paymentService.processRefund(intent.payment.id, 150)
      ).rejects.toThrow('Refund amount cannot exceed payment amount');
    });
  });

  describe('getUserPayments', () => {
    it('should return all payments for a user', async () => {
      await paymentService.initiatePayment(testUserId, 100.00);
      await paymentService.initiatePayment(testUserId, 200.00);
      await paymentService.initiatePayment(testUserId, 300.00);

      const payments = await paymentService.getUserPayments(testUserId);

      expect(payments.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('isPaymentSuccessful', () => {
    it('should return true for successful payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);
      
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, intent.payment.id]
      );

      const isSuccessful = await paymentService.isPaymentSuccessful(intent.payment.id);
      expect(isSuccessful).toBe(true);
    });

    it('should return false for pending payment', async () => {
      const intent = await paymentService.initiatePayment(testUserId, 100.00);

      const isSuccessful = await paymentService.isPaymentSuccessful(intent.payment.id);
      expect(isSuccessful).toBe(false);
    });
  });

  describe('getPaymentsByStatus', () => {
    it('should return payments filtered by status', async () => {
      const intent1 = await paymentService.initiatePayment(testUserId, 100.00);
      const intent2 = await paymentService.initiatePayment(testUserId, 200.00);
      
      await pool.query(
        'UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2',
        [PaymentStatus.SUCCESS, intent1.payment.id]
      );

      const successPayments = await paymentService.getPaymentsByStatus(PaymentStatus.SUCCESS);
      const initiatedPayments = await paymentService.getPaymentsByStatus(PaymentStatus.INITIATED);

      expect(successPayments.length).toBeGreaterThanOrEqual(1);
      expect(initiatedPayments.length).toBeGreaterThanOrEqual(1);
    });
  });
});
