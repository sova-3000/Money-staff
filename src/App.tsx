import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, User } from './lib/supabase';
import { Dashboard } from './components/Dashboard';
import { ShiftForm } from './components/ShiftForm';
import { AuthScreen } from './components/AuthScreen';
import { useTelegram } from './hooks/useTelegram';
import { Shift } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

type View = 'dashboard' | 'shift-form';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingShift, setEditingShift] = useState<Shift | undefined>(undefined);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { tg } = useTelegram();

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    // Handle OAuth callback first - Supabase should auto-detect it
    // IMPORTANT: Supabase OAuth can return tokens in two ways:
    // 1. Hash fragment: #access_token=... (implicit flow)
    // 2. Query parameter: ?code=... (PKCE code flow)
    // Both need to be handled to preserve the 'state' parameter
    const initializeAuth = async () => {
      try {
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        
        // Check for OAuth callback in URL hash (implicit flow with access_token)
        if (hash && hash.includes('access_token')) {
          console.log('🔐 OAuth callback detected in URL hash (implicit flow)');
          console.log('Hash contains access_token, length:', hash.length);
          
          // Supabase should auto-process the hash, but we wait to ensure it's processed
          // The 'state' parameter should be preserved in sessionStorage by Supabase client
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        // Check for OAuth callback in query params (PKCE code flow)
        else if (code) {
          console.log('🔐 OAuth callback detected in URL query (PKCE code flow)');
          console.log('Code parameter found:', code.substring(0, 20) + '...');
          console.log('📍 Current URL:', window.location.href);
          console.log('📍 Origin:', window.location.origin);
          
          // Debug: Check if code_verifier exists in sessionStorage
          const storageKeys = Object.keys(sessionStorage);
          const codeVerifierKeys = storageKeys.filter(key => key.includes('code-verifier'));
          console.log('🔍 Code verifier keys in sessionStorage:', codeVerifierKeys.length);
          
          // Wait for automatic processing (detectSessionInUrl) first
          // This is the primary method when detectSessionInUrl: true
          console.log('⏳ Waiting for automatic processing (detectSessionInUrl)...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Only try explicit exchange if automatic processing didn't work AND code_verifier exists
          // This is a fallback if detectSessionInUrl somehow failed
          const hasCodeVerifier = codeVerifierKeys.length > 0;
          
          if (hasCodeVerifier) {
            console.log('✅ Code verifier found:', codeVerifierKeys[0]);
            // Check if session was already created by automatic processing
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            
            if (!existingSession) {
              // Only try explicit exchange if no session exists (automatic processing failed)
              console.log('🔄 No session found, attempting explicit code exchange as fallback...');
              try {
                const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                
                if (exchangeError) {
                  console.error('❌ Explicit exchange failed:', exchangeError.message);
                  if (exchangeError.message.includes('redirect_uri')) {
                    console.error('⚠️ Redirect URI mismatch!');
                    console.error('⚠️ Go to: Supabase Dashboard → Authentication → URL Configuration');
                    console.error('⚠️ Add this EXACT URL:', window.location.origin);
                  }
                } else if (exchangeData.session) {
                  console.log('✅ Explicit exchange succeeded! User:', exchangeData.session.user?.email);
                }
              } catch (explicitErr) {
                console.error('❌ Exception during explicit exchange:', explicitErr);
              }
            } else {
              console.log('✅ Session already exists from automatic processing, skipping explicit exchange');
            }
          } else {
            console.log('ℹ️ Code verifier not found - relying on automatic processing only');
            // Wait a bit more for automatic processing to complete
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        // Check for OAuth error in query params
        else if (errorParam) {
          console.error('❌ OAuth error in callback:', errorParam);
          const errorDescription = searchParams.get('error_description') || 'Unknown OAuth error';
          console.error('Error description:', errorDescription);
          
          // Clean up URL
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Get current session (this should work after OAuth redirect)
        // If code was exchanged above, session should be available here
        console.log('📋 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
        }

        if (mounted) {
          if (session) {
            console.log('✅ Session found! User:', session.user?.email);
            console.log('Session expires at:', new Date(session.expires_at! * 1000).toLocaleString());
            setUser(session.user);
            setSession(session);
            setAuthLoading(false);
            setLoading(false);
            
            // Clean up URL parameters ONLY after successful auth
            if (hash || code) {
              console.log('🧹 Cleaning up URL parameters after successful auth');
              window.history.replaceState(null, '', window.location.pathname);
            }
          } else {
            console.log('⚠️ No session found - user needs to log in');
            // If code was present but no session, the exchange failed
            if (code) {
              console.error('❌ Code exchange failed - check the following:');
              console.error('   1. Supabase Dashboard → Authentication → URL Configuration');
              console.error('      Must include redirect URL:', window.location.origin);
              console.error('   2. Check Network tab for 401 error details');
              console.error('   3. Ensure redirect URL matches exactly in all places');
            }
            setUser(null);
            setSession(null);
            setAuthLoading(false);
          }
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes (this should fire SIGNED_IN after OAuth redirect)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user');
      
      if (!mounted) {
        console.log('⚠️ Component unmounted, ignoring auth change');
        return;
      }

      setUser(session?.user ?? null);
      setSession(session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ SIGNED_IN event - User authenticated:', session.user?.email);
        setAuthLoading(false);
        setLoading(false);
        
        // Clean up URL hash
        if (window.location.hash) {
          console.log('🧹 Cleaning URL hash after SIGNED_IN');
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 SIGNED_OUT event - User logged out');
        setAuthLoading(false);
        setLoading(false);
      } else if (event === 'INITIAL_SESSION') {
        console.log('🚀 INITIAL_SESSION event - Session:', session ? 'exists' : 'none');
        setAuthLoading(false);
        if (session) {
          console.log('✅ Initial session found, user:', session.user?.email);
          setLoading(false);
        } else {
          console.log('⚠️ No initial session - showing auth screen');
          setLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('♻️ TOKEN_REFRESHED event - Session refreshed');
        setUser(session.user);
        setSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      // User is authenticated, finish loading
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    } else if (!authLoading && !user) {
      // No user, show auth screen - loading will be handled by auth check
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (tg) {
      // Настраиваем цвета интерфейса под Telegram тему
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
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

  const handleAuthSuccess = async () => {
    // Force refresh session after OAuth redirect
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      setSession(session);
      setAuthLoading(false);
      setLoading(false);
    }
  };

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

  // Show auth screen if Supabase is configured but user is not authenticated
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[var(--tg-theme-bg-color,#ffffff)] to-[var(--tg-theme-secondary-bg-color,#f0f0f0)]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[var(--tg-theme-button-color,#3390ec)] border-t-transparent rounded-full animate-spin"></div>
          <h3 className="text-lg font-semibold text-[var(--tg-theme-text-color,#000000)]">SmokyDock</h3>
          <p className="text-sm text-[var(--tg-theme-hint-color,#999999)]">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  if (!user && isSupabaseConfigured()) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

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