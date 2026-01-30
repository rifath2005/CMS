import { redisHelpers } from '../../config/redis';
import { User, UserRole, SessionData } from '../../types';
import { config } from '../../config/env';

/**
 * Session Service
 * Manages user sessions in Redis
 * Validates: Requirements 1.3 (Session Management), 13.4 (Session Expiration)
 */

export class SessionService {
  private sessionTTL: number;

  constructor() {
    this.sessionTTL = config.session.timeout; // Default 24 hours (86400 seconds)
  }

  /**
   * Create a new session for a user
   * @param userId - User ID
   * @param token - JWT token
   * @param role - User role
   * @param institutionId - Institution ID
   * @returns Session data
   */
  async createSession(
    userId: string,
    token: string,
    role: UserRole,
    institutionId: string
  ): Promise<SessionData> {
    const expiresAt = new Date(Date.now() + this.sessionTTL * 1000);

    const sessionData: SessionData = {
      token,
      role,
      institutionId,
      expiresAt,
    };

    // Store session in Redis with TTL
    await redisHelpers.setSession(userId, sessionData, this.sessionTTL);

    return sessionData;
  }

  /**
   * Get session data for a user
   * @param userId - User ID
   * @returns Session data or null if not found/expired
   */
  async getSession(userId: string): Promise<SessionData | null> {
    const sessionData = await redisHelpers.getSession(userId);

    if (!sessionData) {
      return null;
    }

    // Check if session has expired
    const expiresAt = new Date(sessionData.expiresAt);
    if (expiresAt < new Date()) {
      // Session expired, delete it
      await this.deleteSession(userId);
      return null;
    }

    return sessionData;
  }

  /**
   * Delete a user's session (logout)
   * @param userId - User ID
   * @returns true if session was deleted
   */
  async deleteSession(userId: string): Promise<boolean> {
    await redisHelpers.deleteSession(userId);
    return true;
  }

  /**
   * Refresh a session (extend expiration)
   * @param userId - User ID
   * @returns Updated session data or null if session doesn't exist
   */
  async refreshSession(userId: string): Promise<SessionData | null> {
    const sessionData = await this.getSession(userId);

    if (!sessionData) {
      return null;
    }

    // Extend expiration
    const newExpiresAt = new Date(Date.now() + this.sessionTTL * 1000);
    sessionData.expiresAt = newExpiresAt;

    // Update in Redis
    await redisHelpers.setSession(userId, sessionData, this.sessionTTL);

    return sessionData;
  }

  /**
   * Validate if a session exists and is valid
   * @param userId - User ID
   * @returns true if session is valid, false otherwise
   */
  async isSessionValid(userId: string): Promise<boolean> {
    const sessionData = await this.getSession(userId);
    return sessionData !== null;
  }

  /**
   * Get all active sessions count (for monitoring)
   * Note: This is a simplified version. In production, you'd track this differently.
   * @returns Number of active sessions
   */
  async getActiveSessionsCount(): Promise<number> {
    // This is a placeholder - Redis doesn't easily support counting keys by pattern
    // In production, you'd use a separate counter or different data structure
    return 0;
  }
}
