import React from 'react';
import { Calendar } from 'lucide-react';
import type { Shift } from '../lib/supabase';

interface ShiftTableProps {
  shifts: Shift[];
  onShiftClick: (shift: Shift) => void;
}

export function ShiftTable({ shifts, onShiftClick }: ShiftTableProps) {
  if (shifts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Смены за месяц</h3>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Нет смен в этом месяце</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'short' });
    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    return { day, month, weekday };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-base font-medium text-gray-900">Смены за месяц</h3>
        <p className="text-sm text-gray-500 mt-1">{shifts.length} смен</p>
      </div>

      <div className="divide-y divide-gray-100">
        {shifts.map((shift) => {
          const { day, month, weekday } = formatDate(shift.date);
          return (
            <button
              key={shift.id}
              onClick={() => onShiftClick(shift)}
              className="w-full p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                    <span className="text-lg font-semibold text-gray-900">{day}</span>
                    <span className="text-xs text-gray-500">{month}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 capitalize">{weekday}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        shift.shift_type === 'day'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {shift.shift_type === 'day' ? 'День' : 'Ночь'}
                      </span>
                      <span className="text-xs text-gray-500">{shift.hours}ч</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Выручка</div>
                    <div className="text-sm font-medium text-blue-600">
                      {shift.revenue.toLocaleString()}₽
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Чаевые</div>
                    <div className="text-sm font-medium text-yellow-600">
                      {shift.tips.toLocaleString()}₽
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Доход</div>
                    <div className="text-sm font-semibold text-green-600">
                      {shift.total_income.toLocaleString()}₽
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
