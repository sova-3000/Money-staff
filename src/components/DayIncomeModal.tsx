import React from 'react';
import { X, Edit, Trash2, Plus } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

interface DayIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  incomes: any[];
  onEdit: (income: any) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

export function DayIncomeModal({ 
  isOpen, 
  onClose, 
  date, 
  incomes, 
  onEdit, 
  onDelete,
  onAdd 
}: DayIncomeModalProps) {
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalAmount = incomes.reduce((sum, income) => sum + Number(income.amount), 0);

  const handleEdit = (income: any) => {
    tg?.HapticFeedback.impactOccurred('light');
    onEdit(income);
  };

  const handleDelete = (id: number) => {
    if (confirm('Удалить эту запись о доходе?')) {
      tg?.HapticFeedback.notificationOccurred('success');
      onDelete(id);
    }
  };

  const handleAdd = () => {
    tg?.HapticFeedback.impactOccurred('light');
    onAdd();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-0">
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 pt-safe">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {formatDate(date)}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Доходы за день: {totalAmount.toLocaleString()}₽
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 pb-safe">
          {incomes.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-sm sm:text-base text-gray-500 mb-4">Нет доходов за этот день</p>
              <button
                onClick={handleAdd}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl active:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto min-h-[44px]"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Добавить доход</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {incomes.map((income) => (
                <div key={income.id} className="bg-gray-50 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">
                      {Number(income.amount).toLocaleString()}₽
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(income)}
                        className="p-2 sm:p-3 active:bg-white rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="p-2 sm:p-3 active:bg-white rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                  
                  {income.source && (
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1 sm:mb-2">
                      {income.source}
                    </p>
                  )}
                  
                  {income.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      {income.description}
                    </p>
                  )}
                  
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatTime(income.date)}
                  </p>
                </div>
              ))}
              
              <button
                onClick={handleAdd}
                className="w-full bg-blue-600 text-white p-4 rounded-xl active:bg-blue-700 transition-colors flex items-center justify-center space-x-2 mt-4 min-h-[52px]"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Добавить еще</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}