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
      
      // CRITICAL: redirectTo MUST match exactly with:
      // 1. The redirect URL configured in Supabase Dashboard (Authentication → URL Configuration)
      // 2. The redirect URL in Google Cloud Console (OAuth 2.0 Client → Authorized redirect URIs)
      // 
      // For Supabase OAuth, the redirect URL should be:
      // - Your app URL (window.location.origin)
      // - Supabase will append the callback to this URL
      // - The 'state' parameter is stored in sessionStorage by Supabase client and validated on return
      const redirectUrl = window.location.origin;
      console.log('🔵 Starting Google OAuth');
      console.log('📍 Redirect URL:', redirectUrl);
      console.log('📍 Current URL:', window.location.href);
      
      // PKCE FLOW EXPLANATION:
      // When signInWithOAuth is called with flowType: 'pkce', Supabase SDK:
      //
      // STEP 1: BEFORE REDIRECT (this function)
      // - Generates a random code_verifier (43-128 character string)
      // - Creates code_challenge = SHA256(code_verifier) encoded as base64url
      // - Generates state parameter (CSRF token)
      // - Stores code_verifier in sessionStorage under key: sb-{project-ref}-auth-code-verifier-{id}
      // - Stores state in sessionStorage under key: sb-{project-ref}-auth-token
      // - Redirects to Google OAuth with code_challenge and state in URL
      //
      // STEP 2: GOOGLE OAUTH
      // - User authenticates with Google
      // - Google redirects back to Supabase callback with authorization code
      //
      // STEP 3: SUPABASE CALLBACK
      // - Supabase receives code from Google
      // - Supabase redirects to your app with code in query: ?code=...
      //
      // STEP 4: YOUR APP CALLBACK (detectSessionInUrl: true)
      // - Supabase SDK detects code in URL automatically
      // - Extracts code_verifier from sessionStorage (stored in STEP 1)
      // - Sends POST to /auth/v1/token with:
      //   * grant_type=pkce
      //   * code (from URL)
      //   * code_verifier (from sessionStorage)
      // - Supabase validates and exchanges for access_token + refresh_token
      // - Sets session and fires SIGNED_IN event
      //
      // IF code_verifier is missing from sessionStorage → "Invalid API key" error
      
      // Debug: Check sessionStorage before OAuth redirect
      console.log('🔍 Checking sessionStorage before OAuth...');
      const storageKeysBefore = Object.keys(sessionStorage);
      console.log('📦 Storage keys before OAuth:', storageKeysBefore.length);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // This redirectTo should be exactly: http://localhost:5173 (for dev)
          // Or your production URL. Supabase will handle adding callback params
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Skip browser redirect for testing (not needed here, but useful to know)
          // skipBrowserRedirect: false,
        }
      });

      if (error) {
        console.error('❌ OAuth initialization error:', error);
        throw error;
      }

      // After signInWithOAuth, Supabase has:
      // - Generated code_verifier
      // - Stored it in sessionStorage
      // - Generated code_challenge
      // - Created OAuth URL with code_challenge
      // - Stored state parameter
      
      // Debug: Verify code_verifier was stored
      setTimeout(() => {
        const storageKeysAfter = Object.keys(sessionStorage);
        const codeVerifierKeys = storageKeysAfter.filter(key => key.includes('code-verifier'));
        console.log('🔍 Code verifier keys after OAuth init:', codeVerifierKeys);
        if (codeVerifierKeys.length > 0) {
          console.log('✅ Code verifier stored successfully - PKCE flow ready');
        } else {
          console.error('❌ Code verifier NOT stored - PKCE will fail on return!');
        }
      }, 100);

      // data.url contains the full OAuth URL with:
      // - code_challenge (derived from code_verifier)
      // - state parameter
      // - redirect_uri pointing to Supabase callback
      console.log('✅ OAuth redirect URL generated:', data?.url ? 'Success' : 'Failed');
      
      if (data?.url) {
        console.log('🔗 Redirecting to Google OAuth...');
        console.log('📝 Code verifier is stored in sessionStorage and will be used on callback');
        // Supabase will automatically redirect to data.url
        // The code_verifier in sessionStorage will be automatically used when code returns
      }
      
      // OAuth redirect will happen automatically via window.location = data.url
      // Don't set loading to false here - we'll be redirected
      // sessionStorage should NOT be cleared during redirect to preserve state
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (error: any) {
      console.error('❌ Auth error:', error);
      setLoading(false);
      let errorMessage = 'Ошибка входа';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Неверные данные для входа';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Подтвердите email адрес';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Слишком много попыток. Попробуйте позже';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Проблема с подключением к интернету';
      } else if (error.message?.includes('state')) {
        errorMessage = 'Ошибка авторизации: потерян параметр состояния. Проверьте настройки браузера (не используйте режим инкогнито).';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      tg?.HapticFeedback?.notificationOccurred('error');
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