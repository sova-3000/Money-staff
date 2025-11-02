/*
  Check how many records exist without user_id
  
  This query helps verify how many records need to be migrated.
*/

-- Check shifts without user_id
SELECT 
  'shifts' as table_name,
  COUNT(*) as records_without_user_id
FROM shifts
WHERE user_id IS NULL

UNION ALL

-- Check salary_payments without user_id
SELECT 
  'salary_payments' as table_name,
  COUNT(*) as records_without_user_id
FROM salary_payments
WHERE user_id IS NULL

UNION ALL

-- Check monthly_actuals without user_id (if exists)
SELECT 
  'monthly_actuals' as table_name,
  COUNT(*) as records_without_user_id
FROM monthly_actuals
WHERE user_id IS NULL

UNION ALL

-- Check incomes without user_id (if exists)
SELECT 
  'incomes' as table_name,
  COUNT(*) as records_without_user_id
FROM incomes
WHERE user_id IS NULL

-- Also check if user exists
UNION ALL

SELECT 
  'auth.users' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'premiumservice23@gmail.com') 
    THEN 1 
    ELSE 0 
  END as user_exists;

-- Show user details if exists
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'premiumservice23@gmail.com';

