import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setView, setAuthMode, setPreselectedRole } = useAuth();
  
  const handleSignIn = () => {
    setAuthMode('login');
    setView('auth');
  };

  const handleListProperty = () => {
    setAuthMode('signup');
    setPreselectedRole('agent');
    setView('auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="w-full px-2">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <Home className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none">
                Direct<span className="text-primary-600 dark:text-primary-400">Rent</span>
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#listings" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Browse</a>
            <button 
              onClick={handleListProperty}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              List Property
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSignIn}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-3 py-2"
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthMode('signup'); setView('auth'); }}
                className="text-sm font-medium bg-primary-600 text-white px-5 py-2 rounded-xl hover:bg-primary-700 shadow-md transition-all shadow-primary-200 dark:shadow-none active:scale-95"
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 dark:text-slate-400 p-2 active:scale-90 transition-transform">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col space-y-4 shadow-inner shadow-slate-100/50 dark:shadow-none">
              <a 
                href="#listings" 
                onClick={() => setIsOpen(false)}
                className="block text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Browse
              </a>
              <button 
                onClick={() => { setIsOpen(false); handleListProperty(); }}
                className="block w-full text-left font-semibold text-slate-800 dark:text-slate-200 tracking-tight p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                List Property
              </button>
              <div className="pt-2 flex flex-col gap-3">
                <button 
                  onClick={() => { setIsOpen(false); handleSignIn(); }} 
                  className="w-full text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setIsOpen(false); setAuthMode('signup'); setView('auth'); }} 
                  className="w-full bg-primary-600 text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-md shadow-primary-500/20 dark:shadow-none hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
