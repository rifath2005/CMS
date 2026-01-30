import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AuthService } from '../services/auth/AuthService';
import { UserRole } from '../types';
import { ValidationError } from '../utils/errors';

/**
 * Authentication routes
 * Handles user registration, login, logout, and session management
 * Validates: Requirements 1.1, 1.2, 1.3 (Authentication and Authorization), 13.4 (Session Management)
 */

export const createAuthRouter = (pool: Pool): Router => {
  const router = Router();
  const authService = new AuthService(pool);

  /**
   * POST /api/v1/auth/register
   * Register a new user with institutional email validation
   * 
   * Request body:
   * - email: string (required) - Must belong to a registered institution
   * - password: string (required) - Must meet strength requirements
   * - name: string (required) - User's full name
   * 
   * Response:
   * - 201: User created successfully
   * - 400: Invalid input or email domain not registered
   * - 409: Email already exists
   * 
   * Validates: Requirements 1.1, 1.2 (Institutional Email Validation)
   */
  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        throw new ValidationError('Email, password, and name are required');
      }

      // Validate types
      if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
        throw new ValidationError('Email, password, and name must be strings');
      }

      // Trim inputs
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      if (!trimmedEmail || !trimmedName) {
        throw new ValidationError('Email and name cannot be empty');
      }

      // Register user (includes institutional email validation)
      const user = await authService.register(
        trimmedEmail,
        password,
        trimmedName,
        UserRole.USER
      );

      // Return user without sensitive data
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            institutionId: user.institutionId,
          },
          message: 'Registration successful',
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      // Handle specific error types
      if (error.message.includes('Email domain is not registered')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL_DOMAIN',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else if (error.message.includes('Email already exists')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else if (error.message.includes('Password must be')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        next(error);
      }
    }
  });

  /**
   * POST /api/v1/auth/login
   * Login with email and password
   * Creates a session in Redis with 24-hour expiration
   * 
   * Request body:
   * - email: string (required)
   * - password: string (required)
   * 
   * Response:
   * - 200: Login successful with JWT token and session created
   * - 400: Invalid input
   * - 401: Invalid credentials
   * 
   * Validates: Requirements 1.3 (Authentication), 13.4 (Session Management)
   */
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Validate types
      if (typeof email !== 'string' || typeof password !== 'string') {
        throw new ValidationError('Email and password must be strings');
      }

      // Trim email
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail) {
        throw new ValidationError('Email cannot be empty');
      }

      // Login user (creates session in Redis)
      const authToken = await authService.login(trimmedEmail, password);

      res.status(200).json({
        success: true,
        data: authToken,
        timestamp: new Date(),
      });
    } catch (error: any) {
      if (error.message.includes('Invalid email or password')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            timestamp: new Date(),
          },
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        next(error);
      }
    }
  });

  /**
   * POST /api/v1/auth/validate-email
   * Validate if an email belongs to a registered institution
   * 
   * Request body:
   * - email: string (required)
   * 
   * Response:
   * - 200: Validation result
   * - 400: Invalid input
   * 
   * Validates: Requirements 1.1, 1.2 (Institutional Email Validation)
   */
  router.post('/validate-email', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      // Validate required field
      if (!email) {
        throw new ValidationError('Email is required');
      }

      // Validate type
      if (typeof email !== 'string') {
        throw new ValidationError('Email must be a string');
      }

      // Trim email
      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail) {
        throw new ValidationError('Email cannot be empty');
      }

      // Validate institutional email
      const isValid = await authService.validateInstitutionalEmail(trimmedEmail);

      res.status(200).json({
        success: true,
        data: {
          email: trimmedEmail,
          isValid,
          message: isValid 
            ? 'Email domain is registered' 
            : 'Email domain is not registered with any institution',
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        next(error);
      }
    }
  });

  /**
   * POST /api/v1/auth/logout
   * Logout a user by removing their session from Redis
   * 
   * Request body:
   * - userId: string (required)
   * 
   * Response:
   * - 200: Logout successful
   * - 400: Invalid input
   * - 500: Logout failed
   * 
   * Validates: Requirements 13.4 (Session Management)
   */
  router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;

      // Validate required field
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Validate type
      if (typeof userId !== 'string') {
        throw new ValidationError('User ID must be a string');
      }

      // Logout user (remove session from Redis)
      await authService.logout(userId);

      res.status(200).json({
        success: true,
        data: {
          message: 'Logout successful',
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        next(error);
      }
    }
  });

  /**
   * POST /api/v1/auth/verify-session
   * Verify if a user has a valid session
   * 
   * Request body:
   * - userId: string (required)
   * - token: string (required)
   * 
   * Response:
   * - 200: Session verification result
   * - 400: Invalid input
   * 
   * Validates: Requirements 13.4 (Session Management)
   */
  router.post('/verify-session', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, token } = req.body;

      // Validate required fields
      if (!userId || !token) {
        throw new ValidationError('User ID and token are required');
      }

      // Validate types
      if (typeof userId !== 'string' || typeof token !== 'string') {
        throw new ValidationError('User ID and token must be strings');
      }

      // Verify session
      const isValid = await authService.verifySession(userId, token);

      res.status(200).json({
        success: true,
        data: {
          isValid,
          message: isValid ? 'Session is valid' : 'Session is invalid or expired',
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        next(error);
      }
    }
  });

  /**
   * POST /api/v1/auth/refresh-session
   * Refresh a user's session by extending the TTL
   * 
   * Request body:
   * - userId: string (required)
   * 
   * Response:
   * - 200: Session refreshed successfully
   * - 400: Invalid input
   * - 404: Session not found
   * 
   * Validates: Requirements 13.4 (Session Management)
   */
  router.post('/refresh-session', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;

      // Validate required field
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Validate type
      if (typeof userId !== 'string') {
        throw new ValidationError('User ID must be a string');
      }

      // Refresh session
      const sessionData = await authService.refreshSession(userId);

      if (!sessionData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found or expired',
            timestamp: new Date(),
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Session refreshed successfully',
          expiresAt: sessionData.expiresAt,
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date(),
          },
        });
      } else {
        next(error);
      }
    }
  });

  return router;
};
