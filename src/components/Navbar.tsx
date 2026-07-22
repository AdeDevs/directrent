import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { theme } = useTheme();
  
  const { setView, setAuthMode, setPreselectedRole } = useAuth();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-[100] flex flex-col gap-2">
      <nav className={`w-full transition-all duration-300 rounded-full ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-sm' 
          : 'bg-white/50 backdrop-blur-md border border-slate-200/50'
      }`}>
        <div className="w-full px-4 md:px-6">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center">
              <div 
                className="flex-shrink-0 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {!logoFailed ? (
                  <img 
                    src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} 
                    onError={() => setLogoFailed(true)}
                    className="h-11 w-auto object-contain max-w-[150px]"
                    alt="DirectRent"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                      <Home className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-display font-black tracking-tight leading-none text-slate-900">
                      Direct<span className="text-primary-600">Rent</span>
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a 
                href="#how-it-works" 
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors duration-300 relative py-1.5 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary-600 after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100"
              >
                How it Works
              </a>
              <a 
                href="#listings" 
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors duration-300 relative py-1.5 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary-600 after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100"
              >
                Spaces
              </a>
              <a 
                href="#faq" 
                className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors duration-300 relative py-1.5 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary-600 after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100"
              >
                FAQs
              </a>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSignIn}
                  className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors duration-300 px-3 py-1.5 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary-600 after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100"
                >
                  Login
                </button>
                <button 
                  onClick={() => { setAuthMode('signup'); setView('auth'); }}
                  className="text-sm font-medium bg-primary-600 text-white px-5 py-2 rounded-full hover:bg-primary-700 hover:shadow-md hover:shadow-primary-500/10 transition-all active:scale-95"
                >
                  Sign Up
                </button>
              </div>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 active:scale-90 transition-all duration-300 text-slate-600">
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            key="mobile-menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden w-full bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-[2rem] overflow-hidden"
          >
            <div className="p-4 flex flex-col space-y-2">
              <a 
                href="#how-it-works" 
                onClick={() => setIsOpen(false)}
                className="block text-base font-semibold text-slate-800 tracking-tight p-4 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                How it Works
              </a>
              <a 
                href="#listings" 
                onClick={() => setIsOpen(false)}
                className="block text-base font-semibold text-slate-800 tracking-tight p-4 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Spaces
              </a>
              <a 
                href="#faq" 
                onClick={() => setIsOpen(false)}
                className="block text-base font-semibold text-slate-800 tracking-tight p-4 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                FAQs
              </a>
              <div className="pt-2 flex flex-col gap-3 px-2">
                <button 
                  onClick={() => { setIsOpen(false); handleSignIn(); }} 
                  className="w-full text-slate-800 border border-slate-200 bg-white px-4 py-3.5 rounded-full font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setIsOpen(false); setAuthMode('signup'); setView('auth'); }} 
                  className="w-full bg-primary-600 text-white px-4 py-3.5 rounded-full font-semibold text-sm shadow-md shadow-primary-500/25 hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
