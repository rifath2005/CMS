import { Pool } from 'pg';

export interface ProductSales {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  orderCount: number;
}

export class ProductAnalytics {
  constructor(private pool: Pool) {}

  /**
   * Get top selling products
   */
  async getTopProducts(vendorId: string, limit: number = 10): Promise<ProductSales[]> {
    const query = `
      SELECT 
        oi.product_id as "productId",
        oi.product_name as "productName",
        SUM(oi.quantity) as "totalQuantitySold",
        SUM(oi.price * oi.quantity) as "totalRevenue",
        COUNT(DISTINCT o.id) as "orderCount"
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.vendor_id = $1 AND o.status = 'DELIVERED'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY "totalQuantitySold" DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [vendorId, limit]);

    return result.rows.map(row => ({
      productId: row.productId,
      productName: row.productName,
      totalQuantitySold: parseInt(row.totalQuantitySold),
      totalRevenue: parseFloat(row.totalRevenue),
      orderCount: parseInt(row.orderCount)
    }));
  }

  /**
   * Get product performance for a specific product
   */
  async getProductPerformance(productId: string): Promise<ProductSales | null> {
    const query = `
      SELECT 
        oi.product_id as "productId",
        oi.product_name as "productName",
        SUM(oi.quantity) as "totalQuantitySold",
        SUM(oi.price * oi.quantity) as "totalRevenue",
        COUNT(DISTINCT o.id) as "orderCount"
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = $1 AND o.status = 'DELIVERED'
      GROUP BY oi.product_id, oi.product_name
    `;

    const result = await this.pool.query(query, [productId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      productId: row.productId,
      productName: row.productName,
      totalQuantitySold: parseInt(row.totalQuantitySold),
      totalRevenue: parseFloat(row.totalRevenue),
      orderCount: parseInt(row.orderCount)
    };
  }
}
