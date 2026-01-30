/**
 * Authentication module exports
 * Provides user authentication, password hashing, and JWT token management
 */

export { AuthService } from './AuthService';
export { hashPassword, comparePassword, validatePasswordStrength } from './password';
export { generateToken, verifyToken, decodeToken, isTokenExpired, JWTPayload } from './jwt';
