import { supabase, Shift, NewShift, SalaryPayment, isSupabaseConfigured } from '../lib/supabase';
import type { MonthlyActuals, NewMonthlyActuals } from '../lib/supabase';

// Получаем текущего пользователя
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user.id;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export class ShiftService {
  static async getAllShifts(): Promise<Shift[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured. Please set up your environment variables.');
      return [];
    }
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch shifts: ${error.message}`);
    }

    return data || [];
  }

  static async getShiftsByMonth(year: number, month: number): Promise<Shift[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch shifts for month: ${error.message}`);
    }

    return data || [];
  }

  static async getShiftsByDate(date: string): Promise<Shift[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch shifts for date: ${error.message}`);
    }

    return data || [];
  }

  static async createShift(shift: NewShift): Promise<Shift | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured. Cannot create shift.');
      return null;
    }
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('shifts')
      .insert([{ ...shift, user_id: userId }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create shift: ${error.message}`);
    }

    return data;
  }

  static async updateShift(id: string, shift: Partial<NewShift>): Promise<Shift | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured. Cannot update shift.');
      return null;
    }
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('shifts')
      .update(shift)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update shift: ${error.message}`);
    }

    return data;
  }

  static async deleteShift(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured. Cannot delete shift.');
      return false;
    }
    
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete shift: ${error.message}`);
    }

    return true;
  }

  static async getMonthlyStats(year: number, month: number): Promise<{
    totalRevenue: number;
    totalSalary: number;
    totalTips: number;
    totalIncome: number;
    averageRevenue: number;
    averageTips: number;
    totalHours: number;
    shiftsCount: number;
    advanceAmount: number;
    dayHours: number;
    nightHours: number;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        totalRevenue: 0,
        totalSalary: 0,
        totalTips: 0,
        totalIncome: 0,
        averageRevenue: 0,
        averageTips: 0,
        totalHours: 0,
        shiftsCount: 0,
        advanceAmount: 0,
        dayHours: 0,
        nightHours: 0
      };
    }

    const shifts = await this.getShiftsByMonth(year, month);
    
    const totalRevenue = shifts.reduce((sum, shift) => sum + Number(shift.revenue), 0);
    const totalSalary = shifts.reduce((sum, shift) => sum + Number(shift.total_salary), 0);
    const totalTips = shifts.reduce((sum, shift) => sum + Number(shift.tips), 0);
    const totalIncome = shifts.reduce((sum, shift) => sum + Number(shift.total_income), 0);
    const totalHours = shifts.reduce((sum, shift) => sum + Number(shift.hours), 0);
    const shiftsCount = shifts.length;
    
    const dayHours = shifts
      .filter(shift => shift.shift_type === 'day')
      .reduce((sum, shift) => sum + Number(shift.hours), 0);
    
    const nightHours = shifts
      .filter(shift => shift.shift_type === 'night')
      .reduce((sum, shift) => sum + Number(shift.hours), 0);

    // Calculate advance (1st to 15th of month)
    const advanceShifts = shifts.filter(shift => {
      const day = new Date(shift.date).getDate();
      return day >= 1 && day <= 15;
    });
    const advanceAmount = advanceShifts.reduce((sum, shift) => sum + Number(shift.hourly_pay), 0);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSalary: Math.round(totalSalary * 100) / 100,
      totalTips: Math.round(totalTips * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      averageRevenue: shiftsCount > 0 ? Math.round((totalRevenue / shiftsCount) * 100) / 100 : 0,
      averageTips: shiftsCount > 0 ? Math.round((totalTips / shiftsCount) * 100) / 100 : 0,
      totalHours: Math.round(totalHours * 100) / 100,
      shiftsCount,
      advanceAmount: Math.round(advanceAmount * 100) / 100,
      dayHours: Math.round(dayHours * 100) / 100,
      nightHours: Math.round(nightHours * 100) / 100
    };
  }

  static async getLastThreeMonthsData(): Promise<Array<{
    month: string;
    revenue: number;
    tips: number;
  }>> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const now = new Date();
    const months = [];
    
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const stats = await this.getMonthlyStats(year, month);
      months.push({
        month: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
        revenue: stats.totalRevenue,
        tips: stats.totalTips
      });
    }

    return months;
  }

  // Salary payments management
  static async getSalaryPayment(month: string): Promise<SalaryPayment | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('salary_payments')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch salary payment: ${error.message}`);
    }

    return data;
  }

  static async upsertSalaryPayment(payment: Partial<SalaryPayment> & { month: string }): Promise<SalaryPayment | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Use onConflict to handle upsert with composite unique key (user_id, month)
    const { data, error } = await supabase
      .from('salary_payments')
      .upsert([{ ...payment, user_id: userId }], {
        onConflict: 'user_id,month'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert salary payment: ${error.message}`);
    }

    return data;
  }

  // Monthly actuals management
  static async getMonthlyActuals(month: string): Promise<MonthlyActuals | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('monthly_actuals')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch monthly actuals: ${error.message}`);
    }

    return data;
  }

  static async upsertMonthlyActuals(actuals: NewMonthlyActuals): Promise<MonthlyActuals | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // First, get existing data
    const existing = await this.getMonthlyActuals(actuals.month);

    // Merge with existing data, only updating fields that are provided
    const merged = {
      month: actuals.month,
      user_id: userId,
      actual_revenue: actuals.actual_revenue !== undefined ? actuals.actual_revenue : (existing?.actual_revenue || 0),
      actual_advance: actuals.actual_advance !== undefined ? actuals.actual_advance : (existing?.actual_advance || 0),
      actual_salary: actuals.actual_salary !== undefined ? actuals.actual_salary : (existing?.actual_salary || 0),
      updated_at: new Date().toISOString()
    };

    // Use onConflict to handle upsert with composite unique key (user_id, month)
    const { data, error } = await supabase
      .from('monthly_actuals')
      .upsert([merged], {
        onConflict: 'user_id,month'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert monthly actuals: ${error.message}`);
    }

    return data;
  }
}