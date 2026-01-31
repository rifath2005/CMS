// Generate bcrypt hash for admin password
const bcrypt = require('bcrypt');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  
  console.log('\n=== PASSWORD HASH GENERATED ===\n');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\n=== SQL UPDATE COMMAND ===\n');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'admin@system.com';`);
  console.log('\n');
});
