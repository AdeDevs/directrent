import React from 'react';
import { motion } from 'motion/react';
import { Home, MessageSquare, UserCircle, Heart } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Home' },
    { id: 'favorites', icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Saved' },
    { id: 'chat', icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Chat' },
    { id: 'profile', icon: <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Profile' },
  ] as const;

  return (
    <nav className="fixed z-50 transition-all bottom-0 left-0 w-full bg-white/90 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-8px_32px_rgba(0,0,0,0.06)] px-4 sm:px-8 pt-3 pb-6 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[480px] md:bg-white/60 md:rounded-[32px] md:border md:border-white/60 md:shadow-[0_8px_32px_rgba(0,0,0,0.08)] md:ring-1 md:ring-slate-900/5 md:px-10 md:py-3.5 overflow-hidden">
      <div className="flex items-center justify-between max-w-md mx-auto w-full">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all relative cursor-pointer min-w-0 flex-1 ${
              activeTab === tab.id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
              {tab.icon}
            </div>
            <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all truncate w-full ${activeTab === tab.id ? 'opacity-100 font-extrabold' : 'opacity-60 font-medium'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute -bottom-2 w-1 h-1 bg-primary-600 rounded-full" 
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
