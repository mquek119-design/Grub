-- Create test user if not exists
-- This creates a real auth.users entry that can be used for testing
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at, 
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_confirm_status
)
SELECT 
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'test-audit@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'test-audit@example.com'
);
