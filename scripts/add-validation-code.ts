import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addValidationCodeColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding validation_code and verified_at columns to orders table...');
    
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS validation_code VARCHAR(6),
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
    `);
    
    console.log('✓ Columns added successfully');
    
    console.log('Creating index on validation_code...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_validation_code ON orders(validation_code);
    `);
    
    console.log('✓ Index created successfully');
    
    console.log('Generating validation codes for existing orders...');
    
    // Generate validation codes for existing orders that don't have one
    const result = await client.query(`
      UPDATE orders 
      SET validation_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
      WHERE validation_code IS NULL;
    `);
    
    console.log(`✓ Generated validation codes for ${result.rowCount} orders`);
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addValidationCodeColumn().catch(console.error);
