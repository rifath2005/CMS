import { pool } from '../src/config/database';

/**
 * Add wallet_balance column to users table and set default values
 */
async function addWalletColumn() {
  try {
    console.log('🔄 Adding wallet_balance column to users table...\n');

    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'wallet_balance'
    `);

    if (checkResult.rows.length > 0) {
      console.log('⚠️  wallet_balance column already exists');
      console.log('🔄 Updating existing USER accounts...\n');
    } else {
      console.log('➕ Adding wallet_balance column...');
      
      // Add the column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN wallet_balance DECIMAL(10, 2) DEFAULT 1000.00 CHECK (wallet_balance >= 0)
      `);
      
      console.log('✅ Column added successfully\n');
    }

    // Update all USER accounts to have 1000.00 balance
    console.log('🔄 Setting wallet balance for USER accounts...');
    const updateResult = await pool.query(`
      UPDATE users 
      SET wallet_balance = 1000.00 
      WHERE role = 'USER' AND (wallet_balance IS NULL OR wallet_balance = 0 OR wallet_balance < 1000)
      RETURNING id, email, name, wallet_balance
    `);

    console.log(`✅ Updated ${updateResult.rowCount} USER accounts\n`);

    if (updateResult.rowCount > 0) {
      console.log('Updated users:');
      updateResult.rows.forEach((user) => {
        console.log(`  - ${user.name} (${user.email}): ₹${parseFloat(user.wallet_balance).toFixed(2)}`);
      });
      console.log('');
    }

    // Create index if it doesn't exist
    console.log('🔄 Creating index for wallet queries...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_wallet_balance 
      ON users(wallet_balance) 
      WHERE role = 'USER'
    `);
    console.log('✅ Index created\n');

    // Show all USER accounts
    const allUsersResult = await pool.query(`
      SELECT id, email, name, role, wallet_balance, created_at
      FROM users 
      WHERE role = 'USER'
      ORDER BY created_at DESC
    `);

    console.log('👥 All USER accounts with wallet balance:');
    if (allUsersResult.rows.length === 0) {
      console.log('  No USER accounts found');
    } else {
      allUsersResult.rows.forEach((user) => {
        const balance = user.wallet_balance ? parseFloat(user.wallet_balance).toFixed(2) : '0.00';
        console.log(`  - ${user.name} (${user.email}): ₹${balance}`);
      });
    }

    console.log('\n✅ Wallet setup complete!');
    console.log('\n💡 All USER accounts now have ₹1000.00 wallet balance');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the setup
addWalletColumn();
