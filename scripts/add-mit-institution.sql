-- Add MIT as a separate institution
-- This allows users to signup with organization name "MIT"

INSERT INTO institutions (id, name, email_domain, contact_email, contact_phone)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'MIT', 'mit.edu', 'admin@mit.edu', '+91-9876543213')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone;

-- Display result
SELECT 'MIT institution added successfully!' as message;
SELECT * FROM institutions WHERE name = 'MIT';
