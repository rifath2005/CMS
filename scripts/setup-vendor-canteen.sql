-- Script to set up a canteen for a vendor user
-- This allows vendors to add products to their menu

-- Step 1: Find your vendor user ID
-- Replace 'vendor@example.com' with your vendor email
SELECT id, email, name, role 
FROM users 
WHERE role = 'VENDOR' AND email = 'vendor@example.com';

-- Step 2: Get the institution ID (use the institution_id from the vendor user above)
-- Or find an institution:
SELECT id, name FROM institutions LIMIT 5;

-- Step 3: Create a canteen for the vendor
-- Replace the values below with actual IDs from steps 1 and 2
INSERT INTO canteens (
    institution_id,
    vendor_id,
    name,
    location,
    is_active,
    is_approved
) VALUES (
    'YOUR_INSTITUTION_ID_HERE',  -- Replace with actual institution UUID
    'YOUR_VENDOR_USER_ID_HERE',  -- Replace with actual vendor user UUID
    'Main Campus Canteen',        -- Canteen name
    'Building A, Ground Floor',   -- Location
    true,                          -- is_active
    true                           -- is_approved
)
RETURNING *;

-- Step 4: Verify the canteen was created
SELECT * FROM canteens WHERE vendor_id = 'YOUR_VENDOR_USER_ID_HERE';

-- Now the vendor can add products!
