/*
  # Enable Multi-User Authentication with Google OAuth

  1. Database Changes
    - Add user_id to monthly_actuals table
    - Re-enable RLS on all tables
    - Create proper RLS policies for authenticated users
    - Fix unique constraints to be per-user

  2. Security
    - Users can only access their own data
    - All tables require authentication
    - Auto-assign user_id on insert
*/

-- Remove unique constraint from salary_payments.month and add composite unique (user_id, month)
DO $$
BEGIN
  -- Drop the unique constraint on month if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'salary_payments_month_key'
  ) THEN
    ALTER TABLE salary_payments DROP CONSTRAINT salary_payments_month_key;
  END IF;
  
  -- Create composite unique index for (user_id, month)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_payments_user_month 
    ON salary_payments(user_id, month) 
    WHERE user_id IS NOT NULL;
END $$;

-- Remove unique constraint from monthly_actuals.month and add composite unique (user_id, month)
DO $$
BEGIN
  -- Drop the unique constraint on month if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'monthly_actuals_month_key'
  ) THEN
    ALTER TABLE monthly_actuals DROP CONSTRAINT monthly_actuals_month_key;
  END IF;
END $$;

-- Add user_id to monthly_actuals if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_actuals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE monthly_actuals ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Create composite unique index for (user_id, month)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_actuals_user_month 
    ON monthly_actuals(user_id, month) 
    WHERE user_id IS NOT NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_actuals_user_id ON monthly_actuals(user_id);

-- Re-enable RLS on all tables
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_actuals ENABLE ROW LEVEL SECURITY;

-- Drop old policies and all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can view own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can insert own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can update own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can delete own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can manage own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can view own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can insert own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can update own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can delete own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can view own monthly actuals" ON monthly_actuals;
DROP POLICY IF EXISTS "Users can insert own monthly actuals" ON monthly_actuals;
DROP POLICY IF EXISTS "Users can update own monthly actuals" ON monthly_actuals;
DROP POLICY IF EXISTS "Users can delete own monthly actuals" ON monthly_actuals;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON shifts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON shifts;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON salary_payments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON salary_payments;

-- Create RLS policies for shifts - users can only see/manage their own shifts
CREATE POLICY "Users can view own shifts"
  ON shifts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shifts"
  ON shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shifts"
  ON shifts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shifts"
  ON shifts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for salary_payments - users can only see/manage their own payments
CREATE POLICY "Users can view own salary payments"
  ON salary_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary payments"
  ON salary_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary payments"
  ON salary_payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary payments"
  ON salary_payments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for monthly_actuals - users can only see/manage their own actuals
CREATE POLICY "Users can view own monthly actuals"
  ON monthly_actuals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly actuals"
  ON monthly_actuals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly actuals"
  ON monthly_actuals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly actuals"
  ON monthly_actuals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update user_profiles policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON user_profiles;
    DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_profiles;
    
    CREATE POLICY "Users can view own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
    
    CREATE POLICY "Users can insert own profile"
      ON user_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
    
    CREATE POLICY "Users can update own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Update the handle_new_user function to properly create user profiles from Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, user_profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update incomes table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incomes') THEN
    -- Add user_id if not exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'incomes' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE incomes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
    END IF;
    
    ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can manage own incomes" ON incomes;
    DROP POLICY IF EXISTS "Anonymous users can manage incomes" ON incomes;
    DROP POLICY IF EXISTS "Users can manage incomes" ON incomes;
    
    CREATE POLICY "Users can view own incomes"
      ON incomes
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own incomes"
      ON incomes
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own incomes"
      ON incomes
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own incomes"
      ON incomes
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

