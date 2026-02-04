# Database Migrations

This directory contains database migration scripts for the CMS Platform Controls feature.

## Overview

The migration system provides a structured way to apply and rollback database schema changes. It includes:

- **Migration Scripts**: SQL files that apply schema changes
- **Rollback Scripts**: SQL files that undo schema changes  
- **Migration Runner**: TypeScript utility to manage migrations
- **Version Tracking**: Automatic tracking of applied migrations

## Migration Files

### 001-add-platform-controls.sql
Adds the core platform controls infrastructure:

**New Columns in `institutions` table:**
- `institution_features` (JSONB) - Feature toggles configuration
- `institution_limits` (JSONB) - Resource quotas and limits
- `institution_security` (JSONB) - Security policies configuration  
- `institution_branding` (JSONB) - Branding customization settings

**New Tables:**
- `platform_settings` - Global platform-wide configuration
- `configuration_audit_logs` - Audit trail for configuration changes
- `schema_migrations` - Migration version tracking

**Indexes:**
- GIN indexes on all JSONB columns for efficient queries
- Composite indexes for common query patterns
- Standard B-tree indexes for foreign keys and timestamps

**Default Data:**
- Global platform settings with sensible defaults
- Default configuration for existing institutions

### 001-add-platform-controls-rollback.sql
Completely removes all changes made by the migration:
- Drops all new tables
- Removes JSONB columns from institutions table
- Drops all associated indexes and triggers

## Usage

### Apply Migrations
```bash
# Apply all pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status
```

### Rollback Migrations
```bash
# Rollback all migrations
npm run migrate:down

# Rollback to specific version
npm run migrate:down 001
```

### Available Scripts
- `npm run migrate` - Show usage help
- `npm run migrate:up` - Apply all pending migrations
- `npm run migrate:down` - Rollback all migrations  
- `npm run migrate:status` - Show current migration status

## Migration Runner Features

### Atomic Operations
- Each migration runs in a transaction
- Automatic rollback on failure
- Consistent state guaranteed

### Connection Management
- Uses existing database pool configuration
- Proper SSL handling for cloud databases
- Connection timeout and retry logic

### Error Handling
- Detailed error messages
- Graceful failure handling
- Proper cleanup on errors

### Audit Trail
- Tracks who applied each migration
- Records application timestamps
- Maintains migration history

## Configuration Schema

### Institution Features (institution_features JSONB)
```json
{
  "enable_ordering": true,
  "allow_same_day_orders": true,
  "enable_wallet": true,
  "enable_mock_upi": true,
  "allow_vendor_self_registration": true,
  "require_admin_approval_for_vendors": true,
  // ... 40+ feature toggles
}
```

### Institution Limits (institution_limits JSONB)  
```json
{
  "max_users": 10000,
  "max_vendors": 100,
  "max_orders_per_day": 1000,
  "max_wallet_balance": 10000.00,
  "max_concurrent_sessions": 5,
  // ... resource quotas
}
```

### Institution Security (institution_security JSONB)
```json
{
  "audit_retention_days": 365,
  "require_2fa_for_admins": false,
  "data_masking_level": "partial",
  "compliance_mode": false,
  // ... security policies
}
```

### Institution Branding (institution_branding JSONB)
```json
{
  "logo_url": "",
  "primary_color": "#3B82F6", 
  "secondary_color": "#1E40AF",
  "institution_name_display": true,
  // ... branding settings
}
```

## Index Strategy

### JSONB Indexes
- **GIN indexes** on all JSONB columns for general queries
- **Expression indexes** on frequently accessed JSONB fields
- **Composite indexes** for multi-field queries

### Performance Considerations
- JSONB queries use `->` and `->>` operators efficiently
- GIN indexes support containment and existence queries
- Expression indexes optimize specific field lookups

## Best Practices

### Adding New Migrations
1. Create sequential version numbers (002, 003, etc.)
2. Include both migration and rollback scripts
3. Test migrations on development database first
4. Use transactions for atomic operations
5. Add appropriate indexes for new columns

### JSONB Query Examples
```sql
-- Check if feature is enabled
SELECT * FROM institutions 
WHERE institution_features->>'enable_ordering' = 'true';

-- Query nested JSONB values
SELECT * FROM institutions 
WHERE (institution_limits->>'max_users')::int > 5000;

-- Use GIN index for containment
SELECT * FROM institutions 
WHERE institution_features @> '{"enable_wallet": true}';
```

### Rollback Safety
- Always test rollback scripts
- Ensure rollbacks are truly reversible
- Consider data preservation during rollbacks
- Document any data loss implications

## Troubleshooting

### Connection Issues
- Verify database credentials in `.env`
- Check SSL configuration for cloud databases
- Ensure database server is accessible

### Migration Failures
- Check database logs for detailed errors
- Verify SQL syntax in migration files
- Ensure proper permissions for schema changes
- Test migrations on development database first

### Performance Issues
- Monitor JSONB query performance
- Add specific indexes for slow queries
- Consider query optimization for large datasets
- Use EXPLAIN ANALYZE for query planning

## Security Considerations

### Audit Logging
- All configuration changes are logged
- Includes admin identification and timestamps
- IP address and user agent tracking
- Immutable audit trail

### Access Control
- Migration runner requires database admin privileges
- Configuration changes require Main Admin role
- Audit logs are read-only for Institution Admins

### Data Protection
- Sensitive configuration data is encrypted
- JSONB fields support data masking
- Compliance mode for regulatory requirements