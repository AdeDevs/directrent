import React from 'react';
import { motion } from 'motion/react';
import { 
  Home as HomeIcon, 
  MessageCircleMore, 
  PlusCircle, 
  LayoutDashboard, 
  Bookmark, 
  Bell, 
  UserCircle, 
  HelpCircle, 
  FileText, 
  LogOut, 
  Sun, 
  Moon,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppTab } from '../types';
import InboxBadge from './InboxBadge';
import NotificationBadge from './NotificationBadge';

const DesktopSidebar: React.FC = () => {
  const { 
    user, 
    activeTab, 
    setActiveTab, 
    setCurrentListing, 
    setSelectedAgentId, 
    logout,
    updateProfile 
  } = useAuth();
  
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const isAgent = user.role === 'agent';
  
  // Define our responsive sidebar tabs matching BottomNav and standard pages
  const navItems = isAgent ? [
    { id: 'home', icon: <HomeIcon className="w-5 h-5" />, label: 'Home' },
    { id: 'chat', icon: <MessageCircleMore className="w-5 h-5" />, label: 'Chat', badge: <InboxBadge /> },
    { id: 'create', icon: <PlusCircle className="w-5 h-5" />, label: 'Post Property' },
    { id: 'mylistings', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications', badge: <div className="relative w-4 h-4"><NotificationBadge /></div> },
    { id: 'profile', icon: <UserCircle className="w-5 h-5" />, label: 'Profile' },
  ] : [
    { id: 'home', icon: <HomeIcon className="w-5 h-5" />, label: 'Home' },
    { id: 'favorites', icon: <Bookmark className="w-5 h-5" />, label: 'Saved Properties' },
    { id: 'chat', icon: <MessageCircleMore className="w-5 h-5" />, label: 'Chat', badge: <InboxBadge /> },
    { id: 'notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications', badge: <div className="relative w-4 h-4"><NotificationBadge /></div> },
    { id: 'profile', icon: <UserCircle className="w-5 h-5" />, label: 'Profile' },
  ];

  const handleTabChange = (tabId: string) => {
    setCurrentListing(null);
    setSelectedAgentId(null);
    setActiveTab(tabId as AppTab);
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    if (user) {
      updateProfile({ theme: nextTheme }).catch(err => console.error("Theme sync failed:", err));
    }
  };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-72 h-screen hidden lg:flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 z-50 transition-colors duration-300 select-none">
      
      {/* 1. Header & Brand Logo */}
      <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div 
          onClick={() => handleTabChange('home')}
          className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
            <HomeIcon className="text-white w-4 h-4" />
          </div>
          <span className="text-lg font-display font-black tracking-tight leading-none text-slate-900 dark:text-white">
            Direct<span className="text-primary-600 dark:text-primary-400">Rent</span>
          </span>
        </div>
      </div>

      {/* 2. Navigation Links Grid */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={`sidebar-nav-${item.id}`}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest relative cursor-pointer group transition-all duration-300 ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/15' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-[1.08]'}`}>
                {item.icon}
              </div>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge && (
                <div className={`shrink-0 ${isActive ? 'brightness-125' : ''}`}>
                  {item.badge}
                </div>
              )}
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"
                  transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Footer Workspace Utilities */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-900/80 flex flex-col gap-3">
        
        {/* Theme Toggle - Beautiful Segmented iOS Slider style */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-100 dark:border-slate-900 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span className="pl-2 uppercase tracking-wide text-[10px]">Theme Mode</span>
          <button 
            onClick={handleToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200/40 dark:border-slate-700/50 hover:scale-[1.02] transition-transform"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-primary-400" />
                <span className="text-[9px] font-black uppercase tracking-wider">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-wider">Light</span>
              </>
            )}
          </button>
        </div>

        {/* Logout Quick Button */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-3 border border-red-200/50 dark:border-red-950/20 hover:border-red-200/80 text-red-600 bg-red-50/30 dark:bg-red-950/5 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-98"
        >
          <LogOut className="w-3.5 h-3.5 text-red-600" />
          <span>Logout Account</span>
        </button>
      </div>

    </aside>
  );
};

export default DesktopSidebar;
