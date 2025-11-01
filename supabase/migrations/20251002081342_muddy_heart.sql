/*
  # Disable RLS for single-user mode

  1. Security Changes
    - Disable RLS on all tables to allow operations without authentication
    - Remove user_id requirements for single-user application
    
  2. Tables affected
    - shifts: Disable RLS
    - salary_payments: Disable RLS
    - user_profiles: Disable RLS (if exists)
*/

-- Disable RLS on shifts table
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on salary_payments table  
ALTER TABLE salary_payments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user_profiles table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop all existing policies on shifts table
DROP POLICY IF EXISTS "Users can manage own shifts" ON shifts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON shifts;
DROP POLICY IF EXISTS "Enable read access for all users" ON shifts;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON shifts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON shifts;

-- Drop all existing policies on salary_payments table
DROP POLICY IF EXISTS "Users can manage own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON salary_payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON salary_payments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON salary_payments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON salary_payments;

-- Drop all existing policies on user_profiles table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
    DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_profiles;
  END IF;
END $$;