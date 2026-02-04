/**
 * Super Admin Vendors Routes
 * Read-only vendor monitoring across all institutions
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '../types';

export const createSuperAdminVendorsRoutes = (pool: Pool): Router => {
  const router = Router();

  /**
   * GET /api/super-admin/vendors
   * Get all vendors across all institutions (read-only)
   * Access: Super Admin only
   */
  router.get('/', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.institution_id as "institutionId",
          i.name as "institutionName",
          c.status,
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          COALESCE(
            (SELECT COUNT(*) 
             FROM orders o 
             WHERE o.canteen_id = c.id 
             AND DATE(o.created_at) = CURRENT_DATE),
            0
          ) as "ordersToday",
          COALESCE(
            (SELECT COUNT(*) 
             FROM orders o 
             WHERE o.canteen_id = c.id),
            0
          ) as "totalOrders",
          COALESCE(
            (SELECT SUM(o.total_amount) 
             FROM orders o 
             WHERE o.canteen_id = c.id 
             AND o.status = 'completed'),
            0
          ) as "revenue",
          COALESCE(
            (SELECT COUNT(*) 
             FROM products p 
             WHERE p.canteen_id = c.id),
            0
          ) as "productsCount",
          (SELECT MAX(o.created_at) 
           FROM orders o 
           WHERE o.canteen_id = c.id) as "lastActive"
        FROM canteens c
        JOIN institutions i ON c.institution_id = i.id
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query);

      return res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get vendors error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch vendors'
      });
    }
  });

  /**
   * GET /api/super-admin/vendors/:id
   * Get specific vendor details (read-only)
   * Access: Super Admin only
   */
  router.get('/:id', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          c.id,
          c.name,
          c.institution_id as "institutionId",
          i.name as "institutionName",
          c.status,
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          COALESCE(
            (SELECT COUNT(*) 
             FROM orders o 
             WHERE o.canteen_id = c.id 
             AND DATE(o.created_at) = CURRENT_DATE),
            0
          ) as "ordersToday",
          COALESCE(
            (SELECT COUNT(*) 
             FROM orders o 
             WHERE o.canteen_id = c.id),
            0
          ) as "totalOrders",
          COALESCE(
            (SELECT SUM(o.total_amount) 
             FROM orders o 
             WHERE o.canteen_id = c.id 
             AND o.status = 'completed'),
            0
          ) as "revenue",
          COALESCE(
            (SELECT COUNT(*) 
             FROM products p 
             WHERE p.canteen_id = c.id),
            0
          ) as "productsCount",
          (SELECT MAX(o.created_at) 
           FROM orders o 
           WHERE o.canteen_id = c.id) as "lastActive"
        FROM canteens c
        JOIN institutions i ON c.institution_id = i.id
        WHERE c.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Vendor not found'
        });
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Get vendor error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch vendor'
      });
    }
  });

  /**
   * GET /api/super-admin/vendors/:id/products
   * Get vendor products (read-only)
   * Access: Super Admin only
   */
  router.get('/:id/products', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          p.id,
          p.name,
          p.description,
          p.price,
          p.category,
          p.is_available as "isAvailable",
          p.created_at as "createdAt",
          COALESCE(
            (SELECT COUNT(*) 
             FROM order_items oi 
             JOIN orders o ON oi.order_id = o.id
             WHERE oi.product_id = p.id),
            0
          ) as "totalOrders"
        FROM products p
        WHERE p.canteen_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, [id]);

      return res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get vendor products error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch vendor products'
      });
    }
  });

  /**
   * GET /api/super-admin/vendors/:id/orders
   * Get vendor orders (read-only)
   * Access: Super Admin only
   */
  router.get('/:id/orders', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const query = `
        SELECT 
          o.id,
          o.order_number as "orderNumber",
          o.status,
          o.total_amount as "totalAmount",
          o.created_at as "createdAt",
          u.name as "userName",
          u.email as "userEmail"
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.canteen_id = $1
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [id, limit, offset]);

      return res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get vendor orders error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch vendor orders'
      });
    }
  });

  /**
   * GET /api/super-admin/vendors/stats/summary
   * Get vendor statistics summary
   * Access: Super Admin only
   */
  router.get('/stats/summary', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as "totalVendors",
          COUNT(*) FILTER (WHERE status = 'active') as "activeVendors",
          COUNT(*) FILTER (WHERE status = 'inactive') as "inactiveVendors",
          COUNT(*) FILTER (WHERE status = 'suspended') as "suspendedVendors",
          COALESCE(
            (SELECT COUNT(*) 
             FROM orders 
             WHERE DATE(created_at) = CURRENT_DATE),
            0
          ) as "ordersToday",
          COALESCE(
            (SELECT SUM(total_amount) 
             FROM orders 
             WHERE status = 'completed'),
            0
          ) as "totalRevenue",
          COALESCE(
            (SELECT COUNT(*) 
             FROM products),
            0
          ) as "totalProducts"
        FROM canteens
      `;

      const result = await pool.query(query);

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Get vendor stats error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch vendor statistics'
      });
    }
  });

  /**
   * GET /api/super-admin/vendors/by-institution/:institutionId
   * Get vendors by institution (read-only)
   * Access: Super Admin only
   */
  router.get('/by-institution/:institutionId', authenticate, requireRole(UserRole.MAIN_ADMIN), async (req: Request, res: Response) => {
    try {
      const { institutionId } = req.params;

      const query = `
        SELECT 
          c.id,
          c.name,
          c.status,
          c.created_at as "createdAt",
          COALESCE(
            (SELECT COUNT(*) 
             FROM orders o 
             WHERE o.canteen_id = c.id 
             AND DATE(o.created_at) = CURRENT_DATE),
            0
          ) as "ordersToday",
          COALESCE(
            (SELECT COUNT(*) 
             FROM orders o 
             WHERE o.canteen_id = c.id),
            0
          ) as "totalOrders",
          COALESCE(
            (SELECT COUNT(*) 
             FROM products p 
             WHERE p.canteen_id = c.id),
            0
          ) as "productsCount"
        FROM canteens c
        WHERE c.institution_id = $1
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, [institutionId]);

      return res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get vendors by institution error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch vendors by institution'
      });
    }
  });

  return router;
};
