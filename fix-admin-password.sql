-- Fix admin password
-- This sets the password to "admin123" with a proper bcrypt hash

UPDATE users 
SET password_hash = '$2b$10$YourRealBcryptHashHere'
WHERE email = 'admin@system.com';
