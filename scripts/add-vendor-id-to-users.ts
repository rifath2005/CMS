import { Pool } from 'pg';
import { config } from '../src/config/env';

/**
 * Migration script to add vendor_id column to users table
 * and link existing vendor users to their canteens
 */

async function migrateVendorIds() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });

  try {
    console.log('Starting vendor_id migration...');

    // Step 1: Add vendor_id column if it doesn't exist
    console.log('Step 1: Adding vendor_id column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(50) REFERENCES canteens(vendor_id) ON DELETE SET NULL;
    `);
    console.log('✓ Column added successfully');

    // Step 2: Link existing vendor users to canteens based on email patterns
    console.log('Step 2: Linking existing vendor users to canteens...');
    
    // Map vendor emails to their vendor_ids
    const vendorMappings = [
      { email: 'vendor.maincanteen@mitcoe.edu', vendorId: 'MIT-MC-001' },
      { email: 'vendor.snackshop@mitcoe.edu', vendorId: 'MIT-SS-002' },
      { email: 'vendor.cafeteria@mitcoe.edu', vendorId: 'MIT-CF-003' },
      { email: 'vendor.foodcourt@vit.edu', vendorId: 'VIT-FC-001' },
    ];

    for (const mapping of vendorMappings) {
      const result = await pool.query(
        `UPDATE users SET vendor_id = $1 WHERE email = $2 AND role = 'VENDOR' RETURNING id, email, vendor_id`,
        [mapping.vendorId, mapping.email]
      );
      
      if (result.rows.length > 0) {
        console.log(`✓ Linked ${mapping.email} to ${mapping.vendorId}`);
      } else {
        console.log(`⚠ User ${mapping.email} not found or already linked`);
      }
    }

    // Step 3: Verify the migration
    console.log('\nStep 3: Verifying migration...');
    const verifyResult = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.vendor_id, c.name as canteen_name
      FROM users u
      LEFT JOIN canteens c ON u.vendor_id = c.vendor_id
      WHERE u.role = 'VENDOR'
      ORDER BY u.email
    `);

    console.log('\nVendor users and their canteens:');
    console.table(verifyResult.rows);

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
migrateVendorIds()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
