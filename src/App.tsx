import React from 'react';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AppLayout from './layouts/AppLayout';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { view, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-50 rounded-full animate-pulse" />
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin absolute inset-0 m-auto" />
        </div>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] ml-1">Syncing Identity</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-primary-100 selection:text-primary-900 font-sans">
      {view === 'landing' && <Landing />}
      {view === 'auth' && <Auth />}
      {view === 'app' && <AppLayout />}
    </div>
  );
}
