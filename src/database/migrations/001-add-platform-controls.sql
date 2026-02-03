-- Migration: Add Platform Controls Configuration
-- Description: Extends institutions table with JSONB configuration columns and creates platform_settings and configuration_audit_logs tables
-- Version: 001
-- Date: 2026-02-03

-- Begin transaction for atomic migration
BEGIN;

-- 1. Extend institutions table with JSONB configuration columns
ALTER TABLE institutions 
ADD COLUMN institution_features JSONB DEFAULT '{}',
ADD COLUMN institution_limits JSONB DEFAULT '{}',
ADD COLUMN institution_security JSONB DEFAULT '{}',
ADD COLUMN institution_branding JSONB DEFAULT '{}';

-- Add comments for new columns
COMMENT ON COLUMN institutions.institution_features IS 'JSONB configuration for feature toggles (ordering, payment, vendor, user access, fulfillment, notifications, reporting)';
COMMENT ON COLUMN institutions.institution_limits IS 'JSONB configuration for resource quotas and limits (max users, vendors, orders, wallet balance, sessions)';
COMMENT ON COLUMN institutions.institution_security IS 'JSONB configuration for security policies (audit logging, data masking, compliance, authentication)';
COMMENT ON COLUMN institutions.institution_branding IS 'JSONB configuration for institution branding (logo, colors, custom messaging)';

-- 2. Create platform_settings table for global configuration
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for platform_settings table
COMMENT ON TABLE platform_settings IS 'Stores global platform-wide configuration settings that affect all institutions';
COMMENT ON COLUMN platform_settings.key IS 'Unique configuration key (e.g., maintenance_mode, global_payments_enabled)';
COMMENT ON COLUMN platform_settings.value IS 'JSONB configuration value with flexible structure';
COMMENT ON COLUMN platform_settings.description IS 'Human-readable description of the configuration setting';
COMMENT ON COLUMN platform_settings.updated_by IS 'Main Admin user who last updated this setting';

-- 3. Create configuration_audit_logs table for change tracking
CREATE TABLE configuration_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('feature_toggle', 'limit_update', 'security_change', 'branding_change', 'global_setting')),
  section VARCHAR(100) NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for configuration_audit_logs table
COMMENT ON TABLE configuration_audit_logs IS 'Audit trail for all configuration changes made by Main Admin and Institution Admins';
COMMENT ON COLUMN configuration_audit_logs.institution_id IS 'Institution affected by change (NULL for global settings)';
COMMENT ON COLUMN configuration_audit_logs.admin_id IS 'Admin user who made the change';
COMMENT ON COLUMN configuration_audit_logs.change_type IS 'Type of configuration change (feature_toggle, limit_update, etc.)';
COMMENT ON COLUMN configuration_audit_logs.section IS 'Configuration section (ordering, payment, vendor, etc.)';
COMMENT ON COLUMN configuration_audit_logs.field_name IS 'Specific field that was changed';
COMMENT ON COLUMN configuration_audit_logs.old_value IS 'Previous value before change';
COMMENT ON COLUMN configuration_audit_logs.new_value IS 'New value after change';
COMMENT ON COLUMN configuration_audit_logs.reason IS 'Optional reason for the configuration change';

-- 4. Add indexes for JSONB queries and audit log searches

-- Indexes for institutions JSONB columns (GIN indexes for efficient JSONB queries)
CREATE INDEX idx_institutions_features_gin ON institutions USING GIN (institution_features);
CREATE INDEX idx_institutions_limits_gin ON institutions USING GIN (institution_limits);
CREATE INDEX idx_institutions_security_gin ON institutions USING GIN (institution_security);
CREATE INDEX idx_institutions_branding_gin ON institutions USING GIN (institution_branding);

-- Specific indexes for commonly queried JSONB fields
CREATE INDEX idx_institutions_ordering_enabled ON institutions USING GIN ((institution_features->'enable_ordering'));
CREATE INDEX idx_institutions_wallet_enabled ON institutions USING GIN ((institution_features->'enable_wallet'));
CREATE INDEX idx_institutions_max_users ON institutions USING GIN ((institution_limits->'max_users'));

-- Indexes for platform_settings table
CREATE INDEX idx_platform_settings_key ON platform_settings(key);
CREATE INDEX idx_platform_settings_updated_by ON platform_settings(updated_by);
CREATE INDEX idx_platform_settings_updated_at ON platform_settings(updated_at);
CREATE INDEX idx_platform_settings_value_gin ON platform_settings USING GIN (value);

