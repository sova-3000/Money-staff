import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ShiftService } from '../services/shiftService';
import { Shift } from '../lib/supabase';

interface CalendarProps {
  onDateSelect: (date: string) => void;
  currentDate: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

interface DayShift {
  date: string;
  total: number;
  count: number;
  hasDay: boolean;
  hasNight: boolean;
}

export function Calendar({ onDateSelect, currentDate, onMonthChange }: CalendarProps) {
  const [dayShifts, setDayShifts] = useState<DayShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    loadMonthShifts();
  }, [currentDate]);

  const loadMonthShifts = async () => {
    try {
      const shifts = await ShiftService.getShiftsByMonth(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      
      const groupedByDay = shifts.reduce((acc: Record<string, { total: number; count: number; shifts: Shift[] }>, shift) => {
        const dateKey = shift.date;
        if (!acc[dateKey]) {
          acc[dateKey] = { total: 0, count: 0, shifts: [] };
        }
        acc[dateKey].total += Number(shift.total_income);
        acc[dateKey].count += 1;
        acc[dateKey].shifts.push(shift);
        return acc;
      }, {});

      const dayShiftsArray = Object.entries(groupedByDay).map(([date, data]) => ({
        date,
        total: data.total,
        count: data.count,
        hasDay: data.shifts.some(shift => shift.shift_type === 'day'),
        hasNight: data.shifts.some(shift => shift.shift_type === 'night')
      }));

      setDayShifts(dayShiftsArray);
    } catch (error) {
      console.error('Failed to load month shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onMonthChange('next');
    }
    if (isRightSwipe) {
      onMonthChange('prev');
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Первый день месяца
    const firstDayOfMonth = new Date(year, month, 1);
    // Последний день месяца
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Получаем день недели для первого дня (0 = воскресенье, 1 = понедельник, ..., 6 = суббота)
    let firstDayWeekday = firstDayOfMonth.getDay();
    // Преобразуем так, чтобы понедельник был 0, а воскресенье 6
    firstDayWeekday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    
    const calendarDays = [];
    
    // Добавляем пустые ячейки в начале
    for (let i = 0; i < firstDayWeekday; i++) {
      calendarDays.push(null);
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    // Добавляем пустые ячейки в конце, чтобы всего было 42 ячейки (6 недель × 7 дней)
    while (calendarDays.length < 42) {
      calendarDays.push(null);
    }
    
    return calendarDays;
  };

  const getDayShift = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dayShifts.find(shift => shift.date === dateString);
  };

  const handleDateClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(dateString);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === currentDate.getFullYear() &&
           today.getMonth() === currentDate.getMonth() &&
           today.getDate() === day;
  };

  const getDayBackgroundClass = (dayShift: DayShift | undefined, isToday: boolean) => {
    if (isToday) {
      return 'bg-blue-50 border border-blue-200';
    }
    
    if (!dayShift) {
      return 'active:bg-gray-50';
    }
    
    // Если есть и дневные и ночные смены
    if (dayShift.hasDay && dayShift.hasNight) {
      return 'bg-gradient-to-br from-yellow-50 to-indigo-50 border border-purple-200 active:from-yellow-100 active:to-indigo-100';
    }
    
    // Только дневные смены
    if (dayShift.hasDay) {
      return 'bg-yellow-50 border border-yellow-200 active:bg-yellow-100';
    }
    
    // Только ночные смены
    if (dayShift.hasNight) {
      return 'bg-indigo-50 border border-indigo-200 active:bg-indigo-100';
    }
    
    return 'bg-green-50 active:bg-green-100';
  };

  const getDayTextClass = (dayShift: DayShift | undefined, isToday: boolean) => {
    if (isToday) {
      return 'text-blue-600';
    }
    
    if (!dayShift) {
      return 'text-gray-700';
    }
    
    if (dayShift.hasDay && dayShift.hasNight) {
      return 'text-purple-700';
    }
    
    if (dayShift.hasDay) {
      return 'text-yellow-700';
    }
    
    if (dayShift.hasNight) {
      return 'text-indigo-700';
    }
    
    return 'text-green-700';
  };

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const calendarDays = generateCalendarDays();

  return (
    <div 
      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2 sm:mb-3">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-2 sm:py-3">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Fixed 6 rows */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2" style={{ gridTemplateRows: 'repeat(6, minmax(44px, 1fr))' }}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return (
              <div 
                key={`empty-${index}`} 
                className="aspect-square min-h-[44px] sm:min-h-[48px]"
              />
            );
          }

          const dayShift = getDayShift(day);
          const isCurrentDay = isToday(day);
          const backgroundClass = getDayBackgroundClass(dayShift, isCurrentDay);
          const textClass = getDayTextClass(dayShift, isCurrentDay);

          return (
            <button
              key={`day-${day}`}
              onClick={() => handleDateClick(day)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs sm:text-sm transition-all duration-200 min-h-[44px] sm:min-h-[48px] relative ${backgroundClass}`}
            >
              <span className={`font-medium ${textClass}`}>
                {day}
              </span>
              {dayShift && (
                <span className={`text-xs font-medium leading-none absolute bottom-1 ${textClass}`}>
                  {dayShift.total > 999 ? `${Math.round(dayShift.total/1000)}к` : Math.round(dayShift.total)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}