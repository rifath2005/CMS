// Configuration Data Models

export interface InstitutionConfig {
  institutionId: string;
  features: InstitutionFeatures;
  limits: InstitutionLimits;
  security: InstitutionSecurity;
  branding: InstitutionBranding;
  lastUpdated: Date;
  updatedBy: string;
}

export interface InstitutionFeatures {
  // Ordering Controls
  enable_ordering: boolean;
  allow_same_day_orders: boolean;
  allow_future_date_orders: boolean;
  allow_multiple_orders_per_day: boolean;
  enforce_one_active_order_at_time: boolean;
  
  // Time Constraints
  enforce_ordering_time_window: boolean;
  ordering_start_time: string; // HH:MM format
  ordering_end_time: string;   // HH:MM format
  disable_orders_on_holidays: boolean;
  disable_orders_on_weekends: boolean;
  
  // Quantity Rules
  limit_items_per_order: boolean;
  max_items_per_order: number;
  limit_quantity_per_product: boolean;
  allow_bulk_orders: boolean;
  
  // Payment Methods
  enable_wallet: boolean;
  enable_mock_upi: boolean;
  enable_cash_on_delivery: boolean;
  enable_post_paid: boolean;
  
  // Wallet Rules
  enable_wallet_top_up: boolean;
  enable_auto_debit: boolean;
  enforce_wallet_balance_limit: boolean;
  minimum_wallet_balance_required: boolean;
  
  // Payment Enforcement
  require_payment_before_acceptance: boolean;
  allow_pay_after_pickup: boolean;
  auto_cancel_unpaid_orders: boolean;
  unpaid_order_timeout_minutes: number;
  
  // Vendor Lifecycle
  allow_vendor_self_registration: boolean;
  require_admin_approval_for_vendors: boolean;
  allow_vendor_suspension: boolean;
  allow_vendor_deletion: boolean;
  
  // Vendor Operations
  allow_vendors_edit_prices: boolean;
  allow_vendors_disable_products: boolean;
  allow_vendors_see_user_details: boolean;
  allow_vendors_reject_orders: boolean;
  
  // Registration & Authentication
  allow_user_self_registration: boolean;
  require_email_verification: boolean;
  restrict_registration_by_email_domain: boolean;
  allowed_email_domains: string[];
  require_admin_approval_for_users: boolean;
  
  // Authentication Policies
  enforce_password_policy: boolean;
  password_min_length: number;
  password_require_complexity: boolean;
  force_logout_on_role_change: boolean;
  enable_multi_device_login: boolean;
  enforce_single_session_per_user: boolean;
  
  // Order Fulfillment
  enable_scheduled_pickup: boolean;
  enable_instant_pickup: boolean;
  require_qr_code_for_pickup: boolean;
  require_otp_for_pickup: boolean;
  vendor_must_accept_order: boolean;
  auto_accept_orders: boolean;
  auto_complete_orders_after_pickup: boolean;
  
  // Notifications
  enable_real_time_updates: boolean;
  enable_in_app_notifications: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  notify_vendor_on_new_order: boolean;
  notify_user_on_status_change: boolean;
  notify_admin_on_failed_payments: boolean;
  
  // Reporting & Visibility
  enable_analytics_dashboard: boolean;
  allow_institution_admin_view_revenue: boolean;
  allow_vendor_view_sales_reports: boolean;
  allow_export_reports: boolean;
  
  // Security & Compliance
  enable_audit_logging: boolean;
  log_payment_attempts: boolean;
  log_failed_logins: boolean;
  mask_user_personal_data_for_vendors: boolean;
  auto_lock_accounts_on_failures: boolean;
  
  // Branding & Experience
  custom_institution_logo: boolean;
  custom_theme_color: boolean;
  show_institution_name_in_user_app: boolean;
  disable_platform_branding: boolean;
}

export interface InstitutionLimits {
  max_users: number;
  max_vendors: number;
  max_orders_per_day: number;
  max_wallet_balance: number;
  max_concurrent_sessions: number;
  max_products_per_vendor: number;
  max_active_orders_per_vendor: number;
  max_failed_login_attempts: number;
  session_timeout_minutes: number;
  order_expiry_minutes: number;
}

