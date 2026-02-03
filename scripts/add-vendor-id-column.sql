-- Migration: Add vendor_id column to users table and link existing vendors
-- Run this with: psql -U your_user -d your_database -f scripts/add-vendor-id-column.sql

-- Step 1: Add vendor_id column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(50) REFERENCES canteens(vendor_id) ON DELETE SET NULL;

-- Step 2: Link existing vendor users to their canteens
-- MIT College vendors
UPDATE users SET vendor_id = 'MIT-MC-001' WHERE email = 'vendor.maincanteen@mitcoe.edu' AND role = 'VENDOR';
UPDATE users SET vendor_id = 'MIT-SS-002' WHERE email = 'vendor.snackshop@mitcoe.edu' AND role = 'VENDOR';
UPDATE users SET vendor_id = 'MIT-CF-003' WHERE email = 'vendor.cafeteria@mitcoe.edu' AND role = 'VENDOR';

-- VIT vendors
UPDATE users SET vendor_id = 'VIT-FC-001' WHERE email = 'vendor.foodcourt@vit.edu' AND role = 'VENDOR';

-- Step 3: Verify the migration
SELECT 
    u.id, 
    u.email, 
    u.name, 
    u.role, 
    u.vendor_id, 
    c.name as canteen_name,
    c.location
FROM users u
LEFT JOIN canteens c ON u.vendor_id = c.vendor_id
WHERE u.role = 'VENDOR'
ORDER BY u.email;
