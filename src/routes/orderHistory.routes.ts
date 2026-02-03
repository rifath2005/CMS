import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { OrderHistoryService } from '../services/order/OrderHistoryService';

export function createOrderHistoryRoutes(pool: Pool): Router {
  const router = Router();
  const orderHistoryService = new OrderHistoryService(pool);

  /**
   * GET /api/order-history/:userId
   * Get order history for user
   */
  router.get('/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate, vendorId } = req.query;

      const history = await orderHistoryService.getFilteredOrderHistory(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        vendorId as string | undefined
      );

      // Map backend field names to frontend expected names
      const mappedHistory = history.map(order => ({
        id: order.orderId,
        userId: userId,
        vendorId: order.vendorId,
        items: order.items,
        totalAmount: order.totalAmount,
        paymentId: '', // Not needed for history
        status: order.status,
        billGeneratedAt: order.orderDate,
        billExpiresAt: order.orderDate,
        deliveredAt: order.deliveredAt,
        createdAt: order.orderDate // Map orderDate to createdAt
      }));

      res.status(200).json({
        success: true,
        data: mappedHistory
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

  /**
   * GET /api/order-history/:userId/stats
   * Get order history statistics
   */
  router.get('/:userId/stats', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const stats = await orderHistoryService.getHistoryStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_STATS_FAILED',
          message: error.message
        }
      });
    }
  });

  return router;
}
