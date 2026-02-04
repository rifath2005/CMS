import { query } from '../../config/database';
import { 
  InstitutionFeatures, 
  InstitutionLimits, 
  InstitutionSecurity, 
  InstitutionBranding,
  ConfigurationAuditLog 
} from './types';

export class ConfigurationAuditLogger {

  /**
   * Log feature configuration changes
   */
  async logFeatureChanges(
    institutionId: string,
    adminId: string,
    adminEmail: string,
    oldFeatures: InstitutionFeatures,
    newFeatures: InstitutionFeatures,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    const changes = this.detectFeatureChanges(oldFeatures, newFeatures);
    
    for (const change of changes) {
      await this.logConfigurationChange({
        institutionId,
        adminId,
        adminEmail,
        changeType: 'feature_toggle',
        section: this.getFeatureSection(change.field),
        fieldName: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        ipAddress,
        userAgent,
        reason
      });
    }
  }

  /**
   * Log limit configuration changes
   */
  async logLimitChanges(
    institutionId: string,
    adminId: string,
    adminEmail: string,
    oldLimits: InstitutionLimits,
    newLimits: InstitutionLimits,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    const changes = this.detectLimitChanges(oldLimits, newLimits);
    
    for (const change of changes) {
      await this.logConfigurationChange({
        institutionId,
        adminId,
        adminEmail,
        changeType: 'limit_update',
        section: 'limits',
        fieldName: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        ipAddress,
        userAgent,
        reason
      });
    }
  }

  /**
   * Log security configuration changes
   */
  async logSecurityChanges(
    institutionId: string,
    adminId: string,
    adminEmail: string,
    oldSecurity: InstitutionSecurity,
    newSecurity: InstitutionSecurity,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    const changes = this.detectSecurityChanges(oldSecurity, newSecurity);
    
    for (const change of changes) {
      await this.logConfigurationChange({
        institutionId,
        adminId,
        adminEmail,
        changeType: 'security_change',
        section: 'security',
        fieldName: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        ipAddress,
        userAgent,
        reason
      });
    }
  }

  /**
   * Log branding configuration changes
   */
  async logBrandingChanges(
    institutionId: string,
    adminId: string,
    adminEmail: string,
    oldBranding: InstitutionBranding,
    newBranding: InstitutionBranding,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    const changes = this.detectBrandingChanges(oldBranding, newBranding);
    
    for (const change of changes) {
      await this.logConfigurationChange({
        institutionId,
        adminId,
        adminEmail,
        changeType: 'branding_change',
        section: 'branding',
        fieldName: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        ipAddress,
        userAgent,
        reason
      });
    }
  }

  /**
   * Log global setting changes
   */
  async logGlobalSettingChange(
    adminId: string,
    adminEmail: string,
    settingKey: string,
    oldValue: any,
    newValue: any,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    await this.logConfigurationChange({
      institutionId: null, // Global settings don't belong to a specific institution
      adminId,
      adminEmail,
      changeType: 'global_setting',
      section: 'global',
      fieldName: settingKey,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      reason
    });
  }

  /**
   * Log configuration restore operation
   */
  async logConfigurationRestore(
    institutionId: string,
    adminId: string,
    adminEmail: string,
    backupId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logConfigurationChange({
      institutionId,
      adminId,
      adminEmail,
      changeType: 'configuration_restore',
      section: 'system',
      fieldName: 'configuration_restore',
      oldValue: null,
      newValue: { backupId },
      ipAddress,
      userAgent,
      reason: `Configuration restored from backup: ${backupId}`
    });
  }

  /**
   * Core method to log configuration changes
   */
  private async logConfigurationChange(logEntry: {
    institutionId: string | null;
    adminId: string;
    adminEmail: string;
    changeType: string;
    section: string;
    fieldName: string;
    oldValue: any;
    newValue: any;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO configuration_audit_logs (
          institution_id, admin_id, admin_email, change_type, section, 
          field_name, old_value, new_value, ip_address, user_agent, reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          logEntry.institutionId,
          logEntry.adminId,
          logEntry.adminEmail,
          logEntry.changeType,
          logEntry.section,
          logEntry.fieldName,
          JSON.stringify(logEntry.oldValue),
          JSON.stringify(logEntry.newValue),
          logEntry.ipAddress,
          logEntry.userAgent,
          logEntry.reason
        ]
      );
    } catch (error) {
      console.error('Error logging configuration change:', error);
      // Don't throw error, audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Detect changes in feature configuration
   */
  private detectFeatureChanges(
    oldFeatures: InstitutionFeatures, 
    newFeatures: InstitutionFeatures
  ): Array<{ field: string; oldValue: any; newValue: any }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    // Compare all feature fields
    const allFields = new Set([
      ...Object.keys(oldFeatures),
      ...Object.keys(newFeatures)
    ]);

    for (const field of Array.from(allFields)) {
      const oldValue = (oldFeatures as any)[field];
      const newValue = (newFeatures as any)[field];
      
      if (!this.deepEqual(oldValue, newValue)) {
        changes.push({
          field,
          oldValue,
          newValue
        });
      }
    }

    return changes;
  }

