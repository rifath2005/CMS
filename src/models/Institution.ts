import { Pool, QueryResult } from 'pg';
import { Institution } from '../types';
import {
  InstitutionConfig,
  InstitutionFeatures,
  InstitutionLimits,
  InstitutionBranding,
  InstitutionSecurity,
  InstitutionStatus,
  InstitutionPlan
} from '../types/institutionConfig';

/**
 * Institution model for database operations
 * Validates: Requirements 2.1, 2.5 (Institution Management and Email Domain Configuration)
 * Enhanced with comprehensive feature flag support
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
      SELECT 
        i.id, i.name, i.email_domain as "emailDomain", 
        i.contact_email as "contactEmail", i.contact_phone as "contactPhone",
        i.status, i.plan,
        i.created_at as "createdAt",
        COALESCE((SELECT COUNT(*) FROM users u WHERE u.institution_id = i.id), 0)::int as "usersCount",
        COALESCE((SELECT COUNT(*) FROM canteens c WHERE c.institution_id = i.id), 0)::int as "vendorsCount"
      FROM institutions i
      ORDER BY i.created_at DESC
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

  /**
   * Get institution with full configuration
   * @param id - Institution ID
   * @returns Full institution configuration or null
   */
  async getConfig(id: string): Promise<InstitutionConfig | null> {
    const query = `
      SELECT 
        id, name, email_domain as "emailDomain",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        status, plan, features, limits, branding, security,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM institutions
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Update institution features
   * @param id - Institution ID
   * @param features - Partial features to update
   * @returns Updated institution config
   */
  async updateFeatures(
    id: string,
    features: Partial<InstitutionFeatures>
  ): Promise<InstitutionConfig> {
    const query = `
      UPDATE institutions
      SET features = features || $1::jsonb
      WHERE id = $2
      RETURNING 
        id, name, email_domain as "emailDomain",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        status, plan, features, limits, branding, security,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [JSON.stringify(features), id]);
    
    if (result.rows.length === 0) {
      throw new Error('Institution not found');
    }

    return result.rows[0];
  }

  /**
   * Update institution limits
   * @param id - Institution ID
   * @param limits - Partial limits to update
   * @returns Updated institution config
   */
  async updateLimits(
    id: string,
    limits: Partial<InstitutionLimits>
  ): Promise<InstitutionConfig> {
    const query = `
      UPDATE institutions
      SET limits = limits || $1::jsonb
      WHERE id = $2
      RETURNING 
        id, name, email_domain as "emailDomain",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        status, plan, features, limits, branding, security,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [JSON.stringify(limits), id]);
    
    if (result.rows.length === 0) {
      throw new Error('Institution not found');
    }

    return result.rows[0];
  }

  /**
   * Update institution branding
   * @param id - Institution ID
   * @param branding - Partial branding to update
   * @returns Updated institution config
   */
  async updateBranding(
    id: string,
    branding: Partial<InstitutionBranding>
  ): Promise<InstitutionConfig> {
    const query = `
      UPDATE institutions
      SET branding = branding || $1::jsonb
      WHERE id = $2
      RETURNING 
        id, name, email_domain as "emailDomain",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        status, plan, features, limits, branding, security,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [JSON.stringify(branding), id]);
    
    if (result.rows.length === 0) {
      throw new Error('Institution not found');
    }

    return result.rows[0];
  }

  /**
   * Update institution security settings
   * @param id - Institution ID
   * @param security - Partial security settings to update
   * @returns Updated institution config
   */
  async updateSecurity(
    id: string,
    security: Partial<InstitutionSecurity>
  ): Promise<InstitutionConfig> {
    const query = `
      UPDATE institutions
      SET security = security || $1::jsonb
      WHERE id = $2
      RETURNING 
        id, name, email_domain as "emailDomain",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        status, plan, features, limits, branding, security,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [JSON.stringify(security), id]);
    
    if (result.rows.length === 0) {
      throw new Error('Institution not found');
    }

    return result.rows[0];
  }

  /**
   * Update institution status
   * @param id - Institution ID
   * @param status - New status
   * @returns Updated institution config
   */
  async updateStatus(
    id: string,
    status: InstitutionStatus
  ): Promise<InstitutionConfig> {
    const query = `
      UPDATE institutions
      SET status = $1
      WHERE id = $2
      RETURNING 
        id, name, email_domain as "emailDomain",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        status, plan, features, limits, branding, security,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      throw new Error('Institution not found');
    }

    return result.rows[0];
  }

  /**
   * Update institution plan
   * @param id - Institution ID
   * @param plan - New plan
   * @returns Updated institution config
   */
  async updatePlan(
    id: string,
    plan: InstitutionPlan
  ): Promise<InstitutionConfig> {
    const query = `
      UPDATE institutions
      SET plan = $1
      WHERE id = $2
      RETURNING 
        id, name, email_domain as "emailDomain",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        status, plan, features, limits, branding, security,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [plan, id]);
    
    if (result.rows.length === 0) {
      throw new Error('Institution not found');
    }

    return result.rows[0];
  }

  /**
   * Check if a specific feature is enabled for an institution
   * @param id - Institution ID
   * @param featureKey - Feature key to check
   * @returns true if enabled, false otherwise
   */
  async isFeatureEnabled(id: string, featureKey: string): Promise<boolean> {
    const query = `
      SELECT features->$1 as enabled
      FROM institutions
      WHERE id = $2 AND status = 'active'
    `;

    const result = await this.pool.query(query, [featureKey, id]);
    return result.rows[0]?.enabled === true;
  }

  /**
   * Get all institutions with their configurations (Super Admin)
   * @returns Array of institution configs
   */
  async getAllConfigs(): Promise<InstitutionConfig[]> {
    const query = `
      SELECT 
        id, name, email_domain as "emailDomain",
        contact_email as "contactEmail", contact_phone as "contactPhone",
        status, plan, features, limits, branding, security,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM institutions
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get institution statistics for dashboard
   * @param id - Institution ID
   * @returns Statistics object
   */
  async getStats(id: string): Promise<any> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE institution_id = $1) as users_count,
        (SELECT COUNT(*) FROM canteens WHERE institution_id = $1) as vendors_count,
        (SELECT COUNT(*) FROM orders WHERE institution_id = $1 AND DATE(created_at) = CURRENT_DATE) as orders_today,
        (SELECT COUNT(*) FROM orders WHERE institution_id = $1 AND status IN ('pending', 'accepted', 'preparing')) as active_orders
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}
