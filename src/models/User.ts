import { Pool, QueryResult } from 'pg';
import { User, UserRole } from '../types';
import { hashPassword, comparePassword } from '../services/auth/password';

/**
 * User model for database operations
 * Validates: Requirements 1.3 (User Authentication), 13.1 (Password Encryption)
 */

export class UserModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new user with optional hashed password or google_id
   * @param email - User email address
   * @param password - Plain text password (optional)
   * @param name - User's full name
   * @param role - User role
   * @param institutionId - Institution ID the user belongs to
   * @param googleId - Optional Google ID for social login
   * @returns Created user object
   */
  async create(
    email: string,
    name: string,
    role: UserRole,
    institutionId: string,
    password?: string,
    googleId?: string
  ): Promise<User> {
    // Hash the password if provided
    const passwordHash = password ? await hashPassword(password) : null;

    const query = `
      INSERT INTO users (email, password_hash, name, role, institution_id, google_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, role, institution_id as "institutionId", google_id as "googleId", created_at as "createdAt", updated_at as "updatedAt"
    `;

    const values = [email, passwordHash, name, role, institutionId, googleId || null];

    try {
      const result: QueryResult<User> = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Find a user by email
   * @param email - User email address
   * @returns User object or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, name, role, institution_id as "institutionId", google_id as "googleId", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE email = $1
    `;

    const result: QueryResult<User> = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find a user by ID
   * @param id - User ID
   * @returns User object or null if not found
   */
  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, name, role, institution_id as "institutionId", google_id as "googleId", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `;

    const result: QueryResult<User> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Verify user credentials
   * @param email - User email address
   * @param password - Plain text password to verify
   * @returns User object if credentials are valid, null otherwise
   */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, name, role, institution_id as "institutionId", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE email = $1
    `;

    const result = await this.pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    // Remove password_hash from returned user object
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Update user role
   * @param userId - User ID
   * @param role - New role to assign
   * @returns Updated user object
   */
  async updateRole(userId: string, role: UserRole): Promise<User> {
    const query = `
      UPDATE users
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name, role, institution_id as "institutionId", 
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result: QueryResult<User> = await this.pool.query(query, [role, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Update user password
   * @param userId - User ID
   * @param newPassword - New plain text password (will be hashed)
   * @returns true if update successful
   */
  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const passwordHash = await hashPassword(newPassword);

    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    const result = await this.pool.query(query, [passwordHash, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Update user profile information
   * @param userId - User ID
   * @param name - New name
   * @returns Updated user object
   */
  async updateProfile(userId: string, name: string): Promise<User> {
    const query = `
      UPDATE users
      SET name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, name, role, institution_id as "institutionId", 
                created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result: QueryResult<User> = await this.pool.query(query, [name, userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Get all users by institution
   * @param institutionId - Institution ID
   * @returns Array of users
   */
  async findByInstitution(institutionId: string): Promise<User[]> {
    const query = `
      SELECT id, email, name, role, institution_id as "institutionId", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE institution_id = $1
      ORDER BY created_at DESC
    `;

    const result: QueryResult<User> = await this.pool.query(query, [institutionId]);
    return result.rows;
  }

  /**
   * Get all users by role
   * @param role - User role
   * @returns Array of users
   */
  async findByRole(role: UserRole): Promise<User[]> {
    const query = `
      SELECT id, email, name, role, institution_id as "institutionId", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE role = $1
      ORDER BY created_at DESC
    `;

    const result: QueryResult<User> = await this.pool.query(query, [role]);
    return result.rows;
  }

  /**
   * Delete a user
   * @param userId - User ID
   * @returns true if deletion successful
   */
  async delete(userId: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Check if email exists
   * @param email - Email address to check
   * @returns true if email exists, false otherwise
   */
  async emailExists(email: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows.length > 0;
  }
}
