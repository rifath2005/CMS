import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'canteen_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkOrders() {
  try {
    console.log('Checking recent orders...\n');

    const result = await pool.query(`
      SELECT 
        id, 
        status, 
        bill_generated_at,
        bill_expires_at,
        CURRENT_TIMESTAMP as now,
        EXTRACT(EPOCH FROM (bill_expires_at - CURRENT_TIMESTAMP)) / 60 as minutes_remaining,
        EXTRACT(EPOCH FROM (bill_expires_at - bill_generated_at)) / 60 as total_validity_minutes
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('Recent orders:');
    result.rows.forEach((order, i) => {
      console.log(`\n${i + 1}. Order ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Generated at: ${order.bill_generated_at}`);
      console.log(`   Expires at: ${order.bill_expires_at}`);
      console.log(`   Current time: ${order.now}`);
      console.log(`   Minutes remaining: ${order.minutes_remaining?.toFixed(2)}`);
      console.log(`   Total validity: ${order.total_validity_minutes?.toFixed(2)} minutes`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrders();
