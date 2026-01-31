import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { BillService } from '../services/bill/BillService';

export function createBillRoutes(pool: Pool): Router {
  const router = Router();
  const billService = new BillService(pool);

  /**
   * GET /api/bills/order/:orderId
   * Get digital bill for an order
   */
  router.get('/order/:orderId', async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const bill = await billService.getBillByOrderId(orderId);

      res.status(200).json({
        success: true,
        data: bill
      });
    } catch (error: any) {
      res.status(404).json({
        error: {
          code: 'BILL_NOT_FOUND',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/bills/:billId/valid
   * Check if bill is still valid
   */
  router.get('/:billId/valid', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;

      const isValid = await billService.checkBillValidity(billId);

      res.status(200).json({
        success: true,
        data: { isValid }
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'CHECK_VALIDITY_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/bills/:billId/remaining-time
   * Get remaining time for bill
   */
  router.get('/:billId/remaining-time', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;

      const remainingSeconds = await billService.getRemainingTime(billId);

      res.status(200).json({
        success: true,
        data: { remainingSeconds }
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_REMAINING_TIME_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * POST /api/bills/:billId/expire
   * Mark bill as expired
   */
  router.post('/:billId/expire', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;

      await billService.markBillAsExpired(billId);

      res.status(200).json({
        success: true,
        message: 'Bill marked as expired'
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'EXPIRE_BILL_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * POST /api/bills/verify-qr
   * Verify QR code
   */
  router.post('/verify-qr', async (req: Request, res: Response) => {
    try {
      const { qrData } = req.body;

      if (!qrData) {
        return res.status(400).json({
          error: {
            code: 'MISSING_QR_DATA',
            message: 'QR data is required'
          }
        });
      }

      const result = await billService.verifyQRCode(qrData);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'QR_VERIFICATION_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * POST /api/bills/:billId/confirm-delivery
   * Confirm delivery
   */
  router.post('/:billId/confirm-delivery', async (req: Request, res: Response) => {
    try {
      const { billId } = req.params;
      const { validationToken } = req.body;

      if (!validationToken) {
        return res.status(400).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'Validation token is required'
          }
        });
      }

      await billService.confirmDelivery(billId, validationToken);

      res.status(200).json({
        success: true,
        message: 'Delivery confirmed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'CONFIRM_DELIVERY_FAILED',
          message: error.message
        }
      });
    }
  });

  return router;
}
