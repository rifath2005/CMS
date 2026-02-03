import { Pool } from 'pg';
import { PaymentModel, Payment, PaymentStatus } from '../../models/Payment';
import { UpiGateway, UpiPaymentIntent, UpiWebhookPayload } from './UpiGateway';
import { WalletService } from '../wallet/WalletService';

export interface PaymentIntent {
  payment: Payment;
  upiLink: string;
  qrCode: string;
  expiresAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export class PaymentService {
  private paymentModel: PaymentModel;
  private upiGateway: UpiGateway;
  private walletService: WalletService;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.paymentModel = new PaymentModel(pool);
    this.upiGateway = new UpiGateway();
    this.walletService = new WalletService(pool);
  }

  /**
   * Process wallet payment (NEW - replaces UPI for USER role)
   */
  async processWalletPayment(
    userId: string,
    amount: number
  ): Promise<Payment> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create payment record with INITIATED status
      const paymentResult = await client.query(
        `INSERT INTO payments (user_id, amount, status, created_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, amount, PaymentStatus.INITIATED]
      );

      const payment = this.paymentModel.mapRow(paymentResult.rows[0]);

      // Deduct from wallet (this will throw if insufficient balance)
      const walletResult = await this.walletService.deductFromWallet(
        userId,
        amount,
        client
      );

      // Update payment to SUCCESS
      const updatedPaymentResult = await client.query(
        `UPDATE payments 
         SET status = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [PaymentStatus.SUCCESS, payment.id]
      );

      await client.query('COMMIT');

      return this.paymentModel.mapRow(updatedPaymentResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(userId: string): Promise<number> {
    return this.walletService.getWalletBalance(userId);
  }

  /**
   * Initiate a payment
   * Creates payment record and generates UPI payment link
   */
  async initiatePayment(
    userId: string,
    amount: number,
    orderId?: string
  ): Promise<PaymentIntent> {
    // Validate amount
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    // Create payment record with INITIATED status
    const payment = await this.paymentModel.create({
      userId,
      amount,
      status: PaymentStatus.INITIATED
    });

    // Generate UPI payment intent
    const upiIntent = await this.upiGateway.initiatePayment(
      payment.id,
      amount,
      userId
    );

    return {
      payment,
      upiLink: upiIntent.upiLink,
      qrCode: upiIntent.qrCode,
      expiresAt: upiIntent.expiresAt
    };
  }

  /**
   * Verify payment status
   * Checks with UPI gateway and updates payment record
   */
  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    const payment = await this.paymentModel.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    // If already completed, return current status
    if (payment.status === PaymentStatus.SUCCESS || 
        payment.status === PaymentStatus.FAILED ||
        payment.status === PaymentStatus.CANCELLED) {
      return payment.status;
    }

    // Check with UPI gateway
    const verification = await this.upiGateway.verifyPayment(paymentId);
    
    if (verification) {
      // Update payment status
      const updated = await this.paymentModel.update(paymentId, {
        status: verification.status,
        upiTransactionId: verification.upiTransactionId,
        completedAt: verification.completedAt
      });

      return updated?.status || payment.status;
    }

    // Payment still pending
    return payment.status;
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Process webhook from UPI gateway
   * Updates payment status based on webhook notification
   */
  async processWebhook(payload: UpiWebhookPayload): Promise<Payment> {
    // Process and verify webhook
    const verification = await this.upiGateway.processWebhook(payload);

    // Update payment record
    const updated = await this.paymentModel.update(verification.paymentId, {
      status: verification.status,
      upiTransactionId: verification.upiTransactionId,
      completedAt: verification.completedAt
    });

    if (!updated) {
      throw new Error('Failed to update payment status');
    }

    return updated;
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount: number): Promise<Refund> {
    const payment = await this.paymentModel.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new Error('Can only refund successful payments');
    }

    if (amount > payment.amount) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    if (!payment.upiTransactionId) {
      throw new Error('Cannot refund payment without UPI transaction ID');
    }

    // Process refund with UPI gateway
    const refundResult = await this.upiGateway.processRefund(
      paymentId,
      payment.upiTransactionId,
      amount
    );

    return {
      id: refundResult.refundId,
      paymentId,
      amount,
      status: refundResult.status,
      createdAt: new Date()
    };
  }

  /**
   * Get all payments for a user
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    return this.paymentModel.findByUserId(userId);
  }

  /**
   * Check if payment is successful
   */
  async isPaymentSuccessful(paymentId: string): Promise<boolean> {
    const payment = await this.paymentModel.findById(paymentId);
    return payment?.status === PaymentStatus.SUCCESS;
  }

  /**
   * Get payments by status
   */
  async getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
    return this.paymentModel.findByStatus(status);
  }
}
