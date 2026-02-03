-- Migration: Add wallet_balance to users table
-- This migration adds wallet balance functionality for USER role accounts

-- Add wallet_balance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'wallet_balance'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN wallet_balance DECIMAL(10, 2) DEFAULT 1000.00 CHECK (wallet_balance >= 0);
        
        -- Set default balance for existing USER accounts
        UPDATE users 
        SET wallet_balance = 1000.00 
        WHERE role = 'USER' AND wallet_balance IS NULL;
        
        -- Set NULL for non-USER accounts (optional, for clarity)
        UPDATE users 
        SET wallet_balance = NULL 
        WHERE role IN ('MAIN_ADMIN', 'INSTITUTION_ADMIN', 'VENDOR');
        
        RAISE NOTICE 'wallet_balance column added successfully';
    ELSE
        RAISE NOTICE 'wallet_balance column already exists';
    END IF;
END $$;

-- Create index for faster wallet queries
CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON users(wallet_balance) WHERE role = 'USER';

-- Add comment for documentation
COMMENT ON COLUMN users.wallet_balance IS 'Wallet balance for USER role accounts. Used as UPI substitute for payments. Default: 1000.00';
