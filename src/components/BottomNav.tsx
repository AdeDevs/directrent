import React from 'react';
import { motion } from 'motion/react';
import { Home, MessageSquare, UserCircle } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: <Home className="w-6 h-6" />, label: 'Home' },
    { id: 'chat', icon: <MessageSquare className="w-6 h-6" />, label: 'Chat' },
    { id: 'profile', icon: <UserCircle className="w-6 h-6" />, label: 'Profile' },
  ] as const;

  return (
    <nav className="fixed z-50 transition-all bottom-0 left-0 w-full bg-white/85 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] px-8 pt-3 pb-6 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[360px] md:bg-white/60 md:rounded-[32px] md:border md:border-white/60 md:shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:ring-1 md:ring-slate-900/5 md:px-8 md:py-3.5">
      <div className="flex items-center justify-between max-w-sm mx-auto w-full">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all relative cursor-pointer ${
              activeTab === tab.id ? 'text-primary-600 scale-105' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span className={`text-[9px] font-bold uppercase tracking-widest ${activeTab === tab.id ? 'opacity-100 font-extrabold' : 'opacity-60'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute -bottom-2 w-1.5 h-1.5 bg-primary-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
