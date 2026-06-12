import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HamburgerButton = () => {
  const { user } = useAuth();
  
  if (user?.role !== 'agent') return null;

  return (
    <button 
      onClick={() => window.dispatchEvent(new Event('open-mobile-drawer'))} 
      className="p-1 -ml-1 mr-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg dark:text-slate-300 transition-colors lg:hidden active:scale-95"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
};

export default HamburgerButton;
