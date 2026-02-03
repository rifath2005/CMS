/**
 * Institution Configuration Routes
 * Super Admin and Institution Admin endpoints for managing feature flags
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { InstitutionModel } from '../models/Institution';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '../types';
import { InstitutionFeatures, InstitutionLimits, InstitutionBranding, InstitutionSecurity } from '../types/institutionConfig';

export const createInstitutionConfigRoutes = (pool: Pool): Router => {
  const router = Router();
  const institutionModel = new InstitutionModel(pool);

  /**
   * GET /api/institutions/:id/config
   * Get full institution configuration
   * Access: Super Admin or Institution Admin
   */
  router.get('/:id/config', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;
      const userInstitutionId = req.user?.institutionId;

      // Check permissions
      if (userRole !== UserRole.MAIN_ADMIN && userInstitutionId !== id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view this institution configuration'
        });
      }

      const config = await institutionModel.getConfig(id);

      if (!config) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Institution not found'
        });
      }

      return res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('Get institution config error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch institution configuration'
      });
    }
  });

  /**
   * PATCH /api/institutions/:id/features
   * Update institution features
   * Access: Super Admin only
   */
  router.patch('/:id/features', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const features: Partial<InstitutionFeatures> = req.body;

      const config = await institutionModel.updateFeatures(id, features);

      return res.json({
        success: true,
        message: 'Features updated successfully',
        data: config
      });
    } catch (error: any) {
      console.error('Update features error:', error);
      return res.status(error.message === 'Institution not found' ? 404 : 500).json({
        error: error.message === 'Institution not found' ? 'Not Found' : 'Internal Server Error',
        message: error.message || 'Failed to update features'
      });
    }
  });

  /**
   * PATCH /api/institutions/:id/limits
   * Update institution limits
   * Access: Super Admin only
   */
  router.patch('/:id/limits', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limits: Partial<InstitutionLimits> = req.body;

      const config = await institutionModel.updateLimits(id, limits);

      return res.json({
        success: true,
        message: 'Limits updated successfully',
        data: config
      });
    } catch (error: any) {
      console.error('Update limits error:', error);
      return res.status(error.message === 'Institution not found' ? 404 : 500).json({
        error: error.message === 'Institution not found' ? 'Not Found' : 'Internal Server Error',
        message: error.message || 'Failed to update limits'
      });
    }
  });

  /**
   * PATCH /api/institutions/:id/branding
   * Update institution branding
   * Access: Super Admin or Institution Admin
   */
  router.patch('/:id/branding', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;
      const userInstitutionId = req.user?.institutionId;

      // Check permissions
      if (userRole !== UserRole.MAIN_ADMIN && (userRole !== UserRole.INSTITUTION_ADMIN || userInstitutionId !== id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to update branding'
        });
      }

      const branding: Partial<InstitutionBranding> = req.body;
      const config = await institutionModel.updateBranding(id, branding);

      return res.json({
        success: true,
        message: 'Branding updated successfully',
        data: config
      });
    } catch (error: any) {
      console.error('Update branding error:', error);
      return res.status(error.message === 'Institution not found' ? 404 : 500).json({
        error: error.message === 'Institution not found' ? 'Not Found' : 'Internal Server Error',
        message: error.message || 'Failed to update branding'
      });
    }
  });

  /**
   * PATCH /api/institutions/:id/security
   * Update institution security settings
   * Access: Super Admin only
   */
  router.patch('/:id/security', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const security: Partial<InstitutionSecurity> = req.body;

      const config = await institutionModel.updateSecurity(id, security);

      return res.json({
        success: true,
        message: 'Security settings updated successfully',
        data: config
      });
    } catch (error: any) {
      console.error('Update security error:', error);
      return res.status(error.message === 'Institution not found' ? 404 : 500).json({
        error: error.message === 'Institution not found' ? 'Not Found' : 'Internal Server Error',
        message: error.message || 'Failed to update security settings'
      });
    }
  });

  /**
   * PATCH /api/institutions/:id/status
   * Update institution status (active, suspended, inactive)
   * Access: Super Admin only
   */
  router.patch('/:id/status', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'suspended', 'inactive'].includes(status)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid status. Must be one of: active, suspended, inactive'
        });
      }

      const config = await institutionModel.updateStatus(id, status);

      return res.json({
        success: true,
        message: 'Status updated successfully',
        data: config
      });
    } catch (error: any) {
      console.error('Update status error:', error);
      return res.status(error.message === 'Institution not found' ? 404 : 500).json({
        error: error.message === 'Institution not found' ? 'Not Found' : 'Internal Server Error',
        message: error.message || 'Failed to update status'
      });
    }
  });

  /**
   * PATCH /api/institutions/:id/plan
   * Update institution plan (free, custom, enterprise)
   * Access: Super Admin only
   */
  router.patch('/:id/plan', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { plan } = req.body;

      if (!['free', 'custom', 'enterprise'].includes(plan)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid plan. Must be one of: free, custom, enterprise'
        });
      }

      const config = await institutionModel.updatePlan(id, plan);

      return res.json({
        success: true,
        message: 'Plan updated successfully',
        data: config
      });
    } catch (error: any) {
      console.error('Update plan error:', error);
      return res.status(error.message === 'Institution not found' ? 404 : 500).json({
        error: error.message === 'Institution not found' ? 'Not Found' : 'Internal Server Error',
        message: error.message || 'Failed to update plan'
      });
    }
  });

  /**
   * GET /api/institutions/:id/stats
   * Get institution statistics
   * Access: Super Admin or Institution Admin
   */
  router.get('/:id/stats', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userRole = req.user?.role;
      const userInstitutionId = req.user?.institutionId;

      // Check permissions
      if (userRole !== UserRole.MAIN_ADMIN && userInstitutionId !== id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view these statistics'
        });
      }

      const stats = await institutionModel.getStats(id);

      return res.json(stats);
    } catch (error) {
      console.error('Get institution stats error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch institution statistics'
      });
    }
  });

  /**
   * GET /api/institutions/configs
   * Get all institution configurations (Super Admin only)
   * Access: Super Admin only
   */
  router.get('/configs', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const configs = await institutionModel.getAllConfigs();

      return res.json({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('Get all configs error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch institution configurations'
      });
    }
  });

  return router;
};
