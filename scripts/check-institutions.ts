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

async function checkInstitutions() {
  try {
    console.log('Checking institutions in database...\n');

    const result = await pool.query(`
      SELECT id, name, email_domain, contact_email, is_active
      FROM institutions 
      ORDER BY name ASC
    `);

    if (result.rows.length === 0) {
      console.log('❌ No institutions found in database!');
      console.log('\nYou need to seed the database with institutions.');
      console.log('Run: npm run seed');
    } else {
      console.log(`✅ Found ${result.rows.length} institution(s):\n`);
      result.rows.forEach((inst, i) => {
        console.log(`${i + 1}. ${inst.name}`);
        console.log(`   ID: ${inst.id}`);
        console.log(`   Domain: ${inst.email_domain}`);
        console.log(`   Contact: ${inst.contact_email}`);
        console.log(`   Active: ${inst.is_active ? '✅' : '❌'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error checking institutions:', error);
  } finally {
    await pool.end();
  }
}

checkInstitutions();
