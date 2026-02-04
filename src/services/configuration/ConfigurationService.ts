import { pool, query, transaction } from '../../config/database';
import { redisClient } from '../../config/redis';
import { 
  InstitutionConfig, 
  InstitutionFeatures, 
  InstitutionLimits, 
  InstitutionSecurity, 
  InstitutionBranding,
  GlobalConfig,
  ConfigurationAuditLog,
  ValidationResult,
  ConfigSchema
} from './types';
import { ConfigurationValidator } from './ConfigurationValidator';
import { ConfigurationCache } from './ConfigurationCache';
import { ConfigurationAuditLogger } from './ConfigurationAuditLogger';

export class ConfigurationService {
  private validator: ConfigurationValidator;
  private cache: ConfigurationCache;
  private auditLogger: ConfigurationAuditLogger;

  constructor() {
    this.validator = new ConfigurationValidator();
    this.cache = new ConfigurationCache();
    this.auditLogger = new ConfigurationAuditLogger();
  }

  // Institution Configuration Management

  /**
   * Get complete configuration for an institution
   */
  async getInstitutionConfig(institutionId: string): Promise<InstitutionConfig> {
    // Try cache first
    const cached = await this.cache.getInstitutionConfig(institutionId);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const result = await query(
      `SELECT 
        id,
        institution_features,
        institution_limits,
        institution_security,
        institution_branding,
        updated_at
      FROM institutions 
      WHERE id = $1`,
      [institutionId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Institution not found: ${institutionId}`);
    }

    const row = result.rows[0];
    const config: InstitutionConfig = {
      institutionId: row.id,
      features: row.institution_features || {},
      limits: row.institution_limits || {},
      security: row.institution_security || {},
      branding: row.institution_branding || {},
      lastUpdated: row.updated_at,
      updatedBy: 'system' // Will be updated when we track who made changes
    };

    // Cache the result
    await this.cache.setInstitutionConfig(institutionId, config);

    return config;
  }

  /**
   * Update institution features configuration
   */
  async updateInstitutionFeatures(
    institutionId: string, 
    features: Partial<InstitutionFeatures>,
    adminId: string,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    // Validate the features configuration
    const validationResult = this.validator.validateFeatures(features);
    if (!validationResult.isValid) {
      throw new Error(`Invalid features configuration: ${validationResult.errors.join(', ')}`);
    }

    // Get current configuration for audit logging
    const currentConfig = await this.getInstitutionConfig(institutionId);

    await transaction(async (client) => {
      // Update the database
      await client.query(
        `UPDATE institutions 
         SET institution_features = institution_features || $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [JSON.stringify(features), institutionId]
      );

      // Log the changes
      await this.auditLogger.logFeatureChanges(
        institutionId,
        adminId,
        adminEmail,
        currentConfig.features,
        { ...currentConfig.features, ...features },
        ipAddress,
        userAgent,
        reason
      );
    });

    // Invalidate cache
    await this.cache.invalidateInstitutionConfig(institutionId);

