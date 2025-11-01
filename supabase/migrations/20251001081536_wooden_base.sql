/*
  # Подготовка базы данных для многопользовательской системы

  1. Новые таблицы
    - `user_profiles` - профили пользователей с дополнительной информацией
    - Обновление существующих таблиц для связи с пользователями

  2. Безопасность
    - Включение RLS для всех таблиц
    - Политики доступа только к собственным данным пользователя
    - Автоматическое создание профиля при регистрации

  3. Изменения
    - Добавление user_id во все существующие таблицы
    - Миграция существующих данных (если есть)
    - Обновление политик безопасности
*/

-- Создаем таблицу профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  day_rate numeric DEFAULT 200,
  night_rate numeric DEFAULT 230,
  revenue_bonus_percent numeric DEFAULT 0.1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Включаем RLS для профилей
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Политика для профилей - пользователи могут управлять только своим профилем
CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Добавляем user_id в существующие таблицы
DO $$
BEGIN
  -- Добавляем user_id в таблицу shifts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shifts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Добавляем user_id в таблицу salary_payments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salary_payments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE salary_payments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Добавляем user_id в таблицу incomes (если она используется)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'incomes'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'incomes' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE incomes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Обновляем политики для таблицы shifts
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON shifts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON shifts;

CREATE POLICY "Users can manage own shifts"
  ON shifts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Обновляем политики для таблицы salary_payments
DROP POLICY IF EXISTS "Allow all operations for anonymous users" ON salary_payments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON salary_payments;

CREATE POLICY "Users can manage own salary payments"
  ON salary_payments
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Обновляем политики для таблицы incomes (если существует)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'incomes'
  ) THEN
    DROP POLICY IF EXISTS "Anonymous users can manage incomes" ON incomes;
    DROP POLICY IF EXISTS "Users can manage incomes" ON incomes;
    
    EXECUTE 'CREATE POLICY "Users can manage own incomes"
      ON incomes
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Функция для автоматического создания профиля пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления updated_at в профилях
DROP TRIGGER IF EXISTS handle_updated_at ON user_profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_user_id ON salary_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Если существует таблица incomes, создаем индекс
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'incomes'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id)';
  END IF;
END $$;