import { Pool } from 'pg';
import { config } from '../src/config/env';

/**
 * Script to add user_id column to canteens table and link vendor users
 * Run with: npx ts-node scripts/link-vendors.ts
 */

async function linkVendorsToCanteens() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🚀 Starting vendor-canteen linking process...\n');

    // Step 1: Add user_id column
    console.log('Step 1: Adding user_id column to canteens table...');
    await pool.query(`
      ALTER TABLE canteens 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log('✓ Column added successfully\n');

    // Step 2: Show current state
    console.log('Step 2: Checking current state...');
    const beforeResult = await pool.query(`
      SELECT 
        COUNT(*) as total_canteens,
        COUNT(user_id) as canteens_with_user,
        COUNT(*) - COUNT(user_id) as canteens_without_user
      FROM canteens
    `);
    console.log('Before migration:', beforeResult.rows[0]);
    console.log('');

    // Step 3: Link vendors to canteens
    console.log('Step 3: Linking vendor users to canteens...');
    
    const vendorMappings = [
      { email: 'vendor.maincanteen@mitcoe.edu', vendorId: 'MIT-MC-001' },
      { email: 'vendor.snackshop@mitcoe.edu', vendorId: 'MIT-SS-002' },
      { email: 'vendor.cafeteria@mitcoe.edu', vendorId: 'MIT-CF-003' },
      { email: 'vendor.foodcourt@vit.edu', vendorId: 'VIT-FC-001' },
    ];

    for (const mapping of vendorMappings) {
      const result = await pool.query(
        `UPDATE canteens 
         SET user_id = (SELECT id FROM users WHERE email = $1 AND role = 'VENDOR')
         WHERE vendor_id = $2
         RETURNING vendor_id, user_id`,
        [mapping.email, mapping.vendorId]
      );
      
      if (result.rows.length > 0) {
        console.log(`✓ Linked ${mapping.vendorId} to ${mapping.email}`);
      } else {
        console.log(`⚠ Could not link ${mapping.vendorId} (canteen or user not found)`);
      }
    }
    console.log('');

    // Step 4: Show results
    console.log('Step 4: Verifying results...');
    const afterResult = await pool.query(`
      SELECT 
        COUNT(*) as total_canteens,
        COUNT(user_id) as canteens_with_user,
        COUNT(*) - COUNT(user_id) as canteens_without_user
      FROM canteens
    `);
    console.log('After migration:', afterResult.rows[0]);
    console.log('');

    // Step 5: Show detailed mapping
    console.log('Step 5: Detailed canteen-vendor mapping:');
    const detailResult = await pool.query(`
      SELECT 
        c.vendor_id,
        c.name as canteen_name,
        c.location,
        c.user_id,
        u.email as vendor_email,
        u.name as vendor_name,
        i.name as institution_name
      FROM canteens c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN institutions i ON c.institution_id = i.id
      ORDER BY i.name, c.vendor_id
    `);
    
    console.table(detailResult.rows);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
linkVendorsToCanteens()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
