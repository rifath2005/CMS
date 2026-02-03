-- Quick fix: Add user_id column and link vendors to canteens
-- Run this immediately to fix the 500 error

-- Step 1: Add user_id column
ALTER TABLE canteens 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Link vendors to canteens
UPDATE canteens SET user_id = '44444444-4444-4444-4444-444444444444' WHERE vendor_id = 'MIT-MC-001';
UPDATE canteens SET user_id = '55555555-5555-5555-5555-555555555555' WHERE vendor_id = 'MIT-SS-002';
UPDATE canteens SET user_id = '66666666-6666-6666-6666-666666666666' WHERE vendor_id = 'MIT-CF-003';
UPDATE canteens SET user_id = '77777777-7777-7777-7777-777777777777' WHERE vendor_id = 'VIT-FC-001';

-- Step 3: Verify
SELECT vendor_id, name, user_id FROM canteens ORDER BY vendor_id;
