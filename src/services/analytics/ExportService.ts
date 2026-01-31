import { Pool } from 'pg';

export class ExportService {
  constructor(private pool: Pool) {}

  /**
   * Export sales data to CSV
   */
  async exportSalesDataToCSV(
    vendorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const query = `
      SELECT 
        o.id as order_id,
        o.created_at as order_date,
        o.delivered_at as delivered_date,
        u.name as customer_name,
        o.total_amount,
        o.status,
        oi.product_name,
        oi.quantity,
        oi.price
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.vendor_id = $1 
        AND o.status = 'DELIVERED'
        AND o.delivered_at >= $2 
        AND o.delivered_at <= $3
      ORDER BY o.delivered_at DESC
    `;

    const result = await this.pool.query(query, [vendorId, startDate, endDate]);

    // Generate CSV
    const headers = [
      'Order ID',
      'Order Date',
      'Delivered Date',
      'Customer Name',
      'Total Amount',
      'Status',
      'Product Name',
      'Quantity',
      'Price'
    ];

    let csv = headers.join(',') + '\n';

    for (const row of result.rows) {
      const values = [
        row.order_id,
        row.order_date.toISOString(),
        row.delivered_date.toISOString(),
        `"${row.customer_name}"`,
        row.total_amount,
        row.status,
        `"${row.product_name}"`,
        row.quantity,
        row.price
      ];

      csv += values.join(',') + '\n';
    }

    return csv;
  }

  /**
   * Export product sales data to CSV
   */
  async exportProductSalesCSV(vendorId: string): Promise<string> {
    const query = `
      SELECT 
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.price * oi.quantity) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.vendor_id = $1 AND o.status = 'DELIVERED'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_quantity_sold DESC
    `;

    const result = await this.pool.query(query, [vendorId]);

    const headers = ['Product ID', 'Product Name', 'Total Quantity Sold', 'Total Revenue', 'Order Count'];
    let csv = headers.join(',') + '\n';

    for (const row of result.rows) {
      const values = [
        row.product_id,
        `"${row.product_name}"`,
        row.total_quantity_sold,
        row.total_revenue,
        row.order_count
      ];

      csv += values.join(',') + '\n';
    }

    return csv;
  }
}
