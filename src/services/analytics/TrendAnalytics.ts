import { Pool } from 'pg';

export interface VolumeTrend {
  date: Date;
  orderCount: number;
  totalRevenue: number;
}

export class TrendAnalytics {
  constructor(private pool: Pool) {}

  /**
   * Get order volume trends
   */
  async getOrderVolumeTrends(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    bucketSize: 'day' | 'week' | 'month' = 'day'
  ): Promise<VolumeTrend[]> {
    const query = `
      SELECT 
        DATE_TRUNC($1, delivered_at) as date,
        COUNT(*) as "orderCount",
        SUM(total_amount) as "totalRevenue"
      FROM orders
      WHERE vendor_id = $2 
        AND status = 'DELIVERED'
        AND delivered_at >= $3 
        AND delivered_at <= $4
      GROUP BY DATE_TRUNC($1, delivered_at)
      ORDER BY date
    `;

    const result = await this.pool.query(query, [bucketSize, vendorId, startDate, endDate]);

    return result.rows.map(row => ({
      date: row.date,
      orderCount: parseInt(row.orderCount),
      totalRevenue: parseFloat(row.totalRevenue)
    }));
  }

  /**
   * Get peak hours analysis
   */
  async getPeakHours(vendorId: string, days: number = 7): Promise<{ hour: number; orderCount: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT 
        EXTRACT(HOUR FROM delivered_at) as hour,
        COUNT(*) as "orderCount"
      FROM orders
      WHERE vendor_id = $1 
        AND status = 'DELIVERED'
        AND delivered_at >= $2
      GROUP BY EXTRACT(HOUR FROM delivered_at)
      ORDER BY hour
    `;

    const result = await this.pool.query(query, [vendorId, startDate]);

    return result.rows.map(row => ({
      hour: parseInt(row.hour),
      orderCount: parseInt(row.orderCount)
    }));
  }
}
