import { Pool, QueryResult } from 'pg';
import { Canteen, OperatingHours } from '../types';

/**
 * Canteen model for database operations
 * Validates: Requirements 3.1, 3.2 (Canteen and Vendor Management)
 */

export class CanteenModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new canteen with unique vendor ID
   * @param institutionId - Institution ID
   * @param vendorId - Unique vendor identifier (e.g., "SS1", "SS2")
   * @param name - Canteen name
   * @param userId - Optional user ID to link vendor user
   * @param location - Optional location
   * @param operatingHours - Optional operating hours
   * @returns Created canteen object
   */
  async create(
    institutionId: string,
    vendorId: string,
    name: string,
    userId?: string,
    location?: string,
    operatingHours?: OperatingHours
  ): Promise<Canteen> {
    const query = `
      INSERT INTO canteens (institution_id, vendor_id, user_id, name, location, operating_hours)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, institution_id as "institutionId", vendor_id as "vendorId", user_id as "userId",
                name, location, operating_hours as "operatingHours",
                is_active as "isActive", is_approved as "isApproved",
                created_at as "createdAt"
    `;

    const values = [
      institutionId,
      vendorId,
      userId || null,
      name,
      location || null,
      operatingHours ? JSON.stringify(operatingHours) : null,
    ];

    try {
      const result: QueryResult<Canteen> = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new Error('Vendor ID already exists');
      }
      throw error;
    }
  }

  /**
   * Find canteen by user ID
   * @param userId - User ID
   * @returns Canteen object or null if not found
   */
  async findByUserId(userId: string): Promise<Canteen | null> {
    const query = `
      SELECT id, institution_id as "institutionId", vendor_id as "vendorId", user_id as "userId",
             name, location, operating_hours as "operatingHours",
             is_active as "isActive", is_approved as "isApproved",
             created_at as "createdAt"
      FROM canteens
      WHERE user_id = $1
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find a canteen by ID
   * @param id - Canteen ID
   * @returns Canteen object or null if not found
   */
  async findById(id: string): Promise<Canteen | null> {
    const query = `
      SELECT id, institution_id as "institutionId", vendor_id as "vendorId", user_id as "userId",
             name, location, operating_hours as "operatingHours",
             is_active as "isActive", is_approved as "isApproved",
             created_at as "createdAt"
      FROM canteens
      WHERE id = $1
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find a canteen by vendor ID
   * @param vendorId - Vendor ID
   * @returns Canteen object or null if not found
   */
  async findByVendorId(vendorId: string): Promise<Canteen | null> {
    const query = `
      SELECT id, institution_id as "institutionId", vendor_id as "vendorId", user_id as "userId",
             name, location, operating_hours as "operatingHours",
             is_active as "isActive", is_approved as "isApproved",
             created_at as "createdAt"
      FROM canteens
      WHERE vendor_id = $1
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, [vendorId]);
    return result.rows[0] || null;
  }

  /**
   * Get all canteens for an institution
   * @param institutionId - Institution ID
   * @returns Array of canteens
   */
  async findByInstitution(institutionId: string): Promise<Canteen[]> {
    const query = `
      SELECT id, institution_id as "institutionId", vendor_id as "vendorId", user_id as "userId",
             name, location, operating_hours as "operatingHours",
             is_active as "isActive", is_approved as "isApproved",
             created_at as "createdAt"
      FROM canteens
      WHERE institution_id = $1
      ORDER BY created_at DESC
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, [institutionId]);
    return result.rows;
  }

  /**
   * Get all active canteens for an institution
   * @param institutionId - Institution ID
   * @returns Array of active canteens
   */
  async findActiveByInstitution(institutionId: string): Promise<Canteen[]> {
    const query = `
      SELECT id, institution_id as "institutionId", vendor_id as "vendorId", user_id as "userId",
             name, location, operating_hours as "operatingHours",
             is_active as "isActive", is_approved as "isApproved",
             created_at as "createdAt"
      FROM canteens
      WHERE institution_id = $1 AND is_active = true AND is_approved = true
      ORDER BY created_at DESC
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, [institutionId]);
    return result.rows;
  }

  /**
   * Get all canteens
   * @returns Array of all canteens
   */
  async findAll(): Promise<Canteen[]> {
    const query = `
      SELECT id, institution_id as "institutionId", vendor_id as "vendorId", user_id as "userId",
             name, location, operating_hours as "operatingHours",
             is_active as "isActive", is_approved as "isApproved",
             created_at as "createdAt"
      FROM canteens
      ORDER BY created_at DESC
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Update canteen information
   * @param id - Canteen ID
   * @param data - Partial canteen data to update
   * @returns Updated canteen object
   */
  async update(
    id: string,
    data: Partial<Pick<Canteen, 'name' | 'location' | 'operatingHours'>>
  ): Promise<Canteen> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(data.location);
    }
    if (data.operatingHours !== undefined) {
      updates.push(`operating_hours = $${paramCount++}`);
      values.push(JSON.stringify(data.operatingHours));
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const query = `
      UPDATE canteens
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, institution_id as "institutionId", vendor_id as "vendorId",
                name, location, operating_hours as "operatingHours",
                is_active as "isActive", is_approved as "isApproved",
                created_at as "createdAt"
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Canteen not found');
    }

    return result.rows[0];
  }

  /**
   * Approve a vendor/canteen
   * @param id - Canteen ID
   * @returns Updated canteen object
   */
  async approve(id: string): Promise<Canteen> {
    const query = `
      UPDATE canteens
      SET is_approved = true
      WHERE id = $1
      RETURNING id, institution_id as "institutionId", vendor_id as "vendorId",
                name, location, operating_hours as "operatingHours",
                is_active as "isActive", is_approved as "isApproved",
                created_at as "createdAt"
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Canteen not found');
    }

    return result.rows[0];
  }

  /**
   * Deactivate a canteen
   * @param id - Canteen ID
   * @returns Updated canteen object
   */
  async deactivate(id: string): Promise<Canteen> {
    const query = `
      UPDATE canteens
      SET is_active = false
      WHERE id = $1
      RETURNING id, institution_id as "institutionId", vendor_id as "vendorId",
                name, location, operating_hours as "operatingHours",
                is_active as "isActive", is_approved as "isApproved",
                created_at as "createdAt"
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Canteen not found');
    }

    return result.rows[0];
  }

  /**
   * Activate a canteen
   * @param id - Canteen ID
   * @returns Updated canteen object
   */
  async activate(id: string): Promise<Canteen> {
    const query = `
      UPDATE canteens
      SET is_active = true
      WHERE id = $1
      RETURNING id, institution_id as "institutionId", vendor_id as "vendorId",
                name, location, operating_hours as "operatingHours",
                is_active as "isActive", is_approved as "isApproved",
                created_at as "createdAt"
    `;

    const result: QueryResult<Canteen> = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Canteen not found');
    }

    return result.rows[0];
  }

  /**
   * Delete a canteen
   * @param id - Canteen ID
   * @returns true if deletion successful
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM canteens WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Check if vendor ID exists
   * @param vendorId - Vendor ID to check
   * @returns true if vendor ID exists, false otherwise
   */
  async vendorIdExists(vendorId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM canteens WHERE vendor_id = $1';
    const result = await this.pool.query(query, [vendorId]);
    return result.rows.length > 0;
  }

  /**
   * Generate next available vendor ID for an institution
   * @param institutionId - Institution ID
   * @param prefix - Vendor ID prefix (default: "SS")
   * @returns Next available vendor ID (e.g., "SS1", "SS2")
   */
  async generateVendorId(institutionId: string, prefix: string = 'SS'): Promise<string> {
    const query = `
      SELECT vendor_id as "vendorId"
      FROM canteens
      WHERE institution_id = $1 AND vendor_id LIKE $2
      ORDER BY vendor_id DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [institutionId, `${prefix}%`]);

    if (result.rows.length === 0) {
      return `${prefix}1`;
    }

    // Extract number from last vendor ID and increment
    const lastVendorId = result.rows[0].vendorId;
    const numberMatch = lastVendorId.match(/\d+$/);
    
    if (numberMatch) {
      const lastNumber = parseInt(numberMatch[0], 10);
      return `${prefix}${lastNumber + 1}`;
    }

    return `${prefix}1`;
  }
}
