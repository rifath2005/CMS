import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { VendorOrderService } from '../services/vendor/VendorOrderService';
import { VendorAnalyticsService } from '../services/vendor/VendorAnalyticsService';

export function createVendorRoutes(pool: Pool): Router {
  const router = Router();
  const vendorOrderService = new VendorOrderService(pool);
  const vendorAnalyticsService = new VendorAnalyticsService(pool);

  /**
   * GET /api/vendor/:vendorId/active-orders
   * Get active orders for vendor
   */
  router.get('/:vendorId/active-orders', async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const orders = await vendorOrderService.getActiveOrders(vendorId);

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
   * GET /api/vendor/:vendorId/order-history
   * Get completed/delivered orders for vendor
   */
  router.get('/:vendorId/order-history', async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const orders = await vendorOrderService.getOrderHistory(vendorId);

      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_ORDER_HISTORY_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/vendor/:vendorId/combined-items
   * Get combined item list for vendor
   */
  router.get('/:vendorId/combined-items', async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const items = await vendorOrderService.getCombinedItemList(vendorId);

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_COMBINED_ITEMS_FAILED',
          message: error.message
        }
      });
    }
  });

  /**
   * GET /api/vendor/order/:orderId/detail
   * Get order detail
   */
  router.get('/order/:orderId/detail', async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;

      const detail = await vendorOrderService.getOrderDetail(orderId);

      res.status(200).json({
        success: true,
        data: detail
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
   * GET /api/vendor/:vendorId/stats
   * Get vendor statistics
   */
  router.get('/:vendorId/stats', async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const stats = await vendorOrderService.getVendorStats(vendorId);

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

  /**
   * GET /api/vendor/:vendorId/analytics
   * Get vendor analytics
   */
  router.get('/:vendorId/analytics', async (req: Request, res: Response) => {
    try {
      const { vendorId } = req.params;

      const analytics = await vendorAnalyticsService.getAnalytics(vendorId);

      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(400).json({
        error: {
          code: 'GET_ANALYTICS_FAILED',
          message: error.message
        }
      });
    }
  });

  return router;
}
