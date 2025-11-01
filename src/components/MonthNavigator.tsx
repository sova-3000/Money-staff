import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

interface MonthNavigatorProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  monthNames: string[];
}

export function MonthNavigator({ currentDate, onNavigate, monthNames }: MonthNavigatorProps) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tg } = useTelegram();

  const minSwipeDistance = 30;
  const threshold = 0.3;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchEnd(e.touches[0].clientX);
    setIsDragging(true);
    tg?.HapticFeedback?.impactOccurred('light');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentTouch = e.touches[0].clientX;
    setTouchEnd(currentTouch);
    const diff = currentTouch - touchStart;
    setOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const distance = touchEnd - touchStart;
    const containerWidth = containerRef.current?.offsetWidth || 0;

    if (Math.abs(distance) > minSwipeDistance) {
      if (Math.abs(distance) > containerWidth * threshold) {
        if (distance > 0) {
          onNavigate('prev');
          tg?.HapticFeedback?.impactOccurred('medium');
        } else {
          onNavigate('next');
          tg?.HapticFeedback?.impactOccurred('medium');
        }
      }
    }

    setOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  const getPrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    return `${monthNames[prev.getMonth()]} ${prev.getFullYear()}`;
  };

  const getNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    return `${monthNames[next.getMonth()]} ${next.getFullYear()}`;
  };

  const currentMonthText = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => onNavigate('prev')}
          className="p-2 active:bg-gray-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden h-12 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            {/* Previous month sliding in from left */}
            {offset > 30 && (
              <div
                className="absolute text-gray-400 text-sm whitespace-nowrap"
                style={{
                  left: `calc(50% - ${Math.abs(offset)}px)`,
                  transform: 'translateX(-50%)',
                  opacity: Math.min(Math.abs(offset) / 100, 0.8),
                }}
              >
                {getPrevMonth()}
              </div>
            )}

            {/* Current month sliding with finger */}
            <h2
              className="text-lg font-medium text-gray-900 whitespace-nowrap"
              style={{
                transform: `translateX(${offset}px)`,
                opacity: Math.max(0.2, 1 - Math.abs(offset) / 150),
              }}
            >
              {currentMonthText}
            </h2>

            {/* Next month sliding in from right */}
            {offset < -30 && (
              <div
                className="absolute text-gray-400 text-sm whitespace-nowrap"
                style={{
                  left: `calc(50% - ${offset}px)`,
                  transform: 'translateX(-50%)',
                  opacity: Math.min(Math.abs(offset) / 100, 0.8),
                }}
              >
                {getNextMonth()}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onNavigate('next')}
          className="p-2 active:bg-gray-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center z-10"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
