#!/usr/bin/env ts-node

/**
 * Database reset script
 * WARNING: This will drop all tables and recreate them
 * Use only in development!
 */

import { resetDatabase } from '../src/database/init';
import { pool, closePool } from '../src/config/database';
import { config } from '../src/config/env';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askConfirmation = (): Promise<boolean> => {
  return new Promise((resolve) => {
    rl.question('Are you sure you want to reset the database? This will DELETE ALL DATA! (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
};

const main = async () => {
  try {
    console.log('⚠ DATABASE RESET SCRIPT ⚠\n');
    console.log('This will:');
    console.log('  1. Drop all existing tables');
    console.log('  2. Delete all data');
    console.log('  3. Recreate the schema\n');
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Database: ${config.database.name}\n`);

    // Safety check for production
    if (config.nodeEnv === 'production') {
      console.error('✗ Cannot reset database in production environment!');
      process.exit(1);
    }

    // Ask for confirmation
    const confirmed = await askConfirmation();
    
    if (!confirmed) {
      console.log('\nDatabase reset cancelled.');
      process.exit(0);
    }

    console.log('\nResetting database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // Reset database
    await resetDatabase();
    console.log('✓ Database reset completed successfully!\n');

    console.log('Default admin credentials:');
    console.log('  Email: admin@system.com');
    console.log('  Password: admin123\n');

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Database reset failed:');
    console.error(error);
    await closePool();
    process.exit(1);
  }
};

main();
