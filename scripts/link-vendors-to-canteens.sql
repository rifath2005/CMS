-- Migration: Add user_id to canteens table and link vendor users to their canteens
-- This script adds the user_id column and populates it based on existing data
-- Run this with: psql -U your_user -d your_database -f scripts/link-vendors-to-canteens.sql

-- Step 1: Add user_id column to canteens table if it doesn't exist
ALTER TABLE canteens 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Link existing vendor users to their canteens
-- MIT College vendors
UPDATE canteens 
SET user_id = (SELECT id FROM users WHERE email = 'vendor.maincanteen@mitcoe.edu' AND role = 'VENDOR')
WHERE vendor_id = 'MIT-MC-001';

UPDATE canteens 
SET user_id = (SELECT id FROM users WHERE email = 'vendor.snackshop@mitcoe.edu' AND role = 'VENDOR')
WHERE vendor_id = 'MIT-SS-002';

UPDATE canteens 
SET user_id = (SELECT id FROM users WHERE email = 'vendor.cafeteria@mitcoe.edu' AND role = 'VENDOR')
WHERE vendor_id = 'MIT-CF-003';

-- VIT vendors
UPDATE canteens 
SET user_id = (SELECT id FROM users WHERE email = 'vendor.foodcourt@vit.edu' AND role = 'VENDOR')
WHERE vendor_id = 'VIT-FC-001';

-- Step 3: Verify the migration
SELECT 
    c.id as canteen_id,
    c.vendor_id,
    c.name as canteen_name,
    c.location,
    c.user_id,
    u.id as user_id_check,
    u.email as vendor_email,
    u.name as vendor_name,
    u.role
FROM canteens c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.vendor_id;

-- Step 4: Show summary
SELECT 
    'Total canteens' as description,
    COUNT(*) as count
FROM canteens
UNION ALL
SELECT 
    'Canteens with user_id linked' as description,
    COUNT(*) as count
FROM canteens
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
    'Canteens without user_id' as description,
    COUNT(*) as count
FROM canteens
WHERE user_id IS NULL;
