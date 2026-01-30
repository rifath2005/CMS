import { Pool } from 'pg';
import { User, UserRole, AuthToken, SessionData } from '../../types';
import { UserModel } from '../../models/User';
import { InstitutionModel } from '../../models/Institution';
import { generateToken, verifyToken, JWTPayload } from './jwt';
import { validatePasswordStrength } from './password';
import { isValidEmail } from '../../utils/validators';
import { redisHelpers } from '../../config/redis';

/**
 * Authentication Service
 * Handles user registration, login, and token management
 * Validates: Requirements 1.1, 1.2 (Institutional Email Validation), 1.3 (Authentication and Authorization), 13.1 (Password Encryption), 13.4 (Session Management)
 */

export class AuthService {
  private userModel: UserModel;
  private institutionModel: InstitutionModel;
  private readonly SESSION_TTL = 86400; // 24 hours in seconds

  constructor(pool: Pool) {
    this.userModel = new UserModel(pool);
    this.institutionModel = new InstitutionModel(pool);
  }

  /**
   * Register a new user with institutional email validation
   * @param email - User email address (must belong to a registered institution)
   * @param password - Plain text password
   * @param name - User's full name
   * @param role - User role (defaults to USER)
   * @returns Created user object
   * @throws Error if email domain is invalid, email already exists, or password is weak
   * Validates: Requirements 1.1, 1.2 (Institutional Email Validation)
   */
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = UserRole.USER
  ): Promise<User> {
    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate institutional email domain (Requirements 1.1, 1.2)
    const institution = await this.institutionModel.validateInstitutionalEmail(email);
    if (!institution) {
      throw new Error('Email domain is not registered with any institution. Please use your institutional email address.');
    }

    // Validate password strength
    if (!validatePasswordStrength(password)) {
      throw new Error(
        'Password must be at least 8 characters long and contain at least one letter and one number'
      );
    }

    // Check if email already exists
    const existingUser = await this.userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Create user with hashed password and institution ID from validated domain
    return this.userModel.create(email, password, name, role, institution.id);
  }

  /**
   * Validate if an email belongs to a registered institution
   * @param email - Email address to validate
   * @returns true if email domain is registered, false otherwise
   * Validates: Requirements 1.1, 1.2 (Institutional Email Validation)
   */
  async validateInstitutionalEmail(email: string): Promise<boolean> {
    if (!isValidEmail(email)) {
      return false;
    }
    
    const institution = await this.institutionModel.validateInstitutionalEmail(email);
    return institution !== null;
  }

  /**
   * Login a user with email and password
   * Stores session in Redis for session management
   * @param email - User email address
   * @param password - Plain text password
   * @returns AuthToken containing JWT token and user info
   * @throws Error if credentials are invalid
   * Validates: Requirements 1.3 (Authentication), 13.4 (Session Management)
   */
  async login(email: string, password: string): Promise<AuthToken> {
    // Verify credentials
    const user = await this.userModel.verifyCredentials(email, password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const authToken = generateToken(user);

    // Calculate expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.SESSION_TTL);

    // Store session in Redis (Requirement 13.4)
    const sessionData: SessionData = {
      token: authToken.token,
      role: user.role,
      institutionId: user.institutionId,
      expiresAt,
    };

    await redisHelpers.setSession(user.id, sessionData, this.SESSION_TTL);

    return authToken;
  }

  /**
   * Verify a JWT token and return the user
   * @param token - JWT token to verify
   * @returns User object if token is valid
   * @throws Error if token is invalid or expired
   */
  async verifyTokenAndGetUser(token: string): Promise<User> {
    // Verify and decode token
    const payload: JWTPayload = verifyToken(token);

    // Fetch user from database
    const user = await this.userModel.findById(payload.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Logout a user by removing their session from Redis
   * @param userId - User ID
   * @returns true if logout successful
   * Validates: Requirements 13.4 (Session Management)
   */
  async logout(userId: string): Promise<boolean> {
    try {
      await redisHelpers.deleteSession(userId);
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Get session data for a user from Redis
   * @param userId - User ID
   * @returns SessionData if session exists, null otherwise
   * Validates: Requirements 13.4 (Session Management)
   */
  async getSession(userId: string): Promise<SessionData | null> {
    try {
      const sessionData = await redisHelpers.getSession(userId);
      
      if (!sessionData) {
        return null;
      }

      // Check if session has expired
      const expiresAt = new Date(sessionData.expiresAt);
      if (expiresAt < new Date()) {
        // Session expired, remove it
        await redisHelpers.deleteSession(userId);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  }

  /**
   * Verify if a user has a valid session
   * @param userId - User ID
   * @param token - JWT token to verify against stored session
   * @returns true if session is valid, false otherwise
   * Validates: Requirements 13.4 (Session Management)
   */
  async verifySession(userId: string, token: string): Promise<boolean> {
    try {
      // Get session from Redis
      const sessionData = await this.getSession(userId);
      
      if (!sessionData) {
        return false;
      }

      // Verify token matches stored session token
      if (sessionData.token !== token) {
        return false;
      }

      // Verify JWT token is still valid
      try {
        verifyToken(token);
        return true;
      } catch {
        // Token is invalid or expired, remove session
        await redisHelpers.deleteSession(userId);
        return false;
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      return false;
    }
  }

  /**
   * Refresh a user's session by extending the TTL
   * @param userId - User ID
   * @returns Updated SessionData if successful, null otherwise
   * Validates: Requirements 13.4 (Session Management)
   */
  async refreshSession(userId: string): Promise<SessionData | null> {
    try {
      const sessionData = await this.getSession(userId);
      
      if (!sessionData) {
        return null;
      }

      // Calculate new expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + this.SESSION_TTL);

      // Update session with new expiration
      const updatedSessionData: SessionData = {
        ...sessionData,
        expiresAt,
      };

      await redisHelpers.setSession(userId, updatedSessionData, this.SESSION_TTL);

      return updatedSessionData;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  }

  /**
   * Assign a role to a user
   * @param userId - User ID
   * @param role - Role to assign
   * @returns Updated user object
   */
  async assignRole(userId: string, role: UserRole): Promise<User> {
    return this.userModel.updateRole(userId, role);
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param oldPassword - Current password
   * @param newPassword - New password
   * @returns true if password changed successfully
   * @throws Error if old password is incorrect or new password is weak
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Get user
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const validUser = await this.userModel.verifyCredentials(user.email, oldPassword);
    if (!validUser) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    if (!validatePasswordStrength(newPassword)) {
      throw new Error(
        'Password must be at least 8 characters long and contain at least one letter and one number'
      );
    }

    // Update password
    return this.userModel.updatePassword(userId, newPassword);
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User object or null if not found
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId);
  }

  /**
   * Get user by email
   * @param email - User email address
   * @returns User object or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findByEmail(email);
  }
}