export interface InstitutionSecurity {
  audit_retention_days: number;
  require_2fa_for_admins: boolean;
  encrypt_sensitive_data: boolean;
  data_masking_level: 'none' | 'partial' | 'full';
  compliance_mode: boolean;
  gdpr_compliance: boolean;
  data_export_restrictions: boolean;
  ip_whitelist_enabled: boolean;
  allowed_ip_ranges: string[];
}

export interface InstitutionBranding {
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  institution_name_display: boolean;
  custom_welcome_message: string;
  footer_text: string;
}

export interface GlobalConfig {
  maintenance_mode: boolean;
  maintenance_message: string;
  global_payments_enabled: boolean;
  new_institution_creation_enabled: boolean;
  global_real_time_enabled: boolean;
  platform_announcement: string;
  support_contact_email: string;
  terms_of_service_url: string;
  privacy_policy_url: string;
}

// Audit and Logging Models

export interface ConfigurationAuditLog {
  id: string;
  institutionId?: string; // null for global changes
  adminId: string;
  adminEmail: string;
  changeType: 'feature_toggle' | 'limit_update' | 'security_change' | 'branding_change' | 'global_setting';
  section: string; // e.g., 'ordering', 'payment', 'vendor'
  fieldName: string;
  oldValue: any;
  newValue: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  reason?: string; // optional reason for change
}

export interface FeatureAccessLog {
  id: string;
  userId: string;
  institutionId: string;
  feature: string;
  accessGranted: boolean;
  denialReason?: string;
  endpoint: string;
  method: string;
  ipAddress?: string;
  timestamp: Date;
}

// Validation Types

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ConfigSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ConfigSchema>;
  items?: ConfigSchema;
  required?: string[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
}

// Cache Types

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
}

// WebSocket Event Types

export interface ConfigurationChangeEvent {
  type: 'config_change' | 'global_config_change';
  institutionId?: string;
  changeType?: string;
  key?: string;
  changes?: any;
  value?: any;
  timestamp: string;
}

// Configuration Templates

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'educational' | 'corporate' | 'healthcare' | 'custom';
  features: Partial<InstitutionFeatures>;
  limits: Partial<InstitutionLimits>;
  security: Partial<InstitutionSecurity>;
  branding: Partial<InstitutionBranding>;
}

// Configuration Backup Types

export interface ConfigurationBackup {
  id: string;
  institutionId: string;
  timestamp: string;
  configuration: InstitutionConfig;
  createdBy: string;
  description?: string;
}

// Configuration Import/Export Types

export interface ConfigurationExport {
  version: string;
  exportedAt: string;
  exportedBy: string;
  institutions: Array<{
    institutionId: string;
    institutionName: string;
    configuration: InstitutionConfig;
  }>;
  globalConfig: GlobalConfig;
}

export interface ConfigurationImport {
  version: string;
  institutions: Array<{
    institutionId: string;
    configuration: Partial<InstitutionConfig>;
  }>;
  globalConfig?: Partial<GlobalConfig>;
  overwriteExisting: boolean;
}

// Configuration Diff Types

export interface ConfigurationDiff {
  section: string;
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

export interface ConfigurationComparison {
  institutionId: string;
  comparedAt: Date;
  differences: ConfigurationDiff[];
  summary: {
    totalChanges: number;
    addedFields: number;
    modifiedFields: number;
    removedFields: number;
  };
}

// Configuration Status Types

export interface ConfigurationStatus {
  institutionId: string;
  isComplete: boolean;
  completionPercentage: number;
  missingRequiredFields: string[];
  warnings: string[];
  lastUpdated: Date;
  lastUpdatedBy: string;
}

// Configuration Compliance Types

export interface ComplianceCheck {
  institutionId: string;
  checkedAt: Date;
  isCompliant: boolean;
  violations: ComplianceViolation[];
  score: number; // 0-100
}

export interface ComplianceViolation {
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  field: string;
  currentValue: any;
  recommendedValue: any;
}

// Configuration Migration Types

export interface ConfigurationMigration {
  version: string;
  description: string;
  up: (config: any) => any;
  down: (config: any) => any;
}

export interface MigrationResult {
  success: boolean;
  version: string;
  migratedInstitutions: string[];
  errors: Array<{
    institutionId: string;
    error: string;
  }>;
}