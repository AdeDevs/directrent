import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Home as HomeIcon, MessageCircleMore, UserCircle, PlusCircle, LayoutDashboard, LogOut, Wallet, Bell, Sun, Moon, Bookmark } from 'lucide-react';
import { AppTab, User } from '../types';
import InboxBadge from './InboxBadge';
import NotificationBadge from './NotificationBadge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface MobileDrawerProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  user: User | null;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ activeTab, setActiveTab, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-mobile-drawer', handleOpen);
    return () => window.removeEventListener('open-mobile-drawer', handleOpen);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    if (user) {
      updateProfile({ theme: nextTheme }).catch(err => console.error("Theme sync failed:", err));
    }
  };

  const isAgent = user?.role === 'agent';
  
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
    { id: 'favorites', icon: <Bookmark className="w-5 h-5" />, label: 'Saved' },
    { id: 'chat', icon: <MessageCircleMore className="w-5 h-5" />, label: 'Chat', badge: <InboxBadge /> },
    { id: 'notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications', badge: <div className="relative w-4 h-4"><NotificationBadge /></div> },
    { id: 'profile', icon: <UserCircle className="w-5 h-5" />, label: 'Profile' }
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm z-[115] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-950 z-[120] lg:hidden flex flex-col shadow-2xl border-r border-slate-200 dark:border-slate-800"
            >
              <div className="px-3 pt-2 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                    <HomeIcon className="text-white w-4 h-4" />
                  </div>
                  <span className="font-display font-black tracking-tight text-slate-900 dark:text-white">
                    Direct<span className="text-primary-600 dark:text-primary-400">Rent</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as AppTab);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 font-bold text-sm tracking-tight group ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className={`transition-transform duration-300 relative ${isActive ? 'scale-110' : 'group-hover:scale-110 group-active:scale-95'}`}>
                        {item.icon}
                        {item.badge && (
                          <div className="absolute top-1 right-1 z-10 flex items-center justify-center">
                            {item.id === 'chat' ? (
                               <InboxBadge className="flex items-center justify-center w-4 h-4 bg-primary-600 text-white text-[8px] font-black rounded-full border border-white dark:border-slate-900 select-none leading-none text-center" />
                            ) : (
                              <NotificationBadge className="flex items-center justify-center w-4 h-4 bg-primary-600 text-white text-[8px] font-black rounded-full border border-white dark:border-slate-900 select-none leading-none text-center" />
                            )}
                          </div>
                        )}
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
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
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-red-200/50 dark:border-red-950/20 hover:border-red-200/80 text-red-600 bg-red-50/30 dark:bg-red-950/5 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-98"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span>Logout Account</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div 
              key="logout-modal-drawer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 pb-safe sm:pb-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mb-4 mx-auto">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Log Out</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Are you sure you want to log out of your account?</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      setIsOpen(false);
                      logout();
                    }}
                    className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default MobileDrawer;
