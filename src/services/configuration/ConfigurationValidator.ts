import { 
  InstitutionFeatures, 
  InstitutionLimits, 
  InstitutionSecurity, 
  InstitutionBranding,
  ValidationResult,
  ConfigSchema
} from './types';

export class ConfigurationValidator {
  
  /**
   * Validate institution features configuration
   */
  validateFeatures(features: Partial<InstitutionFeatures>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate boolean fields
    const booleanFields = [
      'enable_ordering', 'allow_same_day_orders', 'allow_future_date_orders',
      'allow_multiple_orders_per_day', 'enforce_one_active_order_at_time',
      'enforce_ordering_time_window', 'disable_orders_on_holidays', 'disable_orders_on_weekends',
      'limit_items_per_order', 'limit_quantity_per_product', 'allow_bulk_orders',
      'enable_wallet', 'enable_mock_upi', 'enable_cash_on_delivery', 'enable_post_paid',
      'enable_wallet_top_up', 'enable_auto_debit', 'enforce_wallet_balance_limit',
      'minimum_wallet_balance_required', 'require_payment_before_acceptance',
      'allow_pay_after_pickup', 'auto_cancel_unpaid_orders',
      'allow_vendor_self_registration', 'require_admin_approval_for_vendors',
      'allow_vendor_suspension', 'allow_vendor_deletion', 'allow_vendors_edit_prices',
      'allow_vendors_disable_products', 'allow_vendors_see_user_details', 'allow_vendors_reject_orders',
      'allow_user_self_registration', 'require_email_verification', 'restrict_registration_by_email_domain',
      'require_admin_approval_for_users', 'enforce_password_policy', 'password_require_complexity',
      'force_logout_on_role_change', 'enable_multi_device_login', 'enforce_single_session_per_user',
      'enable_scheduled_pickup', 'enable_instant_pickup', 'require_qr_code_for_pickup',
      'require_otp_for_pickup', 'vendor_must_accept_order', 'auto_accept_orders',
      'auto_complete_orders_after_pickup', 'enable_real_time_updates', 'enable_in_app_notifications',
      'enable_email_notifications', 'enable_sms_notifications', 'notify_vendor_on_new_order',
      'notify_user_on_status_change', 'notify_admin_on_failed_payments', 'enable_analytics_dashboard',
      'allow_institution_admin_view_revenue', 'allow_vendor_view_sales_reports', 'allow_export_reports',
      'enable_audit_logging', 'log_payment_attempts', 'log_failed_logins',
      'mask_user_personal_data_for_vendors', 'auto_lock_accounts_on_failures',
      'custom_institution_logo', 'custom_theme_color', 'show_institution_name_in_user_app',
      'disable_platform_branding'
    ];

    booleanFields.forEach(field => {
      if (field in features && typeof (features as any)[field] !== 'boolean') {
        errors.push(`${field} must be a boolean value`);
      }
    });

    // Validate numeric fields
    if ('max_items_per_order' in features) {
      if (typeof features.max_items_per_order !== 'number' || features.max_items_per_order < 1) {
        errors.push('max_items_per_order must be a positive number');
      }
    }

    if ('unpaid_order_timeout_minutes' in features) {
      if (typeof features.unpaid_order_timeout_minutes !== 'number' || features.unpaid_order_timeout_minutes < 1) {
        errors.push('unpaid_order_timeout_minutes must be a positive number');
      }
    }

    if ('password_min_length' in features) {
      if (typeof features.password_min_length !== 'number' || features.password_min_length < 4 || features.password_min_length > 128) {
        errors.push('password_min_length must be between 4 and 128');
      }
    }

    // Validate time format (HH:MM)
    const timeFields = ['ordering_start_time', 'ordering_end_time'];
    timeFields.forEach(field => {
      if (field in features) {
        const timeValue = (features as any)[field];
        if (typeof timeValue !== 'string' || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeValue)) {
          errors.push(`${field} must be in HH:MM format (24-hour)`);
        }
      }
    });

    // Validate email domains array
    if ('allowed_email_domains' in features) {
      if (!Array.isArray(features.allowed_email_domains)) {
        errors.push('allowed_email_domains must be an array');
      } else {
        features.allowed_email_domains.forEach((domain, index) => {
          if (typeof domain !== 'string' || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
            errors.push(`allowed_email_domains[${index}] must be a valid domain name`);
          }
        });
      }
    }

    // Logical validations
    if (features.enforce_ordering_time_window && features.ordering_start_time && features.ordering_end_time) {
      if (features.ordering_start_time >= features.ordering_end_time) {
        errors.push('ordering_start_time must be before ordering_end_time');
      }
    }

    if (features.require_qr_code_for_pickup && features.require_otp_for_pickup) {
      warnings.push('Both QR code and OTP verification are enabled, which may create user confusion');
    }

