import React, { useState } from 'react';
import { LogIn, Chrome, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useTelegram } from '../hooks/useTelegram';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tg } = useTelegram();

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 pt-safe pb-safe">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">SmokyDock</h1>
            <p className="text-gray-600">Учет смен и доходов</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Настройка базы данных</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  Для работы приложения необходимо настроить Supabase.
                </p>
              </div>
              <div className="text-left space-y-3 text-sm text-gray-600">
                <p><strong>1.</strong> Нажмите кнопку "Supabase" в настройках проекта</p>
                <p><strong>2.</strong> Создайте новый проект или подключите существующий</p>
                <p><strong>3.</strong> Настройте Google OAuth в Supabase Dashboard</p>
                <p><strong>4.</strong> Перезагрузите приложение</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) {
        throw error;
      }

      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = 'Ошибка входа';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Неверные данные для входа';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Подтвердите email адрес';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Слишком много попыток. Попробуйте позже';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Проблема с подключением к интернету';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      tg?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 pt-safe pb-safe">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">SmokyDock</h1>
          <p className="text-gray-600">Учет смен и доходов</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Добро пожаловать!</h2>
            <p className="text-gray-500 text-sm">Войдите в свой аккаунт для продолжения</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="text-center">
                <p className="text-red-600 text-sm font-medium mb-2">Ошибка подключения</p>
                <p className="text-red-500 text-xs">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 text-xs text-red-400 hover:text-red-600"
                >
                  Закрыть
                </button>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 p-4 rounded-xl flex items-center justify-center space-x-3 hover:border-gray-300 active:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[56px]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Chrome className="w-5 h-5 text-blue-500" />
            )}
            <span className="font-medium">
              {loading ? 'Вход...' : 'Войти через Google'}
            </span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Для входа необходимо настроить Supabase в настройках проекта
            </p>
          </div>
        </div>

        {/* Version */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            SmokyDock v{import.meta.env.PACKAGE_VERSION || '1.3.0'}
          </p>
        </div>
      </div>
    </div>
  );
}