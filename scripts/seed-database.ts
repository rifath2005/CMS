import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Read the seed SQL file
    const seedFilePath = path.join(__dirname, '..', 'src', 'database', 'seed.sql');
    const seedSQL = fs.readFileSync(seedFilePath, 'utf-8');

    // Execute the seed SQL
    await pool.query(seedSQL);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('   Student: john.doe@mitcoe.edu');
    console.log('   Vendor: vendor.maincanteen@mitcoe.edu');
    console.log('   Admin: admin@mitcoe.edu');
    console.log('   Password (all): password123\n');

  } catch (error: any) {
    console.error('❌ Error seeding database:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
