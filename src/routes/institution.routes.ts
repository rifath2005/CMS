import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { InstitutionService } from '../services/institution/InstitutionService';
import { InstitutionStatsService } from '../services/institution/InstitutionStatsService';
import { authenticate } from '../middleware/auth.middleware';
import { requireMainAdmin, requireInstitutionAdmin } from '../middleware/rbac.middleware';
import { ValidationError, NotFoundError } from '../utils/errors';

export const createInstitutionRouter = (pool: Pool): Router => {
  const router = Router();
  const institutionService = new InstitutionService(pool);
  const statsService = new InstitutionStatsService(pool);

  // POST /api/v1/institutions - Create institution (Main Admin only)
  router.post('/', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const { name, domain, address, contactEmail, contactPhone } = req.body;

      if (!name || !domain || !contactEmail) {
        throw new ValidationError('Name, domain, and contact email are required');
      }

      const institution = await institutionService.createInstitution(
        name,
        domain,
        contactEmail,
        contactPhone
      );

      res.status(201).json({
        success: true,
        data: institution,
        message: 'Institution created successfully',
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

  // GET /api/v1/institutions - Get all institutions (Main Admin only)
  router.get('/', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const institutions = await institutionService.getAllInstitutions();

      res.json({
        success: true,
        data: institutions,
        count: institutions.length,
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

  // GET /api/v1/institutions/:id - Get institution by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      const institution = await institutionService.getInstitutionById(institutionId);

      if (!institution) {
        throw new NotFoundError('Institution not found');
      }

      res.json({
        success: true,
        data: institution,
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

  // PUT /api/v1/institutions/:id - Update institution
  router.put('/:id', authenticate, requireInstitutionAdmin, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      const { name, domain, address, contactEmail, contactPhone, isActive } = req.body;

      const institution = await institutionService.updateInstitution(institutionId, {
        name,
        contactEmail,
        contactPhone,
      });

      res.json({
        success: true,
        data: institution,
        message: 'Institution updated successfully',
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

  // DELETE /api/v1/institutions/:id - Delete institution (Main Admin only)
  router.delete('/:id', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      await institutionService.deleteInstitution(institutionId);

      res.json({
        success: true,
        message: 'Institution deleted successfully',
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

  // POST /api/v1/institutions/:id/assign-admin - Assign Institution Admin (Main Admin only)
  router.post('/:id/assign-admin', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      const { userId } = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Update user role to Institution Admin
      const result = await pool.query(
        `UPDATE users 
         SET role = 'Institution_Admin', institution_id = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, role, institution_id`,
        [institutionId, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Institution Admin assigned successfully',
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

  // POST /api/v1/institutions/:id/canteens - Register canteen
  router.post('/:id/canteens', authenticate, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      const { name, description, location, contactPhone, ownerName, ownerEmail } = req.body;

      if (!name || !location || !contactPhone || !ownerName || !ownerEmail) {
        throw new ValidationError('Name, location, contact phone, owner name, and owner email are required');
      }

      const canteen = await institutionService.registerCanteen(
        institutionId,
        name,
        location
      );

      res.status(201).json({
        success: true,
        data: canteen,
        message: 'Canteen registered successfully. Awaiting approval.',
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

  // GET /api/v1/institutions/:id/canteens - Get canteens for institution
  router.get('/:id/canteens', authenticate, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      const activeOnly = req.query.activeOnly === 'true';

      const canteens = activeOnly
        ? await institutionService.getActiveCanteens(institutionId)
        : await institutionService.getCanteensByInstitution(institutionId);

      res.json({
        success: true,
        data: canteens,
        count: canteens.length,
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

  // GET /api/v1/institutions/:id/stats - Get platform stats (Main Admin only)
  router.get('/:id/stats', authenticate, requireMainAdmin, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      const stats = await institutionService.getPlatformStats(institutionId);

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

  // GET /api/v1/institutions/:id/dashboard-stats - Get dashboard stats (Institution Admin)
  router.get('/:id/dashboard-stats', authenticate, requireInstitutionAdmin, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      const stats = await statsService.getDashboardStats(institutionId);

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

  // GET /api/v1/institutions/:id/vendor-workflow - Get vendor approval workflow (Institution Admin)
  router.get('/:id/vendor-workflow', authenticate, requireInstitutionAdmin, async (req: Request, res: Response) => {
    try {
      const institutionId = req.params.id;

      const vendors = await statsService.getVendorApprovalWorkflow(institutionId);

      res.json({
        success: true,
        data: vendors,
        count: vendors.length,
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
