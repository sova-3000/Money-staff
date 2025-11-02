/*
  # Migrate Existing Data to User
  
  This migration assigns all existing data (shifts, salary_payments, monthly_actuals, incomes)
  to the user with email premiumservice23@gmail.com
  
  IMPORTANT: Run this migration only once after setting up multi-user mode.
  All data without user_id will be assigned to this user.
*/

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'premiumservice23@gmail.com';
  
  -- Check if user exists
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email premiumservice23@gmail.com not found. Please create the user first or update the email in this migration.';
  END IF;
  
  RAISE NOTICE 'Found user with ID: %', target_user_id;
  
  -- Migrate shifts data
  UPDATE shifts
  SET user_id = target_user_id
  WHERE user_id IS NULL;
  
  RAISE NOTICE 'Migrated % shifts', (SELECT COUNT(*) FROM shifts WHERE user_id = target_user_id);
  
  -- Migrate salary_payments data
  UPDATE salary_payments
  SET user_id = target_user_id
  WHERE user_id IS NULL;
  
  RAISE NOTICE 'Migrated % salary payments', (SELECT COUNT(*) FROM salary_payments WHERE user_id = target_user_id);
  
  -- Migrate monthly_actuals data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_actuals') THEN
    UPDATE monthly_actuals
    SET user_id = target_user_id
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Migrated % monthly actuals', (SELECT COUNT(*) FROM monthly_actuals WHERE user_id = target_user_id);
  END IF;
  
  -- Migrate incomes data (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incomes') THEN
    UPDATE incomes
    SET user_id = target_user_id
    WHERE user_id IS NULL;
    
    RAISE NOTICE 'Migrated % incomes', (SELECT COUNT(*) FROM incomes WHERE user_id = target_user_id);
  END IF;
  
  RAISE NOTICE 'Migration completed successfully!';
END $$;

