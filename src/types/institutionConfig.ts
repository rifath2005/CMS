/**
 * Institution Configuration Types
 * Comprehensive feature flag and configuration system
 */

export interface InstitutionFeatures {
  // 1. ORDERING & FLOW CONTROL
  enable_orders: boolean;
  allow_same_day_orders: boolean;
  allow_future_date_orders: boolean;
  allow_multiple_orders_per_day: boolean;
  enforce_one_active_order: boolean;
  
  // Time Constraints
  enforce_ordering_time_window: boolean;
  ordering_start_time: string; // HH:MM format
  ordering_end_time: string; // HH:MM format
  disable_orders_on_holidays: boolean;
  disable_orders_on_weekends: boolean;
  
  // Quantity Rules
  limit_items_per_order: boolean;
  max_items_per_order: number;
  limit_quantity_per_product: boolean;
  allow_bulk_orders: boolean;

  // 2. PAYMENT & FINANCIAL CONTROLS
  // Payment Methods
  enable_wallet: boolean;
  enable_mock_upi: boolean;
  enable_cash_on_delivery: boolean;
  enable_post_paid: boolean;
  
  // Wallet Rules
  enable_wallet_topup: boolean;
  enable_auto_debit: boolean;
  enforce_wallet_balance_limit: boolean;
  max_wallet_balance: number;
  minimum_wallet_balance_required: number;
  
  // Payment Enforcement
  require_payment_before_acceptance: boolean;
  allow_pay_after_pickup: boolean;
  auto_cancel_unpaid_orders_minutes: number;

  // 3. VENDOR (CANTEEN) GOVERNANCE
  // Vendor Lifecycle
  allow_vendor_self_registration: boolean;
  require_vendor_approval: boolean;
  allow_vendor_suspension: boolean;
  allow_vendor_deletion: boolean;
  
  // Vendor Operations
  allow_vendors_edit_prices: boolean;
  allow_vendors_disable_products: boolean;
  allow_vendors_see_user_details: boolean;
  allow_vendors_reject_orders: boolean;

  // 4. USER ACCESS & IDENTITY CONTROL
  // Registration
  allow_user_self_registration: boolean;
  require_email_verification: boolean;
  restrict_registration_by_domain: boolean;
  allowed_email_domains: string[];
  require_user_approval: boolean;
  
  // Authentication
  enforce_password_policy: boolean;
  password_min_length: number;
  password_require_complexity: boolean;
  force_logout_on_role_change: boolean;
  enable_multi_device_login: boolean;
  enforce_single_session: boolean;
  
  // User Behavior
  limit_orders_per_user_per_day: boolean;
  max_orders_per_user_per_day: number;
  limit_wallet_usage_per_day: boolean;
  allow_order_cancellation_by_user: boolean;

  // 5. ORDER FULFILLMENT & PICKUP
  // Pickup
  enable_scheduled_pickup: boolean;
  enable_instant_pickup: boolean;
  require_qr_code_for_pickup: boolean;
  require_otp_for_pickup: boolean;
  
  // Status Flow
  vendor_must_accept_order: boolean;
  auto_accept_orders: boolean;
  auto_complete_after_pickup: boolean;

  // 6. NOTIFICATIONS & REAL-TIME
  // Notification Channels
  enable_realtime_updates: boolean;
  enable_inapp_notifications: boolean;
  enable_email_notifications: boolean;
  enable_sms_notifications: boolean;
  
  // Event Toggles
  notify_vendor_on_new_order: boolean;
  notify_user_on_status_change: boolean;
  notify_admin_on_failed_payments: boolean;

  // 7. REPORTING & VISIBILITY
  enable_analytics_dashboard: boolean;
  allow_admin_view_revenue: boolean;
  allow_vendor_view_sales: boolean;
  allow_export_reports: boolean;

  // 8. SECURITY & COMPLIANCE
  enable_audit_logging: boolean;
  log_payment_attempts: boolean;
  log_failed_logins: boolean;
  mask_user_data_for_vendors: boolean;
  auto_lock_on_multiple_failures: boolean;
  max_failed_login_attempts: number;
}

export interface InstitutionLimits {
  max_users: number;
  max_vendors: number;
  max_orders_per_day: number;
  max_wallet_balance: number;
  max_concurrent_sessions: number;
  max_products_per_vendor: number;
  max_active_orders_per_vendor: number;
}

export interface InstitutionBranding {
  custom_logo_url: string | null;
  custom_theme_color: string;
  show_institution_name: boolean;
  disable_platform_branding: boolean;
}

export interface InstitutionSecurity {
  enable_2fa: boolean;
  session_timeout_minutes: number;
  require_password_change_days: number;
  ip_whitelist: string[];
  enable_rate_limiting: boolean;
}

export type InstitutionStatus = 'active' | 'suspended' | 'inactive';
export type InstitutionPlan = 'free' | 'custom' | 'enterprise';

export interface InstitutionConfig {
  id: string;
  name: string;
  emailDomain: string;
  contactEmail?: string;
  contactPhone?: string;
  status: InstitutionStatus;
  plan: InstitutionPlan;
  features: InstitutionFeatures;
  limits: InstitutionLimits;
  branding: InstitutionBranding;
  security: InstitutionSecurity;
  createdAt: Date;
  updatedAt: Date;
}

// Feature check helper type
export type FeatureKey = keyof InstitutionFeatures;
export type LimitKey = keyof InstitutionLimits;
