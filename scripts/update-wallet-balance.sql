-- Update wallet balance for existing USER accounts
-- Run this script to set wallet balance to 1000.00 for all USER role accounts

-- Update all USER accounts to have 1000.00 wallet balance
UPDATE users 
SET wallet_balance = 1000.00 
WHERE role = 'USER' AND (wallet_balance IS NULL OR wallet_balance = 0);

-- Verify the update
SELECT 
    id,
    email,
    name,
    role,
    wallet_balance
FROM users 
WHERE role = 'USER'
ORDER BY created_at DESC;

-- Show summary
SELECT 
    role,
    COUNT(*) as user_count,
    AVG(wallet_balance) as avg_balance,
    MIN(wallet_balance) as min_balance,
    MAX(wallet_balance) as max_balance
FROM users 
WHERE role = 'USER'
GROUP BY role;
