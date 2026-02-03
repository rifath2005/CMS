-- ========================================
-- Expire Old Orders - SQL Script
-- ========================================
-- This script will:
-- 1. Show orders that need to be expired
-- 2. Update their status to EXPIRED
-- 3. Make them appear in order history
-- ========================================

-- Step 1: Check which orders will be expired
SELECT 
    id as "Order ID", 
    status as "Current Status", 
    bill_expires_at as "Expired At",
    created_at as "Created At",
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - bill_expires_at)) / 60 as "Minutes Overdue"
FROM orders 
WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
  AND bill_expires_at < CURRENT_TIMESTAMP
ORDER BY bill_expires_at ASC;

-- Step 2: Update expired orders
UPDATE orders 
SET status = 'EXPIRED'
WHERE status NOT IN ('DELIVERED', 'EXPIRED', 'CANCELLED')
  AND bill_expires_at < CURRENT_TIMESTAMP;

-- Step 3: Verify the update
SELECT 
    id as "Order ID", 
    status as "New Status", 
    created_at as "Created At"
FROM orders 
WHERE status = 'EXPIRED'
  AND bill_expires_at < CURRENT_TIMESTAMP
ORDER BY created_at DESC;

-- ========================================
-- Script completed
-- ========================================
