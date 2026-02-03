import { Pool } from 'pg';
import { pool } from '../src/config/database';

async function verifyMigration() {
  try {
    console.log('Verifying migration results...');
    
    // Check if schema_migrations table exists and has data
    try {
      const migrations = await pool.query('SELECT * FROM schema_migrations ORDER BY version');
      console.log('\nApplied migrations:');
      if (migrations.rows.length === 0) {
        console.log('  No migrations found in schema_migrations table');
      } else {
        migrations.rows.forEach(row => {
          console.log(`  - ${row.version}: ${row.name} (applied: ${row.applied_at})`);
        });
      }
    } catch (error) {
      console.log('  schema_migrations table does not exist');
    }
    
    // Check institutions table for new columns
    const institutionsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'institutions' 
      AND column_name IN ('institution_features', 'institution_limits', 'institution_security', 'institution_branding')
      ORDER BY column_name;
    `);
    
    console.log('\nNew JSONB columns in institutions table:');
    if (institutionsColumns.rows.length === 0) {
      console.log('  No new JSONB columns found');
    } else {
      institutionsColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }
    
    // Check for new tables
    const newTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('platform_settings', 'configuration_audit_logs')
      ORDER BY table_name;
    `);
    
    console.log('\nNew tables:');
    if (newTables.rows.length === 0) {
      console.log('  No new tables found');
    } else {
      newTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    // Check platform_settings data
    try {
      const settings = await pool.query('SELECT key, description FROM platform_settings ORDER BY key');
      console.log('\nPlatform settings:');
      if (settings.rows.length === 0) {
        console.log('  No platform settings found');
      } else {
        settings.rows.forEach(row => {
          console.log(`  - ${row.key}: ${row.description}`);
        });
      }
    } catch (error) {
      console.log('  Could not query platform_settings table');
    }
    
  } catch (error) {
    console.error('Error verifying migration:', error);
  }
}

verifyMigration();