-- Seed Data for Canteen Management System
-- Run this after schema.sql to populate test data

-- Insert Test Institution
INSERT INTO institutions (id, name, email_domain, contact_email, contact_phone)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test University', 'test.edu', 'admin@test.edu', '+1234567890'),
  ('22222222-2222-2222-2222-222222222222', 'Demo College', 'demo.edu', 'admin@demo.edu', '+0987654321')
ON CONFLICT (id) DO NOTHING;

-- Insert Test Users
-- Password for all test users: 'password123'
-- Hash: $2b$10$rKvVPZqGhqZqZqZqZqZqZeO8YqYqYqYqYqYqYqYqYqYqYqYqYqYqY
INSERT INTO users (id, email, password_hash, name, role, institution_id)
VALUES 
  -- Institution Admins
  ('33333333-3333-3333-3333-333333333333', 'admin@test.edu', '$2b$10$rKvVPZqGhqZqZqZqZqZqZeO8YqYqYqYqYqYqYqYqYqYqYqYqYqYqY', 'Test Admin', 'INSTITUTION_ADMIN', '11111111-1111-1111-1111-111111111111'),
  
  -- Vendors
  ('44444444-4444-4444-4444-444444444444', 'vendor1@test.edu', '$2b$10$rKvVPZqGhqZqZqZqZqZqZeO8YqYqYqYqYqYqYqYqYqYqYqYqYqYqY', 'Main Canteen Vendor', 'VENDOR', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555555', 'vendor2@test.edu', '$2b$10$rKvVPZqGhqZqZqZqZqZqZeO8YqYqYqYqYqYqYqYqYqYqYqYqYqYqY', 'Snack Shop Vendor', 'VENDOR', '11111111-1111-1111-1111-111111111111'),
  
  -- Regular Users
  ('66666666-6666-6666-6666-666666666666', 'student1@test.edu', '$2b$10$rKvVPZqGhqZqZqZqZqZqZeO8YqYqYqYqYqYqYqYqYqYqYqYqYqYqY', 'John Doe', 'USER', '11111111-1111-1111-1111-111111111111'),
  ('77777777-7777-7777-7777-777777777777', 'student2@test.edu', '$2b$10$rKvVPZqGhqZqZqZqZqZqZeO8YqYqYqYqYqYqYqYqYqYqYqYqYqYqY', 'Jane Smith', 'USER', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Insert Test Canteens
INSERT INTO canteens (id, institution_id, vendor_id, name, location, operating_hours, is_active, is_approved)
VALUES 
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'SS1', 'Main Canteen', 'Building A, Ground Floor', 
   '{"monday": "08:00-20:00", "tuesday": "08:00-20:00", "wednesday": "08:00-20:00", "thursday": "08:00-20:00", "friday": "08:00-20:00", "saturday": "09:00-18:00", "sunday": "closed"}', 
   true, true),
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'SS2', 'Snack Shop', 'Building B, First Floor', 
   '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "10:00-16:00", "sunday": "closed"}', 
   true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Test Products for Main Canteen (SS1)
INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, image_url, is_available)
VALUES 
  -- Snacks
  ('SS1', 'Samosa', 'Crispy and delicious potato samosa', 15.00, 'Snacks', 50, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true),
  ('SS1', 'Pakora', 'Mixed vegetable pakoras', 20.00, 'Snacks', 40, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', true),
  ('SS1', 'Spring Roll', 'Crispy vegetable spring rolls', 25.00, 'Snacks', 30, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400', true),
  ('SS1', 'Vada Pav', 'Mumbai style vada pav', 18.00, 'Snacks', 35, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', true),
  
  -- Beverages
  ('SS1', 'Masala Chai', 'Hot masala tea', 10.00, 'Beverages', 100, 'https://images.unsplash.com/photo-1597318181274-7d8f4b0c0c3e?w=400', true),
  ('SS1', 'Coffee', 'Fresh brewed coffee', 20.00, 'Beverages', 80, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', true),
  ('SS1', 'Cold Coffee', 'Iced coffee with ice cream', 35.00, 'Beverages', 60, 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', true),
  ('SS1', 'Lemon Tea', 'Refreshing lemon tea', 12.00, 'Beverages', 90, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', true),
  
  -- Main Course
  ('SS1', 'Veg Burger', 'Vegetable burger with cheese', 50.00, 'Main Course', 25, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true),
  ('SS1', 'Sandwich', 'Grilled vegetable sandwich', 40.00, 'Main Course', 30, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', true),
  ('SS1', 'Pasta', 'White sauce pasta', 60.00, 'Main Course', 20, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', true),
  ('SS1', 'Fried Rice', 'Vegetable fried rice', 55.00, 'Main Course', 25, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400', true),
  
  -- Desserts
  ('SS1', 'Ice Cream', 'Vanilla ice cream', 30.00, 'Desserts', 40, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400', true),
  ('SS1', 'Brownie', 'Chocolate brownie', 35.00, 'Desserts', 20, 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400', true);

-- Insert Test Products for Snack Shop (SS2)
INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, image_url, is_available)
VALUES 
  -- Snacks
  ('SS2', 'Chips', 'Potato chips packet', 10.00, 'Snacks', 100, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400', true),
  ('SS2', 'Biscuits', 'Assorted biscuits', 15.00, 'Snacks', 80, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', true),
  ('SS2', 'Chocolate', 'Dairy milk chocolate', 20.00, 'Snacks', 60, 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400', true),
  
  -- Beverages
  ('SS2', 'Cold Drink', 'Chilled soft drink', 25.00, 'Beverages', 70, 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400', true),
  ('SS2', 'Juice', 'Fresh fruit juice', 30.00, 'Beverages', 50, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', true),
  ('SS2', 'Water Bottle', 'Mineral water 1L', 20.00, 'Beverages', 100, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', true);

-- Add some out-of-stock items for testing
UPDATE products SET stock_quantity = 0, is_available = false WHERE name = 'Brownie';

-- Add some low-stock items for testing
UPDATE products SET stock_quantity = 5 WHERE name = 'Pasta';
UPDATE products SET stock_quantity = 8 WHERE name = 'Spring Roll';

-- Display summary
SELECT 'Seed data inserted successfully!' as message;
SELECT COUNT(*) as total_institutions FROM institutions;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_canteens FROM canteens;
SELECT COUNT(*) as total_products FROM products;
