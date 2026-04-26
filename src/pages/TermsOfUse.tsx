import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, FileText, Shield, Gavel, Eye, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TermsOfUse = () => {
  const { setActiveTab } = useAuth();

  const sections = [
    {
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      title: "User Conduct",
      content: "All users must provide accurate information. Fraudulent listings, identity theft, or harassment of other users will result in immediate permanent ban."
    },
    {
      icon: <Gavel className="w-5 h-5 text-emerald-500" />,
      title: "Listing Accuracy",
      content: "Property owners and agents are responsible for the accuracy of their listings. Misleading prices or images are strictly prohibited."
    },
    {
      icon: <Eye className="w-5 h-5 text-amber-500" />,
      title: "Privacy & Data",
      content: "We protect your data. Phone numbers and NINs are used strictly for verification. We do not sell your personal information to third parties."
    },
    {
      icon: <Bell className="w-5 h-5 text-rose-500" />,
      title: "Safety Disclaimer",
      content: "DirectRent is a platform connecting users. We strongly advise meeting in public places and never sending money before physical property inspection."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="w-full px-4 h-16 flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('profile')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Terms of Use</h1>
        </div>
      </header>

      <main className="w-full px-4 py-8">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600 dark:text-primary-400 shadow-inner">
            <FileText className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">
            Please read our guidelines carefully to ensure a safe experience for everyone.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                  {section.icon}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white tracking-tight">{section.title}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium pl-1">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-primary-600 rounded-3xl text-white shadow-xl shadow-primary-500/20 text-center">
          <h3 className="text-lg font-black tracking-tight mb-2">Need Help?</h3>
          <p className="text-white/80 text-xs font-medium mb-4">Our support team is available 24/7 for safety concerns.</p>
          <button className="w-full bg-white text-primary-600 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all">
            Contact Support
          </button>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">
          Last Updated: April 2026
        </p>
      </main>
    </div>
  );
};

export default TermsOfUse;
