import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { SuperAdminStatsService } from '../services/superadmin/SuperAdminStatsService';
import { configurationService } from '../services/configuration/ConfigurationService';
import { authenticate } from '../middleware/auth.middleware';
import { requireMainAdmin } from '../middleware/rbac.middleware';

export const createSuperAdminRouter = (pool: Pool): Router => {
  const router = Router();
  const statsService = new SuperAdminStatsService(pool);

  /**
   * GET /api/v1/super-admin/stats
   * Get platform-wide statistics
   */
  router.get('/stats', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await statsService.getPlatformStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });
  /**
   * GET /api/v1/super-admin/settings
   * Get global platform settings
   */
  router.get('/settings', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const config = await configurationService.getGlobalConfig();
      res.json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  /**
   * PATCH /api/v1/super-admin/settings/:key
   * Update a global platform setting
   */
  router.patch('/settings/:key', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value, reason } = req.body;
      const adminId = req.user!.userId;
      const adminEmail = req.user!.email;

      await configurationService.updateGlobalSetting(
        key,
        value,
        adminId,
        adminEmail,
        req.ip,
        req.get('user-agent'),
        reason
      );

      res.json({
        success: true,
        message: `Setting ${key} updated successfully`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: error.message,
        },
      });
    }
  });
  /**
   * GET /api/v1/super-admin/audit-logs
   * Get platform-wide audit logs
   */
  router.get('/audit-logs', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const { institutionId, limit, offset } = req.query;
      const logs = await configurationService.getConfigurationAuditLogs(
        institutionId as string,
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );
      res.json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });
  /**
   * GET /api/v1/super-admin/users
   * Get all users across the platform
   */
  router.get('/users', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const queryStr = `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.role, 
          u.status, 
          u.institution_id as "institutionId",
          i.name as "institutionName",
          u.wallet_balance as "walletBalance",
          u.last_login as "lastActive",
          u.created_at as "createdAt"
        FROM users u
        LEFT JOIN institutions i ON u.institution_id = i.id
        WHERE u.role != 'MAIN_ADMIN'
        ORDER BY u.created_at DESC
        LIMIT 100
      `;
      const result = await pool.query(queryStr);
      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  return router;
};
