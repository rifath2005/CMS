import { Pool } from 'pg';
import bcrypt from 'bcrypt';
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

async function fixPasswords() {
  try {
    console.log('🔐 Generating correct password hash for "password123"...\n');

    // Generate the correct hash for password123
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);

    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}\n`);

    console.log('📝 Updating all user passwords...\n');

    // Update all users with the correct hash
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE password_hash IS NOT NULL',
      [hash]
    );

    console.log(`✅ Updated ${result.rowCount} user passwords\n`);

    // Verify by testing login for one user
    console.log('🧪 Testing login for john.doe@mitcoe.edu...\n');
    
    const testUser = await pool.query(
      'SELECT email, password_hash FROM users WHERE email = $1',
      ['john.doe@mitcoe.edu']
    );

    if (testUser.rows.length > 0) {
      const isValid = await bcrypt.compare(password, testUser.rows[0].password_hash);
      console.log(`Password verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    }

    console.log('🎉 All passwords fixed! You can now login with:');
    console.log('   Email: john.doe@mitcoe.edu');
    console.log('   Password: password123\n');

  } catch (error: any) {
    console.error('❌ Error fixing passwords:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixPasswords();
