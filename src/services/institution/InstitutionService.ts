import { Pool } from 'pg';
import { Institution, Canteen, InstitutionStats, UserRole } from '../../types';
import { InstitutionModel } from '../../models/Institution';
import { CanteenModel } from '../../models/Canteen';
import { UserModel } from '../../models/User';
import { isValidEmail } from '../../utils/validators';

/**
 * Institution Service
 * Handles institution and canteen management operations
 * Validates: Requirements 2.1-2.5, 3.1-3.5 (Institution and Canteen Management)
 */

export class InstitutionService {
  private institutionModel: InstitutionModel;
  private canteenModel: CanteenModel;
  private userModel: UserModel;

  constructor(pool: Pool) {
    this.institutionModel = new InstitutionModel(pool);
    this.canteenModel = new CanteenModel(pool);
    this.userModel = new UserModel(pool);
  }

  /**
   * Create a new institution (Main Admin only)
   * @param name - Institution name
   * @param emailDomain - Email domain (e.g., "university.edu")
   * @param contactEmail - Optional contact email
   * @param contactPhone - Optional contact phone
   * @returns Created institution
   * Validates: Requirements 2.1, 2.2, 2.5
   */
  async createInstitution(
    name: string,
    emailDomain: string,
    contactEmail?: string,
    contactPhone?: string
  ): Promise<Institution> {
    // Validate inputs
    if (!name || !emailDomain) {
      throw new Error('Institution name and email domain are required');
    }

    // Validate email domain format (should not include @)
    if (emailDomain.includes('@')) {
      throw new Error('Email domain should not include @ symbol (e.g., use "university.edu" not "@university.edu")');
    }

    // Validate contact email if provided
    if (contactEmail && !isValidEmail(contactEmail)) {
      throw new Error('Invalid contact email format');
    }

    // Check if email domain already exists
    const existingInstitution = await this.institutionModel.findByEmailDomain(emailDomain);
    if (existingInstitution) {
      throw new Error('Email domain already registered');
    }

    // Create institution
    return this.institutionModel.create(name, emailDomain, contactEmail, contactPhone);
  }

  /**
   * Get institution by ID
   * @param institutionId - Institution ID
   * @returns Institution or null
   */
  async getInstitutionById(institutionId: string): Promise<Institution | null> {
    return this.institutionModel.findById(institutionId);
  }

  /**
   * Get all institutions (Main Admin only)
   * @returns Array of all institutions
   */
  async getAllInstitutions(): Promise<Institution[]> {
    return this.institutionModel.findAll();
  }

  /**
   * Update institution information
   * @param institutionId - Institution ID
   * @param data - Partial institution data
   * @returns Updated institution
   */
  async updateInstitution(
    institutionId: string,
    data: Partial<Pick<Institution, 'name' | 'contactEmail' | 'contactPhone'>>
  ): Promise<Institution> {
    // Validate contact email if provided
    if (data.contactEmail && !isValidEmail(data.contactEmail)) {
      throw new Error('Invalid contact email format');
    }

    return this.institutionModel.update(institutionId, data);
  }

  /**
   * Register a new canteen for an institution
   * @param institutionId - Institution ID
   * @param name - Canteen name
   * @param location - Optional location
   * @param operatingHours - Optional operating hours
   * @returns Created canteen with auto-generated vendor ID
   * Validates: Requirements 3.1, 3.2
   */
  async registerCanteen(
    institutionId: string,
    name: string,
    location?: string,
    operatingHours?: any
  ): Promise<Canteen> {
    // Validate inputs
    if (!name) {
      throw new Error('Canteen name is required');
    }

    // Verify institution exists
    const institution = await this.institutionModel.findById(institutionId);
    if (!institution) {
      throw new Error('Institution not found');
    }

    // Generate unique vendor ID (e.g., SS1, SS2, SS3...)
    const vendorId = await this.canteenModel.generateVendorId(institutionId);

    // Create canteen
    return this.canteenModel.create(institutionId, vendorId, name, location, operatingHours);
  }

  /**
   * Register a new canteen with vendor user account
   * @param institutionId - Institution ID
   * @param canteenName - Canteen name
   * @param location - Optional location
   * @param operatingHours - Optional operating hours
   * @param vendorEmail - Vendor user email
   * @param vendorPassword - Vendor user password
   * @param vendorName - Vendor user name
   * @returns Created canteen and vendor user
   * Validates: Requirements 3.1, 3.2, 1.3
   */
  async registerCanteenWithVendor(
    institutionId: string,
    canteenName: string,
    vendorEmail: string,
    vendorPassword: string,
    vendorName: string,
    location?: string,
    operatingHours?: any
  ): Promise<{ canteen: Canteen; vendorUserId: string }> {
    // Validate inputs
    if (!canteenName || !vendorEmail || !vendorPassword || !vendorName) {
      throw new Error('Canteen name, vendor email, password, and name are required');
    }

    // Validate email format
    if (!isValidEmail(vendorEmail)) {
      throw new Error('Invalid vendor email format');
    }

    // Verify institution exists
    const institution = await this.institutionModel.findById(institutionId);
    if (!institution) {
      throw new Error('Institution not found');
    }

    // Check if vendor email already exists
    const existingUser = await this.userModel.findByEmail(vendorEmail);
    if (existingUser) {
      throw new Error('Vendor email already exists');
    }

    // Generate unique vendor ID (e.g., MIT-SS-001, MIT-SS-002...)
    const emailDomain = institution.emailDomain;
    const prefix = emailDomain.split('.')[0].toUpperCase().substring(0, 3);
    const vendorId = await this.canteenModel.generateVendorId(institutionId, `${prefix}-`);

    // Create vendor user first
    const vendorUser = await this.userModel.create(
      vendorEmail,
      vendorName,
      UserRole.VENDOR,
      institutionId,
      vendorPassword
    );

    // Create canteen linked to the vendor user
    const canteen = await this.canteenModel.create(
      institutionId,
      vendorId,
      canteenName,
      vendorUser.id, // Link canteen to vendor user
      location,
      operatingHours
    );

    return {
      canteen,
      vendorUserId: vendorUser.id,
    };
  }

