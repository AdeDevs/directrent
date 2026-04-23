import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AppLayout from './layouts/AppLayout';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { view, isLoading } = useAuth();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  }, [view]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center gap-6 transition-colors duration-300">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-50 dark:border-primary-900/20 rounded-full animate-pulse" />
          <Loader2 className="w-6 h-6 text-primary-600 dark:text-primary-400 animate-spin absolute inset-0 m-auto" />
        </div>
        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] ml-1">Syncing Identity</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-primary-100 selection:text-primary-900 font-sans transition-colors duration-300">
      {view === 'landing' && <Landing />}
      {view === 'auth' && <Auth />}
      {view === 'app' && <AppLayout />}
    </div>
  );
}
