import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { PaymentService } from '../services/payment/PaymentService';
import { UpiWebhookPayload } from '../services/payment/UpiGateway';

export function createPaymentRoutes(pool: Pool): Router {
  const router = Router();
  const paymentService = new PaymentService(pool);

  /**
   * POST /api/payments/initiate
   * Initiate a new payment
   */
  router.post('/initiate', async (req: Request, res: Response) => {
    try {
      const { userId, amount, orderId } = req.body;

      if (!userId || !amount) {
        return res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'userId and amount are required'
          }
        });
      }

      const paymentIntent = await paymentService.initiatePayment(
        userId,
        parseFloat(amount),
        orderId
      );

      res.status(201).json({
        success: true,
        data: paymentIntent
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'PAYMENT_INITIATION_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/payments/:paymentId
   * Get payment details
   */
  router.get('/:paymentId', async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;

      const payment = await paymentService.getPaymentDetails(paymentId);

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      res.status(404).json({
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/payments/:paymentId/verify
   * Verify payment status
   */
  router.get('/:paymentId/verify', async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;

      const status = await paymentService.verifyPayment(paymentId);

      res.status(200).json({
        success: true,
        data: {
          paymentId,
          status
        }
      });
    } catch (error: any) {
      res.status(404).json({
        error: {
          code: 'PAYMENT_VERIFICATION_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * POST /api/payments/webhook
   * Handle UPI gateway webhook
   */
  router.post('/webhook', async (req: Request, res: Response) => {
    try {
      const webhookPayload: UpiWebhookPayload = req.body;

      const payment = await paymentService.processWebhook(webhookPayload);

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/payments/user/:userId
   * Get all payments for a user
   */
  router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const payments = await paymentService.getUserPayments(userId);

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'FETCH_PAYMENTS_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * POST /api/payments/:paymentId/refund
   * Process refund for a payment
   */
  router.post('/:paymentId/refund', async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const { amount } = req.body;

      if (!amount) {
        return res.status(400).json({
          error: {
            code: 'MISSING_AMOUNT',
            message: 'Refund amount is required'
          }
        });
      }

      const refund = await paymentService.processRefund(
        paymentId,
        parseFloat(amount)
      );

      res.status(200).json({
        success: true,
        data: refund
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'REFUND_FAILED',
          message: error.message
        }
      });
    }
  });

  return router;
}
