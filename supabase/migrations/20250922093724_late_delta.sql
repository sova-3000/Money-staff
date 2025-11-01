-- Create shifts table for SmokyDock shift tracking
-- Run this SQL in your Supabase SQL Editor

-- Create shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  shift_type text NOT NULL CHECK (shift_type IN ('day', 'night')),
  hours numeric NOT NULL DEFAULT 12,
  revenue numeric NOT NULL DEFAULT 0,
  tips numeric NOT NULL DEFAULT 0,
  hourly_pay numeric GENERATED ALWAYS AS (
    CASE 
      WHEN shift_type = 'day' THEN hours * 200
      WHEN shift_type = 'night' THEN hours * 220
      ELSE 0
    END
  ) STORED,
  revenue_bonus numeric GENERATED ALWAYS AS (revenue * 0.1) STORED,
  total_salary numeric GENERATED ALWAYS AS (
    (CASE 
      WHEN shift_type = 'day' THEN hours * 200
      WHEN shift_type = 'night' THEN hours * 220
      ELSE 0
    END) + (revenue * 0.1)
  ) STORED,
  total_income numeric GENERATED ALWAYS AS (
    (CASE 
      WHEN shift_type = 'day' THEN hours * 200
      WHEN shift_type = 'night' THEN hours * 220
      ELSE 0
    END) + (revenue * 0.1) + tips
  ) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous and authenticated users
CREATE POLICY "Allow all operations for anonymous users" ON public.shifts
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.shifts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create salary_payments table
CREATE TABLE IF NOT EXISTS public.salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  advance_calculated numeric NOT NULL DEFAULT 0,
  advance_actual numeric DEFAULT 0,
  salary_calculated numeric NOT NULL DEFAULT 0,
  salary_actual numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security for salary_payments
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for salary_payments
CREATE POLICY "Allow all operations for anonymous users" ON public.salary_payments
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.salary_payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_created_at ON public.shifts(created_at);
CREATE INDEX IF NOT EXISTS idx_salary_payments_month ON public.salary_payments(month);