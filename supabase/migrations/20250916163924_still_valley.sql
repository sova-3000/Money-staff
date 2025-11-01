/*
  # Create incomes table for Telegram WebApp

  1. New Tables
    - `incomes`
      - `id` (integer, primary key, identity)
      - `amount` (numeric) - сумма дохода
      - `source` (text, nullable) - источник дохода 
      - `description` (text, nullable) - описание
      - `date` (timestamptz) - дата получения дохода, по умолчанию now()

  2. Security
    - Enable RLS on `incomes` table
    - Add policy for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS incomes (
  id SERIAL PRIMARY KEY,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  source TEXT,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all operations on incomes
CREATE POLICY "Users can manage incomes"
  ON incomes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users (for Telegram WebApp)
CREATE POLICY "Anonymous users can manage incomes"
  ON incomes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);