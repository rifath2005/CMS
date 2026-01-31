import { Pool } from 'pg';
import { Order, OrderItem } from '../../models/Order';
import { QRCodeService } from './QRCodeService';

export interface DigitalBill {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentTimestamp: Date;
  generatedAt: Date;
  expiresAt: Date;
  remainingSeconds: number;
  isValid: boolean;
  isDelivered: boolean;
  qrCode: string;
  validationToken: string;
}

export class BillService {
  private pool: Pool;
  private qrCodeService: QRCodeService;
  private readonly BILL_VALIDITY_MINUTES = 15;

  constructor(pool: Pool) {
    this.pool = pool;
    this.qrCodeService = new QRCodeService();
  }

  /**
   * Generate digital bill from order
   */
  async generateBill(orderId: string): Promise<DigitalBill> {
    // Get order details
    const orderQuery = `
      SELECT o.id, o.user_id, o.vendor_id, o.total_amount, o.payment_id,
             o.status, o.bill_generated_at, o.bill_expires_at, o.qr_code,
             o.validation_token, o.is_qr_scanned, o.delivered_at, o.created_at,
             u.name as user_name,
             p.completed_at as payment_timestamp
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN payments p ON o.payment_id = p.id
      WHERE o.id = $1
    `;

    const orderResult = await this.pool.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsQuery = `
      SELECT product_id as "productId", product_name as "productName",
             quantity, price, image_url as "imageUrl"
      FROM order_items
      WHERE order_id = $1
    `;

    const itemsResult = await this.pool.query(itemsQuery, [orderId]);

    // Calculate remaining time
    const now = new Date();
    const expiresAt = new Date(order.bill_expires_at);
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    // Check if bill is valid
    const isValid = now <= expiresAt && order.status !== 'DELIVERED' && order.status !== 'EXPIRED';
    const isDelivered = order.status === 'DELIVERED';

    const bill: DigitalBill = {
      id: order.id,
      orderId: order.id,
      userId: order.user_id,
      userName: order.user_name,
      vendorId: order.vendor_id,
      items: itemsResult.rows,
      totalAmount: parseFloat(order.total_amount),
      paymentTimestamp: order.payment_timestamp,
      generatedAt: order.bill_generated_at,
      expiresAt: expiresAt,
      remainingSeconds,
      isValid,
      isDelivered,
      qrCode: order.qr_code,
      validationToken: order.validation_token
    };

    return bill;
  }

  /**
   * Get bill by order ID
   */
  async getBillByOrderId(orderId: string): Promise<DigitalBill> {
    return this.generateBill(orderId);
  }

  /**
   * Check if bill is valid (not expired and not delivered)
   */
  async checkBillValidity(billId: string): Promise<boolean> {
    const bill = await this.generateBill(billId);
    return bill.isValid;
  }

  /**
   * Get remaining time for bill in seconds
   */
  async getRemainingTime(billId: string): Promise<number> {
    const bill = await this.generateBill(billId);
    return bill.remainingSeconds;
  }

  /**
   * Mark bill as expired
   */
  async markBillAsExpired(billId: string): Promise<void> {
    await this.pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      ['EXPIRED', billId]
    );
  }

  /**
   * Verify QR code and return bill information
   */
  async verifyQRCode(qrData: string): Promise<{
    isValid: boolean;
    billId?: string;
    orderId?: string;
    errorMessage?: string;
  }> {
    try {
      // Parse QR code data
      const qrCodeData = this.qrCodeService.parseQRCode(qrData);

      // Verify QR code data structure
      if (!this.qrCodeService.verifyQRCodeData(qrCodeData)) {
        return {
          isValid: false,
          errorMessage: 'Invalid QR code data'
        };
      }

      // Get order and verify
      const orderQuery = `
        SELECT id, validation_token, bill_expires_at, status
        FROM orders
        WHERE id = $1
      `;

      const result = await this.pool.query(orderQuery, [qrCodeData.orderId]);

      if (result.rows.length === 0) {
        return {
          isValid: false,
          errorMessage: 'Order not found'
        };
      }

      const order = result.rows[0];

      // Verify validation token
      if (order.validation_token !== qrCodeData.validationToken) {
        return {
          isValid: false,
          errorMessage: 'Invalid validation token'
        };
      }

      // Check if already delivered
      if (order.status === 'DELIVERED') {
        return {
          isValid: false,
          errorMessage: 'Order already delivered'
        };
      }

      // Check if expired
      if (new Date() > new Date(order.bill_expires_at)) {
        return {
          isValid: false,
          errorMessage: 'Bill has expired'
        };
      }

      return {
        isValid: true,
        billId: order.id,
        orderId: order.id
      };
    } catch (error: any) {
      return {
        isValid: false,
        errorMessage: error.message || 'QR code verification failed'
      };
    }
  }

  /**
   * Confirm delivery
   */
  async confirmDelivery(billId: string, validationToken: string): Promise<void> {
    // Verify validation token
    const orderQuery = `
      SELECT id, validation_token, bill_expires_at, status, is_qr_scanned
      FROM orders
      WHERE id = $1
    `;

    const result = await this.pool.query(orderQuery, [billId]);

    if (result.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = result.rows[0];

    if (order.validation_token !== validationToken) {
      throw new Error('Invalid validation token');
    }

    if (order.status === 'DELIVERED') {
      throw new Error('Order already delivered');
    }

    if (order.is_qr_scanned) {
      throw new Error('QR code already scanned');
    }

    if (new Date() > new Date(order.bill_expires_at)) {
      throw new Error('Bill has expired');
    }

    // Update order status
    await this.pool.query(
      `UPDATE orders 
       SET status = $1, is_qr_scanned = $2, delivered_at = $3
       WHERE id = $4`,
      ['DELIVERED', true, new Date(), billId]
    );
  }
}
