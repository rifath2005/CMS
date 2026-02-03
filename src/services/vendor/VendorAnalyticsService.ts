import { Pool } from 'pg';

export interface VendorAnalytics {
  todayStats: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    completedOrders: number;
  };
  weekStats: {
    totalOrders: number;
    totalRevenue: number;
    dailyBreakdown: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    orderCount: number;
  }>;
}

export class VendorAnalyticsService {
  constructor(private pool: Pool) {}

  async getAnalytics(vendorId: string): Promise<VendorAnalytics> {
    const todayStats = await this.getTodayStats(vendorId);
    const weekStats = await this.getWeekStats(vendorId);
    const topProducts = await this.getTopProducts(vendorId);
    const revenueByCategory = await this.getRevenueByCategory(vendorId);

    return {
      todayStats,
      weekStats,
      topProducts,
      revenueByCategory
    };
  }

  private async getTodayStats(vendorId: string) {
    const query = `
      SELECT 
        COUNT(*) as "totalOrders",
        COALESCE(SUM(total_amount), 0) as "totalRevenue",
        COALESCE(AVG(total_amount), 0) as "averageOrderValue",
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as "completedOrders"
      FROM orders
      WHERE vendor_id = $1 
        AND DATE(created_at) = CURRENT_DATE
    `;

    const result = await this.pool.query(query, [vendorId]);
    const row = result.rows[0];

    return {
      totalOrders: parseInt(row.totalOrders),
      totalRevenue: parseFloat(row.totalRevenue),
      averageOrderValue: parseFloat(row.averageOrderValue),
      completedOrders: parseInt(row.completedOrders)
    };
  }

  private async getWeekStats(vendorId: string) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE vendor_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const result = await this.pool.query(query, [vendorId]);

    const dailyBreakdown = result.rows.map(row => ({
      date: row.date,
      orders: parseInt(row.orders),
      revenue: parseFloat(row.revenue)
    }));

    const totalOrders = dailyBreakdown.reduce((sum, day) => sum + day.orders, 0);
    const totalRevenue = dailyBreakdown.reduce((sum, day) => sum + day.revenue, 0);

    return {
      totalOrders,
      totalRevenue,
      dailyBreakdown
    };
  }

  private async getTopProducts(vendorId: string, limit: number = 10) {
    const query = `
      SELECT 
        oi.product_id as "productId",
        oi.product_name as "productName",
        SUM(oi.quantity) as "totalSold",
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.vendor_id = $1 
        AND o.status = 'DELIVERED'
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY "totalSold" DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [vendorId, limit]);

    return result.rows.map(row => ({
      productId: row.productId,
      productName: row.productName,
      totalSold: parseInt(row.totalSold),
      revenue: parseFloat(row.revenue)
    }));
  }

  private async getRevenueByCategory(vendorId: string) {
    const query = `
      SELECT 
        p.category,
        SUM(oi.quantity * oi.price) as revenue,
        COUNT(DISTINCT o.id) as "orderCount"
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.vendor_id = $1 
        AND o.status = 'DELIVERED'
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.category
      ORDER BY revenue DESC
    `;

    const result = await this.pool.query(query, [vendorId]);

    return result.rows.map(row => ({
      category: row.category || 'Uncategorized',
      revenue: parseFloat(row.revenue),
      orderCount: parseInt(row.orderCount)
    }));
  }
}
