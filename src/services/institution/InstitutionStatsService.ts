import { Pool } from 'pg';

export interface InstitutionDashboardStats {
  activeCanteens: number;
  pendingApprovals: number;
  ordersToday: number;
  dailyRevenue: number;
}

export class InstitutionStatsService {
  constructor(private pool: Pool) {}

  /**
   * Get dashboard statistics for institution admin
   * OPTIMIZED: Single query instead of multiple queries
   */
  async getDashboardStats(institutionId: string): Promise<InstitutionDashboardStats> {
    try {
      // Single optimized query to get all stats at once
      const query = `
        WITH canteen_stats AS (
          SELECT 
            COUNT(*) FILTER (WHERE is_active = true AND is_approved = true) as active_canteens,
            COUNT(*) FILTER (WHERE is_approved = false) as pending_approvals
          FROM canteens
          WHERE institution_id = $1
        ),
        order_stats AS (
          SELECT 
            COUNT(*) as orders_today,
            COALESCE(SUM(o.total_amount), 0) as daily_revenue
          FROM orders o
          INNER JOIN canteens c ON o.vendor_id = c.vendor_id
          WHERE c.institution_id = $1 
            AND DATE(o.created_at) = CURRENT_DATE
            AND o.status != 'EXPIRED'
        )
        SELECT 
          COALESCE(cs.active_canteens, 0) as active_canteens,
          COALESCE(cs.pending_approvals, 0) as pending_approvals,
          COALESCE(os.orders_today, 0) as orders_today,
          COALESCE(os.daily_revenue, 0) as daily_revenue
        FROM canteen_stats cs, order_stats os
      `;

      const result = await this.pool.query(query, [institutionId]);
      
      if (result.rows.length === 0) {
        return {
          activeCanteens: 0,
          pendingApprovals: 0,
          ordersToday: 0,
          dailyRevenue: 0,
        };
      }

      const row = result.rows[0];
      return {
        activeCanteens: parseInt(row.active_canteens) || 0,
        pendingApprovals: parseInt(row.pending_approvals) || 0,
        ordersToday: parseInt(row.orders_today) || 0,
        dailyRevenue: parseFloat(row.daily_revenue) || 0,
      };
    } catch (error: any) {
      console.error('Error in getDashboardStats:', error);
      // Return default values instead of throwing
      return {
        activeCanteens: 0,
        pendingApprovals: 0,
        ordersToday: 0,
        dailyRevenue: 0,
      };
    }
  }

  /**
   * Get vendor approval workflow data
   */
  async getVendorApprovalWorkflow(institutionId: string) {
    try {
      const query = `
        SELECT 
          c.id,
          c.vendor_id,
          c.name,
          c.location,
          c.is_approved,
          c.is_active,
          c.created_at,
          c.operating_hours
        FROM canteens c
        WHERE c.institution_id = $1
        ORDER BY 
          CASE 
            WHEN c.is_approved = false THEN 1
            WHEN c.is_active = true THEN 2
            ELSE 3
          END,
          c.created_at DESC
      `;

      const result = await this.pool.query(query, [institutionId]);
      
      return result.rows.map(row => ({
        id: row.id,
        vendorId: row.vendor_id,
        name: row.name,
        location: row.location || 'Not specified',
        isApproved: row.is_approved,
        isActive: row.is_active,
        createdAt: row.created_at,
        operatingHours: row.operating_hours,
        status: !row.is_approved ? 'pending' : row.is_active ? 'active' : 'inactive',
      }));
    } catch (error: any) {
      console.error('Error in getVendorApprovalWorkflow:', error);
      // Return empty array instead of throwing
      return [];
    }
  }
}
