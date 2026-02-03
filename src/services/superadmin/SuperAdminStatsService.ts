import { Pool } from 'pg';

export interface SuperAdminDashboardStats {
  totalInstitutions: number;
  activeInstitutions: number;
  totalUsers: number;
  totalVendors: number;
  totalRevenue: number;
  activeOrders: number;
  ordersToday: number;
  paymentVolume: number;
}

export class SuperAdminStatsService {
  constructor(private pool: Pool) {}

  /**
   * Get platform-wide dashboard statistics for super admin
   */
  async getPlatformStats(): Promise<SuperAdminDashboardStats> {
    try {
      const query = `
        WITH institution_stats AS (
          SELECT 
            COUNT(*) as total_institutions,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as active_institutions
          FROM institutions
          WHERE id != '00000000-0000-0000-0000-000000000001' -- Exclude system institution
        ),
        user_stats AS (
          SELECT 
            COUNT(*) as total_users
          FROM users
          WHERE role = 'USER'
        ),
        vendor_stats AS (
          SELECT 
            COUNT(*) as total_vendors
          FROM canteens
          WHERE is_active = true AND is_approved = true
        ),
        order_stats AS (
          SELECT 
            COUNT(*) FILTER (WHERE status NOT IN ('DELIVERED', 'EXPIRED')) as active_orders,
            COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as orders_today,
            COALESCE(SUM(total_amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status != 'EXPIRED'), 0) as payment_volume,
            COALESCE(SUM(total_amount) FILTER (WHERE status = 'DELIVERED'), 0) as total_revenue
          FROM orders
        )
        SELECT 
          COALESCE(i.total_institutions, 0) as total_institutions,
          COALESCE(i.active_institutions, 0) as active_institutions,
          COALESCE(u.total_users, 0) as total_users,
          COALESCE(v.total_vendors, 0) as total_vendors,
          COALESCE(o.total_revenue, 0) as total_revenue,
          COALESCE(o.active_orders, 0) as active_orders,
          COALESCE(o.orders_today, 0) as orders_today,
          COALESCE(o.payment_volume, 0) as payment_volume
        FROM institution_stats i, user_stats u, vendor_stats v, order_stats o
      `;

      const result = await this.pool.query(query);
      
      if (result.rows.length === 0) {
        return this.getDefaultStats();
      }

      const row = result.rows[0];
      return {
        totalInstitutions: parseInt(row.total_institutions) || 0,
        activeInstitutions: parseInt(row.active_institutions) || 0,
        totalUsers: parseInt(row.total_users) || 0,
        totalVendors: parseInt(row.total_vendors) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        activeOrders: parseInt(row.active_orders) || 0,
        ordersToday: parseInt(row.orders_today) || 0,
        paymentVolume: parseFloat(row.payment_volume) || 0,
      };
    } catch (error: any) {
      console.error('Error in getPlatformStats:', error);
      return this.getDefaultStats();
    }
  }

  private getDefaultStats(): SuperAdminDashboardStats {
    return {
      totalInstitutions: 0,
      activeInstitutions: 0,
      totalUsers: 0,
      totalVendors: 0,
      totalRevenue: 0,
      activeOrders: 0,
      ordersToday: 0,
      paymentVolume: 0,
    };
  }
}
