/**
 * Institution Admins Management Routes
 * Super Admin endpoints for managing institution administrator accounts
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { authenticate, requireRole } from '../middleware/auth';

export const createInstitutionAdminsRoutes = (pool: Pool): Router => {
  const router = Router();

  /**
   * GET /api/super-admin/institution-admins
   * Get all institution admins
   * Access: Super Admin only
   */
  router.get('/', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.institution_id as "institutionId",
          i.name as "institutionName",
          u.status,
          u.last_login as "lastLogin",
          u.created_at as "createdAt"
        FROM users u
        JOIN institutions i ON u.institution_id = i.id
        WHERE u.role = 'institution_admin'
        ORDER BY u.created_at DESC
      `;

      const result = await pool.query(query);

      res.json(result.rows);
    } catch (error) {
      console.error('Get institution admins error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch institution admins'
      });
    }
  });

  /**
   * GET /api/super-admin/institution-admins/:id
   * Get specific institution admin
   * Access: Super Admin only
   */
  router.get('/:id', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.institution_id as "institutionId",
          i.name as "institutionName",
          u.status,
          u.last_login as "lastLogin",
          u.created_at as "createdAt"
        FROM users u
        JOIN institutions i ON u.institution_id = i.id
        WHERE u.id = $1 AND u.role = 'institution_admin'
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Institution admin not found'
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get institution admin error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch institution admin'
      });
    }
  });

  /**
   * POST /api/super-admin/institution-admins
   * Create new institution admin
   * Access: Super Admin only
   */
  router.post('/', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { name, email, institutionId, password } = req.body;

      // Validation
      if (!name || !email || !institutionId || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Name, email, institution ID, and password are required'
        });
      }

      // Check if email already exists
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Email already exists'
        });
      }

      // Check if institution exists
      const institutionCheck = await pool.query(
        'SELECT id FROM institutions WHERE id = $1',
        [institutionId]
      );

      if (institutionCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Institution not found'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin
      const query = `
        INSERT INTO users (name, email, password, role, institution_id, status)
        VALUES ($1, $2, $3, 'institution_admin', $4, 'active')
        RETURNING 
          id, name, email, institution_id as "institutionId", 
          role, status, created_at as "createdAt"
      `;

      const result = await pool.query(query, [name, email, hashedPassword, institutionId]);

      res.status(201).json({
        message: 'Institution admin created successfully',
        admin: result.rows[0]
      });
    } catch (error) {
      console.error('Create institution admin error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create institution admin'
      });
    }
  });

  /**
   * PATCH /api/super-admin/institution-admins/:id
   * Update institution admin details
   * Access: Super Admin only
   */
  router.patch('/:id', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email, institutionId } = req.body;

      // Check if admin exists
      const adminCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [id, 'institution_admin']
      );

      if (adminCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Institution admin not found'
        });
      }

      // Check if email is taken by another user
      if (email) {
        const emailCheck = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, id]
        );

        if (emailCheck.rows.length > 0) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'Email already exists'
          });
        }
      }

      // Build update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(email);
      }
      if (institutionId !== undefined) {
        updates.push(`institution_id = $${paramCount++}`);
        values.push(institutionId);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No fields to update'
        });
      }

      values.push(id);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING 
          id, name, email, institution_id as "institutionId", 
          role, status, created_at as "createdAt"
      `;

      const result = await pool.query(query, values);

      res.json({
        message: 'Institution admin updated successfully',
        admin: result.rows[0]
      });
    } catch (error) {
      console.error('Update institution admin error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update institution admin'
      });
    }
  });

  /**
   * POST /api/super-admin/institution-admins/:id/reset-password
   * Reset admin password
   * Access: Super Admin only
   */
  router.post('/:id/reset-password', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Password is required'
        });
      }

      // Check if admin exists
      const adminCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [id, 'institution_admin']
      );

      if (adminCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Institution admin not found'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, id]
      );

      res.json({
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reset password'
      });
    }
  });

  /**
   * PATCH /api/super-admin/institution-admins/:id/status
   * Toggle admin status (active/disabled)
   * Access: Super Admin only
   */
  router.patch('/:id/status', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'disabled'].includes(status)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Status must be either "active" or "disabled"'
        });
      }

      // Check if admin exists
      const adminCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [id, 'institution_admin']
      );

      if (adminCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Institution admin not found'
        });
      }

      // Update status
      const query = `
        UPDATE users
        SET status = $1
        WHERE id = $2
        RETURNING 
          id, name, email, institution_id as "institutionId", 
          role, status, created_at as "createdAt"
      `;

      const result = await pool.query(query, [status, id]);

      res.json({
        message: `Admin ${status === 'active' ? 'enabled' : 'disabled'} successfully`,
        admin: result.rows[0]
      });
    } catch (error) {
      console.error('Update admin status error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update admin status'
      });
    }
  });

  /**
   * DELETE /api/super-admin/institution-admins/:id
   * Delete institution admin
   * Access: Super Admin only
   */
  router.delete('/:id', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if admin exists
      const adminCheck = await pool.query(
        'SELECT id, name FROM users WHERE id = $1 AND role = $2',
        [id, 'institution_admin']
      );

      if (adminCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Institution admin not found'
        });
      }

      // Delete admin
      await pool.query('DELETE FROM users WHERE id = $1', [id]);

      res.json({
        message: 'Institution admin deleted successfully',
        deletedAdmin: adminCheck.rows[0]
      });
    } catch (error) {
      console.error('Delete institution admin error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete institution admin'
      });
    }
  });

  /**
   * GET /api/super-admin/institution-admins/stats
   * Get institution admins statistics
   * Access: Super Admin only
   */
  router.get('/stats/summary', authenticate, requireRole('super_admin'), async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'disabled') as disabled,
          COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days') as active_last_week
        FROM users
        WHERE role = 'institution_admin'
      `;

      const result = await pool.query(query);

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch admin statistics'
      });
    }
  });

  return router;
};
