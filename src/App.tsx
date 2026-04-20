import React from 'react';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AppLayout from './layouts/AppLayout';

export default function App() {
  const { view } = useAuth();
  return (
    <div className="min-h-screen selection:bg-primary-100 selection:text-primary-900 font-sans">
      {view === 'landing' && <Landing />}
      {view === 'auth' && <Auth />}
      {view === 'app' && <AppLayout />}
    </div>
  );
}
