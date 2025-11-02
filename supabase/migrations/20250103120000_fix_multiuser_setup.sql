/*
  # Fix Multi-User Setup - Final Migration
  
  This migration resolves conflicts between previous migrations and sets up
  correct database state for multi-user mode.
  
  1. Database Changes
    - Ensure user_id is added to all tables
    - Enable RLS on all tables
    - Remove all old policies
    - Create correct RLS policies for data isolation
    - Fix unique indexes for multi-user mode
  
  2. Security
    - All tables require authentication
    - Users see only their own data
    - Automatic user_id assignment on insert
  
  3. Idempotency
    - Migration is idempotent - can be run multiple times
    - All operations check existence before execution
*/

-- ============================================================================
-- 1. ENSURE user_id EXISTS IN ALL TABLES
-- ============================================================================

-- Add user_id to shifts if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shifts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
  END IF;
END $$;

-- Add user_id to salary_payments if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salary_payments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE salary_payments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_salary_payments_user_id ON salary_payments(user_id);
  END IF;
END $$;

-- Add user_id to monthly_actuals if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_actuals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE monthly_actuals ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_monthly_actuals_user_id ON monthly_actuals(user_id);
  END IF;
END $$;

-- Add user_id to incomes if missing and table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incomes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'incomes' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE incomes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 2. FIX UNIQUE CONSTRAINTS FOR MULTI-USER MODE
-- ============================================================================

-- Remove unique constraint from salary_payments.month and create composite (user_id, month)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'salary_payments_month_key'
  ) THEN
    ALTER TABLE salary_payments DROP CONSTRAINT salary_payments_month_key;
  END IF;
  
  DROP INDEX IF EXISTS idx_salary_payments_month;
  
  CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_payments_user_month 
    ON salary_payments(user_id, month) 
    WHERE user_id IS NOT NULL;
END $$;

-- Remove unique constraint from monthly_actuals.month and create composite (user_id, month)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'monthly_actuals_month_key'
  ) THEN
    ALTER TABLE monthly_actuals DROP CONSTRAINT monthly_actuals_month_key;
  END IF;
  
  DROP INDEX IF EXISTS idx_monthly_actuals_month;
  
  CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_actuals_user_month 
    ON monthly_actuals(user_id, month) 
    WHERE user_id IS NOT NULL;
END $$;

-- ============================================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_actuals') THEN
    ALTER TABLE monthly_actuals ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incomes') THEN
    ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- 4. DROP ALL OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can view own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can insert own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can update own shifts" ON shifts;
DROP POLICY IF EXISTS "Users can delete own shifts" ON shifts;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON shifts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON shifts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON shifts;
DROP POLICY IF EXISTS "Enable read access for all users" ON shifts;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON shifts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON shifts;

DROP POLICY IF EXISTS "Users can manage own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can view own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can insert own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can update own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Users can delete own salary payments" ON salary_payments;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON salary_payments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON salary_payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON salary_payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON salary_payments;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON salary_payments;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON salary_payments;

DROP POLICY IF EXISTS "Users can view own monthly actuals" ON monthly_actuals;
DROP POLICY IF EXISTS "Users can insert own monthly actuals" ON monthly_actuals;
DROP POLICY IF EXISTS "Users can update own monthly actuals" ON monthly_actuals;
DROP POLICY IF EXISTS "Users can delete own monthly actuals" ON monthly_actuals;

DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_profiles;

DROP POLICY IF EXISTS "Users can manage own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can view own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete own incomes" ON incomes;
DROP POLICY IF EXISTS "Anonymous users can manage incomes" ON incomes;
DROP POLICY IF EXISTS "Users can manage incomes" ON incomes;

-- ============================================================================
-- 5. CREATE CORRECT RLS POLICIES FOR SHIFTS
-- ============================================================================

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

-- ============================================================================
-- 6. CREATE CORRECT RLS POLICIES FOR SALARY_PAYMENTS
-- ============================================================================

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

-- ============================================================================
-- 7. CREATE CORRECT RLS POLICIES FOR MONTHLY_ACTUALS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_actuals') THEN
    EXECUTE '
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
    ';
  END IF;
END $$;

-- ============================================================================
-- 8. CREATE CORRECT RLS POLICIES FOR USER_PROFILES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    EXECUTE '
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
    ';
  END IF;
END $$;

-- ============================================================================
-- 9. CREATE CORRECT RLS POLICIES FOR INCOMES (IF TABLE EXISTS)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incomes') THEN
    EXECUTE '
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
    ';
  END IF;
END $$;

-- ============================================================================
-- 10. UPDATE FUNCTION FOR CREATING USER PROFILES
-- ============================================================================

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

-- ============================================================================
-- 11. ENSURE TRIGGER FOR CREATING PROFILES EXISTS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 12. CREATE FUNCTIONS FOR AUTOMATIC user_id ASSIGNMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_shifts_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_shifts_user_id ON shifts;
CREATE TRIGGER set_shifts_user_id
  BEFORE INSERT ON shifts
  FOR EACH ROW EXECUTE FUNCTION public.handle_shifts_user_id();

CREATE OR REPLACE FUNCTION public.handle_salary_payments_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_salary_payments_user_id ON salary_payments;
CREATE TRIGGER set_salary_payments_user_id
  BEFORE INSERT ON salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_salary_payments_user_id();

CREATE OR REPLACE FUNCTION public.handle_monthly_actuals_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_actuals') THEN
    DROP TRIGGER IF EXISTS set_monthly_actuals_user_id ON monthly_actuals;
    EXECUTE '
      CREATE TRIGGER set_monthly_actuals_user_id
        BEFORE INSERT ON monthly_actuals
        FOR EACH ROW EXECUTE FUNCTION public.handle_monthly_actuals_user_id();
    ';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_incomes_user_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incomes') THEN
    DROP TRIGGER IF EXISTS set_incomes_user_id ON incomes;
    EXECUTE '
      CREATE TRIGGER set_incomes_user_id
        BEFORE INSERT ON incomes
        FOR EACH ROW EXECUTE FUNCTION public.handle_incomes_user_id();
    ';
  END IF;
END $$;
