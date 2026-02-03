import { pool } from '../src/config/database';

/**
 * Check wallet balance for all users
 */
async function checkWalletBalance() {
  try {
    console.log('🔍 Checking wallet balances...\n');

    // Get all users with their wallet balance
    const result = await pool.query(`
      SELECT 
        id,
        email,
        name,
        role,
        wallet_balance,
        created_at
      FROM users 
      ORDER BY role, created_at DESC
    `);

    console.log(`Found ${result.rows.length} users:\n`);

    // Group by role
    const byRole: Record<string, any[]> = {};
    result.rows.forEach((user) => {
      if (!byRole[user.role]) {
        byRole[user.role] = [];
      }
      byRole[user.role].push(user);
    });

    // Display by role
    Object.keys(byRole).forEach((role) => {
      console.log(`\n${role} (${byRole[role].length} users):`);
      console.log('─'.repeat(60));
      byRole[role].forEach((user) => {
        const balance = user.wallet_balance 
          ? `₹${parseFloat(user.wallet_balance).toFixed(2)}` 
          : 'NULL';
        console.log(`  ${user.name}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Wallet: ${balance}`);
        console.log(`    ID: ${user.id}`);
        console.log('');
      });
    });

    // Summary
    const userCount = byRole['USER']?.length || 0;
    const totalBalance = byRole['USER']?.reduce((sum, u) => sum + parseFloat(u.wallet_balance || 0), 0) || 0;
    
    console.log('\n📊 Summary:');
    console.log(`  Total USER accounts: ${userCount}`);
    console.log(`  Total wallet balance: ₹${totalBalance.toFixed(2)}`);
    console.log(`  Average balance: ₹${userCount > 0 ? (totalBalance / userCount).toFixed(2) : '0.00'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the check
checkWalletBalance();
