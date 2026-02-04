-- Add common short names for institutions
-- This makes signup easier for users

-- Add MIT as short name for MIT College of Engineering
INSERT INTO institutions (id, name, email_domain, contact_email, contact_phone)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'MIT', 'mit.edu', 'admin@mit.edu', '+91-9876543213')
ON CONFLICT (id) DO NOTHING;

-- Add VIT as short name (already exists as "VIT University")
-- Add IIT as short name for IIT Bombay
INSERT INTO institutions (id, name, email_domain, contact_email, contact_phone)
VALUES 
  ('55555555-5555-5555-5555-555555555555', 'IIT', 'iit.edu', 'admin@iit.edu', '+91-9876543214')
ON CONFLICT (id) DO NOTHING;

-- Display all institutions
SELECT '==================================' as separator;
SELECT 'AVAILABLE INSTITUTIONS FOR SIGNUP' as title;
SELECT '==================================' as separator;
SELECT name as "Organization Name" FROM institutions ORDER BY name;
SELECT '==================================' as separator;
SELECT 'Use any of these names in the signup form' as note;
