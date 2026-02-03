-- Migration: Add Institution Feature Flags and Configuration
-- This adds comprehensive feature flag support for institution-level configuration

-- Add JSONB columns for feature flags and configuration
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{
  "enable_orders": true,
  "allow_same_day_orders": true,
  "allow_future_date_orders": true,
  "allow_multiple_orders_per_day": true,
  "enforce_one_active_order": false,
  "enforce_ordering_time_window": false,
  "ordering_start_time": "08:00",
  "ordering_end_time": "20:00",
  "disable_orders_on_holidays": false,
  "disable_orders_on_weekends": false,
  "limit_items_per_order": false,
  "max_items_per_order": 10,
  "limit_quantity_per_product": false,
  "allow_bulk_orders": false,
  "enable_wallet": true,
  "enable_mock_upi": true,
  "enable_cash_on_delivery": false,
  "enable_post_paid": false,
  "enable_wallet_topup": true,
  "enable_auto_debit": false,
  "enforce_wallet_balance_limit": false,
  "max_wallet_balance": 10000,
  "minimum_wallet_balance_required": 0,
  "require_payment_before_acceptance": true,
  "allow_pay_after_pickup": false,
  "auto_cancel_unpaid_orders_minutes": 30,
  "allow_vendor_self_registration": false,
  "require_vendor_approval": true,
  "allow_vendor_suspension": true,
  "allow_vendor_deletion": false,
  "allow_vendors_edit_prices": true,
  "allow_vendors_disable_products": true,
  "allow_vendors_see_user_details": false,
  "allow_vendors_reject_orders": true,
  "allow_user_self_registration": true,
  "require_email_verification": false,
  "restrict_registration_by_domain": true,
  "allowed_email_domains": [],
  "require_user_approval": false,
  "enforce_password_policy": true,
  "password_min_length": 8,
  "password_require_complexity": true,
  "force_logout_on_role_change": true,
  "enable_multi_device_login": true,
  "enforce_single_session": false,
  "limit_orders_per_user_per_day": false,
  "max_orders_per_user_per_day": 5,
  "limit_wallet_usage_per_day": false,
  "allow_order_cancellation_by_user": true,
  "enable_scheduled_pickup": true,
  "enable_instant_pickup": true,
  "require_qr_code_for_pickup": true,
  "require_otp_for_pickup": false,
  "vendor_must_accept_order": true,
  "auto_accept_orders": false,
  "auto_complete_after_pickup": true,
  "enable_realtime_updates": true,
  "enable_inapp_notifications": true,
  "enable_email_notifications": false,
  "enable_sms_notifications": false,
  "notify_vendor_on_new_order": true,
  "notify_user_on_status_change": true,
  "notify_admin_on_failed_payments": true,
  "enable_analytics_dashboard": true,
  "allow_admin_view_revenue": true,
  "allow_vendor_view_sales": true,
  "allow_export_reports": true,
  "enable_audit_logging": true,
  "log_payment_attempts": true,
  "log_failed_logins": true,
  "mask_user_data_for_vendors": true,
  "auto_lock_on_multiple_failures": true,
  "max_failed_login_attempts": 5
}'::jsonb;

ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{
  "max_users": 10000,
  "max_vendors": 50,
  "max_orders_per_day": 1000,
  "max_wallet_balance": 10000,
  "max_concurrent_sessions": 3,
  "max_products_per_vendor": 100,
  "max_active_orders_per_vendor": 50
}'::jsonb;

ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{
  "custom_logo_url": null,
  "custom_theme_color": "#3B82F6",
  "show_institution_name": true,
  "disable_platform_branding": false
}'::jsonb;

ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS security JSONB DEFAULT '{
  "enable_2fa": false,
  "session_timeout_minutes": 60,
  "require_password_change_days": 90,
  "ip_whitelist": [],
  "enable_rate_limiting": true
}'::jsonb;

-- Add status column for institution lifecycle management
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive'));

-- Add plan column for subscription management
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'custom', 'enterprise'));

-- Create index for faster feature flag lookups
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_plan ON institutions(plan);

-- Add GIN indexes for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_institutions_features ON institutions USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_institutions_limits ON institutions USING GIN (limits);

-- Add updated_at column with trigger
ALTER TABLE institutions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;
CREATE TRIGGER update_institutions_updated_at
    BEFORE UPDATE ON institutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN institutions.features IS 'Feature flags controlling institution behavior and capabilities';
COMMENT ON COLUMN institutions.limits IS 'Hard limits and quotas for the institution';
COMMENT ON COLUMN institutions.branding IS 'Branding and UI customization settings';
COMMENT ON COLUMN institutions.security IS 'Security and compliance settings';
COMMENT ON COLUMN institutions.status IS 'Institution lifecycle status (active, suspended, inactive)';
COMMENT ON COLUMN institutions.plan IS 'Subscription plan type (free, custom, enterprise)';
