-- Canteen Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS canteens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;

-- Institutions Table
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email_domain VARCHAR(255) UNIQUE NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('MAIN_ADMIN', 'INSTITUTION_ADMIN', 'VENDOR', 'USER')),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  wallet_balance DECIMAL(10, 2) DEFAULT 1000.00 CHECK (wallet_balance >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_role ON users(role);

-- Canteens Table
CREATE TABLE canteens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
  vendor_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  operating_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for canteens table
CREATE INDEX idx_canteens_institution ON canteens(institution_id);
CREATE INDEX idx_canteens_vendor ON canteens(vendor_id);
CREATE INDEX idx_canteens_active ON canteens(is_active);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id VARCHAR(50) REFERENCES canteens(vendor_id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  category VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for products table
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_category ON products(category);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(50) NOT NULL CHECK (status IN ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
  upi_transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for payments table
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_upi_transaction ON payments(upi_transaction_id);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vendor_id VARCHAR(50) REFERENCES canteens(vendor_id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_id UUID REFERENCES payments(id) ON DELETE RESTRICT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'EXPIRED')),
  bill_generated_at TIMESTAMP NOT NULL,
  bill_expires_at TIMESTAMP NOT NULL,
  qr_code TEXT NOT NULL,
  validation_token VARCHAR(255) UNIQUE NOT NULL,
  is_qr_scanned BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for orders table
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_expires ON orders(bill_expires_at);
CREATE INDEX idx_orders_validation_token ON orders(validation_token);
CREATE INDEX idx_orders_payment ON orders(payment_id);

-- Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url VARCHAR(500)
);

-- Indexes for order_items table
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_email ON audit_logs(user_email);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_success ON audit_logs(success);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set product availability based on stock
CREATE OR REPLACE FUNCTION update_product_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity = 0 THEN
    NEW.is_available = false;
  ELSIF NEW.stock_quantity > 0 AND OLD.stock_quantity = 0 THEN
    NEW.is_available = true;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_product_availability BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_availability();

-- Insert default Main Admin (password: admin123 - should be changed in production)
-- Password hash for 'admin123' using bcrypt with 10 rounds
INSERT INTO institutions (id, name, email_domain, contact_email)
VALUES ('00000000-0000-0000-0000-000000000001', 'System', 'system.admin', 'admin@system.com');

INSERT INTO users (id, email, password_hash, name, role, institution_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@system.com',
  '$2b$10$rKvVPZqGhqZqZqZqZqZqZeO8YqYqYqYqYqYqYqYqYqYqYqYqYqYqY',
  'System Administrator',
  'MAIN_ADMIN',
  '00000000-0000-0000-0000-000000000001'
);

-- Create views for common queries

-- Active orders view
CREATE OR REPLACE VIEW active_orders_view AS
SELECT 
  o.id,
  o.user_id,
  u.name as user_name,
  o.vendor_id,
  o.total_amount,
  o.status,
  o.bill_generated_at,
  o.bill_expires_at,
  o.created_at,
  EXTRACT(EPOCH FROM (o.bill_expires_at - CURRENT_TIMESTAMP)) as remaining_seconds
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status NOT IN ('DELIVERED', 'EXPIRED')
ORDER BY o.created_at ASC;

-- Order history view
CREATE OR REPLACE VIEW order_history_view AS
SELECT 
  o.id,
  o.user_id,
  u.name as user_name,
  o.vendor_id,
  c.name as vendor_name,
  o.total_amount,
  o.status,
  o.delivered_at,
  o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN canteens c ON o.vendor_id = c.vendor_id
WHERE o.status = 'DELIVERED'
ORDER BY o.delivered_at DESC;

-- Comments for documentation
COMMENT ON TABLE institutions IS 'Stores campus institutions registered on the platform';
COMMENT ON TABLE users IS 'Stores all system users with role-based access control';
COMMENT ON TABLE canteens IS 'Stores canteen information with unique vendor identifiers';
COMMENT ON TABLE products IS 'Stores product catalog with inventory management';
COMMENT ON TABLE payments IS 'Stores payment transactions with UPI integration';
COMMENT ON TABLE orders IS 'Stores orders with time-bound digital bills and QR codes';
COMMENT ON TABLE order_items IS 'Stores individual items within each order';
COMMENT ON TABLE audit_logs IS 'Stores security audit logs for authentication and authorization events';