  /**
   * Get all canteens for an institution
   * @param institutionId - Institution ID
   * @returns Array of canteens
   */
  async getCanteensByInstitution(institutionId: string): Promise<Canteen[]> {
    return this.canteenModel.findByInstitution(institutionId);
  }

  /**
   * Get active canteens for an institution
   * @param institutionId - Institution ID
   * @returns Array of active and approved canteens
   */
  async getActiveCanteens(institutionId: string): Promise<Canteen[]> {
    return this.canteenModel.findActiveByInstitution(institutionId);
  }

  /**
   * Get canteen by ID
   * @param canteenId - Canteen ID
   * @returns Canteen or null
   */
  async getCanteenById(canteenId: string): Promise<Canteen | null> {
    return this.canteenModel.findById(canteenId);
  }

  /**
   * Get canteen by vendor ID
   * @param vendorId - Vendor ID
   * @returns Canteen or null
   */
  async getCanteenByVendorId(vendorId: string): Promise<Canteen | null> {
    return this.canteenModel.findByVendorId(vendorId);
  }

  /**
   * Get canteen by user ID
   * @param userId - User ID
   * @returns Canteen or null
   */
  async getCanteenByUserId(userId: string): Promise<Canteen | null> {
    return this.canteenModel.findByUserId(userId);
  }

  /**
   * Approve a vendor/canteen (Institution Admin only)
   * @param canteenId - Canteen ID
   * @returns Updated canteen
   * Validates: Requirements 3.3, 3.5
   */
  async approveVendor(canteenId: string): Promise<Canteen> {
    const canteen = await this.canteenModel.findById(canteenId);
    if (!canteen) {
      throw new Error('Canteen not found');
    }

    return this.canteenModel.approve(canteenId);
  }

  /**
   * Deactivate a vendor/canteen (Institution Admin only)
   * @param canteenId - Canteen ID
   * @returns Updated canteen
   * Validates: Requirements 3.4
   */
  async deactivateVendor(canteenId: string): Promise<Canteen> {
    const canteen = await this.canteenModel.findById(canteenId);
    if (!canteen) {
      throw new Error('Canteen not found');
    }

    return this.canteenModel.deactivate(canteenId);
  }

  /**
   * Activate a vendor/canteen
   * @param canteenId - Canteen ID
   * @returns Updated canteen
   */
  async activateVendor(canteenId: string): Promise<Canteen> {
    const canteen = await this.canteenModel.findById(canteenId);
    if (!canteen) {
      throw new Error('Canteen not found');
    }

    return this.canteenModel.activate(canteenId);
  }

  /**
   * Update canteen information
   * @param canteenId - Canteen ID
   * @param data - Partial canteen data
   * @returns Updated canteen
   */
  async updateCanteen(
    canteenId: string,
    data: Partial<Pick<Canteen, 'name' | 'location' | 'operatingHours'>>
  ): Promise<Canteen> {
    return this.canteenModel.update(canteenId, data);
  }

  /**
   * Get platform-level statistics (Main Admin only)
   * @param institutionId - Optional institution ID to filter stats
   * @returns Institution statistics
   * Validates: Requirements 2.4
   */
  async getPlatformStats(institutionId?: string): Promise<InstitutionStats> {
    // This is a simplified version - in production you'd have more complex queries
    const institution = institutionId 
      ? await this.institutionModel.findById(institutionId)
      : null;

    if (institutionId && !institution) {
      throw new Error('Institution not found');
    }

    // Get counts (simplified - would use proper aggregation queries in production)
    const users = institutionId 
      ? await this.userModel.findByInstitution(institutionId)
      : [];
    
    const canteens = institutionId
      ? await this.canteenModel.findByInstitution(institutionId)
      : await this.canteenModel.findAll();

    return {
      institutionId: institutionId || 'all',
      totalUsers: users.length,
      totalCanteens: canteens.length,
      totalOrders: 0, // Would be calculated from orders table
      totalRevenue: 0, // Would be calculated from orders table
    };
  }

  /**
   * Delete an institution (Main Admin only)
   * WARNING: This will cascade delete all related data
   * @param institutionId - Institution ID
   * @returns true if deleted
   */
  async deleteInstitution(institutionId: string): Promise<boolean> {
    const institution = await this.institutionModel.findById(institutionId);
    if (!institution) {
      throw new Error('Institution not found');
    }

    return this.institutionModel.delete(institutionId);
  }

  /**
   * Delete a canteen
   * WARNING: This will cascade delete all related data
   * @param canteenId - Canteen ID
   * @returns true if deleted
   */
  async deleteCanteen(canteenId: string): Promise<boolean> {
    const canteen = await this.canteenModel.findById(canteenId);
    if (!canteen) {
      throw new Error('Canteen not found');
    }

    return this.canteenModel.delete(canteenId);
  }
}
