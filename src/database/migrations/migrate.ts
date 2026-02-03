import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../../config/database';

interface Migration {
  version: string;
  name: string;
  filePath: string;
  rollbackPath: string;
}

class MigrationRunner {
  private pool: Pool;
  private migrations: Migration[] = [
    {
      version: '001',
      name: 'add-platform-controls',
      filePath: join(__dirname, '001-add-platform-controls.sql'),
      rollbackPath: join(__dirname, '001-add-platform-controls-rollback.sql')
    },
    {
      version: '002',
      name: 'add-institution-feature-flags',
      filePath: join(__dirname, 'add-institution-feature-flags.sql'),
      rollbackPath: join(__dirname, '001-add-platform-controls-rollback.sql') // Placeholder rollback
    },
    {
      version: '003',
      name: 'unify-institution-config',
      filePath: join(__dirname, '003-unify-institution-config.sql'),
      rollbackPath: join(__dirname, '001-add-platform-controls-rollback.sql') // Placeholder rollback
    }
  ];

  constructor() {
    this.pool = pool;
  }

  async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        applied_by VARCHAR(255)
      );
    `;
    
    await this.pool.query(createTableSQL);
    console.log('✓ Migrations table created/verified');
  }

  async getMigratedVersions(): Promise<string[]> {
    try {
      const result = await this.pool.query('SELECT version FROM schema_migrations ORDER BY version');
      return result.rows.map(row => row.version);
    } catch (error) {
      // Table doesn't exist yet
      return [];
    }
  }

  async applyMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      console.log(`Applying migration ${migration.version}: ${migration.name}...`);
      
      // Read and execute migration SQL
      const migrationSQL = readFileSync(migration.filePath, 'utf8');
      await client.query(migrationSQL);
      
      // Record migration in schema_migrations table
      await client.query(
        'INSERT INTO schema_migrations (version, name, applied_by) VALUES ($1, $2, $3)',
        [migration.version, migration.name, 'migration-runner']
      );
      
      console.log(`✓ Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`✗ Failed to apply migration ${migration.version}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      console.log(`Rolling back migration ${migration.version}: ${migration.name}...`);
      
      // Read and execute rollback SQL
      const rollbackSQL = readFileSync(migration.rollbackPath, 'utf8');
      await client.query(rollbackSQL);
      
      // Remove migration record from schema_migrations table
      await client.query(
        'DELETE FROM schema_migrations WHERE version = $1',
        [migration.version]
      );
      
      console.log(`✓ Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      console.error(`✗ Failed to rollback migration ${migration.version}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async migrateUp(): Promise<void> {
    console.log('Starting database migration...');
    
    await this.createMigrationsTable();
    const appliedVersions = await this.getMigratedVersions();
    
    for (const migration of this.migrations) {
      if (!appliedVersions.includes(migration.version)) {
        await this.applyMigration(migration);
      } else {
        console.log(`- Migration ${migration.version} already applied, skipping`);
      }
    }
    
    console.log('✓ All migrations completed successfully');
  }

  async migrateDown(targetVersion?: string): Promise<void> {
    console.log('Starting database rollback...');
    
    const appliedVersions = await this.getMigratedVersions();
    const migrationsToRollback = this.migrations
      .filter(m => appliedVersions.includes(m.version))
      .reverse(); // Rollback in reverse order
    
    for (const migration of migrationsToRollback) {
      if (targetVersion && migration.version <= targetVersion) {
        break;
      }
      await this.rollbackMigration(migration);
    }
    
    console.log('✓ Rollback completed successfully');
  }

  async getStatus(): Promise<void> {
    console.log('Migration Status:');
    console.log('================');
    
    const appliedVersions = await this.getMigratedVersions();
    
    for (const migration of this.migrations) {
      const status = appliedVersions.includes(migration.version) ? '✓ Applied' : '✗ Pending';
      console.log(`${migration.version}: ${migration.name} - ${status}`);
    }
  }

  async close(): Promise<void> {
    // Don't close the shared pool, just return
    return Promise.resolve();
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'up':
        await runner.migrateUp();
        break;
      case 'down':
        const targetVersion = process.argv[3];
        await runner.migrateDown(targetVersion);
        break;
      case 'status':
        await runner.getStatus();
        break;
      default:
        console.log('Usage:');
        console.log('  npm run migrate up     - Apply all pending migrations');
        console.log('  npm run migrate down   - Rollback all migrations');
        console.log('  npm run migrate down <version> - Rollback to specific version');
        console.log('  npm run migrate status - Show migration status');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

if (require.main === module) {
  main();
}

export { MigrationRunner };