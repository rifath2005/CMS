import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { User, UserRole, AuthToken } from '../../types';
import { config } from '../../config/env';

/**
 * JWT token generation and validation utilities
 * Validates: Requirements 1.3 (Role Assignment), 13.4 (Session Expiration)
 */

const JWT_SECRET: jwt.Secret = config.jwt.secret;
const JWT_EXPIRES_IN: StringValue | number = config.jwt.expiresIn as StringValue;

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  institutionId: string;
  canteenId?: string; // For VENDOR role users
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

/**
 * Generate a JWT token for a user
 * @param user - User object to generate token for
 * @param canteenId - Optional canteen ID for vendor users
 * @returns AuthToken object containing the JWT token and user info
 */
export function generateToken(user: User, canteenId?: string): AuthToken {
  const now = Math.floor(Date.now() / 1000);
  const expirationTime = now + (24 * 60 * 60); // 24 hours from now

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    institutionId: user.institutionId,
    canteenId: user.role === UserRole.VENDOR ? canteenId : undefined,
    exp: expirationTime,
    iat: now,
  };

  const token = jwt.sign(payload, JWT_SECRET);

  return {
    token,
    expiresIn: JWT_EXPIRES_IN.toString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
    },
  };
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Additional expiration check
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new jwt.TokenExpiredError('Token has expired', new Date(decoded.exp * 1000));
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param token - JWT token to decode
 * @returns Decoded JWT payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token - JWT token to check
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    verifyToken(token);
    return false;
  } catch (error) {
    if (error instanceof Error && error.message === 'Token has expired') {
      return true;
    }
    return false;
  }
}
