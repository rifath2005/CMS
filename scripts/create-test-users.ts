#!/usr/bin/env ts-node

import bcrypt from 'bcrypt';
import { pool, closePool } from '../src/config/database';

const createTestUsers = async () => {
  try {
    console.log('Creating test users...\n');

    const password = 'pass123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('Password hash generated');
    console.log('');

    // Check if institution exists
    const institutionCheck = await pool.query(
      "SELECT id FROM institutions WHERE email_domain = 'example.com'"
    );

    let institutionId;
    if (institutionCheck.rows.length === 0) {
      const institutionResult = await pool.query(
        `INSERT INTO institutions (name, email_domain, contact_email, contact_phone)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['Example University', 'example.com', 'admin@example.com', '+1234567890']
      );
      institutionId = institutionResult.rows[0].id;
      console.log('✓ Created test institution');
    } else {
      institutionId = institutionCheck.rows[0].id;
      console.log('✓ Test institution already exists');
    }

    const users = [
      { email: 'user@example.com', name: 'Test User', role: 'USER' },
      { email: 'vendor@example.com', name: 'Test Vendor', role: 'VENDOR' },
      { email: 'admin@example.com', name: 'Test Admin', role: 'INSTITUTION_ADMIN' },
    ];

    for (const user of users) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );

      if (existingUser.rows.length > 0) {
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE email = $2',
          [passwordHash, user.email]
        );
        console.log(`✓ Updated ${user.email} (${user.role})`);
      } else {
        await pool.query(
          `INSERT INTO users (email, password_hash, name, role, institution_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.email, passwordHash, user.name, user.role, institutionId]
        );
        console.log(`✓ Created ${user.email} (${user.role})`);
      }
    }

    // Create test canteen for vendor
    const canteenCheck = await pool.query(
      "SELECT id FROM canteens WHERE vendor_id = 'VENDOR1'"
    );

    if (canteenCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO canteens (institution_id, vendor_id, name, location, operating_hours, is_active, is_approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          institutionId,
          'VENDOR1',
          'Test Canteen',
          'Main Building',
          JSON.stringify({
            monday: '08:00-20:00',
            tuesday: '08:00-20:00',
            wednesday: '08:00-20:00',
            thursday: '08:00-20:00',
            friday: '08:00-20:00',
            saturday: '09:00-18:00',
            sunday: 'closed',
          }),
          true,
          true,
        ]
      );
      console.log('✓ Created test canteen');
    }

    console.log('\n✅ Test users created successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('👤 USER:     user@example.com   / pass123');
    console.log('🏪 VENDOR:   vendor@example.com / pass123');
    console.log('👨‍💼 ADMIN:    admin@example.com  / pass123\n');
    console.log('═══════════════════════════════════════════════════════\n');

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await closePool();
    process.exit(1);
  }
};

createTestUsers();
