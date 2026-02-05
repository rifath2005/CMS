-- Optimize Products Query Performance
-- Run this to add composite indexes for faster product queries

-- Composite index for vendor products with availability filter
CREATE INDEX IF NOT EXISTS idx_products_vendor_available_stock 
ON products(vendor_id, is_available, stock_quantity);

-- Composite index for vendor products ordered by name
CREATE INDEX IF NOT EXISTS idx_products_vendor_name 
ON products(vendor_id, name);

-- Analyze the products table to update query planner statistics
ANALYZE products;

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'products'
ORDER BY indexname;
