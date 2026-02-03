/**
 * Institution Configuration Routes
 * Super Admin and Institution Admin endpoints for managing feature flags
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { InstitutionModel } from '../models/Institution';
import { authenticate, requireRole } from '../middleware/auth';
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
      if (userRole !== 'super_admin' && userInstitutionId !== id) {
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

      res.json(config);
    } catch (error) {
      console.error('Get institution config error:', error);
      res.status(500).json({
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
  router.patch('/:id/features', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const features: Partial<InstitutionFeatures> = req.body;

      const config = await institutionModel.updateFeatures(id, features);

      res.json({
        message: 'Features updated successfully',
        config
      });
    } catch (error: any) {
      console.error('Update features error:', error);
      res.status(error.message === 'Institution not found' ? 404 : 500).json({
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
  router.patch('/:id/limits', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limits: Partial<InstitutionLimits> = req.body;

      const config = await institutionModel.updateLimits(id, limits);

      res.json({
        message: 'Limits updated successfully',
        config
      });
    } catch (error: any) {
      console.error('Update limits error:', error);
      res.status(error.message === 'Institution not found' ? 404 : 500).json({
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
      if (userRole !== 'super_admin' && (userRole !== 'institution_admin' || userInstitutionId !== id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to update branding'
        });
      }

      const branding: Partial<InstitutionBranding> = req.body;
      const config = await institutionModel.updateBranding(id, branding);

      res.json({
        message: 'Branding updated successfully',
        config
      });
    } catch (error: any) {
      console.error('Update branding error:', error);
      res.status(error.message === 'Institution not found' ? 404 : 500).json({
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
  router.patch('/:id/security', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const security: Partial<InstitutionSecurity> = req.body;

      const config = await institutionModel.updateSecurity(id, security);

      res.json({
        message: 'Security settings updated successfully',
        config
      });
    } catch (error: any) {
      console.error('Update security error:', error);
      res.status(error.message === 'Institution not found' ? 404 : 500).json({
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
  router.patch('/:id/status', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
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

      res.json({
        message: 'Status updated successfully',
        config
      });
    } catch (error: any) {
      console.error('Update status error:', error);
      res.status(error.message === 'Institution not found' ? 404 : 500).json({
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
  router.patch('/:id/plan', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
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

      res.json({
        message: 'Plan updated successfully',
        config
      });
    } catch (error: any) {
      console.error('Update plan error:', error);
      res.status(error.message === 'Institution not found' ? 404 : 500).json({
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
      if (userRole !== 'super_admin' && userInstitutionId !== id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view these statistics'
        });
      }

      const stats = await institutionModel.getStats(id);

      res.json(stats);
    } catch (error) {
      console.error('Get institution stats error:', error);
      res.status(500).json({
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
  router.get('/configs', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const configs = await institutionModel.getAllConfigs();

      res.json(configs);
    } catch (error) {
      console.error('Get all configs error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch institution configurations'
      });
    }
  });

  return router;
};
