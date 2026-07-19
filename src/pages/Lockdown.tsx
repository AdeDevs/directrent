import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowRight, CheckCircle2, Home } from 'lucide-react';
import toast from "react-hot-toast";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

interface LockdownProps {
  onBypass: () => void;
  user?: any;
  onLogout?: () => void;
}

export default function Lockdown({ onBypass, user, onLogout }: LockdownProps) {
  const { t } = useLanguage();
  // Target date: End of August 2026
  const targetTime = new Date("2026-08-31T23:59:59Z").getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: false
  });

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isComplete: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/waitlist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register email');
      }

      setIsSubmitted(true);
      toast.success('Your email has been registered for early access updates!');
    } catch (err: any) {
      console.error('Failed to register email:', err);
      toast.error(err.message || 'Could not submit email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as any }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      {/* Top Header Navigation bar - Fixed without border, glass effect */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!logoFailed ? (
              <img 
                src="/logo-light.png" 
                onError={() => setLogoFailed(true)}
                className="h-9 w-auto object-contain max-w-[150px]"
                alt="DirectRent"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <Home className="text-white w-5 h-5" />
              </div>
            )}
            <span className="text-xl font-display font-black tracking-tight text-slate-900">
              Direct<span className="text-primary-600">Rent</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="relative z-10 flex-grow w-full max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center pt-24 pb-8 text-center">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center"
        >
          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-3xl md:text-5xl font-display font-bold tracking-tight text-slate-900 max-w-2xl leading-tight mb-4"
          >
            {t('lockdown.title')}
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-sm md:text-base text-slate-600 max-w-xl leading-relaxed mb-10 text-center"
            dangerouslySetInnerHTML={{ __html: t('lockdown.desc') }}
          />

          {/* Majestic Countdown Widget - Sharp corners, Light theme */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-4 w-full max-w-lg mb-10 border border-slate-200 bg-white shadow-sm"
          >
            {/* Days block */}
            <div className="flex flex-col items-center justify-center py-6 border-r border-slate-200">
              <span className="text-4xl md:text-5xl font-mono font-medium tracking-tight text-slate-900 mb-1">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">{t('lockdown.days')}</span>
            </div>

            {/* Hours block */}
            <div className="flex flex-col items-center justify-center py-6 border-r border-slate-200">
              <span className="text-4xl md:text-5xl font-mono font-medium tracking-tight text-slate-900 mb-1">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">{t('lockdown.hours')}</span>
            </div>

            {/* Minutes block */}
            <div className="flex flex-col items-center justify-center py-6 border-r border-slate-200">
              <span className="text-4xl md:text-5xl font-mono font-medium tracking-tight text-slate-900 mb-1">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">{t('lockdown.mins')}</span>
            </div>

            {/* Seconds block */}
            <div className="flex flex-col items-center justify-center py-6 bg-slate-50/50">
              <span className="text-4xl md:text-5xl font-mono font-medium tracking-tight text-amber-600 mb-1">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-600/70 font-bold">{t('lockdown.secs')}</span>
            </div>
          </motion.div>

          {/* Email Signup Form or Success Message */}
          <motion.div variants={itemVariants} className="w-full max-w-md mb-8">
            <AnimatePresence mode="wait">
              {!isSubmitted ? (
                <motion.form 
                  key="signup-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleNotifySubmit}
                  className="flex flex-col sm:flex-row shadow-sm"
                >
                  <div className="relative flex-grow">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('lockdown.placeholder')}
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 focus:outline-none focus:border-slate-300 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all font-sans rounded-none"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-[10px] tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 min-w-[130px] rounded-none border border-slate-900"
                  >
                    {isSubmitting ? '...' : t('lockdown.notify')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="success-message"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-left"
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                  <div className="flex-grow">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Registration Complete</p>
                    <p className="text-xs text-emerald-700/80 mt-0.5">We'll alert you with early access invitation keys shortly.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Agent Bypass Action Button */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col items-center gap-2 pt-6 w-full"
          >
            {user ? (
              <>
                <p className="text-xs text-slate-600">
                  {t('lockdown.tenant')} ({user.email})
                </p>
                {onLogout && (
                  <button 
                    onClick={onLogout}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline decoration-rose-600/30 underline-offset-4"
                  >
                    {t('lockdown.disconnect')}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-600">
                {t('lockdown.authorized')}{' '}
                <button 
                  onClick={onBypass}
                  className="font-semibold text-primary-600 hover:text-primary-700 underline decoration-primary-600/30 underline-offset-4 transition-colors"
                >
                  {t('lockdown.loginNow')}
                </button>
              </p>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer Bottom */}
      <footer className="relative z-10 w-full py-6 mt-auto text-center border-t border-slate-200 bg-white/50">
        <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500">
          &copy; {new Date().getFullYear()} DirectRent. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
