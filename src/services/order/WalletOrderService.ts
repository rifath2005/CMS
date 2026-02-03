import { Pool } from 'pg';
import { WalletService } from '../wallet/WalletService';
import { ValidationError } from '../../utils/errors';

export interface WalletPaymentResult {
  success: boolean;
  orderId: string;
  amountPaid: number;
  newBalance: number;
  message: string;
  qrCode: string;
  validationToken: string;
  expiresAt: string;
}

export class WalletOrderService {
  private walletService: WalletService;

  constructor(private pool: Pool) {
    this.walletService = new WalletService(pool);
  }

  /**
   * Process wallet payment and create order (atomic transaction)
   */
  async processWalletPayment(
    userId: string,
    cartItems: any[],
    totalAmount: number
  ): Promise<WalletPaymentResult> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!cartItems || cartItems.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    if (totalAmount <= 0) {
      throw new ValidationError('Invalid order amount');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Check wallet balance
      const hasSufficient = await this.walletService.hasSufficientBalance(userId, totalAmount);
      if (!hasSufficient) {
        const currentBalance = await this.walletService.getBalance(userId);
        throw new ValidationError(
          `Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${totalAmount.toFixed(2)}`
        );
      }

      // 2. Get vendor_id from cart items (assuming all items from same vendor)
      const vendorId = cartItems[0]?.vendorId;
      if (!vendorId) {
        throw new ValidationError('Vendor information missing');
      }

      // 3. Create payment record first
      const paymentResult = await client.query(
        `INSERT INTO payments (id, user_id, amount, status, created_at, completed_at)
         VALUES (uuid_generate_v4(), $1, $2, 'SUCCESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [userId, totalAmount]
      );

      const paymentId = paymentResult.rows[0].id;

      // 4. Generate QR code and validation token
      const validationToken = `WALLET_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const qrCode = `ORDER_${validationToken}`;
      const billGeneratedAt = new Date();
      const billExpiresAt = new Date(billGeneratedAt.getTime() + 15 * 60 * 1000); // 15 minutes

      // 5. Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          id, user_id, vendor_id, total_amount, payment_id, status, 
          bill_generated_at, bill_expires_at, qr_code, validation_token, created_at
        )
        VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, 'PENDING', 
          $5, $6, $7, $8, CURRENT_TIMESTAMP
        )
        RETURNING id, created_at`,
        [userId, vendorId, totalAmount, paymentId, billGeneratedAt, billExpiresAt, qrCode, validationToken]
      );

      const orderId = orderResult.rows[0].id;

      // 6. Insert order items and update stock
      for (const item of cartItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, image_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, item.productId, item.productName, item.quantity, item.price, item.imageUrl || '']
        );

        // Deduct stock quantity
        await client.query(
          `UPDATE products 
           SET stock_quantity = stock_quantity - $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND stock_quantity >= $1`,
          [item.quantity, item.productId]
        );
      }

      // 7. Deduct from wallet (using same transaction)
      const walletResult = await this.walletService.deductBalance(
        userId,
        totalAmount,
        orderId,
        client
      );

      await client.query('COMMIT');

      return {
        success: true,
        orderId,
        amountPaid: totalAmount,
        newBalance: walletResult.balance,
        message: 'Payment successful! Order placed.',
        qrCode,
        validationToken,
        expiresAt: billExpiresAt.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's wallet balance
   */
  async getWalletBalance(userId: string): Promise<number> {
    return await this.walletService.getBalance(userId);
  }

  /**
   * Refund order to wallet (for cancelled orders)
   */
  async refundToWallet(orderId: string, userId: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get order details
      const orderResult = await client.query(
        `SELECT total_amount, status FROM orders WHERE id = $1 AND user_id = $2`,
        [orderId, userId]
      );

      if (orderResult.rows.length === 0) {
        throw new ValidationError('Order not found');
      }

      const { total_amount, status } = orderResult.rows[0];

      if (status === 'DELIVERED') {
        throw new ValidationError('Cannot refund delivered orders');
      }

      // Credit wallet
      await this.walletService.creditBalance(
        userId,
        parseFloat(total_amount),
        `Refund for order ${orderId}`,
        client
      );

      // Update order status
      await client.query(
        `UPDATE orders SET status = 'CANCELLED' WHERE id = $1`,
        [orderId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
