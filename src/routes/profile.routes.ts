import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { ProfileService } from '../services/user/ProfileService';

export function createProfileRoutes(pool: Pool): Router {
  const router = Router();
  const profileService = new ProfileService(pool);

  /**
   * GET /api/profile/:userId
   * Get user profile
   */
  router.get('/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const profile = await profileService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/profile/:userId/dashboard
   * Get user dashboard
   */
  router.get('/:userId/dashboard', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const dashboard = await profileService.getUserDashboard(userId);

      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_DASHBOARD_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * PUT /api/profile/:userId
   * Update user profile
   */
  router.put('/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { name } = req.body;

      // Prevent email updates
      if (req.body.email) {
        return res.status(400).json({
          error: {
            code: 'EMAIL_UPDATE_NOT_ALLOWED',
            message: 'Institutional email cannot be updated'
          }
        });
      }

      const profile = await profileService.updateProfile(userId, { name });

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'UPDATE_PROFILE_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/profile/:userId/statistics
   * Get user statistics
   */
  router.get('/:userId/statistics', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const statistics = await profileService.getUserStatistics(userId);

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_STATISTICS_FAILED',
          message: error.message
        }
      });
    }
  });

  return router;
}
