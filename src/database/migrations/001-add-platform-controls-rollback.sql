-- Rollback Migration: Remove Platform Controls Configuration
-- Description: Removes JSONB configuration columns from institutions table and drops platform_settings and configuration_audit_logs tables
-- Version: 001-rollback
-- Date: 2026-02-03

-- Begin transaction for atomic rollback
BEGIN;

-- 1. Drop indexes for configuration_audit_logs table
DROP INDEX IF EXISTS idx_config_audit_change_type_created_at;
DROP INDEX IF EXISTS idx_config_audit_admin_created_at;
DROP INDEX IF EXISTS idx_config_audit_institution_section;
DROP INDEX IF EXISTS idx_config_audit_ip_address;
DROP INDEX IF EXISTS idx_config_audit_created_at;
DROP INDEX IF EXISTS idx_config_audit_field_name;
DROP INDEX IF EXISTS idx_config_audit_section;
DROP INDEX IF EXISTS idx_config_audit_change_type;
DROP INDEX IF EXISTS idx_config_audit_admin_email;
DROP INDEX IF EXISTS idx_config_audit_admin;
DROP INDEX IF EXISTS idx_config_audit_institution;

-- 2. Drop indexes for platform_settings table
DROP INDEX IF EXISTS idx_platform_settings_value_gin;
DROP INDEX IF EXISTS idx_platform_settings_updated_at;
DROP INDEX IF EXISTS idx_platform_settings_updated_by;
DROP INDEX IF EXISTS idx_platform_settings_key;

-- 3. Drop indexes for institutions JSONB columns
DROP INDEX IF EXISTS idx_institutions_max_users;
DROP INDEX IF EXISTS idx_institutions_wallet_enabled;
DROP INDEX IF EXISTS idx_institutions_ordering_enabled;
DROP INDEX IF EXISTS idx_institutions_branding_gin;
DROP INDEX IF EXISTS idx_institutions_security_gin;
DROP INDEX IF EXISTS idx_institutions_limits_gin;
DROP INDEX IF EXISTS idx_institutions_features_gin;

-- 4. Drop triggers
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;

-- 5. Drop tables
DROP TABLE IF EXISTS configuration_audit_logs CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;

-- 6. Remove JSONB columns from institutions table
ALTER TABLE institutions 
DROP COLUMN IF EXISTS institution_features,
DROP COLUMN IF EXISTS institution_limits,
DROP COLUMN IF EXISTS institution_security,
DROP COLUMN IF EXISTS institution_branding;

-- Commit the rollback transaction
COMMIT;

-- Rollback completed successfully