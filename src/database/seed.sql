-- Seed Data for Canteen Management System
-- Run this after schema.sql to populate test data
-- All test users have password: 'password123'

-- Clear existing data (optional - comment out if you want to keep existing data)
TRUNCATE TABLE order_items, orders, payments, products, canteens, users, institutions RESTART IDENTITY CASCADE;

-- Insert Test Institutions
INSERT INTO institutions (id, name, email_domain, contact_email, contact_phone)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'MIT College of Engineering', 'mitcoe.edu', 'admin@mitcoe.edu', '+91-9876543210'),
  ('22222222-2222-2222-2222-222222222222', 'VIT University', 'vit.edu', 'admin@vit.edu', '+91-9876543211'),
  ('33333333-3333-3333-3333-333333333333', 'IIT Bombay', 'iitb.edu', 'admin@iitb.edu', '+91-9876543212')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone;

-- Insert Test Users
-- Password for all test users: 'password123'
-- Hash: $2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO
INSERT INTO users (id, email, password_hash, name, role, institution_id)
VALUES 
  -- Institution Admins
  ('a1111111-1111-1111-1111-111111111111', 'admin@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Rajesh Kumar', 'INSTITUTION_ADMIN', '11111111-1111-1111-1111-111111111111'),
  ('a2222222-2222-2222-2222-222222222222', 'admin@vit.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Priya Sharma', 'INSTITUTION_ADMIN', '22222222-2222-2222-2222-222222222222'),
  
  -- Vendors for MIT College
  ('44444444-4444-4444-4444-444444444444', 'vendor.maincanteen@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Amit Patel', 'VENDOR', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555555', 'vendor.snackshop@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Sunita Desai', 'VENDOR', '11111111-1111-1111-1111-111111111111'),
  ('66666666-6666-6666-6666-666666666666', 'vendor.cafeteria@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Ravi Mehta', 'VENDOR', '11111111-1111-1111-1111-111111111111'),
  
  -- Vendors for VIT
  ('77777777-7777-7777-7777-777777777777', 'vendor.foodcourt@vit.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Lakshmi Iyer', 'VENDOR', '22222222-2222-2222-2222-222222222222'),
  
  -- Regular Users (Students) - MIT College
  ('88888888-8888-8888-8888-888888888888', 'john.doe@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'John Doe', 'USER', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999999', 'jane.smith@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Jane Smith', 'USER', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rahul.verma@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Rahul Verma', 'USER', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'priya.singh@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Priya Singh', 'USER', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'amit.kumar@mitcoe.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Amit Kumar', 'USER', '11111111-1111-1111-1111-111111111111'),
  
  -- Regular Users (Students) - VIT
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'sarah.johnson@vit.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Sarah Johnson', 'USER', '22222222-2222-2222-2222-222222222222'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'michael.brown@vit.edu', '$2b$10$k1TAo4t0fsOh84eM3TIuA.wd3dzojjWKldfiYLINnfylnqNN/B5XO', 'Michael Brown', 'USER', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;

-- Insert Test Canteens (now with user_id linking to vendor users)
INSERT INTO canteens (id, institution_id, vendor_id, user_id, name, location, operating_hours, is_active, is_approved)
VALUES 
  -- MIT College Canteens
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'MIT-MC-001', '44444444-4444-4444-4444-444444444444', 'Main Canteen', 'Ground Floor, Main Building', 
   '{"monday": "07:00-21:00", "tuesday": "07:00-21:00", "wednesday": "07:00-21:00", "thursday": "07:00-21:00", "friday": "07:00-21:00", "saturday": "08:00-20:00", "sunday": "09:00-18:00"}', 
   true, true),
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'MIT-SS-002', '55555555-5555-5555-5555-555555555555', 'Snack Shop', 'First Floor, Library Building', 
   '{"monday": "08:00-19:00", "tuesday": "08:00-19:00", "wednesday": "08:00-19:00", "thursday": "08:00-19:00", "friday": "08:00-19:00", "saturday": "09:00-17:00", "sunday": "closed"}', 
   true, true),
  ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'MIT-CF-003', '66666666-6666-6666-6666-666666666666', 'Cafeteria', 'Second Floor, Engineering Block', 
   '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "10:00-16:00", "sunday": "closed"}', 
   true, true),
   
  -- VIT Canteens
  ('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'VIT-FC-001', '77777777-7777-7777-7777-777777777777', 'Food Court', 'Ground Floor, Student Center', 
   '{"monday": "07:00-22:00", "tuesday": "07:00-22:00", "wednesday": "07:00-22:00", "thursday": "07:00-22:00", "friday": "07:00-22:00", "saturday": "08:00-22:00", "sunday": "08:00-21:00"}', 
   true, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  user_id = EXCLUDED.user_id,
  is_active = EXCLUDED.is_active,
  is_approved = EXCLUDED.is_approved;

-- Insert Test Products
INSERT INTO canteens (id, institution_id, vendor_id, name, location, operating_hours, is_active, is_approved)
VALUES 
  -- MIT College Canteens
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'MIT-MC-001', 'Main Canteen', 'Ground Floor, Main Building', 
   '{"monday": "07:00-21:00", "tuesday": "07:00-21:00", "wednesday": "07:00-21:00", "thursday": "07:00-21:00", "friday": "07:00-21:00", "saturday": "08:00-20:00", "sunday": "09:00-18:00"}', 
   true, true),
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'MIT-SS-002', 'Snack Shop', 'First Floor, Library Building', 
   '{"monday": "08:00-19:00", "tuesday": "08:00-19:00", "wednesday": "08:00-19:00", "thursday": "08:00-19:00", "friday": "08:00-19:00", "saturday": "09:00-17:00", "sunday": "closed"}', 
   true, true),
  ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'MIT-CF-003', 'Cafeteria', 'Second Floor, Engineering Block', 
   '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "10:00-16:00", "sunday": "closed"}', 
   true, true),
   
  -- VIT Canteens
  ('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'VIT-FC-001', 'Food Court', 'Ground Floor, Student Center', 
   '{"monday": "07:00-22:00", "tuesday": "07:00-22:00", "wednesday": "07:00-22:00", "thursday": "07:00-22:00", "friday": "07:00-22:00", "saturday": "08:00-22:00", "sunday": "08:00-21:00"}', 
   true, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active,
  is_approved = EXCLUDED.is_approved;

-- Insert Test Products for Main Canteen (MIT-MC-001)
INSERT INTO products (id, vendor_id, name, description, price, category, stock_quantity, image_url, is_available)
VALUES 
  -- Breakfast Items
  ('10000001-0001-0001-0001-000000000001', 'MIT-MC-001', 'Poha', 'Traditional flattened rice with peanuts and spices', 25.00, 'Breakfast', 50, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400', true),
  ('10000002-0002-0002-0002-000000000002', 'MIT-MC-001', 'Upma', 'Savory semolina porridge with vegetables', 30.00, 'Breakfast', 45, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', true),
  ('10000003-0003-0003-0003-000000000003', 'MIT-MC-001', 'Idli Sambar', '3 steamed rice cakes with sambar and chutney', 35.00, 'Breakfast', 60, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', true),
  ('10000004-0004-0004-0004-000000000004', 'MIT-MC-001', 'Dosa', 'Crispy rice crepe with potato filling', 40.00, 'Breakfast', 40, 'https://images.unsplash.com/photo-1694809956746-74e0f2b6e273?w=400', true),
  ('10000005-0005-0005-0005-000000000005', 'MIT-MC-001', 'Paratha with Curd', 'Stuffed flatbread with yogurt', 45.00, 'Breakfast', 35, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true),
  
  -- Snacks
  ('10000006-0006-0006-0006-000000000006', 'MIT-MC-001', 'Samosa', 'Crispy triangular pastry with spiced potato filling', 15.00, 'Snacks', 80, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', true),
  ('10000007-0007-0007-0007-000000000007', 'MIT-MC-001', 'Vada Pav', 'Mumbai street food - spiced potato fritter in bun', 20.00, 'Snacks', 70, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', true),
  ('10000008-0008-0008-0008-000000000008', 'MIT-MC-001', 'Pakora', 'Mixed vegetable fritters', 25.00, 'Snacks', 60, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', true),
  ('10000009-0009-0009-0009-000000000009', 'MIT-MC-001', 'Spring Roll', 'Crispy vegetable spring rolls (2 pcs)', 30.00, 'Snacks', 8, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400', true),
  ('10000010-0010-0010-0010-000000000010', 'MIT-MC-001', 'Pav Bhaji', 'Spiced mashed vegetables with buttered buns', 50.00, 'Snacks', 40, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400', true),
  
  -- Main Course
  ('10000011-0011-0011-0011-000000000011', 'MIT-MC-001', 'Veg Thali', 'Complete meal with rice, roti, dal, sabzi, and salad', 80.00, 'Main Course', 50, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', true),
  ('10000012-0012-0012-0012-000000000012', 'MIT-MC-001', 'Paneer Butter Masala', 'Cottage cheese in rich tomato gravy with rice/roti', 90.00, 'Main Course', 35, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', true),
  ('10000013-0013-0013-0013-000000000013', 'MIT-MC-001', 'Dal Tadka with Rice', 'Tempered lentils with steamed rice', 60.00, 'Main Course', 55, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', true),
  ('10000014-0014-0014-0014-000000000014', 'MIT-MC-001', 'Chole Bhature', 'Spiced chickpeas with fried bread', 70.00, 'Main Course', 30, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400', true),
  ('10000015-0015-0015-0015-000000000015', 'MIT-MC-001', 'Veg Biryani', 'Aromatic rice with mixed vegetables', 75.00, 'Main Course', 45, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', true),
  ('10000016-0016-0016-0016-000000000016', 'MIT-MC-001', 'Rajma Chawal', 'Kidney beans curry with rice', 65.00, 'Main Course', 40, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', true),
  
  -- Beverages
  ('10000017-0017-0017-0017-000000000017', 'MIT-MC-001', 'Masala Chai', 'Indian spiced tea', 10.00, 'Beverages', 150, 'https://images.unsplash.com/photo-1597318181274-7d8f4b0c0c3e?w=400', true),
  ('10000018-0018-0018-0018-000000000018', 'MIT-MC-001', 'Filter Coffee', 'South Indian filter coffee', 15.00, 'Beverages', 120, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', true),
  ('10000019-0019-0019-0019-000000000019', 'MIT-MC-001', 'Cold Coffee', 'Iced coffee with ice cream', 40.00, 'Beverages', 80, 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', true),
  ('10000020-0020-0020-0020-000000000020', 'MIT-MC-001', 'Lassi', 'Sweet yogurt drink', 30.00, 'Beverages', 60, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400', true),
  ('10000021-0021-0021-0021-000000000021', 'MIT-MC-001', 'Fresh Lime Soda', 'Refreshing lime drink', 20.00, 'Beverages', 100, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', true),
  
  -- Desserts
  ('10000022-0022-0022-0022-000000000022', 'MIT-MC-001', 'Gulab Jamun', 'Sweet milk dumplings in syrup (2 pcs)', 25.00, 'Desserts', 50, 'https://images.unsplash.com/photo-1589119908995-c6c4c9d0cde7?w=400', true),
  ('10000023-0023-0023-0023-000000000023', 'MIT-MC-001', 'Jalebi', 'Crispy sweet spirals', 30.00, 'Desserts', 40, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', true),
  ('10000024-0024-0024-0024-000000000024', 'MIT-MC-001', 'Ice Cream', 'Vanilla/Chocolate ice cream', 35.00, 'Desserts', 0, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400', false),
  ('10000025-0025-0025-0025-000000000025', 'MIT-MC-001', 'Kulfi', 'Traditional Indian ice cream', 30.00, 'Desserts', 45, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400', true)
ON CONFLICT (id) DO UPDATE SET 
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity,
  is_available = EXCLUDED.is_available;

-- Insert Products for Snack Shop (MIT-SS-002)
INSERT INTO products (id, vendor_id, name, description, price, category, stock_quantity, image_url, is_available)
VALUES 
  ('20000001-0001-0001-0001-000000000001', 'MIT-SS-002', 'Chips Packet', 'Lays/Kurkure chips', 10.00, 'Snacks', 150, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400', true),
  ('20000002-0002-0002-0002-000000000002', 'MIT-SS-002', 'Biscuits', 'Parle-G/Marie biscuits', 15.00, 'Snacks', 120, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', true),
  ('20000003-0003-0003-0003-000000000003', 'MIT-SS-002', 'Chocolate Bar', 'Dairy Milk/KitKat', 20.00, 'Snacks', 100, 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400', true),
  ('20000004-0004-0004-0004-000000000004', 'MIT-SS-002', 'Sandwich', 'Veg grilled sandwich', 35.00, 'Snacks', 50, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', true),
  ('20000005-0005-0005-0005-000000000005', 'MIT-SS-002', 'Burger', 'Veg aloo tikki burger', 45.00, 'Snacks', 40, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true),
  ('20000006-0006-0006-0006-000000000006', 'MIT-SS-002', 'Cold Drink', 'Coke/Pepsi/Sprite 300ml', 20.00, 'Beverages', 200, 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400', true),
  ('20000007-0007-0007-0007-000000000007', 'MIT-SS-002', 'Fruit Juice', 'Real/Tropicana juice', 30.00, 'Beverages', 80, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', true),
  ('20000008-0008-0008-0008-000000000008', 'MIT-SS-002', 'Water Bottle', 'Bisleri 1L', 20.00, 'Beverages', 150, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', true),
  ('20000009-0009-0009-0009-000000000009', 'MIT-SS-002', 'Energy Drink', 'Red Bull/Monster', 100.00, 'Beverages', 30, 'https://images.unsplash.com/photo-1622543925917-763c34f6a1a7?w=400', true)
ON CONFLICT (id) DO UPDATE SET 
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity;

-- Insert Products for Cafeteria (MIT-CF-003)
INSERT INTO products (id, vendor_id, name, description, price, category, stock_quantity, image_url, is_available)
VALUES 
  ('30000001-0001-0001-0001-000000000001', 'MIT-CF-003', 'Pasta Alfredo', 'Creamy white sauce pasta', 70.00, 'Main Course', 30, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', true),
  ('30000002-0002-0002-0002-000000000002', 'MIT-CF-003', 'Pasta Arrabiata', 'Spicy red sauce pasta', 70.00, 'Main Course', 5, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', true),
  ('30000003-0003-0003-0003-000000000003', 'MIT-CF-003', 'Veg Pizza', 'Personal size veg pizza', 120.00, 'Main Course', 25, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', true),
  ('30000004-0004-0004-0004-000000000004', 'MIT-CF-003', 'Garlic Bread', 'Cheesy garlic bread (4 pcs)', 60.00, 'Snacks', 40, 'https://images.unsplash.com/photo-1573140401552-3fab0b24306f?w=400', true),
  ('30000005-0005-0005-0005-000000000005', 'MIT-CF-003', 'French Fries', 'Crispy potato fries', 40.00, 'Snacks', 60, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', true),
  ('30000006-0006-0006-0006-000000000006', 'MIT-CF-003', 'Brownie with Ice Cream', 'Warm brownie with vanilla ice cream', 80.00, 'Desserts', 0, 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400', false),
  ('30000007-0007-0007-0007-000000000007', 'MIT-CF-003', 'Cappuccino', 'Italian style coffee', 50.00, 'Beverages', 100, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', true),
  ('30000008-0008-0008-0008-000000000008', 'MIT-CF-003', 'Latte', 'Smooth milk coffee', 55.00, 'Beverages', 100, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', true),
  ('30000009-0009-0009-0009-000000000009', 'MIT-CF-003', 'Mojito', 'Virgin mojito', 60.00, 'Beverages', 50, 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400', true)
ON CONFLICT (id) DO UPDATE SET 
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity,
  is_available = EXCLUDED.is_available;

-- Insert Products for VIT Food Court (VIT-FC-001)
INSERT INTO products (id, vendor_id, name, description, price, category, stock_quantity, image_url, is_available)
VALUES 
  ('40000001-0001-0001-0001-000000000001', 'VIT-FC-001', 'South Indian Thali', 'Complete South Indian meal', 90.00, 'Main Course', 40, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', true),
  ('40000002-0002-0002-0002-000000000002', 'VIT-FC-001', 'Masala Dosa', 'Crispy dosa with potato masala', 45.00, 'Breakfast', 50, 'https://images.unsplash.com/photo-1694809956746-74e0f2b6e273?w=400', true),
  ('40000003-0003-0003-0003-000000000003', 'VIT-FC-001', 'Rava Dosa', 'Crispy semolina dosa', 50.00, 'Breakfast', 45, 'https://images.unsplash.com/photo-1694809956746-74e0f2b6e273?w=400', true),
  ('40000004-0004-0004-0004-000000000004', 'VIT-FC-001', 'Medu Vada', 'Fried lentil donuts (3 pcs)', 30.00, 'Snacks', 60, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', true),
  ('40000005-0005-0005-0005-000000000005', 'VIT-FC-001', 'Pongal', 'Rice and lentil porridge', 35.00, 'Breakfast', 40, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400', true),
  ('40000006-0006-0006-0006-000000000006', 'VIT-FC-001', 'Chicken Biryani', 'Hyderabadi style chicken biryani', 120.00, 'Main Course', 35, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', true),
  ('40000007-0007-0007-0007-000000000007', 'VIT-FC-001', 'Butter Naan', 'Soft butter naan (2 pcs)', 40.00, 'Main Course', 50, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', true),
  ('40000008-0008-0008-0008-000000000008', 'VIT-FC-001', 'Filter Coffee', 'Authentic South Indian coffee', 20.00, 'Beverages', 150, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', true)
ON CONFLICT (id) DO UPDATE SET 
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity;

-- Display summary
SELECT 'Seed data inserted successfully!' as message;
SELECT '==================================' as separator;
SELECT 'DATABASE SUMMARY' as title;
SELECT '==================================' as separator;
SELECT COUNT(*) as total_institutions FROM institutions;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_canteens FROM canteens;
SELECT COUNT(*) as total_products FROM products;
SELECT '==================================' as separator;
SELECT 'USER CREDENTIALS (All passwords: password123)' as credentials;
SELECT '==================================' as separator;
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;
SELECT '==================================' as separator;
SELECT 'SAMPLE LOGIN CREDENTIALS' as login_info;
SELECT '==================================' as separator;
SELECT 'Student: john.doe@mitcoe.edu' as student_login;
SELECT 'Vendor: vendor.maincanteen@mitcoe.edu' as vendor_login;
SELECT 'Admin: admin@mitcoe.edu' as admin_login;