    // Broadcast configuration change via WebSocket (will be implemented later)
    await this.broadcastConfigChange(institutionId, 'feature_toggle', features);
  }

  /**
   * Update institution limits configuration
   */
  async updateInstitutionLimits(
    institutionId: string, 
    limits: Partial<InstitutionLimits>,
    adminId: string,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    // Validate the limits configuration
    const validationResult = this.validator.validateLimits(limits);
    if (!validationResult.isValid) {
      throw new Error(`Invalid limits configuration: ${validationResult.errors.join(', ')}`);
    }

    // Get current configuration for audit logging
    const currentConfig = await this.getInstitutionConfig(institutionId);

    await transaction(async (client) => {
      // Update the database
      await client.query(
        `UPDATE institutions 
         SET institution_limits = institution_limits || $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [JSON.stringify(limits), institutionId]
      );

      // Log the changes
      await this.auditLogger.logLimitChanges(
        institutionId,
        adminId,
        adminEmail,
        currentConfig.limits,
        { ...currentConfig.limits, ...limits },
        ipAddress,
        userAgent,
        reason
      );
    });

    // Invalidate cache
    await this.cache.invalidateInstitutionConfig(institutionId);

    // Broadcast configuration change
    await this.broadcastConfigChange(institutionId, 'limit_update', limits);
  }

  /**
   * Update institution security configuration
   */
  async updateInstitutionSecurity(
    institutionId: string, 
    security: Partial<InstitutionSecurity>,
    adminId: string,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    // Validate the security configuration
    const validationResult = this.validator.validateSecurity(security);
    if (!validationResult.isValid) {
      throw new Error(`Invalid security configuration: ${validationResult.errors.join(', ')}`);
    }

    // Get current configuration for audit logging
    const currentConfig = await this.getInstitutionConfig(institutionId);

    await transaction(async (client) => {
      // Update the database
      await client.query(
        `UPDATE institutions 
         SET institution_security = institution_security || $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [JSON.stringify(security), institutionId]
      );

      // Log the changes
      await this.auditLogger.logSecurityChanges(
        institutionId,
        adminId,
        adminEmail,
        currentConfig.security,
        { ...currentConfig.security, ...security },
        ipAddress,
        userAgent,
        reason
      );
    });

    // Invalidate cache
    await this.cache.invalidateInstitutionConfig(institutionId);

    // Broadcast configuration change
    await this.broadcastConfigChange(institutionId, 'security_change', security);
  }

  /**
   * Update institution branding configuration
   */
  async updateInstitutionBranding(
    institutionId: string, 
    branding: Partial<InstitutionBranding>,
    adminId: string,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    // Validate the branding configuration
    const validationResult = this.validator.validateBranding(branding);
    if (!validationResult.isValid) {
      throw new Error(`Invalid branding configuration: ${validationResult.errors.join(', ')}`);
    }

    // Get current configuration for audit logging
    const currentConfig = await this.getInstitutionConfig(institutionId);

    await transaction(async (client) => {
      // Update the database
      await client.query(
        `UPDATE institutions 
         SET institution_branding = institution_branding || $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [JSON.stringify(branding), institutionId]
      );

      // Log the changes
      await this.auditLogger.logBrandingChanges(
        institutionId,
        adminId,
        adminEmail,
        currentConfig.branding,
        { ...currentConfig.branding, ...branding },
        ipAddress,
        userAgent,
        reason
      );
    });

    // Invalidate cache
    await this.cache.invalidateInstitutionConfig(institutionId);

    // Broadcast configuration change
    await this.broadcastConfigChange(institutionId, 'branding_change', branding);
  }

  // Global Configuration Management

  /**
   * Get global platform configuration
   */
  async getGlobalConfig(): Promise<GlobalConfig> {
    // Try cache first
    const cached = await this.cache.getGlobalConfig();
    if (cached) {
      return cached;
    }

    // Fetch from database
    const result = await query(
      `SELECT key, value FROM platform_settings ORDER BY key`
    );

    const config: GlobalConfig = {
      maintenance_mode: false,
      maintenance_message: 'System maintenance in progress. Please try again later.',
      global_payments_enabled: true,
      new_institution_creation_enabled: true,
      global_real_time_enabled: true,
      platform_announcement: '',
      support_contact_email: 'support@cms-platform.com',
      terms_of_service_url: '',
      privacy_policy_url: ''
    };

    // Map database results to config object
    result.rows.forEach(row => {
      const key = row.key as keyof GlobalConfig;
      let value = row.value;
      
      // Parse JSON values
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }
      
      (config as any)[key] = value;
    });

    // Cache the result
    await this.cache.setGlobalConfig(config);

    return config;
  }

  /**
   * Update a global platform setting
   */
  async updateGlobalSetting(
    key: string, 
    value: any,
    adminId: string,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    // Validate the global setting
    const validationResult = this.validator.validateGlobalSetting(key, value);
    if (!validationResult.isValid) {
      throw new Error(`Invalid global setting: ${validationResult.errors.join(', ')}`);
    }

    // Get current value for audit logging
    const currentConfig = await this.getGlobalConfig();
    const oldValue = (currentConfig as any)[key];

    await transaction(async (client) => {
      // Update or insert the setting
      await client.query(
        `INSERT INTO platform_settings (key, value, updated_by, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (key) 
         DO UPDATE SET 
           value = EXCLUDED.value,
           updated_by = EXCLUDED.updated_by,
           updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(value), adminId, `Global setting: ${key}`]
      );

      // Log the change
      await this.auditLogger.logGlobalSettingChange(
        adminId,
        adminEmail,
        key,
        oldValue,
        value,
        ipAddress,
        userAgent,
        reason
      );
    });

    // Invalidate cache
    await this.cache.invalidateGlobalConfig();

    // Broadcast global configuration change
    await this.broadcastGlobalConfigChange(key, value);
  }

  // Configuration Validation

  /**
   * Validate configuration against schema
   */
  validateConfiguration(config: any, schema: ConfigSchema): ValidationResult {
    return this.validator.validate(config, schema);
  }

  // Configuration Backup and Restore

  /**
   * Create a backup of institution configuration
   */
  async backupInstitutionConfig(institutionId: string): Promise<string> {
    const config = await this.getInstitutionConfig(institutionId);
    const backup = {
      institutionId,
      timestamp: new Date().toISOString(),
      configuration: config
    };

    // Store backup in database or file system
    const backupId = `backup_${institutionId}_${Date.now()}`;
    
    // For now, we'll store in Redis with a long TTL (30 days)
    await redisClient.setEx(
      `config_backup:${backupId}`,
      30 * 24 * 60 * 60, // 30 days
      JSON.stringify(backup)
    );

    return backupId;
  }

  /**
   * Restore institution configuration from backup
   */
  async restoreInstitutionConfig(
    backupId: string,
    adminId: string,
    adminEmail: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Retrieve backup
    const backupData = await redisClient.get(`config_backup:${backupId}`);
    if (!backupData) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const backup = JSON.parse(backupData);
    const { institutionId, configuration } = backup;

    // Restore configuration
    await transaction(async (client) => {
      await client.query(
        `UPDATE institutions 
         SET 
           institution_features = $1,
           institution_limits = $2,
           institution_security = $3,
           institution_branding = $4,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          JSON.stringify(configuration.features),
          JSON.stringify(configuration.limits),
          JSON.stringify(configuration.security),
          JSON.stringify(configuration.branding),
          institutionId
        ]
      );

      // Log the restore operation
      await this.auditLogger.logConfigurationRestore(
        institutionId,
        adminId,
        adminEmail,
        backupId,
        ipAddress,
        userAgent
      );
    });

    // Invalidate cache
    await this.cache.invalidateInstitutionConfig(institutionId);

    // Broadcast configuration change
    await this.broadcastConfigChange(institutionId, 'configuration_restore', { backupId });
  }

  // Real-time Updates

  /**
   * Broadcast configuration change to connected clients
   */
  async broadcastConfigChange(institutionId: string, changeType: string, changes: any): Promise<void> {
    // This will be implemented when WebSocket infrastructure is ready
    // For now, we'll just log the broadcast intent
    console.log(`Broadcasting config change for institution ${institutionId}:`, {
      changeType,
      changes,
      timestamp: new Date().toISOString()
    });

    // Store the change notification in Redis for WebSocket servers to pick up
    const notification = {
      type: 'config_change',
      institutionId,
      changeType,
      changes,
      timestamp: new Date().toISOString()
    };

    await redisClient.publish('config_changes', JSON.stringify(notification));
  }

  /**
   * Broadcast global configuration change to all clients
   */
  async broadcastGlobalConfigChange(key: string, value: any): Promise<void> {
    // This will be implemented when WebSocket infrastructure is ready
    console.log(`Broadcasting global config change:`, {
      key,
      value,
      timestamp: new Date().toISOString()
    });

    // Store the change notification in Redis for WebSocket servers to pick up
    const notification = {
      type: 'global_config_change',
      key,
      value,
      timestamp: new Date().toISOString()
    };

    await redisClient.publish('global_config_changes', JSON.stringify(notification));
  }

  // Configuration Inheritance Logic

  /**
   * Get effective configuration for an institution (with global overrides)
   */
  async getEffectiveConfig(institutionId: string): Promise<InstitutionConfig> {
    const [institutionConfig, globalConfig] = await Promise.all([
      this.getInstitutionConfig(institutionId),
      this.getGlobalConfig()
    ]);

    // Apply global overrides
    const effectiveConfig = { ...institutionConfig };

    // Global settings that override institution settings
    if (!globalConfig.global_payments_enabled) {
      effectiveConfig.features.enable_wallet = false;
      effectiveConfig.features.enable_mock_upi = false;
      effectiveConfig.features.enable_cash_on_delivery = false;
      effectiveConfig.features.enable_post_paid = false;
    }

    if (!globalConfig.global_real_time_enabled) {
      effectiveConfig.features.enable_real_time_updates = false;
    }

    if (globalConfig.maintenance_mode) {
      // In maintenance mode, disable most features
      effectiveConfig.features.enable_ordering = false;
      effectiveConfig.features.allow_vendor_self_registration = false;
      effectiveConfig.features.allow_user_self_registration = false;
    }

    return effectiveConfig;
  }

  // Utility Methods

  /**
   * Get configuration audit logs for an institution
   */
  async getConfigurationAuditLogs(
    institutionId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ConfigurationAuditLog[]> {
    let query_text = `
      SELECT * FROM configuration_audit_logs
      WHERE ($1::uuid IS NULL OR institution_id = $1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(query_text, [institutionId || null, limit, offset]);
    
    return result.rows.map(row => ({
      id: row.id,
      institutionId: row.institution_id,
      adminId: row.admin_id,
      adminEmail: row.admin_email,
      changeType: row.change_type,
      section: row.section,
      fieldName: row.field_name,
      oldValue: row.old_value,
      newValue: row.new_value,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      reason: row.reason,
      timestamp: row.created_at
    }));
  }

  /**
   * Check if a feature is enabled for an institution
   */
  async isFeatureEnabled(institutionId: string, featureName: string): Promise<boolean> {
    const config = await this.getEffectiveConfig(institutionId);
    return (config.features as any)[featureName] === true;
  }

  /**
   * Get current usage against limits for an institution
   */
  async getCurrentUsage(institutionId: string): Promise<Record<string, number>> {
    // This will query actual usage from the database
    const [userCount, vendorCount, todayOrderCount] = await Promise.all([
      this.getUserCount(institutionId),
      this.getVendorCount(institutionId),
      this.getTodayOrderCount(institutionId)
    ]);

    return {
      current_users: userCount,
      current_vendors: vendorCount,
      today_orders: todayOrderCount
    };
  }

  private async getUserCount(institutionId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM users WHERE institution_id = $1',
      [institutionId]
    );
    return parseInt(result.rows[0].count);
  }

  private async getVendorCount(institutionId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM canteens WHERE institution_id = $1',
      [institutionId]
    );
    return parseInt(result.rows[0].count);
  }

  private async getTodayOrderCount(institutionId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE u.institution_id = $1 
       AND DATE(o.created_at) = CURRENT_DATE`,
      [institutionId]
    );
    return parseInt(result.rows[0].count);
  }
}

// Export singleton instance
export const configurationService = new ConfigurationService();