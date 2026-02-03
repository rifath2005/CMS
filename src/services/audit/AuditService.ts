import { Pool } from 'pg';

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ROLE_CHANGE = 'ROLE_CHANGE',
  INSTITUTION_CREATED = 'INSTITUTION_CREATED',
  INSTITUTION_UPDATED = 'INSTITUTION_UPDATED',
  CANTEEN_REGISTERED = 'CANTEEN_REGISTERED',
  CANTEEN_APPROVED = 'CANTEEN_APPROVED',
  CANTEEN_DEACTIVATED = 'CANTEEN_DEACTIVATED',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
}

export interface AuditLog {
  id: number;
  event_type: AuditEventType;
  user_id?: number;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: number;
  details?: any;
  success: boolean;
  created_at: Date;
}

export class AuditService {
  constructor(private pool: Pool) {}

  /**
   * Log an audit event
   */
  async logEvent(data: {
    eventType: AuditEventType;
    userId?: number;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    resourceType?: string;
    resourceId?: number;
    details?: any;
    success?: boolean;
  }): Promise<void> {
    const {
      eventType,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      resourceType,
      resourceId,
      details,
      success = true,
    } = data;

    try {
      const query = `
        INSERT INTO audit_logs (
          event_type, user_id, user_email, ip_address, user_agent,
          resource_type, resource_id, details, success
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const values = [
        eventType,
        userId || null,
        userEmail || null,
        ipAddress || null,
        userAgent || null,
        resourceType || null,
        resourceId || null,
        details ? JSON.stringify(details) : null,
        success,
      ];

      await this.pool.query(query, values);
    } catch (error) {
      // Log error but don't throw - audit logging should not break application flow
      console.error('Audit logging error:', error);
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(data: {
    email: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    userId?: number;
    reason?: string;
  }): Promise<void> {
    await this.logEvent({
      eventType: data.success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILED,
      userId: data.userId,
      userEmail: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: data.success,
      details: data.reason ? { reason: data.reason } : undefined,
    });
  }

  /**
   * Log user registration
   */
  async logRegistration(data: {
    userId: number;
    email: string;
    role: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.REGISTER,
      userId: data.userId,
      userEmail: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: { role: data.role },
      success: true,
    });
  }

  /**
   * Log logout
   */
  async logLogout(data: {
    userId: number;
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.LOGOUT,
      userId: data.userId,
      userEmail: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: true,
    });
  }

  /**
   * Log password reset
   */
  async logPasswordReset(data: {
    userId: string;
    email: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.PASSWORD_RESET,
      userId: parseInt(data.userId),
      userEmail: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: true,
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(data: {
    userId?: number;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    resource: string;
    action: string;
  }): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.UNAUTHORIZED_ACCESS,
      userId: data.userId,
      userEmail: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      success: false,
      details: {
        resource: data.resource,
        action: data.action,
      },
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: number, limit: number = 50): Promise<AuditLog[]> {
    const query = `
      SELECT * FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Get failed login attempts for an email
   */
  async getFailedLoginAttempts(email: string, windowMinutes: number = 15): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE user_email = $1
        AND event_type = $2
        AND success = false
        AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'
    `;

    const result = await this.pool.query(query, [email, AuditEventType.LOGIN_FAILED]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get recent audit logs (admin only)
   */
  async getRecentLogs(limit: number = 100, eventType?: AuditEventType): Promise<AuditLog[]> {
    let query = `
      SELECT * FROM audit_logs
    `;

    const values: any[] = [];

    if (eventType) {
      query += ` WHERE event_type = $1`;
      values.push(eventType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1}`;
    values.push(limit);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Get audit logs by date range
   */
  async getLogsByDateRange(startDate: Date, endDate: Date, eventType?: AuditEventType): Promise<AuditLog[]> {
    let query = `
      SELECT * FROM audit_logs
      WHERE created_at BETWEEN $1 AND $2
    `;

    const values: any[] = [startDate, endDate];

    if (eventType) {
      query += ` AND event_type = $3`;
      values.push(eventType);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Get security summary for a user
   */
  async getUserSecuritySummary(userId: number): Promise<{
    totalLogins: number;
    failedLogins: number;
    lastLogin?: Date;
    lastFailedLogin?: Date;
  }> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE event_type = $1 AND success = true) as total_logins,
        COUNT(*) FILTER (WHERE event_type = $1 AND success = false) as failed_logins,
        MAX(created_at) FILTER (WHERE event_type = $1 AND success = true) as last_login,
        MAX(created_at) FILTER (WHERE event_type = $1 AND success = false) as last_failed_login
      FROM audit_logs
      WHERE user_id = $2
    `;

    const result = await this.pool.query(query, [AuditEventType.LOGIN_SUCCESS, userId]);
    const row = result.rows[0];

    return {
      totalLogins: parseInt(row.total_logins) || 0,
      failedLogins: parseInt(row.failed_logins) || 0,
      lastLogin: row.last_login || undefined,
      lastFailedLogin: row.last_failed_login || undefined,
    };
  }
}
