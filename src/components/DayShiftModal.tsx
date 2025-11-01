import React from 'react';
import { X, CreditCard as Edit, Trash2, Plus, Sun, Moon, Clock, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { Shift } from '../lib/supabase';

interface DayShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  shifts: Shift[];
  onEdit: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onAdd: (date: string) => void;
}

export function DayShiftModal({ 
  isOpen, 
  onClose, 
  date, 
  shifts, 
  onEdit, 
  onDelete,
  onAdd 
}: DayShiftModalProps) {
  const { tg } = useTelegram();

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const totalIncome = shifts.reduce((sum, shift) => sum + Number(shift.total_income), 0);
  const totalSalary = shifts.reduce((sum, shift) => sum + Number(shift.total_salary), 0);
  const totalTips = shifts.reduce((sum, shift) => sum + Number(shift.tips), 0);

  const handleEdit = (shift: Shift) => {
    tg?.HapticFeedback?.impactOccurred('light');
    onEdit(shift);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить эту смену?')) {
      tg?.HapticFeedback?.notificationOccurred('success');
      onDelete(id);
    }
  };

  const handleAdd = () => {
    tg?.HapticFeedback?.impactOccurred('light');
    onAdd(date);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-0">
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 pt-safe">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {formatDate(date)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {shifts.length} {shifts.length === 1 ? 'смена' : 'смен'} • {totalIncome.toLocaleString()}₽
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 sm:p-2 active:bg-gray-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 pb-safe" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {shifts.length === 0 ? (
            <div className="text-center py-6 sm:py-8 px-4 sm:px-6">
              <p className="text-sm sm:text-base text-gray-500 mb-4">Нет смен за этот день</p>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl active:from-blue-700 active:to-blue-800 transition-all flex items-center space-x-2 mx-auto min-h-[44px] shadow-lg"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Добавить смену</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              {shifts.map((shift) => (
                <div key={shift.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        shift.shift_type === 'day' 
                          ? 'bg-yellow-100 text-yellow-600' 
                          : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {shift.shift_type === 'day' ? (
                          <Sun className="w-6 h-6" />
                        ) : (
                          <Moon className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {shift.shift_type === 'day' ? 'Дневная' : 'Ночная'} смена
                        </p>
                        <p className="text-sm text-gray-500">
                          {shift.hours}ч • Выручка: {Number(shift.revenue).toLocaleString()}₽
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(shift)}
                        className="p-3 active:bg-gray-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(shift.id)}
                        className="p-3 active:bg-gray-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Simple earnings display */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Итого доход:</span>
                      <span className="text-xl font-bold text-gray-900">
                        {Number(shift.total_income).toLocaleString()}₽
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                      <span>ЗП: {Number(shift.total_salary).toLocaleString()}₽</span>
                      <span>Чаевые: {Number(shift.tips).toLocaleString()}₽</span>
                      </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={handleAdd}
                className="w-full bg-blue-600 text-white p-4 rounded-xl active:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mt-4 min-h-[52px]"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Добавить еще смену</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}