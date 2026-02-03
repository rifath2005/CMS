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
   */
  async getVendorStats(vendorId: string): Promise<{
    activeOrdersCount: number;
    totalItemsToPrep: number;
    oldestOrderTime?: Date;
  }> {
    const activeOrders = await this.getActiveOrders(vendorId);
    const combinedItems = await this.getCombinedItemList(vendorId);

    const totalItemsToPrep = combinedItems.reduce((sum, item) => sum + item.totalQuantity, 0);

    const oldestOrderTime = activeOrders.length > 0 
      ? activeOrders[0].createdAt 
      : undefined;

    return {
      activeOrdersCount: activeOrders.length,
      totalItemsToPrep,
      oldestOrderTime
    };
  }
}
