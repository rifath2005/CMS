import { Pool } from 'pg';
import { Order, OrderModel } from '../../models/Order';

export interface CombinedItem {
  productId: string;
  productName: string;
  totalQuantity: number;
  imageUrl?: string;
  category?: string;
}

export interface OrderDetail {
  orderId: string;
  userName: string;
  orderTime: Date;
  items: {
    productName: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[];
  totalAmount: number;
  status: string;
  remainingTime?: number;
}

export class VendorOrderService {
  private orderModel: OrderModel;
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
    this.orderModel = new OrderModel(pool);
  }

  /**
   * Get active orders for vendor
   * Sorted by timestamp (oldest first)
   */
  async getActiveOrders(vendorId: string): Promise<Order[]> {
    return this.orderModel.findActiveByVendorId(vendorId);
  }

  /**
   * Get order history (completed/delivered orders)
   * Sorted by timestamp (newest first)
   */
  async getOrderHistory(vendorId: string): Promise<Order[]> {
    return this.orderModel.findHistoryByVendorId(vendorId);
  }

  /**
   * Get combined item list for vendor
   * Aggregates quantities across all active orders
   */
  async getCombinedItemList(vendorId: string): Promise<CombinedItem[]> {
    const query = `
      SELECT 
        oi.product_id as "productId",
        oi.product_name as "productName",
        SUM(oi.quantity) as "totalQuantity",
        oi.image_url as "imageUrl",
        p.category as "category"
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.vendor_id = $1 
        AND o.status NOT IN ('DELIVERED', 'EXPIRED')
      GROUP BY oi.product_id, oi.product_name, oi.image_url, p.category
      ORDER BY p.category NULLS LAST, oi.product_name
    `;

    const result = await this.pool.query(query, [vendorId]);

    return result.rows.map(row => ({
      productId: row.productId,
      productName: row.productName,
      totalQuantity: parseInt(row.totalQuantity),
      imageUrl: row.imageUrl,
      category: row.category
    }));
  }

  /**
   * Get order detail view
   */
  async getOrderDetail(orderId: string): Promise<OrderDetail> {
    const query = `
      SELECT 
        o.id as "orderId",
        u.name as "userName",
        o.created_at as "orderTime",
        o.total_amount as "totalAmount",
        o.status,
        o.bill_expires_at as "billExpiresAt"
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;

    const orderResult = await this.pool.query(query, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsQuery = `
      SELECT 
        product_name as "productName",
        quantity,
        price,
        image_url as "imageUrl"
      FROM order_items
      WHERE order_id = $1
    `;

    const itemsResult = await this.pool.query(itemsQuery, [orderId]);

    // Calculate remaining time
    let remainingTime: number | undefined;
    if (order.status !== 'DELIVERED' && order.status !== 'EXPIRED') {
      const now = new Date();
      const expiresAt = new Date(order.billExpiresAt);
      const remainingMs = expiresAt.getTime() - now.getTime();
      remainingTime = Math.max(0, Math.floor(remainingMs / 1000));
    }

    return {
      orderId: order.orderId,
      userName: order.userName,
      orderTime: order.orderTime,
      items: itemsResult.rows,
      totalAmount: parseFloat(order.totalAmount),
      status: order.status,
      remainingTime
    };
  }

  /**
   * Remove order from active list (called when delivered)
   */
  async removeFromActiveList(orderId: string): Promise<void> {
    // This is handled automatically by the order status update
    // Orders with status DELIVERED or EXPIRED are filtered out in getActiveOrders
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'DELIVERED' && order.status !== 'EXPIRED') {
      throw new Error('Order must be delivered or expired to remove from active list');
    }
  }

  /**
   * Get order statistics for vendor
   * OPTIMIZED: Single query instead of multiple queries
   */
  async getVendorStats(vendorId: string): Promise<{
    activeOrdersCount: number;
    totalItemsToPrep: number;
    oldestOrderTime?: Date;
    completedToday: number;
    avgWaitTime: number;
  }> {
    // Single optimized query to get all stats at once
    const query = `
      WITH active_orders AS (
        SELECT 
          COUNT(*) as active_count,
          MIN(created_at) as oldest_order
        FROM orders
        WHERE vendor_id = $1 
          AND status NOT IN ('DELIVERED', 'EXPIRED')
      ),
      items_to_prep AS (
        SELECT 
          COALESCE(SUM(oi.quantity), 0) as total_items
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.vendor_id = $1 
          AND o.status NOT IN ('DELIVERED', 'EXPIRED')
      ),
      today_stats AS (
        SELECT 
          COUNT(*) as completed_today,
          COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - created_at)) / 60), 0) as avg_wait_minutes
        FROM orders
        WHERE vendor_id = $1
          AND status = 'DELIVERED'
          AND delivered_at IS NOT NULL
          AND DATE(created_at) = CURRENT_DATE
      )
      SELECT 
        COALESCE(ao.active_count, 0) as active_orders_count,
        COALESCE(itp.total_items, 0) as total_items_to_prep,
        ao.oldest_order as oldest_order_time,
        COALESCE(ts.completed_today, 0) as completed_today,
        COALESCE(ROUND(ts.avg_wait_minutes), 0) as avg_wait_time
      FROM active_orders ao, items_to_prep itp, today_stats ts
    `;

    const result = await this.pool.query(query, [vendorId]);
    
    if (result.rows.length === 0) {
      return {
        activeOrdersCount: 0,
        totalItemsToPrep: 0,
        completedToday: 0,
        avgWaitTime: 0
      };
    }

    const row = result.rows[0];
    return {
      activeOrdersCount: parseInt(row.active_orders_count) || 0,
      totalItemsToPrep: parseInt(row.total_items_to_prep) || 0,
      oldestOrderTime: row.oldest_order_time || undefined,
      completedToday: parseInt(row.completed_today) || 0,
      avgWaitTime: parseInt(row.avg_wait_time) || 0
    };
  }
}
