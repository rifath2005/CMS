import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'canteen_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function expireOldOrders() {
  try {
    console.log('🔍 Checking for expired orders...\n');

    // First, show orders that need to be expired
    const checkResult = await pool.query(
      `SELECT 
        id, 
        user_id, 
        vendor_id, 
        status, 
        bill_expires_at,
        created_at,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - bill_expires_at)) / 60 as minutes_overdue
      FROM orders 
      WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
        AND bill_expires_at < CURRENT_TIMESTAMP
      ORDER BY bill_expires_at ASC`
    );

    if (checkResult.rows.length === 0) {
      console.log('✓ No expired orders found. All orders are up to date!');
      return;
    }

    console.log(`Found ${checkResult.rows.length} order(s) that need to be expired:\n`);
    
    checkResult.rows.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.created_at}`);
      console.log(`   Expired at: ${order.bill_expires_at}`);
      console.log(`   Overdue by: ${Math.floor(order.minutes_overdue)} minutes`);
      console.log('');
    });

    // Update expired orders
    const updateResult = await pool.query(
      `UPDATE orders 
       SET status = 'EXPIRED'
       WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
         AND bill_expires_at < CURRENT_TIMESTAMP
       RETURNING id, status, bill_expires_at`
    );

    console.log(`\n✅ Successfully expired ${updateResult.rows.length} order(s)!\n`);
    
    updateResult.rows.forEach((order, index) => {
      console.log(`${index + 1}. Order ${order.id} → Status: ${order.status}`);
    });

    console.log('\n✓ All expired orders have been updated in the database.');
    console.log('✓ These orders will now appear in the order history.');

  } catch (error) {
    console.error('❌ Error expiring orders:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
expireOldOrders()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
