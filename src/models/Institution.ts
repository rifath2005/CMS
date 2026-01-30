import { Pool, QueryResult } from 'pg';
import { Institution } from '../types';

/**
 * Institution model for database operations
 * Validates: Requirements 2.1, 2.5 (Institution Management and Email Domain Configuration)
 */

export class InstitutionModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new institution
   * @param name - Institution name
   * @param emailDomain - Email domain for the institution (e.g., "university.edu")
   * @param contactEmail - Optional contact email
   * @param contactPhone - Optional contact phone
   * @returns Created institution object
   */
  async create(
    name: string,
    emailDomain: string,
    contactEmail?: string,
    contactPhone?: string
  ): Promise<Institution> {
    const query = `
      INSERT INTO institutions (name, email_domain, contact_email, contact_phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email_domain as "emailDomain", 
                contact_email as "contactEmail", contact_phone as "contactPhone",
                created_at as "createdAt"
    `;

    const values = [name, emailDomain, contactEmail || null, contactPhone || null];

    try {
      const result: QueryResult<Institution> = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new Error('Email domain already exists');
      }
      throw error;
    }
  }

  /**
   * Find an institution by ID
   * @param id - Institution ID
   * @returns Institution object or null if not found
   */
  async findById(id: string): Promise<Institution | null> {
    const query = `
      SELECT id, name, email_domain as "emailDomain", 
             contact_email as "contactEmail", contact_phone as "contactPhone",
             created_at as "createdAt"
      FROM institutions
      WHERE id = $1
    `;

    const result: QueryResult<Institution> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find an institution by email domain
   * @param emailDomain - Email domain to search for
   * @returns Institution object or null if not found
   */
  async findByEmailDomain(emailDomain: string): Promise<Institution | null> {
    const query = `
      SELECT id, name, email_domain as "emailDomain", 
             contact_email as "contactEmail", contact_phone as "contactPhone",
             created_at as "createdAt"
      FROM institutions
      WHERE email_domain = $1
    `;

    const result: QueryResult<Institution> = await this.pool.query(query, [emailDomain]);
    return result.rows[0] || null;
  }

  /**
   * Get all institutions
   * @returns Array of all institutions
   */
  async findAll(): Promise<Institution[]> {
    const query = `
      SELECT id, name, email_domain as "emailDomain", 
             contact_email as "contactEmail", contact_phone as "contactPhone",
             created_at as "createdAt"
      FROM institutions
      ORDER BY created_at DESC
    `;

    const result: QueryResult<Institution> = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Update institution information
   * @param id - Institution ID
   * @param data - Partial institution data to update
   * @returns Updated institution object
   */
  async update(
    id: string,
    data: Partial<Pick<Institution, 'name' | 'contactEmail' | 'contactPhone'>>
  ): Promise<Institution> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.contactEmail !== undefined) {
      updates.push(`contact_email = $${paramCount++}`);
      values.push(data.contactEmail);
    }
    if (data.contactPhone !== undefined) {
      updates.push(`contact_phone = $${paramCount++}`);
      values.push(data.contactPhone);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE institutions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email_domain as "emailDomain", 
                contact_email as "contactEmail", contact_phone as "contactPhone",
                created_at as "createdAt"
    `;

    const result: QueryResult<Institution> = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Institution not found');
    }

    return result.rows[0];
  }

  /**
   * Delete an institution
   * @param id - Institution ID
   * @returns true if deletion successful
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM institutions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Check if an email domain is registered
   * @param emailDomain - Email domain to check
   * @returns true if domain exists, false otherwise
   */
  async emailDomainExists(emailDomain: string): Promise<boolean> {
    const query = 'SELECT 1 FROM institutions WHERE email_domain = $1';
    const result = await this.pool.query(query, [emailDomain]);
    return result.rows.length > 0;
  }

  /**
   * Validate if an email belongs to a registered institution
   * @param email - Email address to validate
   * @returns Institution object if email domain is registered, null otherwise
   */
  async validateInstitutionalEmail(email: string): Promise<Institution | null> {
    const domain = email.split('@')[1];
    if (!domain) {
      return null;
    }
    return this.findByEmailDomain(domain);
  }
}
