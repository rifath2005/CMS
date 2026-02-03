import { pool } from '../src/config/database';

/**
 * Update wallet balance for existing USER accounts
 * Sets wallet_balance to 1000.00 for all USER role accounts that have 0 or NULL balance
 */
async function updateWalletBalance() {
  try {
    console.log('🔄 Updating wallet balance for USER accounts...\n');

    // Update all USER accounts
    const updateResult = await pool.query(
      `UPDATE users 
       SET wallet_balance = 1000.00 
       WHERE role = 'USER' AND (wallet_balance IS NULL OR wallet_balance = 0)
       RETURNING id, email, name, wallet_balance`
    );

    console.log(`✅ Updated ${updateResult.rowCount} USER accounts\n`);

    if (updateResult.rowCount > 0) {
      console.log('Updated users:');
      updateResult.rows.forEach((user) => {
        console.log(`  - ${user.name} (${user.email}): ₹${user.wallet_balance}`);
      });
      console.log('');
    }

    // Show summary of all USER accounts
    const summaryResult = await pool.query(
      `SELECT 
        COUNT(*) as total_users,
        SUM(wallet_balance) as total_balance,
        AVG(wallet_balance) as avg_balance,
        MIN(wallet_balance) as min_balance,
        MAX(wallet_balance) as max_balance
       FROM users 
       WHERE role = 'USER'`
    );

    const summary = summaryResult.rows[0];
    console.log('📊 Summary of USER accounts:');
    console.log(`  Total Users: ${summary.total_users}`);
    console.log(`  Total Balance: ₹${parseFloat(summary.total_balance || 0).toFixed(2)}`);
    console.log(`  Average Balance: ₹${parseFloat(summary.avg_balance || 0).toFixed(2)}`);
    console.log(`  Min Balance: ₹${parseFloat(summary.min_balance || 0).toFixed(2)}`);
    console.log(`  Max Balance: ₹${parseFloat(summary.max_balance || 0).toFixed(2)}`);
    console.log('');

    // List all USER accounts with their balances
    const allUsersResult = await pool.query(
      `SELECT id, email, name, wallet_balance, created_at
       FROM users 
       WHERE role = 'USER'
       ORDER BY created_at DESC`
    );

    console.log('👥 All USER accounts:');
    allUsersResult.rows.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}): ₹${parseFloat(user.wallet_balance || 0).toFixed(2)}`);
    });

    console.log('\n✅ Wallet balance update complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating wallet balance:', error);
    process.exit(1);
  }
}

// Run the update
updateWalletBalance();