-- Indexes for configuration_audit_logs table
CREATE INDEX idx_config_audit_institution ON configuration_audit_logs(institution_id);
CREATE INDEX idx_config_audit_admin ON configuration_audit_logs(admin_id);
CREATE INDEX idx_config_audit_admin_email ON configuration_audit_logs(admin_email);
CREATE INDEX idx_config_audit_change_type ON configuration_audit_logs(change_type);
CREATE INDEX idx_config_audit_section ON configuration_audit_logs(section);
CREATE INDEX idx_config_audit_field_name ON configuration_audit_logs(field_name);
CREATE INDEX idx_config_audit_created_at ON configuration_audit_logs(created_at);
CREATE INDEX idx_config_audit_ip_address ON configuration_audit_logs(ip_address);

-- Composite indexes for common query patterns
CREATE INDEX idx_config_audit_institution_section ON configuration_audit_logs(institution_id, section);
CREATE INDEX idx_config_audit_admin_created_at ON configuration_audit_logs(admin_id, created_at DESC);
CREATE INDEX idx_config_audit_change_type_created_at ON configuration_audit_logs(change_type, created_at DESC);

-- 5. Add triggers for automatic timestamp updates
CREATE TRIGGER update_platform_settings_updated_at 
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert default global platform settings
INSERT INTO platform_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'Global maintenance mode toggle'),
('maintenance_message', '"System maintenance in progress. Please try again later."', 'Message displayed during maintenance mode'),
('global_payments_enabled', 'true', 'Global toggle for payment processing across all institutions'),
('new_institution_creation_enabled', 'true', 'Allow creation of new institutions'),
('global_real_time_enabled', 'true', 'Global toggle for WebSocket real-time features'),
('platform_announcement', '""', 'Platform-wide announcement message'),
('support_contact_email', '"support@cms-platform.com"', 'Support contact email for the platform'),
('terms_of_service_url', '""', 'URL to platform terms of service'),
('privacy_policy_url', '""', 'URL to platform privacy policy');

-- 7. Initialize default configuration for existing institutions
UPDATE institutions 
SET 
  institution_features = '{
    "enable_ordering": true,
    "allow_same_day_orders": true,
    "allow_future_date_orders": true,
    "allow_multiple_orders_per_day": true,
    "enforce_one_active_order_at_time": false,
    "enforce_ordering_time_window": false,
    "ordering_start_time": "06:00",
    "ordering_end_time": "22:00",
    "disable_orders_on_holidays": false,
    "disable_orders_on_weekends": false,
    "limit_items_per_order": false,
    "max_items_per_order": 10,
    "limit_quantity_per_product": false,
    "allow_bulk_orders": true,
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
    "allow_vendor_self_registration": true,
    "require_admin_approval_for_vendors": true,
    "allow_vendor_suspension": true,
    "allow_vendor_deletion": false,
    "allow_vendors_edit_prices": true,
    "allow_vendors_disable_products": true,
    "allow_vendors_see_user_details": false,
    "allow_vendors_reject_orders": true,
    "allow_user_self_registration": true,
    "require_email_verification": false,
    "restrict_registration_by_email_domain": false,
    "allowed_email_domains": [],
    "require_admin_approval_for_users": false,
    "enforce_password_policy": false,
    "password_min_length": 8,
    "password_require_complexity": false,
    "force_logout_on_role_change": true,
    "enable_multi_device_login": true,
    "enforce_single_session_per_user": false,
    "enable_scheduled_pickup": true,
    "enable_instant_pickup": true,
    "require_qr_code_for_pickup": true,
    "require_otp_for_pickup": false,
    "vendor_must_accept_order": false,
    "auto_accept_orders": true,
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
    "mask_user_personal_data_for_vendors": false,
    "auto_lock_accounts_on_failures": false,
    "custom_institution_logo": false,
    "custom_theme_color": false,
    "show_institution_name_in_user_app": true,
    "disable_platform_branding": false
  }',
  institution_limits = '{
    "max_users": 10000,
    "max_vendors": 100,
    "max_orders_per_day": 1000,
    "max_wallet_balance": 10000.00,
    "max_concurrent_sessions": 5,
    "max_products_per_vendor": 100,
    "max_active_orders_per_vendor": 50,
    "max_failed_login_attempts": 5,
    "session_timeout_minutes": 480,
    "order_expiry_minutes": 30
  }',
  institution_security = '{
    "audit_retention_days": 365,
    "require_2fa_for_admins": false,
    "encrypt_sensitive_data": true,
    "data_masking_level": "partial",
    "compliance_mode": false,
    "gdpr_compliance": false,
    "data_export_restrictions": false,
    "ip_whitelist_enabled": false,
    "allowed_ip_ranges": []
  }',
  institution_branding = '{
    "logo_url": "",
    "primary_color": "#3B82F6",
    "secondary_color": "#1E40AF",
    "institution_name_display": true,
    "custom_welcome_message": "",
    "footer_text": ""
  }'
WHERE institution_features IS NULL OR institution_features = '{}';

-- Commit the transaction
COMMIT;

-- Migration completed successfully