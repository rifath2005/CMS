import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { AuthorizationError } from '../utils/errors';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if authenticated user has required role(s)
 * Validates: Requirements 1.4, 1.5 (Authorization)
 */

/**
 * Middleware factory to check if user has one of the required roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated (should be set by authenticate middleware)
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        );
      }

      // User has required role, proceed
      next();
    } catch (error: any) {
      if (error instanceof AuthorizationError) {
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authorization check failed',
            timestamp: new Date(),
          },
        });
      }
    }
  };
};

/**
 * Middleware to check if user is a Main Admin
 */
export const requireMainAdmin = requireRole(UserRole.MAIN_ADMIN);

/**
 * Middleware to check if user is an Institution Admin or Main Admin
 */
export const requireInstitutionAdmin = requireRole(
  UserRole.MAIN_ADMIN,
  UserRole.INSTITUTION_ADMIN
);

/**
 * Middleware to check if user is a Vendor
 */
export const requireVendor = requireRole(UserRole.VENDOR);

/**
 * Middleware to check if user is a regular User
 */
export const requireUser = requireRole(UserRole.USER);

/**
 * Middleware to check if user is any authenticated user
 */
export const requireAnyUser = requireRole(
  UserRole.MAIN_ADMIN,
  UserRole.INSTITUTION_ADMIN,
  UserRole.VENDOR,
  UserRole.USER
);

/**
 * Middleware to check if user belongs to a specific institution
 * @param institutionId - Institution ID to check against
 */
export const requireInstitution = (institutionId: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      // Main admins can access any institution
      if (req.user.role === UserRole.MAIN_ADMIN) {
        next();
        return;
      }

      // Check if user belongs to the required institution
      if (req.user.institutionId !== institutionId) {
        throw new AuthorizationError('Access denied. You do not belong to this institution.');
      }

      next();
    } catch (error: any) {
      if (error instanceof AuthorizationError) {
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authorization check failed',
            timestamp: new Date(),
          },
        });
      }
    }
  };
};

/**
 * Middleware to check if user is accessing their own resource
 * @param userIdParam - Name of the route parameter containing the user ID (default: 'userId')
 */
export const requireSelfOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      const targetUserId = req.params[userIdParam] || req.body[userIdParam];

      if (!targetUserId) {
        throw new AuthorizationError('User ID not provided');
      }

      // Main admins and institution admins can access any user
      if (
        req.user.role === UserRole.MAIN_ADMIN ||
        req.user.role === UserRole.INSTITUTION_ADMIN
      ) {
        next();
        return;
      }

      // Regular users can only access their own resources
      if (req.user.userId !== targetUserId) {
        throw new AuthorizationError('Access denied. You can only access your own resources.');
      }

      next();
    } catch (error: any) {
      if (error instanceof AuthorizationError) {
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authorization check failed',
            timestamp: new Date(),
          },
        });
      }
    }
  };
};
