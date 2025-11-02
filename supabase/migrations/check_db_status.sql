/*
  SQL скрипты для проверки текущего состояния БД
  
  Выполните эти запросы в Supabase SQL Editor перед применением миграции
  для диагностики текущего состояния БД.
*/

-- ============================================================================
-- 1. ПРОВЕРКА СТАТУСА RLS НА ВСЕХ ТАБЛИЦАХ
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('shifts', 'salary_payments', 'monthly_actuals', 'user_profiles', 'incomes')
ORDER BY tablename;

-- ============================================================================
-- 2. ПРОВЕРКА НАЛИЧИЯ КОЛОНКИ user_id В ТАБЛИЦАХ
-- ============================================================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN ('shifts', 'salary_payments', 'monthly_actuals', 'user_profiles', 'incomes')
  AND column_name = 'user_id'
ORDER BY table_name;

-- ============================================================================
-- 3. ПРОВЕРКА СУЩЕСТВУЮЩИХ RLS ПОЛИТИК
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command",
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('shifts', 'salary_payments', 'monthly_actuals', 'user_profiles', 'incomes')
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. ПРОВЕРКА УНИКАЛЬНЫХ ИНДЕКСОВ
-- ============================================================================
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('shifts', 'salary_payments', 'monthly_actuals', 'user_profiles', 'incomes')
  AND indexdef LIKE '%UNIQUE%'
ORDER BY tablename, indexname;

-- ============================================================================
-- 5. ПРОВЕРКА ТРИГГЕРОВ
-- ============================================================================
SELECT 
  trigger_name,
  event_object_table as "Table",
  action_statement as "Function",
  action_timing as "Timing",
  event_manipulation as "Event"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('shifts', 'salary_payments', 'monthly_actuals', 'user_profiles', 'incomes', 'auth.users')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 6. ПРОВЕРКА ФУНКЦИЙ
-- ============================================================================
SELECT 
  routine_name as "Function Name",
  routine_type as "Type"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'handle%'
ORDER BY routine_name;

