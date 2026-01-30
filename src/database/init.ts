import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Initialize database schema
 * Reads and executes the schema.sql file
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database schema...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    await pool.query(schema);
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
};

/**
 * Check if database tables exist
 */
export const checkDatabaseTables = async (): Promise<boolean> => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'institutions', 'canteens', 'products', 'orders', 'order_items', 'payments')
    `);
    
    return result.rows.length === 7;
  } catch (error) {
    console.error('Failed to check database tables:', error);
    return false;
  }
};

/**
 * Drop all tables (use with caution - for development only)
 */
export const dropAllTables = async (): Promise<void> => {
  try {
    console.log('Dropping all tables...');
    
    await pool.query(`
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS canteens CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS institutions CASCADE;
    `);
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Failed to drop tables:', error);
    throw error;
  }
};

/**
 * Reset database (drop and recreate)
 */
export const resetDatabase = async (): Promise<void> => {
  await dropAllTables();
  await initializeDatabase();
};