    if (features.vendor_must_accept_order && features.auto_accept_orders) {
      errors.push('Cannot have both vendor_must_accept_order and auto_accept_orders enabled');
    }

    if (features.enforce_single_session_per_user && features.enable_multi_device_login) {
      errors.push('Cannot enforce single session while allowing multi-device login');
    }

    if (!features.enable_wallet && !features.enable_mock_upi && !features.enable_cash_on_delivery && !features.enable_post_paid) {
      warnings.push('No payment methods are enabled, users will not be able to complete orders');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate institution limits configuration
   */
  validateLimits(limits: Partial<InstitutionLimits>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate all numeric fields are positive
    const numericFields = [
      'max_users', 'max_vendors', 'max_orders_per_day', 'max_wallet_balance',
      'max_concurrent_sessions', 'max_products_per_vendor', 'max_active_orders_per_vendor',
      'max_failed_login_attempts', 'session_timeout_minutes', 'order_expiry_minutes'
    ];

    numericFields.forEach(field => {
      if (field in limits) {
        const value = (limits as any)[field];
        if (typeof value !== 'number' || value < 0) {
          errors.push(`${field} must be a non-negative number`);
        }
        
        // Specific validations
        if (field === 'max_users' && value > 100000) {
          warnings.push('max_users is very high, consider performance implications');
        }
        
        if (field === 'max_wallet_balance' && value > 50000) {
          warnings.push('max_wallet_balance is very high, consider financial risk');
        }
        
        if (field === 'session_timeout_minutes' && value < 30) {
          warnings.push('session_timeout_minutes is very low, may cause frequent logouts');
        }
        
        if (field === 'order_expiry_minutes' && value < 5) {
          warnings.push('order_expiry_minutes is very low, may not give users enough time');
        }
      }
    });

    // Logical validations
    if (limits.max_concurrent_sessions && limits.max_concurrent_sessions > 10) {
      warnings.push('High concurrent session limit may impact performance');
    }

    if (limits.max_failed_login_attempts && limits.max_failed_login_attempts > 10) {
      warnings.push('High failed login attempts limit may reduce security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate institution security configuration
   */
  validateSecurity(security: Partial<InstitutionSecurity>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate audit_retention_days
    if ('audit_retention_days' in security) {
      if (typeof security.audit_retention_days !== 'number' || security.audit_retention_days < 1) {
        errors.push('audit_retention_days must be a positive number');
      } else if (security.audit_retention_days < 30) {
        warnings.push('audit_retention_days is less than 30 days, may not meet compliance requirements');
      }
    }

    // Validate boolean fields
    const booleanFields = [
      'require_2fa_for_admins', 'encrypt_sensitive_data', 'compliance_mode',
      'gdpr_compliance', 'data_export_restrictions', 'ip_whitelist_enabled'
    ];

    booleanFields.forEach(field => {
      if (field in security && typeof (security as any)[field] !== 'boolean') {
        errors.push(`${field} must be a boolean value`);
      }
    });

    // Validate data_masking_level
    if ('data_masking_level' in security) {
      const validLevels = ['none', 'partial', 'full'];
      if (!validLevels.includes(security.data_masking_level!)) {
        errors.push('data_masking_level must be one of: none, partial, full');
      }
    }

    // Validate IP ranges
    if ('allowed_ip_ranges' in security) {
      if (!Array.isArray(security.allowed_ip_ranges)) {
        errors.push('allowed_ip_ranges must be an array');
      } else {
        security.allowed_ip_ranges.forEach((range, index) => {
          if (typeof range !== 'string') {
            errors.push(`allowed_ip_ranges[${index}] must be a string`);
          } else if (!this.isValidIPRange(range)) {
            errors.push(`allowed_ip_ranges[${index}] is not a valid IP address or CIDR range`);
          }
        });
      }
    }

    // Security recommendations
    if (security.compliance_mode && !security.require_2fa_for_admins) {
      warnings.push('Compliance mode is enabled but 2FA is not required for admins');
    }

    if (security.gdpr_compliance && security.data_masking_level === 'none') {
      warnings.push('GDPR compliance is enabled but data masking is disabled');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate institution branding configuration
   */
  validateBranding(branding: Partial<InstitutionBranding>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate logo_url
    if ('logo_url' in branding && branding.logo_url) {
      if (typeof branding.logo_url !== 'string') {
        errors.push('logo_url must be a string');
      } else if (!this.isValidURL(branding.logo_url)) {
        errors.push('logo_url must be a valid URL');
      }
    }

    // Validate color codes
    const colorFields = ['primary_color', 'secondary_color'];
    colorFields.forEach(field => {
      if (field in branding && (branding as any)[field]) {
        const color = (branding as any)[field];
        if (typeof color !== 'string') {
          errors.push(`${field} must be a string`);
        } else if (!this.isValidHexColor(color)) {
          errors.push(`${field} must be a valid hex color code (e.g., #FF0000)`);
        }
      }
    });

    // Validate boolean fields
    if ('institution_name_display' in branding && typeof branding.institution_name_display !== 'boolean') {
      errors.push('institution_name_display must be a boolean value');
    }

    // Validate text fields
    const textFields = ['custom_welcome_message', 'footer_text'];
    textFields.forEach(field => {
      if (field in branding && (branding as any)[field]) {
        const text = (branding as any)[field];
        if (typeof text !== 'string') {
          errors.push(`${field} must be a string`);
        } else if (text.length > 500) {
          errors.push(`${field} must be less than 500 characters`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate global setting
   */
  validateGlobalSetting(key: string, value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const globalSettingValidations: Record<string, (value: any) => void> = {
      maintenance_mode: (val) => {
        if (typeof val !== 'boolean') {
          errors.push('maintenance_mode must be a boolean');
        }
      },
      maintenance_message: (val) => {
        if (typeof val !== 'string') {
          errors.push('maintenance_message must be a string');
        } else if (val.length > 1000) {
          errors.push('maintenance_message must be less than 1000 characters');
        }
      },
      global_payments_enabled: (val) => {
        if (typeof val !== 'boolean') {
          errors.push('global_payments_enabled must be a boolean');
        }
      },
      new_institution_creation_enabled: (val) => {
        if (typeof val !== 'boolean') {
          errors.push('new_institution_creation_enabled must be a boolean');
        }
      },
      global_real_time_enabled: (val) => {
        if (typeof val !== 'boolean') {
          errors.push('global_real_time_enabled must be a boolean');
        }
      },
      platform_announcement: (val) => {
        if (typeof val !== 'string') {
          errors.push('platform_announcement must be a string');
        } else if (val.length > 2000) {
          errors.push('platform_announcement must be less than 2000 characters');
        }
      },
      support_contact_email: (val) => {
        if (typeof val !== 'string') {
          errors.push('support_contact_email must be a string');
        } else if (val && !this.isValidEmail(val)) {
          errors.push('support_contact_email must be a valid email address');
        }
      },
      terms_of_service_url: (val) => {
        if (typeof val !== 'string') {
          errors.push('terms_of_service_url must be a string');
        } else if (val && !this.isValidURL(val)) {
          errors.push('terms_of_service_url must be a valid URL');
        }
      },
      privacy_policy_url: (val) => {
        if (typeof val !== 'string') {
          errors.push('privacy_policy_url must be a string');
        } else if (val && !this.isValidURL(val)) {
          errors.push('privacy_policy_url must be a valid URL');
        }
      }
    };

    const validator = globalSettingValidations[key];
    if (!validator) {
      errors.push(`Unknown global setting: ${key}`);
    } else {
      validator(value);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generic configuration validation against schema
   */
  validate(config: any, schema: ConfigSchema): ValidationResult {
    const errors: string[] = [];
    
    try {
      this.validateAgainstSchema(config, schema, '', errors);
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateAgainstSchema(value: any, schema: ConfigSchema, path: string, errors: string[]): void {
    // Type validation
    if (schema.type === 'object' && typeof value !== 'object') {
      errors.push(`${path} must be an object`);
      return;
    }
    
    if (schema.type === 'array' && !Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return;
    }
    
    if (schema.type === 'string' && typeof value !== 'string') {
      errors.push(`${path} must be a string`);
      return;
    }
    
    if (schema.type === 'number' && typeof value !== 'number') {
      errors.push(`${path} must be a number`);
      return;
    }
    
    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${path} must be a boolean`);
      return;
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${path} must be one of: ${schema.enum.join(', ')}`);
    }

    // Number range validation
    if (schema.type === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`${path} must be at least ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`${path} must be at most ${schema.maximum}`);
      }
    }

    // String pattern validation
    if (schema.type === 'string' && schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push(`${path} does not match required pattern`);
      }
    }

    // Object properties validation
    if (schema.type === 'object' && schema.properties) {
      // Check required properties
      if (schema.required) {
        schema.required.forEach(prop => {
          if (!(prop in value)) {
            errors.push(`${path}.${prop} is required`);
          }
        });
      }

      // Validate each property
      Object.keys(schema.properties).forEach(prop => {
        if (prop in value) {
          this.validateAgainstSchema(
            value[prop], 
            schema.properties![prop], 
            path ? `${path}.${prop}` : prop, 
            errors
          );
        }
      });
    }

    // Array items validation
    if (schema.type === 'array' && schema.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        this.validateAgainstSchema(
          item, 
          schema.items!, 
          `${path}[${index}]`, 
          errors
        );
      });
    }
  }

  // Utility validation methods

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  private isValidIPRange(range: string): boolean {
    // Validate single IP address
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipRegex.test(range)) {
      return true;
    }

    // Validate CIDR notation
    const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
    return cidrRegex.test(range);
  }
}