/*
  # Add actual salary tracking fields

  1. New Tables
    - `monthly_actuals` - stores actual revenue, advance, and salary data per month
      - `id` (uuid, primary key)
      - `month` (text, unique) - format: YYYY-MM
      - `actual_revenue` (numeric) - actual revenue for the month
      - `actual_advance` (numeric) - actual advance received
      - `actual_salary` (numeric) - actual salary received
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - No RLS needed for single-user mode
*/

CREATE TABLE IF NOT EXISTS monthly_actuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text UNIQUE NOT NULL,
  actual_revenue numeric DEFAULT 0,
  actual_advance numeric DEFAULT 0,
  actual_salary numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monthly_actuals_month ON monthly_actuals(month);