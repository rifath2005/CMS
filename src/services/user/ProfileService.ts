import { Pool } from 'pg';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  institutionId: string;
  institutionName: string;
  createdAt: Date;
}

export interface UserDashboard {
  profile: UserProfile;
  activeOrders: {
    orderId: string;
    vendorName: string;
    totalAmount: number;
    status: string;
    remainingTime?: number;
  }[];
  statistics: {
    totalOrders: number;
    totalSpent: number;
    activeOrdersCount: number;
  };
}

export interface UpdateProfileData {
  name?: string;
  // Email cannot be updated (institutional email)
}

export class ProfileService {
  constructor(private pool: Pool) {}

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.institution_id as "institutionId",
        i.name as "institutionName",
        u.created_at as "createdAt"
      FROM users u
      JOIN institutions i ON u.institution_id = i.id
      WHERE u.id = $1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboard(userId: string): Promise<UserDashboard> {
    const profile = await this.getUserProfile(userId);

    // Get active orders
    const activeOrdersQuery = `
      SELECT 
        o.id as "orderId",
        c.name as "vendorName",
        o.total_amount as "totalAmount",
        o.status,
        o.bill_expires_at as "billExpiresAt"
      FROM orders o
      JOIN canteens c ON o.vendor_id = c.vendor_id
      WHERE o.user_id = $1 AND o.status NOT IN ('DELIVERED', 'EXPIRED')
      ORDER BY o.created_at DESC
    `;

    const activeOrdersResult = await this.pool.query(activeOrdersQuery, [userId]);

    const activeOrders = activeOrdersResult.rows.map(order => {
      let remainingTime: number | undefined;
      if (order.status !== 'DELIVERED' && order.status !== 'EXPIRED') {
        const now = new Date();
        const expiresAt = new Date(order.billExpiresAt);
        const remainingMs = expiresAt.getTime() - now.getTime();
        remainingTime = Math.max(0, Math.floor(remainingMs / 1000));
      }

      return {
        orderId: order.orderId,
        vendorName: order.vendorName,
        totalAmount: parseFloat(order.totalAmount),
        status: order.status,
        remainingTime
      };
    });

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as "totalOrders",
        COALESCE(SUM(total_amount), 0) as "totalSpent"
      FROM orders
      WHERE user_id = $1 AND status = 'DELIVERED'
    `;

    const statsResult = await this.pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    return {
      profile,
      activeOrders,
      statistics: {
        totalOrders: parseInt(stats.totalOrders),
        totalSpent: parseFloat(stats.totalSpent),
        activeOrdersCount: activeOrders.length
      }
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (updates.length === 0) {
      return this.getUserProfile(userId);
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
    `;

    await this.pool.query(query, values);

    return this.getUserProfile(userId);
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    activeOrdersCount: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'DELIVERED') as "totalOrders",
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'DELIVERED'), 0) as "totalSpent",
        COALESCE(AVG(total_amount) FILTER (WHERE status = 'DELIVERED'), 0) as "averageOrderValue",
        COUNT(*) FILTER (WHERE status NOT IN ('DELIVERED', 'EXPIRED')) as "activeOrdersCount"
      FROM orders
      WHERE user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);
    const stats = result.rows[0];

    return {
      totalOrders: parseInt(stats.totalOrders) || 0,
      totalSpent: parseFloat(stats.totalSpent) || 0,
      averageOrderValue: parseFloat(stats.averageOrderValue) || 0,
      activeOrdersCount: parseInt(stats.activeOrdersCount) || 0
    };
  }
}
