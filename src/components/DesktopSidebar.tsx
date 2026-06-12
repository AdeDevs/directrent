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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppTab } from '../types';
import InboxBadge from './InboxBadge';
import NotificationBadge from './NotificationBadge';

interface DesktopSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
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
    { id: 'wallet', icon: <Wallet className="w-5 h-5" />, label: 'Wallet & Earnings' },
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
    <aside className={`fixed top-16 left-0 bottom-0 ${isCollapsed ? 'w-20' : 'w-72'} h-[calc(100vh-4rem)] hidden lg:flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 z-40 transition-all duration-300 select-none`}>
      
      {/* 2. Navigation Links Grid */}
      <nav className="flex-1 min-h-0 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:display-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          if (!isCollapsed) {
            return (
              <button
                key={`sidebar-nav-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                title={item.label}
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
                  <div className={`shrink-0 flex items-center justify-center ${isActive ? 'brightness-125' : ''}`}>
                    {item.id === 'chat' ? (
                      <InboxBadge className="flex items-center justify-center w-5 h-5 bg-primary-600 text-white text-[9px] font-black rounded-full select-none leading-none border border-transparent align-middle text-center" />
                    ) : (
                      <NotificationBadge className="flex items-center justify-center w-5 h-5 bg-primary-600 text-white text-[9px] font-black rounded-full select-none leading-none border border-transparent align-middle text-center" />
                    )}
                  </div>
                )}
              </button>
            );
          } else {
            return (
              <button
                key={`sidebar-nav-${item.id}`}
                onClick={() => handleTabChange(item.id)}
                title={item.label}
                className={`w-12 h-12 mx-auto flex items-center justify-center rounded-xl text-xs relative cursor-pointer group transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/15' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-[1.08]'}`}>
                  {item.icon}
                </div>
                {item.badge && (
                  <div className="absolute top-1 right-1 z-10 flex items-center justify-center">
                    {item.id === 'chat' ? (
                       <InboxBadge className="flex items-center justify-center w-4 h-4 bg-primary-600 text-white text-[8px] font-black rounded-full border border-white dark:border-slate-900 select-none leading-none text-center" />
                    ) : (
                      <NotificationBadge className="flex items-center justify-center w-4 h-4 bg-primary-600 text-white text-[8px] font-black rounded-full border border-white dark:border-slate-900 select-none leading-none text-center" />
                    )}
                  </div>
                )}
              </button>
            );
          }
        })}
      </nav>

      {/* 4. Footer Workspace Utilities */}
      <div className="p-4 border-t border-slate-150 dark:border-slate-900 flex flex-col gap-3">
        {!isCollapsed ? (
          <>
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
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleToggleTheme}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              className="w-11 h-11 mx-auto bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 transition-all active:scale-95 relative group cursor-pointer"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-primary-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
            <button
              onClick={() => logout()}
              title="Logout"
              className="w-11 h-11 mx-auto flex items-center justify-center text-red-600 bg-red-50/30 hover:bg-red-50 dark:bg-red-950/5 dark:hover:bg-red-950/15 border border-red-200/50 dark:border-red-950/20 hover:border-red-200/80 rounded-xl transition-all active:scale-95 relative group cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      </div>

    </aside>
  );
};

export default DesktopSidebar;
