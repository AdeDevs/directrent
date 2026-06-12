import React from 'react';
import { ChevronLeft, Gavel } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LegalTermsDoc, PrivacyPolicyDoc } from '../components/LegalDocs';

const TermsOfUse = () => {
  const { user, setActiveTab, setView } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-850">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button 
            onClick={() => {
              if (user) {
                setView('app');
                setActiveTab('profile');
              } else {
                setView('landing');
              }
            }}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Legal Documentation</h1>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <Gavel className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Terms & Privacy Policy</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Please review our platform guidelines to understand how we protect your data and facilitate safe rentals.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Terms of Use</h3>
          <LegalTermsDoc />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Privacy Policy</h3>
          <PrivacyPolicyDoc />
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            For urgent legal or compliance inquiries, please contact our support team.
          </p>
          <a 
            href="mailto:compliance@directrent.org"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-semibold text-sm rounded-xl"
          >
            Email Compliance Team
          </a>
        </div>

        <p className="mt-12 text-center text-[10px] text-slate-400 dark:text-slate-600 font-medium tracking-widest uppercase">
          Revisions updated June 2026
        </p>
      </main>
    </div>
  );
};

export default TermsOfUse;
