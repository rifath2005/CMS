import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { SuperAdminStatsService } from '../services/superadmin/SuperAdminStatsService';
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

  return router;
};
