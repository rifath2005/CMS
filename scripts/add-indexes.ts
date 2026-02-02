import { pool, closePool } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function addPerformanceIndexes() {
  try {
    console.log('🚀 Adding performance indexes...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../src/database/add-performance-indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ Performance indexes added successfully!\n');
    console.log('📊 Dashboard loading should now be much faster.\n');

  } catch (error: any) {
    console.error('❌ Error adding indexes:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

addPerformanceIndexes();
