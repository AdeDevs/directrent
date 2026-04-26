import React from 'react';
import { motion } from 'motion/react';
import { Home, MessageCircleMore, UserCircle, Bookmark, PlusCircle, LayoutDashboard } from 'lucide-react';
import { AppTab, User } from '../types';

import InboxBadge from './InboxBadge';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  user: User | null;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, user }) => {
  const isAgent = user?.role === 'agent';

  const tabs = isAgent ? [
    { id: 'home', icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Home' },
    { id: 'chat', icon: <MessageCircleMore className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Chat' },
    { id: 'create', icon: <PlusCircle className="w-7 h-7 sm:w-8 sm:h-8" />, label: 'Post' },
    { id: 'mylistings', icon: <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Dashboard' },
    { id: 'profile', icon: <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Profile' },
  ] : [
    { id: 'home', icon: <Home className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Home' },
    { id: 'favorites', icon: <Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Saved' },
    { id: 'chat', icon: <MessageCircleMore className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Chat' },
    { id: 'profile', icon: <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" />, label: 'Profile' },
  ];

  return (
    <nav className="fixed z-50 transition-all bottom-0 left-0 w-full bg-white/95 dark:bg-slate-950/98 backdrop-blur-3xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] dark:shadow-black/40 px-1 pt-2.5 pb-5 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[520px] md:bg-white/80 dark:md:bg-slate-900/90 md:rounded-[32px] md:border md:border-white/20 dark:md:border-white/10 md:shadow-[0_8px_32px_rgba(0,0,0,0.12)] md:ring-1 md:ring-slate-900/5 dark:md:ring-white/10 md:px-10 md:py-3 overflow-hidden">
      <div className="flex items-center justify-between max-w-lg mx-auto w-full px-1">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AppTab)}
            className={`flex flex-col items-center gap-0.5 transition-all relative cursor-pointer min-w-0 flex-1 ${
              activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <div className={`transition-transform duration-300 relative ${activeTab === tab.id ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
              {tab.id === 'create' && isAgent ? (
                <div className="p-1 rounded-full bg-primary-600/10 dark:bg-primary-400/10">
                   <PlusCircle className={`w-7 h-7 sm:w-8 sm:h-8 ${activeTab === 'create' ? 'text-primary-600 dark:text-primary-400' : 'text-primary-500/60'}`} />
                </div>
              ) : tab.icon}
              {tab.id === 'chat' && <InboxBadge />}
            </div>
            <span className={`text-[7px] sm:text-[9px] font-bold uppercase tracking-widest transition-all truncate w-full ${activeTab === tab.id ? 'opacity-100 font-black' : 'opacity-60 dark:opacity-50 font-semibold'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && tab.id !== 'create' && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute -bottom-2 w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full" 
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
