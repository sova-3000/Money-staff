import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholder values if environment variables are not set
const defaultUrl = 'https://your-project.supabase.co';
const defaultKey = 'your-anon-key';

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey
);

// Export User type from Supabase
export type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && 
         supabaseUrl !== defaultUrl && 
         supabaseAnonKey !== defaultKey;
};

export interface Income {
  id: number;
  amount: number;
  source?: string;
  description?: string;
  date: string;
}

export interface NewIncome {
  amount: number;
  source?: string;
  description?: string;
  date?: string;
}

export interface Shift {
  id: string;
  date: string;
  shift_type: 'day' | 'night';
  hours: number;
  revenue: number;
  tips: number;
  hourly_pay: number;
  revenue_bonus: number;
  total_salary: number;
  total_income: number;
  created_at: string;
  updated_at: string;
}

export interface NewShift {
  date: string;
  shift_type: 'day' | 'night';
  hours: number;
  revenue: number;
  tips: number;
}

export interface SalaryPayment {
  id: string;
  month: string;
  advance_calculated: number;
  advance_actual: number;
  salary_calculated: number;
  salary_actual: number;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  day_rate: number;
  night_rate: number;
  revenue_bonus_percent: number;
  created_at: string;
  updated_at: string;
}

export interface NewUserProfile {
  full_name?: string;
  day_rate?: number;
  night_rate?: number;
  revenue_bonus_percent?: number;
}

export interface MonthlyActuals {
  id: string;
  month: string;
  actual_revenue: number;
  actual_advance: number;
  actual_salary: number;
  created_at: string;
  updated_at: string;
}

export interface NewMonthlyActuals {
  month: string;
  actual_revenue?: number;
  actual_advance?: number;
  actual_salary?: number;
}