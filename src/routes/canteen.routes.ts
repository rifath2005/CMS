import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { InstitutionService } from '../services/institution/InstitutionService';
import { authenticate } from '../middleware/auth.middleware';
import { requireInstitutionAdmin } from '../middleware/rbac.middleware';
import { ValidationError, NotFoundError } from '../utils/errors';

export const createCanteenRouter = (pool: Pool): Router => {
  const router = Router();
  const institutionService = new InstitutionService(pool);

  // GET /api/v1/canteens/:id - Get canteen by ID
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const canteenId = req.params.id;

      const canteen = await institutionService.getCanteenById(canteenId);

      if (!canteen) {
        throw new NotFoundError('Canteen not found');
      }

      res.json({
        success: true,
        data: canteen,
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

  // GET /api/v1/canteens/vendor/:vendorId - Get canteen by vendor ID
  router.get('/vendor/:vendorId', authenticate, async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      if (!vendorId) {
        throw new ValidationError('Vendor ID is required');
      }

      const canteen = await institutionService.getCanteenByVendorId(vendorId);

      if (!canteen) {
        throw new NotFoundError('Canteen not found');
      }

      res.json({
        success: true,
        data: canteen,
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

  // PUT /api/v1/canteens/:id - Update canteen
  router.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const canteenId = req.params.id;

      const { name, description, location, contactPhone, ownerName, ownerEmail } = req.body;

      const canteen = await institutionService.updateCanteen(canteenId, {
        name,
        location,
      });

      res.json({
        success: true,
        data: canteen,
        message: 'Canteen updated successfully',
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

  // POST /api/v1/canteens/:id/approve - Approve vendor (Institution Admin only)
  router.post('/:id/approve', authenticate, requireInstitutionAdmin, async (req: Request, res: Response) => {
    try {
      const canteenId = req.params.id;

      const canteen = await institutionService.approveVendor(canteenId);

      res.json({
        success: true,
        data: canteen,
        message: 'Vendor approved successfully',
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

  // POST /api/v1/canteens/:id/deactivate - Deactivate vendor (Institution Admin only)
  router.post('/:id/deactivate', authenticate, requireInstitutionAdmin, async (req: Request, res: Response) => {
    try {
      const canteenId = req.params.id;

      const canteen = await institutionService.deactivateVendor(canteenId);

      res.json({
        success: true,
        data: canteen,
        message: 'Vendor deactivated successfully',
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

  // POST /api/v1/canteens/:id/activate - Activate vendor
  router.post('/:id/activate', authenticate, async (req: Request, res: Response) => {
    try {
      const canteenId = req.params.id;

      const canteen = await institutionService.activateVendor(canteenId);

      res.json({
        success: true,
        data: canteen,
        message: 'Vendor activated successfully',
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

  // DELETE /api/v1/canteens/:id - Delete canteen
  router.delete('/:id', authenticate, requireInstitutionAdmin, async (req: Request, res: Response) => {
    try {
      const canteenId = req.params.id;

      await institutionService.deleteCanteen(canteenId);

      res.json({
        success: true,
        message: 'Canteen deleted successfully',
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