  /**
   * Detect changes in limit configuration
   */
  private detectLimitChanges(
    oldLimits: InstitutionLimits, 
    newLimits: InstitutionLimits
  ): Array<{ field: string; oldValue: any; newValue: any }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    const allFields = new Set([
      ...Object.keys(oldLimits),
      ...Object.keys(newLimits)
    ]);

    for (const field of Array.from(allFields)) {
      const oldValue = (oldLimits as any)[field];
      const newValue = (newLimits as any)[field];
      
      if (oldValue !== newValue) {
        changes.push({
          field,
          oldValue,
          newValue
        });
      }
    }

    return changes;
  }

  /**
   * Detect changes in security configuration
   */
  private detectSecurityChanges(
    oldSecurity: InstitutionSecurity, 
    newSecurity: InstitutionSecurity
  ): Array<{ field: string; oldValue: any; newValue: any }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    const allFields = new Set([
      ...Object.keys(oldSecurity),
      ...Object.keys(newSecurity)
    ]);

    for (const field of allFields) {
      const oldValue = (oldSecurity as any)[field];
      const newValue = (newSecurity as any)[field];
      
      if (!this.deepEqual(oldValue, newValue)) {
        changes.push({
          field,
          oldValue,
          newValue
        });
      }
    }

    return changes;
  }

  /**
   * Detect changes in branding configuration
   */
  private detectBrandingChanges(
    oldBranding: InstitutionBranding, 
    newBranding: InstitutionBranding
  ): Array<{ field: string; oldValue: any; newValue: any }> {
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    
    const allFields = new Set([
      ...Object.keys(oldBranding),
      ...Object.keys(newBranding)
    ]);

    for (const field of allFields) {
      const oldValue = (oldBranding as any)[field];
      const newValue = (newBranding as any)[field];
      
      if (oldValue !== newValue) {
        changes.push({
          field,
          oldValue,
          newValue
        });
      }
    }

    return changes;
  }

  /**
   * Determine which section a feature belongs to
   */
  private getFeatureSection(fieldName: string): string {
    const sectionMap: Record<string, string> = {
      // Ordering features
      'enable_ordering': 'ordering',
      'allow_same_day_orders': 'ordering',
      'allow_future_date_orders': 'ordering',
      'allow_multiple_orders_per_day': 'ordering',
      'enforce_one_active_order_at_time': 'ordering',
      'enforce_ordering_time_window': 'ordering',
      'ordering_start_time': 'ordering',
      'ordering_end_time': 'ordering',
      'disable_orders_on_holidays': 'ordering',
      'disable_orders_on_weekends': 'ordering',
      'limit_items_per_order': 'ordering',
      'max_items_per_order': 'ordering',
      'limit_quantity_per_product': 'ordering',
      'allow_bulk_orders': 'ordering',

      // Payment features
      'enable_wallet': 'payment',
      'enable_mock_upi': 'payment',
      'enable_cash_on_delivery': 'payment',
      'enable_post_paid': 'payment',
      'enable_wallet_top_up': 'payment',
      'enable_auto_debit': 'payment',
      'enforce_wallet_balance_limit': 'payment',
      'minimum_wallet_balance_required': 'payment',
      'require_payment_before_acceptance': 'payment',
      'allow_pay_after_pickup': 'payment',
      'auto_cancel_unpaid_orders': 'payment',
      'unpaid_order_timeout_minutes': 'payment',

      // Vendor features
      'allow_vendor_self_registration': 'vendor',
      'require_admin_approval_for_vendors': 'vendor',
      'allow_vendor_suspension': 'vendor',
      'allow_vendor_deletion': 'vendor',
      'allow_vendors_edit_prices': 'vendor',
      'allow_vendors_disable_products': 'vendor',
      'allow_vendors_see_user_details': 'vendor',
      'allow_vendors_reject_orders': 'vendor',

      // User access features
      'allow_user_self_registration': 'user_access',
      'require_email_verification': 'user_access',
      'restrict_registration_by_email_domain': 'user_access',
      'allowed_email_domains': 'user_access',
      'require_admin_approval_for_users': 'user_access',
      'enforce_password_policy': 'user_access',
      'password_min_length': 'user_access',
      'password_require_complexity': 'user_access',
      'force_logout_on_role_change': 'user_access',
      'enable_multi_device_login': 'user_access',
      'enforce_single_session_per_user': 'user_access',

      // Fulfillment features
      'enable_scheduled_pickup': 'fulfillment',
      'enable_instant_pickup': 'fulfillment',
      'require_qr_code_for_pickup': 'fulfillment',
      'require_otp_for_pickup': 'fulfillment',
      'vendor_must_accept_order': 'fulfillment',
      'auto_accept_orders': 'fulfillment',
      'auto_complete_orders_after_pickup': 'fulfillment',

      // Notification features
      'enable_real_time_updates': 'notifications',
      'enable_in_app_notifications': 'notifications',
      'enable_email_notifications': 'notifications',
      'enable_sms_notifications': 'notifications',
      'notify_vendor_on_new_order': 'notifications',
      'notify_user_on_status_change': 'notifications',
      'notify_admin_on_failed_payments': 'notifications',

      // Reporting features
      'enable_analytics_dashboard': 'reporting',
      'allow_institution_admin_view_revenue': 'reporting',
      'allow_vendor_view_sales_reports': 'reporting',
      'allow_export_reports': 'reporting',

      // Security features
      'enable_audit_logging': 'security',
      'log_payment_attempts': 'security',
      'log_failed_logins': 'security',
      'mask_user_personal_data_for_vendors': 'security',
      'auto_lock_accounts_on_failures': 'security',

      // Branding features
      'custom_institution_logo': 'branding',
      'custom_theme_color': 'branding',
      'show_institution_name_in_user_app': 'branding',
      'disable_platform_branding': 'branding'
    };

    return sectionMap[fieldName] || 'other';
  }

  /**
   * Deep equality check for complex objects
   */
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 == null || obj2 == null) {
      return obj1 === obj2;
    }

    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false;
    }

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEqual(obj1[i], obj2[i])) {
          return false;
        }
      }
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }
      if (!this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(institutionId?: string): Promise<{
    totalLogs: number;
    logsByType: Record<string, number>;
    logsBySection: Record<string, number>;
    recentActivity: number; // logs in last 24 hours
  }> {
    try {
      const whereClause = institutionId ? 'WHERE institution_id = $1' : '';
      const params = institutionId ? [institutionId] : [];

      const [totalResult, typeResult, sectionResult, recentResult] = await Promise.all([
        query(`SELECT COUNT(*) as count FROM configuration_audit_logs ${whereClause}`, params),
        query(`SELECT change_type, COUNT(*) as count FROM configuration_audit_logs ${whereClause} GROUP BY change_type`, params),
        query(`SELECT section, COUNT(*) as count FROM configuration_audit_logs ${whereClause} GROUP BY section`, params),
        query(`SELECT COUNT(*) as count FROM configuration_audit_logs ${whereClause} ${whereClause ? 'AND' : 'WHERE'} created_at > NOW() - INTERVAL '24 hours'`, params)
      ]);

      const logsByType: Record<string, number> = {};
      typeResult.rows.forEach(row => {
        logsByType[row.change_type] = parseInt(row.count);
      });

      const logsBySection: Record<string, number> = {};
      sectionResult.rows.forEach(row => {
        logsBySection[row.section] = parseInt(row.count);
      });

      return {
        totalLogs: parseInt(totalResult.rows[0].count),
        logsByType,
        logsBySection,
        recentActivity: parseInt(recentResult.rows[0].count)
      };
    } catch (error) {
      console.error('Error getting audit log stats:', error);
      return {
        totalLogs: 0,
        logsByType: {},
        logsBySection: {},
        recentActivity: 0
      };
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM configuration_audit_logs 
         WHERE created_at < NOW() - INTERVAL '${retentionDays} days'`
      );
      
      const deletedCount = result.rowCount || 0;
      console.log(`Cleaned up ${deletedCount} old audit log entries (older than ${retentionDays} days)`);
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      return 0;
    }
  }
}