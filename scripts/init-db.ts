#!/usr/bin/env ts-node

/**
 * Database initialization script
 * Run this script to set up the database schema
 */

import { initializeDatabase, checkDatabaseTables } from '../src/database/init';
import { pool, closePool } from '../src/config/database';

const main = async () => {
  try {
    console.log('Starting database initialization...\n');

    // Test connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful\n');

    // Check if tables already exist
    console.log('Checking existing tables...');
    const tablesExist = await checkDatabaseTables();
    
    if (tablesExist) {
      console.log('⚠ Database tables already exist');
      console.log('If you want to reset the database, use: npm run db:reset\n');
      
      // List existing tables
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('Existing tables:');
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('No existing tables found\n');
      
      // Initialize database
      console.log('Creating database schema...');
      await initializeDatabase();
      console.log('✓ Database schema created successfully\n');
      
      // Verify tables
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('Created tables:');
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      
      console.log('\n✓ Database initialization completed successfully!');
      console.log('\nDefault admin credentials:');
      console.log('  Email: admin@system.com');
      console.log('  Password: admin123');
      console.log('  ⚠ Please change the default password in production!\n');
    }

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Database initialization failed:');
    console.error(error);
    await closePool();
    process.exit(1);
  }
};

main();
