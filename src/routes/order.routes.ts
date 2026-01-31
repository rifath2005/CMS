import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { OrderService } from '../services/order/OrderService';

export function createOrderRoutes(pool: Pool): Router {
  const router = Router();
  const orderService = new OrderService(pool);

  /**
   * POST /api/orders
   * Create a new order
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { userId, paymentId } = req.body;

      if (!userId || !paymentId) {
        return res.status(400).json({
          error: {
            code: 'MISSING_FIELDS',
            message: 'userId and paymentId are required'
          }
        });
      }

      const result = await orderService.createOrder({ userId, paymentId });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'ORDER_CREATION_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/orders/:orderId
   * Get order by ID
   */
  router.get('/:orderId', async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const order = await orderService.getOrderById(orderId);

      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(404).json({
        error: {
          code: 'ORDER_NOT_FOUND',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/orders/user/:userId
   * Get all orders for a user
   */
  router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const orders = await orderService.getUserOrders(userId);

      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_ORDERS_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/orders/vendor/:vendorId
   * Get all orders for a vendor
   */
  router.get('/vendor/:vendorId', async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const orders = await orderService.getVendorOrders(vendorId);

      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_ORDERS_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/orders/vendor/:vendorId/active
   * Get active orders for a vendor
   */
  router.get('/vendor/:vendorId/active', async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const orders = await orderService.getActiveVendorOrders(vendorId);

      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_ACTIVE_ORDERS_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * PUT /api/orders/:orderId/status
   * Update order status
   */
  router.put('/:orderId/status', async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          error: {
            code: 'MISSING_STATUS',
            message: 'Status is required'
          }
        });
      }

      const order = await orderService.updateOrderStatus(orderId, status);

      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'UPDATE_STATUS_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * POST /api/orders/:orderId/verify-delivery
   * Verify delivery with QR code
   */
  router.post('/:orderId/verify-delivery', async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { validationToken } = req.body;

      if (!validationToken) {
        return res.status(400).json({
          error: {
            code: 'MISSING_TOKEN',
            message: 'Validation token is required'
          }
        });
      }

      const order = await orderService.verifyDelivery(orderId, validationToken);

      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'DELIVERY_VERIFICATION_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/orders/:orderId/bill-valid
   * Check if bill is still valid
   */
  router.get('/:orderId/bill-valid', async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const isValid = await orderService.isBillValid(orderId);

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
   * GET /api/orders/:orderId/remaining-time
   * Get remaining time for bill
   */
  router.get('/:orderId/remaining-time', async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const remainingSeconds = await orderService.getRemainingTime(orderId);

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
   * GET /api/orders/user/:userId/history
   * Get order history for user
   */
  router.get('/user/:userId/history', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const orders = await orderService.getUserOrderHistory(userId);

      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_HISTORY_FAILED',
          message: error.message
        }
      });
    }
  });

  return router;
}
