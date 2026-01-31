import { Pool } from 'pg';
import { Order, OrderModel, OrderStatus } from '../../models/Order';

export interface OrderHistoryFilter {
  startDate?: Date;
  endDate?: Date;
  vendorId?: string;
  status?: OrderStatus;
}

export interface OrderHistoryEntry {
  orderId: string;
  orderDate: Date;
  items: {
    productName: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[];
  totalAmount: number;
  vendorId: string;
  vendorName: string;
  status: string;
  deliveredAt?: Date;
}

export class OrderHistoryService {
  private orderModel: OrderModel;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.orderModel = new OrderModel(pool);
  }

  /**
   * Get order history for user
   * Sorted by date (most recent first)
   */
  async getUserOrderHistory(userId: string, filter?: OrderHistoryFilter): Promise<OrderHistoryEntry[]> {
    let query = `
      SELECT 
        o.id as "orderId",
        o.created_at as "orderDate",
        o.total_amount as "totalAmount",
        o.vendor_id as "vendorId",
        c.name as "vendorName",
        o.status,
        o.delivered_at as "deliveredAt"
      FROM orders o
      JOIN canteens c ON o.vendor_id = c.vendor_id
      WHERE o.user_id = $1 AND o.status = 'DELIVERED'
    `;

    const params: any[] = [userId];
    let paramCount = 2;

    // Apply filters
    if (filter?.startDate) {
      query += ` AND o.delivered_at >= $${paramCount}`;
      params.push(filter.startDate);
      paramCount++;
    }

    if (filter?.endDate) {
      query += ` AND o.delivered_at <= $${paramCount}`;
      params.push(filter.endDate);
      paramCount++;
    }

    if (filter?.vendorId) {
      query += ` AND o.vendor_id = $${paramCount}`;
      params.push(filter.vendorId);
      paramCount++;
    }

    query += ` ORDER BY o.delivered_at DESC`;

    const ordersResult = await this.pool.query(query, params);

    // Get items for each order
    const history: OrderHistoryEntry[] = [];

    for (const order of ordersResult.rows) {
      const itemsQuery = `
        SELECT 
          product_name as "productName",
          quantity,
          price,
          image_url as "imageUrl"
        FROM order_items
        WHERE order_id = $1
      `;

      const itemsResult = await this.pool.query(itemsQuery, [order.orderId]);

      history.push({
        orderId: order.orderId,
        orderDate: order.orderDate,
        items: itemsResult.rows,
        totalAmount: parseFloat(order.totalAmount),
        vendorId: order.vendorId,
        vendorName: order.vendorName,
        status: order.status,
        deliveredAt: order.deliveredAt
      });
    }

    return history;
  }

  /**
   * Get order history with filtering
   */
  async getFilteredOrderHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    vendorId?: string
  ): Promise<OrderHistoryEntry[]> {
    const filter: OrderHistoryFilter = {
      startDate,
      endDate,
      vendorId
    };

    return this.getUserOrderHistory(userId, filter);
  }

  /**
   * Add order to history (called when order is delivered)
   */
  async addToHistory(orderId: string): Promise<void> {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new Error('Only delivered orders can be added to history');
    }

    // Order is automatically in history when status is DELIVERED
    // This method is here for explicit confirmation
  }

  /**
   * Get order history statistics
   */
  async getHistoryStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    mostOrderedVendor?: string;
  }> {
    const query = `
      SELECT 
        COUNT(*) as "totalOrders",
        SUM(total_amount) as "totalSpent",
        AVG(total_amount) as "averageOrderValue"
      FROM orders
      WHERE user_id = $1 AND status = 'DELIVERED'
    `;

    const result = await this.pool.query(query, [userId]);
    const stats = result.rows[0];

    // Get most ordered vendor
    const vendorQuery = `
      SELECT vendor_id, COUNT(*) as order_count
      FROM orders
      WHERE user_id = $1 AND status = 'DELIVERED'
      GROUP BY vendor_id
      ORDER BY order_count DESC
      LIMIT 1
    `;

    const vendorResult = await this.pool.query(vendorQuery, [userId]);
    const mostOrderedVendor = vendorResult.rows.length > 0 
      ? vendorResult.rows[0].vendor_id 
      : undefined;

    return {
      totalOrders: parseInt(stats.totalOrders) || 0,
      totalSpent: parseFloat(stats.totalSpent) || 0,
      averageOrderValue: parseFloat(stats.averageOrderValue) || 0,
      mostOrderedVendor
    };
  }
}
