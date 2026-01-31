import { Pool } from 'pg';

export enum TimePeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface SalesReport {
  vendorId: string;
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export class SalesAnalytics {
  constructor(private pool: Pool) {}

  /**
   * Generate sales report for a time period
   */
  async generateSalesReport(vendorId: string, period: TimePeriod): Promise<SalesReport> {
    const { startDate, endDate } = this.getDateRange(period);

    const query = `
      SELECT 
        COUNT(*) as "totalOrders",
        COALESCE(SUM(total_amount), 0) as "totalRevenue",
        COALESCE(AVG(total_amount), 0) as "averageOrderValue"
      FROM orders
      WHERE vendor_id = $1 
        AND status = 'DELIVERED'
        AND delivered_at >= $2 
        AND delivered_at <= $3
    `;

    const result = await this.pool.query(query, [vendorId, startDate, endDate]);
    const data = result.rows[0];

    return {
      vendorId,
      period,
      startDate,
      endDate,
      totalRevenue: parseFloat(data.totalRevenue),
      totalOrders: parseInt(data.totalOrders),
      averageOrderValue: parseFloat(data.averageOrderValue)
    };
  }

  /**
   * Calculate total revenue for a time period
   */
  async calculateRevenue(
    vendorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE vendor_id = $1 
        AND status = 'DELIVERED'
        AND delivered_at >= $2 
        AND delivered_at <= $3
    `;

    const result = await this.pool.query(query, [vendorId, startDate, endDate]);
    return parseFloat(result.rows[0].revenue);
  }

  /**
   * Get date range for time period
   */
  private getDateRange(period: TimePeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case TimePeriod.DAILY:
        startDate.setHours(0, 0, 0, 0);
        break;
      case TimePeriod.WEEKLY:
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case TimePeriod.MONTHLY:
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Get revenue trend over time
   */
  async getRevenueTrend(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    bucketSize: 'day' | 'week' | 'month' = 'day'
  ): Promise<{ date: Date; revenue: number }[]> {
    const query = `
      SELECT 
        DATE_TRUNC($1, delivered_at) as date,
        SUM(total_amount) as revenue
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
      revenue: parseFloat(row.revenue)
    }));
  }
}
