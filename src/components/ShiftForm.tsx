import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Clock, DollarSign, Sun, Moon } from 'lucide-react';
import { ShiftService, NewShift, Shift } from '../services/shiftService';
import { useTelegram } from '../hooks/useTelegram';

interface ShiftFormProps {
  onBack: () => void;
  onSave: () => void;
  editingShift?: Shift;
  initialDate?: string;
}

export function ShiftForm({ onBack, onSave, editingShift, initialDate }: ShiftFormProps) {
  const [formData, setFormData] = useState<NewShift>({
    date: initialDate || new Date().toISOString().slice(0, 10),
    shift_type: 'day',
    hours: 12,
    revenue: 0,
    tips: 0,
  });
  const [loading, setLoading] = useState(false);
  const { tg } = useTelegram();

  useEffect(() => {
    if (editingShift) {
      setFormData({
        date: editingShift.date,
        shift_type: editingShift.shift_type,
        hours: Number(editingShift.hours),
        revenue: Number(editingShift.revenue),
        tips: Number(editingShift.tips),
      });
    }
  }, [editingShift]);

  const calculateSalary = () => {
    const hourlyRate = formData.shift_type === 'day' ? 200 : 230;
    const hourlyPay = formData.hours * hourlyRate;
    const revenueBonus = formData.revenue * 0.1;
    const totalSalary = hourlyPay + revenueBonus;
    const totalIncome = totalSalary + formData.tips;

    return {
      hourlyPay,
      revenueBonus,
      totalSalary,
      totalIncome
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.hours <= 0) {
      alert('Количество часов должно быть больше нуля');
      tg?.HapticFeedback?.notificationOccurred('error');
      return;
    }

    if (formData.revenue < 0) {
      alert('Выручка не может быть отрицательной');
      tg?.HapticFeedback?.notificationOccurred('error');
      return;
    }

    setLoading(true);
    
    try {
      if (editingShift) {
        await ShiftService.updateShift(editingShift.id, formData);
      } else {
        await ShiftService.createShift(formData);
      }

      tg?.HapticFeedback?.notificationOccurred('success');
      onSave();
    } catch (error) {
      console.error('Failed to save shift:', error);
      alert('Ошибка при сохранении. Попробуйте еще раз.');
      tg?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
    document.body.classList.remove('form-focused');
    onBack();
  };

  const handleChange = (field: keyof NewShift, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculations = calculateSalary();

  useEffect(() => {
    document.body.classList.add('form-focused');
    
    // Автоматическая прокрутка к кнопке сохранения через небольшую задержку
    const timer = setTimeout(() => {
      const saveButton = document.querySelector('button[type="submit"]');
      if (saveButton) {
        saveButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 300);
    
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('form-focused');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-safe pt-safe overflow-y-auto">
      <div className="px-4 sm:px-6 pt-4 sm:pt-8">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <button
            onClick={handleBack}
            className="mr-3 sm:mr-4 p-3 sm:p-2 active:bg-white rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-light text-gray-900">
            {editingShift ? 'Редактировать смену' : 'Новая смена'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Date */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
              Дата смены *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-4 py-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-light text-base min-h-[48px]"
              required
            />
          </div>

          {/* Shift Type */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
              Тип смены *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('shift_type', 'day')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-h-[64px] ${
                  formData.shift_type === 'day'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Sun className="w-5 h-5" />
                  <span className="font-medium">День</span>
                </div>
                <span className="text-sm text-gray-500">200₽/ч</span>
              </button>
              <button
                type="button"
                onClick={() => handleChange('shift_type', 'night')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-h-[64px] ${
                  formData.shift_type === 'night'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Moon className="w-5 h-5" />
                  <span className="font-medium">Ночь</span>
                </div>
                <span className="text-sm text-gray-500">230₽/ч</span>
              </button>
            </div>
          </div>

          {/* Hours and Revenue - inline */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hours */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Часы *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hours || ''}
                  onChange={(e) => handleChange('hours', Number(e.target.value))}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full pl-10 pr-3 py-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base font-light min-h-[48px]"
                  placeholder="12"
                  required
                />
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Выручка *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <span className="text-gray-400 font-medium text-sm">₽</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.revenue || ''}
                  onChange={(e) => handleChange('revenue', Number(e.target.value))}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full pl-7 pr-3 py-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base font-light min-h-[48px]"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-3">
              Чаевые за смену
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <span className="text-gray-400 font-medium text-base sm:text-lg">₽</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.tips || ''}
                onChange={(e) => handleChange('tips', Number(e.target.value))}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full pl-8 pr-12 py-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg font-light min-h-[48px]"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <span className="text-gray-400 font-medium text-base sm:text-lg">₽</span>
              </div>
            </div>
          </div>

          {/* Calculations Preview */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-sm sm:text-base font-medium text-blue-900 mb-4">Расчет зарплаты</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Оплата за часы:</span>
                <span className="font-medium text-blue-900">{calculations.hourlyPay.toLocaleString()}₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">10% с выручки:</span>
                <span className="font-medium text-blue-900">{calculations.revenueBonus.toLocaleString()}₽</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="text-blue-700 font-medium">Зарплата:</span>
                <span className="font-semibold text-blue-900">{calculations.totalSalary.toLocaleString()}₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">+ Чаевые:</span>
                <span className="font-medium text-blue-900">{formData.tips.toLocaleString()}₽</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="text-blue-700 font-semibold">Итого доход:</span>
                <span className="font-bold text-blue-900 text-lg">{calculations.totalIncome.toLocaleString()}₽</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white p-4 rounded-xl flex items-center justify-center space-x-3 active:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[52px] text-base font-medium"
          >
            <Save className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>
              {loading ? 'Сохранение...' : 'Сохранить смену'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}