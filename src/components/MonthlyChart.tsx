import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';

interface MonthlyChartProps {
  data: Array<{
    month: string;
    revenue: number;
    tips: number;
  }>;
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">График за 3 месяца</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Недостаточно данных для отображения графика</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxTips = Math.max(...data.map(d => d.tips));

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-base font-medium text-gray-900 mb-4">График за 3 месяца</h3>
      
      {/* Revenue Chart */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Выручка</span>
        </div>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-12 text-xs text-gray-500 text-right">
                {item.month}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                  style={{ width: maxRevenue > 0 ? `${(item.revenue / maxRevenue) * 100}%` : '0%' }}
                >
                  {item.revenue > 0 && (
                    <span className="text-xs font-medium text-white leading-none">
                      {item.revenue > 999 ? `${Math.round(item.revenue/1000)}к` : item.revenue}₽
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Chart */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-gray-700">Чаевые</span>
        </div>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-12 text-xs text-gray-500 text-right">
                {item.month}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                  style={{ width: maxTips > 0 ? `${(item.tips / maxTips) * 100}%` : '0%' }}
                >
                  {item.tips > 0 && (
                    <span className="text-xs font-medium text-white leading-none">
                      {item.tips > 999 ? `${Math.round(item.tips/1000)}к` : item.tips}₽
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}