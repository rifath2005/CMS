import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../services/auth/jwt';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 * Validates: Requirements 1.3, 1.4 (Authentication and Authorization)
 */

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT token
 * Expects token in Authorization header: "Bearer <token>"
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authorization format. Use: Bearer <token>');
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Verify token
    try {
      const payload = verifyToken(token);
      
      // Attach user info to request
      req.user = payload;
      
      next();
    } catch (error: any) {
      if (error.message === 'Token has expired') {
        throw new AuthenticationError('Token has expired');
      } else if (error.message === 'Invalid token') {
        throw new AuthenticationError('Invalid token');
      }
      throw new AuthenticationError('Token verification failed');
    }
  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
          timestamp: new Date(),
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed',
          timestamp: new Date(),
        },
      });
    }
  }
};

/**
 * Middleware to check if user is authenticated (optional authentication)
 * Attaches user info if token is valid, but doesn't fail if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const payload = verifyToken(token);
        req.user = payload;
      } catch {
        // Token is invalid, but we don't fail - just continue without user
      }
    }

    next();
  } catch (error) {
    // Even if there's an error, continue without authentication
    next();
  }
};
