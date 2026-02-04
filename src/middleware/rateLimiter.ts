import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import { config } from '../config/env';

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

/**
 * Rate limiting middleware using Redis
 */
export const rateLimiter = (options: RateLimitOptions = {}) => {
  const {
    windowMs = config.rateLimit.windowMs,
    maxRequests = config.rateLimit.maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if Redis is connected
      if (!redisClient.isOpen) {
        console.warn('Rate limiter: Redis not connected, allowing request');
        return next();
      }

      // Get identifier (IP address or user ID if authenticated)
      const identifier = (req as any).user?.id || req.ip || req.connection.remoteAddress || 'unknown';
      const key = `rate_limit:${identifier}`;

      // Get current request count
      const currentCount = await redisClient.get(key);
      const requestCount = currentCount ? parseInt(currentCount) : 0;

      // Check if limit exceeded
      if (requestCount >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter: Math.ceil(windowMs / 1000),
          },
        });
      }

      // Increment counter
      if (requestCount === 0) {
        // First request in window - set with expiration
        await redisClient.setEx(key, Math.ceil(windowMs / 1000), '1');
      } else {
        // Increment existing counter
        await redisClient.incr(key);
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - requestCount - 1).toString());
      res.setHeader('X-RateLimit-Reset', (Date.now() + windowMs).toString());

      // If skipSuccessfulRequests is true, decrement on successful response
      if (skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function (data: any) {
          if (res.statusCode < 400) {
            redisClient.decr(key).catch(() => {});
          }
          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
};

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5000, // Temporarily increased to 1000 for testing
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});

/**
 * API rate limiter for general endpoints
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: config.nodeEnv === 'development' ? 10000 : 100, // 10000 in dev (effectively disabled), 100 in production
  message: 'Too many requests, please try again later',
});

/**
 * Strict rate limiter for payment endpoints
 */
export const paymentRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 payment attempts per hour
  message: 'Too many payment attempts, please try again later',
});
