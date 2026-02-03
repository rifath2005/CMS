-- Automatic Migration: Link vendor users to canteens based on institution
-- This script automatically links vendors to canteens in the same institution
-- It's useful when you have multiple vendors and canteens to link

-- Step 1: Add user_id column if it doesn't exist
ALTER TABLE canteens 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Step 2: Show current state before migration
SELECT 
    'BEFORE MIGRATION' as status,
    COUNT(*) as total_canteens,
    COUNT(user_id) as canteens_with_user,
    COUNT(*) - COUNT(user_id) as canteens_without_user
FROM canteens;

-- Step 3: Auto-link vendors to canteens
-- This creates a temporary mapping based on institution and order
-- Adjust the logic if you have specific matching rules

-- For MIT College (institution_id = '11111111-1111-1111-1111-111111111111')
WITH mit_vendors AS (
    SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM users 
    WHERE institution_id = '11111111-1111-1111-1111-111111111111' 
    AND role = 'VENDOR'
),
mit_canteens AS (
    SELECT id, vendor_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM canteens 
    WHERE institution_id = '11111111-1111-1111-1111-111111111111'
)
UPDATE canteens c
SET user_id = v.id
FROM mit_vendors v, mit_canteens mc
WHERE c.id = mc.id AND v.rn = mc.rn;

-- For VIT (institution_id = '22222222-2222-2222-2222-222222222222')
WITH vit_vendors AS (
    SELECT id, email, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM users 
    WHERE institution_id = '22222222-2222-2222-2222-222222222222' 
    AND role = 'VENDOR'
),
vit_canteens AS (
    SELECT id, vendor_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM canteens 
    WHERE institution_id = '22222222-2222-2222-2222-222222222222'
)
UPDATE canteens c
SET user_id = v.id
FROM vit_vendors v, vit_canteens mc
WHERE c.id = mc.id AND v.rn = mc.rn;

-- Step 4: Show results after migration
SELECT 
    'AFTER MIGRATION' as status,
    COUNT(*) as total_canteens,
    COUNT(user_id) as canteens_with_user,
    COUNT(*) - COUNT(user_id) as canteens_without_user
FROM canteens;

-- Step 5: Show detailed mapping
SELECT 
    c.vendor_id,
    c.name as canteen_name,
    c.location,
    u.email as vendor_email,
    u.name as vendor_name,
    i.name as institution_name,
    CASE 
        WHEN c.user_id IS NOT NULL THEN '✓ Linked'
        ELSE '✗ Not Linked'
    END as link_status
FROM canteens c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN institutions i ON c.institution_id = i.id
ORDER BY i.name, c.vendor_id;
