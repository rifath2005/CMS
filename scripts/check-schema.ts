import { Pool } from 'pg';
import { config } from '../src/config/env';

async function checkSchema() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl,
  });

  try {
    console.log('Checking current schema...');
    
    // Check institutions table columns
    const institutionsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'institutions' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nInstitutions table columns:');
    institutionsColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if platform_settings table exists
    const platformSettingsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'platform_settings'
      );
    `);
    
    console.log(`\nPlatform settings table exists: ${platformSettingsExists.rows[0].exists}`);
    
    // Check if configuration_audit_logs table exists
    const auditLogsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'configuration_audit_logs'
      );
    `);
    
    console.log(`Configuration audit logs table exists: ${auditLogsExists.rows[0].exists}`);
    
    // Check if schema_migrations table exists
    const migrationsExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'schema_migrations'
      );
    `);
    
    console.log(`Schema migrations table exists: ${migrationsExists.rows[0].exists}`);
    
    if (migrationsExists.rows[0].exists) {
      const appliedMigrations = await pool.query('SELECT * FROM schema_migrations ORDER BY version');
      console.log('\nApplied migrations:');
      appliedMigrations.rows.forEach(row => {
        console.log(`  - ${row.version}: ${row.name} (applied at: ${row.applied_at})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();