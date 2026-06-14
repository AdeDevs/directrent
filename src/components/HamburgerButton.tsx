import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HamburgerButtonProps {
  className?: string;
}

const HamburgerButton: React.FC<HamburgerButtonProps> = ({ className }) => {
  const { user } = useAuth();
  
  if (user?.role !== 'agent') return null;
  
  return (
    <button 
      onClick={() => window.dispatchEvent(new Event('open-mobile-drawer'))} 
      className={className || "p-2 flex items-center justify-center text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full dark:text-slate-300 transition-colors lg:hidden active:scale-95 border border-transparent"}
    >
      <Menu className="w-6 h-6" />
    </button>
  );
};

export default HamburgerButton;
