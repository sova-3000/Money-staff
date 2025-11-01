import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, User } from './lib/supabase';
import { Dashboard } from './components/Dashboard';
import { ShiftForm } from './components/ShiftForm';
import { useTelegram } from './hooks/useTelegram';
import { Shift } from './lib/supabase';

type View = 'dashboard' | 'shift-form';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingShift, setEditingShift] = useState<Shift | undefined>(undefined);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { tg } = useTelegram();

  useEffect(() => {
    // Simple loading delay for single-user mode
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (tg) {
      // Настраиваем цвета интерфейса под Telegram тему
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');

      // Настраиваем кнопку "Назад" для навигации
      const handleBackButton = () => {
        if (currentView === 'shift-form') {
          handleBackToDashboard();
        } else {
          tg.close();
        }
      };

      if (currentView === 'shift-form') {
        tg.BackButton.show();
        tg.BackButton.onClick(handleBackButton);
      } else {
        tg.BackButton.hide();
      }

      // Cleanup function
      return () => {
        tg.BackButton.offClick(handleBackButton);
      };
    }
  }, [tg, currentView]);

  const handleAddShift = (date?: string) => {
    setEditingShift(undefined);
    setInitialDate(date);
    setCurrentView('shift-form');
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setInitialDate(undefined);
    setCurrentView('shift-form');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setEditingShift(undefined);
    setInitialDate(undefined);
  };

  const handleSaveShift = () => {
    setEditingShift(undefined);
    setInitialDate(undefined);
    setCurrentView('dashboard');
  };

  const handleAuthSuccess = () => {
    // Auth state will be handled by the auth listener
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-safe pb-safe">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">SmokyDock</h3>
            <p className="text-sm text-gray-500">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  switch (currentView) {
    case 'dashboard':
      return (
        <Dashboard
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
        />
      );

    case 'shift-form':
      return (
        <ShiftForm
          onBack={handleBackToDashboard}
          onSave={handleSaveShift}
          editingShift={editingShift}
          initialDate={initialDate}
        />
      );

    default:
      return (
        <Dashboard
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
        />
      );
  }
}

export default App;