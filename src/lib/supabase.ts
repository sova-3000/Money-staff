import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholder values if environment variables are not set
const defaultUrl = 'https://your-project.supabase.co';
const defaultKey = 'your-anon-key';

export const supabase = createClient(
  supabaseUrl || defaultUrl,
  supabaseAnonKey || defaultKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      // CRITICAL: detectSessionInUrl must be true to automatically detect OAuth callback
      // This handles both hash (#access_token) and query (?code) parameters
      // When true, Supabase automatically:
      // - Detects code in URL on page load
      // - Finds code_verifier in sessionStorage
      // - Exchanges code for tokens
      // - Sets session
      // - Fires SIGNED_IN event
      detectSessionInUrl: true,
      // PKCE flow is more secure and is the default for Supabase
      // Flow steps:
      // 1. signInWithOAuth() generates code_verifier and stores in sessionStorage
      // 2. Creates code_challenge = SHA256(code_verifier) and sends to Google
      // 3. Google redirects back with code
      // 4. detectSessionInUrl extracts code from URL + code_verifier from sessionStorage
      // 5. Exchanges code + code_verifier for tokens at /auth/v1/token?grant_type=pkce
      // 
      // Storage keys used:
      // - code_verifier: sb-{project-ref}-auth-code-verifier-{random-id}
      // - state: sb-{project-ref}-auth-token
      // - session: sb-{project-ref}-auth-token (after successful exchange)
      flowType: 'pkce',
      // CRITICAL: Storage provider must be sessionStorage (NOT localStorage)
      // - code_verifier is stored here BEFORE redirect to Google
      // - Must persist across redirect to be available when code returns
      // - If sessionStorage is cleared/blocked → code_verifier lost → "Invalid API key" error
      // 
      // Why sessionStorage, not localStorage:
      // - More secure (cleared when tab closes)
      // - Works better with redirects
      // - Supabase SDK expects sessionStorage for PKCE flow
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      // Storage key prefix for Supabase auth data
      // Format: sb-{project-ref}-auth-{type}
      // Example: sb-sjlqgrmfrzpufwhdrfcl-auth-token
      storageKey: `sb-${supabaseUrl?.split('//')[1]?.split('.')[0]}-auth-token`,
    }
  }
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
  user_id?: string;
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
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NewMonthlyActuals {
  month: string;
  actual_revenue?: number;
  actual_advance?: number;
  actual_salary?: number;
}