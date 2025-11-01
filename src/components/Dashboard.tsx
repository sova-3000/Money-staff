import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, Clock, Target, Sun, Moon, CreditCard as Edit2, Check, X, RotateCcw, Coins } from 'lucide-react';
import { ShiftService } from '../services/shiftService';
import { useTelegram } from '../hooks/useTelegram';
import { Calendar } from './Calendar';
import { DayShiftModal } from './DayShiftModal';
import { MonthNavigator } from './MonthNavigator';
import { ShiftTable } from './ShiftTable';

interface DashboardProps {
  onAddShift: (date?: string) => void;
  onEditShift: (shift: any) => void;
}

interface MonthlyStats {
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
}

export function Dashboard({ onAddShift, onEditShift }: DashboardProps) {
  const [stats, setStats] = useState<MonthlyStats>({
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
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShifts, setSelectedShifts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { tg } = useTelegram();
  
  // Actual data states
  const [showActualRevenueInput, setShowActualRevenueInput] = useState(false);
  const [showActualAdvanceInput, setShowActualAdvanceInput] = useState(false);
  const [showActualSalaryInput, setShowActualSalaryInput] = useState(false);
  const [actualRevenue, setActualRevenue] = useState<number>(0);
  const [actualAdvance, setActualAdvance] = useState<number>(0);
  const [actualSalary, setActualSalary] = useState<number>(0);
  const [monthShifts, setMonthShifts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  useEffect(() => {
    loadActualData();
  }, [currentDate]);

  const loadActualData = async () => {
    try {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const actuals = await ShiftService.getMonthlyActuals(monthKey);
      
      if (actuals) {
        setActualRevenue(actuals.actual_revenue || 0);
        setActualAdvance(actuals.actual_advance || 0);
        setActualSalary(actuals.actual_salary || 0);
      } else {
        setActualRevenue(0);
        setActualAdvance(0);
        setActualSalary(0);
      }
    } catch (error) {
      console.error('Failed to load actual data:', error);
    }
  };
  const loadData = async () => {
    try {
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const [monthlyStats, shifts] = await Promise.all([
        ShiftService.getMonthlyStats(currentYear, currentMonth),
        ShiftService.getShiftsByMonth(currentYear, currentMonth)
      ]);

      setStats(monthlyStats);
      setMonthShifts(shifts);
    } catch (error) {
      console.error('Failed to load data:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleAddShift = (date?: string) => {
    tg?.HapticFeedback?.impactOccurred('light');
    onAddShift(date);
  };

  const handleDateSelect = async (date: string) => {
    try {
      const shifts = await ShiftService.getShiftsByDate(date);
      
      if (shifts.length === 0) {
        // Если нет смен, сразу открываем форму добавления
        handleAddShift(date);
      } else {
        // Если есть смены, показываем модальное окно
        setSelectedDate(date);
        setSelectedShifts(shifts);
        setIsModalOpen(true);
        tg?.HapticFeedback?.impactOccurred('light');
      }
    } catch (error) {
      console.error('Failed to load shifts for date:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await ShiftService.deleteShift(id);
      setSelectedShifts(prev => prev.filter(shift => shift.id !== id));
      loadData();
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to delete shift:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const handleEditActualRevenue = () => {
    setShowActualRevenueInput(true);
    tg?.HapticFeedback?.impactOccurred('light');
  };

  const handleEditActualAdvance = () => {
    setShowActualAdvanceInput(true);
    tg?.HapticFeedback?.impactOccurred('light');
  };

  const handleEditActualSalary = () => {
    setShowActualSalaryInput(true);
    tg?.HapticFeedback?.impactOccurred('light');
  };

  const handleSaveActualRevenue = async () => {
    try {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      await ShiftService.upsertMonthlyActuals({
        month: monthKey,
        actual_revenue: actualRevenue
      });
      setShowActualRevenueInput(false);
      loadData(); // Reload to recalculate with actual revenue
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to save actual revenue:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const handleSaveActualAdvance = async () => {
    try {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      await ShiftService.upsertMonthlyActuals({
        month: monthKey,
        actual_advance: actualAdvance
      });
      setShowActualAdvanceInput(false);
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to save actual advance:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const handleSaveActualSalary = async () => {
    try {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      await ShiftService.upsertMonthlyActuals({
        month: monthKey,
        actual_salary: actualSalary
      });
      setShowActualSalaryInput(false);
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to save actual salary:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const handleResetActualRevenue = async () => {
    try {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      await ShiftService.upsertMonthlyActuals({
        month: monthKey,
        actual_revenue: 0
      });
      setActualRevenue(0);
      setShowActualRevenueInput(false);
      await loadActualData();
      await loadData();
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to reset actual revenue:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const handleResetActualAdvance = async () => {
    try {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      await ShiftService.upsertMonthlyActuals({
        month: monthKey,
        actual_advance: 0
      });
      setActualAdvance(0);
      setShowActualAdvanceInput(false);
      await loadActualData();
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to reset actual advance:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const handleResetActualSalary = async () => {
    try {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      await ShiftService.upsertMonthlyActuals({
        month: monthKey,
        actual_salary: 0
      });
      setActualSalary(0);
      setShowActualSalaryInput(false);
      await loadActualData();
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to reset actual salary:', error);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-safe pb-safe">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">SmokyDock</h3>
            <p className="text-sm text-gray-500">Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe pt-safe">
      <div className="px-4 sm:px-6 pt-4 sm:pt-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-gray-900 mb-1">SmokyDock</h1>
            <p className="text-sm text-gray-500">Учет смен и доходов</p>
          </div>
        </div>

        {/* Main Financial Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Выручка</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.totalRevenue.toLocaleString()}₽</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Средняя: {Math.round(stats.averageRevenue).toLocaleString()}₽</span>
            </div>
            {actualRevenue > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Факт:</span>
                  <span className="text-sm font-medium text-blue-600">{actualRevenue.toLocaleString()}₽</span>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setActualRevenue(actualRevenue || stats.totalRevenue);
                handleEditActualRevenue();
              }}
              className="mt-3 w-full py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{actualRevenue > 0 ? 'Редактировать' : 'Ввести факт'}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Зарплата</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.totalSalary.toLocaleString()}₽</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Аванс: {stats.advanceAmount.toLocaleString()}₽</span>
            </div>
            {actualAdvance > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Аванс факт:</span>
                  <span className="text-sm font-medium text-green-600">{actualAdvance.toLocaleString()}₽</span>
                </div>
              </div>
            )}
            <button
              onClick={() => handleEditActualAdvance()}
              className="mt-3 w-full py-1.5 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Ввести аванс</span>
            </button>
          </div>
        </div>

        {/* Month Navigation with Swipe */}
        <MonthNavigator
          currentDate={currentDate}
          onNavigate={navigateMonth}
          monthNames={monthNames}
        />

        {/* Actual Revenue Input */}
        {showActualRevenueInput && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Фактическая выручка</h3>
              <button
                onClick={() => setShowActualRevenueInput(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={actualRevenue || ''}
                onChange={(e) => setActualRevenue(Number(e.target.value))}
                placeholder={`Расчет: ${stats.totalRevenue}₽`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setActualRevenue(0)}
                className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title="Сбросить"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveActualRevenue}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Сохранить"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Actual Advance Input */}
        {showActualAdvanceInput && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Фактический аванс</h3>
              <button
                onClick={() => setShowActualAdvanceInput(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={actualAdvance || ''}
                onChange={(e) => setActualAdvance(Number(e.target.value))}
                placeholder={`Расчет: ${stats.advanceAmount}₽`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={() => setActualAdvance(0)}
                className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title="Сбросить"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveActualAdvance}
                className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Сохранить"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-xs text-gray-500">Чаевые</p>
            </div>
            <p className="text-base font-semibold text-gray-900 mb-0.5">{stats.totalTips.toLocaleString()}₽</p>
            <p className="text-xs text-gray-400">Ср: {Math.round(stats.averageTips).toLocaleString()}₽</p>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500">Часы</p>
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">{stats.totalHours}ч</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Sun className="w-3 h-3" />
                <span>{stats.dayHours}</span>
              </div>
              <div className="flex items-center gap-1">
                <Moon className="w-3 h-3" />
                <span>{stats.nightHours}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xs text-gray-500">Доход</p>
            </div>
            <p className="text-base font-semibold text-gray-900 mb-0.5">{stats.totalIncome.toLocaleString()}₽</p>
            <p className="text-xs text-gray-400">{stats.shiftsCount} смен</p>
            {actualSalary > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-indigo-600 font-medium">ЗП: {actualSalary.toLocaleString()}₽</p>
              </div>
            )}
            <button
              onClick={() => {
                setActualSalary(actualSalary || 0);
                handleEditActualSalary();
              }}
              className="mt-2 w-full py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Факт ЗП</span>
            </button>
          </div>
        </div>

        {/* Actual Salary Input */}
        {showActualSalaryInput && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Фактическая основная ЗП</h3>
              <button
                onClick={() => setShowActualSalaryInput(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={actualSalary || ''}
                onChange={(e) => setActualSalary(Number(e.target.value))}
                placeholder={`Расчет: ${stats.totalSalary}₽`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => setActualSalary(0)}
                className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                title="Сбросить"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveActualSalary}
                className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                title="Сохранить"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Section */}
        {actualAdvance > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
            <h3 className="text-base font-medium text-gray-900 mb-4">Сводка по выплатам</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Аванс получен:</span>
                <span className="font-medium text-gray-900">{actualAdvance.toLocaleString()}₽</span>
              </div>
              {actualSalary > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ЗП получена:</span>
                    <span className="font-medium text-gray-900">{actualSalary.toLocaleString()}₽</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Итого получено:</span>
                      <span className="font-semibold text-gray-900">{(actualAdvance + actualSalary).toLocaleString()}₽</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Разница с расчетом:</span>
                      <span className={`font-bold ${
                        (stats.totalSalary - actualAdvance - actualSalary) > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {(stats.totalSalary - actualAdvance - actualSalary).toLocaleString()}₽
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Осталось к выплате:</span>
                    <span className="font-semibold text-orange-600">
                      {(stats.totalSalary - actualAdvance).toLocaleString()}₽
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="mb-6">
          <Calendar 
            onDateSelect={handleDateSelect} 
            currentDate={currentDate}
            onMonthChange={navigateMonth}
          />
        </div>

        {/* Shifts Table */}
        <ShiftTable
          shifts={monthShifts}
          onShiftClick={(shift) => onEditShift(shift)}
        />

        {/* Version Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-gray-400">
            SmokyDock v{import.meta.env.PACKAGE_VERSION || '1.0.0'}
          </p>
        </div>
      </div>

      {/* Day Shift Modal */}
      <DayShiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate}
        shifts={selectedShifts}
        onEdit={onEditShift}
        onDelete={handleDeleteShift}
        onAdd={handleAddShift}
      />
    </div>
  );
}