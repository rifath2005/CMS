import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkInstitutions() {
  try {
    const result = await pool.query('SELECT id, name FROM institutions ORDER BY name');
    
    console.log('\n=== Institutions in Database ===\n');
    
    if (result.rows.length === 0) {
      console.log('❌ No institutions found in database!');
      console.log('\nYou need to add institutions first. Run the seed script:');
      console.log('npm run seed\n');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.name}`);
        console.log(`   ID: ${row.id}\n`);
      });
      console.log(`Total: ${result.rows.length} institution(s)\n`);
    }
    
    await pool.end();
  } catch (error: any) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkInstitutions();
