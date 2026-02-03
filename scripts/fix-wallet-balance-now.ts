import { pool } from '../src/config/database';

/**
 * IMMEDIATE FIX: Set wallet balance to 1000 for all USER accounts
 */
async function fixWalletBalanceNow() {
  try {
    console.log('🔧 IMMEDIATE WALLET BALANCE FIX\n');

    // First, check current state
    console.log('1️⃣ Checking current wallet balances...');
    const checkResult = await pool.query(`
      SELECT id, email, name, role, wallet_balance 
      FROM users 
      WHERE role = 'USER'
      ORDER BY email
    `);

    console.log(`Found ${checkResult.rows.length} USER accounts:\n`);
    checkResult.rows.forEach(user => {
      const balance = user.wallet_balance ? parseFloat(user.wallet_balance) : 0;
      console.log(`  ${user.email}: ₹${balance.toFixed(2)}`);
    });

    // Force update ALL USER accounts to 1000
    console.log('\n2️⃣ Forcing wallet_balance = 1000 for ALL USER accounts...');
    const updateResult = await pool.query(`
      UPDATE users 
      SET wallet_balance = 1000.00
      WHERE role = 'USER'
      RETURNING id, email, name, wallet_balance
    `);

    console.log(`✅ Updated ${updateResult.rowCount} accounts\n`);

    // Verify the update
    console.log('3️⃣ Verifying update...');
    const verifyResult = await pool.query(`
      SELECT id, email, name, role, wallet_balance 
      FROM users 
      WHERE role = 'USER'
      ORDER BY email
    `);

    console.log(`\n✅ VERIFIED - All USER accounts now have:\n`);
    verifyResult.rows.forEach(user => {
      const balance = user.wallet_balance ? parseFloat(user.wallet_balance) : 0;
      console.log(`  ${user.email}: ₹${balance.toFixed(2)}`);
    });

    console.log('\n✅ WALLET BALANCE FIX COMPLETE!');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh your browser (Ctrl+Shift+R)');
    console.log('   2. Logout and login again');
    console.log('   3. Check wallet balance in navigation bar');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWalletBalanceNow();
