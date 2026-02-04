-- Migration: Unify Institution Configuration structure
-- This migration ensures that both 'features' and 'institution_features' (and other JSONB columns) 
-- are synchronized to allow transitional support for both models while we move to a unified structure.

BEGIN;

-- 1. Ensure all columns exist (additive and idempotent)
ALTER TABLE institutions 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS security JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS institution_features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS institution_limits JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS institution_branding JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS institution_security JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';

-- 2. Populate default values for the 'features' column (used by InstitutionModel)
UPDATE institutions 
SET features = '{
  "enable_ordering": true,
  "allow_same_day_orders": true,
  "allow_future_date_orders": true,
  "allow_multiple_orders_per_day": true,
  "enforce_one_active_order_at_time": false,
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
  "enable_wallet_top_up": true,
  "enable_auto_debit": false,
  "enforce_wallet_balance_limit": false,
  "minimum_wallet_balance_required": false,
  "require_payment_before_acceptance": true,
  "allow_pay_after_pickup": false,
  "auto_cancel_unpaid_orders": true,
  "unpaid_order_timeout_minutes": 30,
  "allow_vendor_self_registration": false,
  "require_admin_approval_for_vendors": true,
  "allow_vendor_suspension": true,
  "allow_vendor_deletion": false,
  "allow_vendors_edit_prices": true,
  "allow_vendors_disable_products": true,
  "allow_vendors_see_user_details": false,
  "allow_vendors_reject_orders": true,
  "allow_user_self_registration": true,
  "require_email_verification": false,
  "restrict_registration_by_email_domain": true,
  "allowed_email_domains": [],
  "require_admin_approval_for_users": false,
  "enforce_password_policy": true,
  "password_min_length": 8,
  "password_require_complexity": true,
  "force_logout_on_role_change": true,
  "enable_multi_device_login": true,
  "enforce_single_session_per_user": false,
  "enable_scheduled_pickup": true,
  "enable_instant_pickup": true,
  "require_qr_code_for_pickup": true,
  "require_otp_for_pickup": false,
  "vendor_must_accept_order": true,
  "auto_accept_orders": false,
  "auto_complete_orders_after_pickup": true,
  "enable_real_time_updates": true,
  "enable_in_app_notifications": true,
  "enable_email_notifications": false,
  "enable_sms_notifications": false,
  "notify_vendor_on_new_order": true,
  "notify_user_on_status_change": true,
  "notify_admin_on_failed_payments": true,
  "enable_analytics_dashboard": true,
  "allow_institution_admin_view_revenue": true,
  "allow_vendor_view_sales_reports": true,
  "allow_export_reports": true,
  "enable_audit_logging": true,
  "log_payment_attempts": true,
  "log_failed_logins": true,
  "mask_user_personal_data_for_vendors": true,
  "auto_lock_accounts_on_failures": true,
  "custom_institution_logo": false,
  "custom_theme_color": false,
  "show_institution_name_in_user_app": true,
  "disable_platform_branding": false
}'::jsonb
WHERE features IS NULL OR features = '{}';

-- 3. Sync 'institution_features' with 'features' for consistency
UPDATE institutions 
SET 
  institution_features = features,
  institution_limits = limits,
  institution_branding = branding,
  institution_security = security
WHERE institution_features = '{}' AND features != '{}';

-- 4. Ensure platform_settings table exists
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed default global settings if missing
INSERT INTO platform_settings (key, value, description)
VALUES 
('maintenance_mode', 'false', 'Global maintenance mode toggle'),
('maintenance_message', '"System maintenance in progress. Please try again later."', 'Message displayed during maintenance mode'),
('global_payments_enabled', 'true', 'Global toggle for payment processing across all institutions'),
('new_institution_creation_enabled', 'true', 'Allow creation of new institutions'),
('global_real_time_enabled', 'true', 'Global toggle for WebSocket real-time features'),
('platform_announcement', '""', 'Platform-wide announcement message')
ON CONFLICT (key) DO NOTHING;

COMMIT;
