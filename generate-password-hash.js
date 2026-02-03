// Generate bcrypt hash for admin password
const bcrypt = require('bcrypt');

const password = 'password123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('\n=== PASSWORD HASH GENERATED ===\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n=== SQL INSERT COMMAND ===\n');
  console.log(`INSERT INTO users (id, email, password_hash, name, role, institution_id, created_at, updated_at, wallet_balance) VALUES (gen_random_uuid(), 'admin@example.com', '${hash}', 'Super Admin', 'SUPER_ADMIN', NULL, NOW(), NOW(), 0.00);`);
  console.log('\n');
});
