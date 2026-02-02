-- Performance Optimization Indexes
-- Run this to improve dashboard loading speed

-- Index for canteen filtering by institution and status
CREATE INDEX IF NOT EXISTS idx_canteens_institution_status 
ON canteens(institution_id, is_active, is_approved);

-- Index for orders by date (for daily stats)
CREATE INDEX IF NOT EXISTS idx_orders_created_date 
ON orders(created_at, status);

-- Index for orders by vendor and date
CREATE INDEX IF NOT EXISTS idx_orders_vendor_date 
ON orders(vendor_id, created_at, status);

-- Composite index for faster joins
CREATE INDEX IF NOT EXISTS idx_canteens_vendor_institution 
ON canteens(vendor_id, institution_id, is_active);

-- Analyze tables to update statistics
ANALYZE canteens;
ANALYZE orders;

-- Verify indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('canteens', 'orders')
ORDER BY tablename, indexname;
