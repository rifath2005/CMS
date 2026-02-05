import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AuthService } from '../services/auth/AuthService';
import { AuditService } from '../services/audit/AuditService';
import { EmailService } from '../services/email/EmailService';
import { authRateLimiter } from '../middleware/rateLimiter';
import { UserRole } from '../types';
import { ValidationError } from '../utils/errors';
import { redisHelpers, redisClient } from '../config/redis';
import { validatePasswordStrength } from '../services/auth/password';
import { config } from '../config/env';
import passport from 'passport';
import { generateToken } from '../services/auth/jwt';

/**
 * Authentication routes
 * Handles user registration, login, logout, and session management
 * Validates: Requirements 1.1, 1.2, 1.3 (Authentication and Authorization), 13.4 (Session Management)
 */

export const createAuthRouter = (pool: Pool): Router => {
  const router = Router();
  const authService = new AuthService(pool);
  const auditService = new AuditService(pool);
  const emailService = new EmailService();

  /**
   * GET /api/v1/auth/institutions
   * Get list of all registered institutions for signup
   * 
   * Response:
   * - 200: List of institutions
   * 
   * Public endpoint - no authentication required
   */
  router.get('/institutions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        'SELECT id, name FROM institutions ORDER BY name ASC'
      );

      res.status(200).json({
        success: true,
        data: {
          institutions: result.rows,
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      next(error);
    }
  });

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
  router.post('/register', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, organizationName } = req.body;

      // Validate required fields
      if (!email || !password || !name || !organizationName) {
        throw new ValidationError('Email, password, name, and organization name are required');
      }

      // Validate types
      if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string' || typeof organizationName !== 'string') {
        throw new ValidationError('All fields must be strings');
      }

      // Trim inputs
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      const trimmedOrgName = organizationName.trim();

      if (!trimmedEmail || !trimmedName || !trimmedOrgName) {
        throw new ValidationError('Email, name, and organization name cannot be empty');
      }

      // Register user with organization name
      const user = await authService.registerWithOrganization(
        trimmedEmail,
        password,
        trimmedName,
        trimmedOrgName,
        UserRole.USER
      );

      // Log registration in audit
      await auditService.logRegistration({
        userId: user.id,
        email: user.email,
        role: user.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

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
      if (error.message.includes('Organization not found')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ORGANIZATION_NOT_FOUND',
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
  router.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

      // Log successful login
      await auditService.logAuthAttempt({
        email: trimmedEmail,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: true,
        userId: authToken.user.id,
      });

      res.status(200).json({
        success: true,
        data: authToken,
        timestamp: new Date(),
      });
    } catch (error: any) {
      // Log failed login attempt
      if (error.message.includes('Invalid email or password')) {
        await auditService.logAuthAttempt({
          email: req.body.email,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: false,
          reason: 'Invalid credentials',
        });

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

  /**
   * POST /api/v1/auth/forgot-password
   * Request password reset - generates OTP and stores in Redis
   * 
   * Request body:
   * - email: string (required)
   * 
   * Response:
   * - 200: OTP sent successfully
   * - 400: Invalid input
   * - 404: Email not found
   */
  router.post('/forgot-password', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        throw new ValidationError('Valid email is required');
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Check if user exists
      const user = await authService.getUserByEmail(trimmedEmail);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No account found with this email',
            timestamp: new Date(),
          },
        });
        return;
      }

      // Check if Redis is connected
      if (!redisClient.isOpen) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Password reset service is temporarily unavailable. Please try again later.',
            timestamp: new Date(),
          },
        });
        return;
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in Redis with 10 minute expiration
      await redisHelpers.setOTP(trimmedEmail, otp, 600);

      // Send OTP via email
      try {
        await emailService.sendOTP(trimmedEmail, otp);
        
        res.status(200).json({
          success: true,
          data: {
            message: 'OTP has been sent to your email. Please check your inbox.',
          },
          timestamp: new Date(),
        });
      } catch (emailError: any) {
        console.error('Failed to send OTP email:', emailError);
        
        // Delete OTP from Redis since email failed
        await redisHelpers.deleteOTP(trimmedEmail);
        
        res.status(500).json({
          success: false,
          error: {
            code: 'EMAIL_SEND_FAILED',
            message: 'Failed to send OTP email. Please check your email address and try again.',
            timestamp: new Date(),
          },
        });
      }
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
   * POST /api/v1/auth/verify-otp
   * Verify OTP for password reset
   * 
   * Request body:
   * - email: string (required)
   * - otp: string (required)
   * 
   * Response:
   * - 200: OTP verified successfully
   * - 400: Invalid input or OTP
   * - 404: Email not found
   */
  router.post('/verify-otp', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
        throw new ValidationError('Email and OTP are required');
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Check if Redis is connected
      if (!redisClient.isOpen) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Password reset service is temporarily unavailable. Please try again later.',
            timestamp: new Date(),
          },
        });
        return;
      }

      // Get stored OTP from Redis
      const storedOTP = await redisHelpers.getOTP(trimmedEmail);

      if (!storedOTP) {
        res.status(400).json({
          success: false,
          error: {
            code: 'OTP_EXPIRED',
            message: 'OTP has expired or does not exist',
            timestamp: new Date(),
          },
        });
        return;
      }

      if (storedOTP !== otp) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OTP',
            message: 'Invalid OTP',
            timestamp: new Date(),
          },
        });
        return;
      }

      // OTP verified - generate reset token valid for 15 minutes
      const resetToken = Math.random().toString(36).substring(2, 15);
      await redisHelpers.setResetToken(trimmedEmail, resetToken, 900);

      // Delete OTP after verification
      await redisHelpers.deleteOTP(trimmedEmail);

      res.status(200).json({
        success: true,
        data: {
          message: 'OTP verified successfully',
          resetToken,
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
   * POST /api/v1/auth/reset-password
   * Reset password using verified reset token
   * 
   * Request body:
   * - email: string (required)
   * - resetToken: string (required)
   * - newPassword: string (required)
   * 
   * Response:
   * - 200: Password reset successfully
   * - 400: Invalid input or token
   * - 404: Email not found
   */
  router.post('/reset-password', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, resetToken, newPassword } = req.body;

      if (!email || !resetToken || !newPassword) {
        throw new ValidationError('Email, reset token, and new password are required');
      }

      if (typeof email !== 'string' || typeof resetToken !== 'string' || typeof newPassword !== 'string') {
        throw new ValidationError('Invalid input types');
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Check if Redis is connected
      if (!redisClient.isOpen) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Password reset service is temporarily unavailable. Please try again later.',
            timestamp: new Date(),
          },
        });
        return;
      }

      // Verify reset token
      const storedToken = await redisHelpers.getResetToken(trimmedEmail);

      if (!storedToken || storedToken !== resetToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired reset token',
            timestamp: new Date(),
          },
        });
        return;
      }

      // Get user
      const user = await authService.getUserByEmail(trimmedEmail);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date(),
          },
        });
        return;
      }

      // Validate password strength
      if (!validatePasswordStrength(newPassword)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Password must be at least 8 characters long and contain at least one letter and one number',
            timestamp: new Date(),
          },
        });
        return;
      }

      // Update password
      await authService.resetPassword(user.id, newPassword);

      // Delete reset token
      await redisHelpers.deleteResetToken(trimmedEmail);

      // Log password reset
      await auditService.logPasswordReset({
        userId: user.id,
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Password reset successfully',
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
   * GET /api/v1/auth/google
   * Start Google OAuth flow
   */
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  /**
   * GET /api/v1/auth/google/callback
   * Google OAuth callback URL
   */
  router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login', session: false }), 
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;
        if (!user) {
          return res.redirect(`${config.cors.origin[0]}/login?error=auth_failed`);
        }

        // Generate JWT token
        const authToken = generateToken(user);
        
        // Log successful social login
        await auditService.logAuthAttempt({
          email: user.email,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: true,
          userId: user.id,
          reason: 'Google OAuth Login'
        });

        // Redirect to frontend with token and user info
        const frontendUrl = config.cors.origin[0];
        res.redirect(`${frontendUrl}/login?token=${authToken.token}&user=${encodeURIComponent(JSON.stringify(authToken.user))}`);
      } catch (error) {
        console.error('Google Auth Callback Error:', error);
        res.redirect(`${config.cors.origin[0]}/login?error=callback_error`);
      }
    }
  );

  return router;
};
