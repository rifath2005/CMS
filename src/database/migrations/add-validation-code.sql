-- Add validation code columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS validation_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Create index for faster validation code lookups
CREATE INDEX IF NOT EXISTS idx_orders_validation_code ON orders(validation_code);

-- Add comment for documentation
COMMENT ON COLUMN orders.validation_code IS 'Six-character alphanumeric code for manual order verification';
COMMENT ON COLUMN orders.verified_at IS 'Timestamp when order was verified by vendor';
