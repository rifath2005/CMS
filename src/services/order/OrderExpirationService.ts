import { Pool } from 'pg';

export class OrderExpirationService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

  constructor(private pool: Pool) {}

  /**
   * Start the automatic expiration checker
   */
  start(): void {
    if (this.intervalId) {
      console.log('Order expiration service already running');
      return;
    }

    console.log('✓ Order expiration service started (checking every 60 seconds)');
    
    // Run immediately on start
    this.checkAndExpireOrders();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.checkAndExpireOrders();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop the automatic expiration checker
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Order expiration service stopped');
    }
  }

  /**
   * Check and expire orders that have passed their expiration time
   */
  async checkAndExpireOrders(): Promise<void> {
    try {
      const result = await this.pool.query(
        `UPDATE orders 
         SET status = 'EXPIRED'
         WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
           AND bill_expires_at < CURRENT_TIMESTAMP
         RETURNING id, user_id, vendor_id, bill_expires_at`
      );

      if (result.rows.length > 0) {
        console.log(`✓ Expired ${result.rows.length} order(s) automatically`);
        
        // Log each expired order
        result.rows.forEach(order => {
          console.log(`  - Order ${order.id} expired (was due at ${order.bill_expires_at})`);
        });
      }
    } catch (error) {
      console.error('Error checking for expired orders:', error);
    }
  }

  /**
   * Manually expire a specific order
   */
  async expireOrder(orderId: string): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `UPDATE orders 
         SET status = 'EXPIRED'
         WHERE id = $1 
           AND status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
         RETURNING id`,
        [orderId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error expiring order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Get count of orders that need to be expired
   */
  async getExpiredOrdersCount(): Promise<number> {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) as count
         FROM orders 
         WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
           AND bill_expires_at < CURRENT_TIMESTAMP`
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error getting expired orders count:', error);
      return 0;
    }
  }
}
