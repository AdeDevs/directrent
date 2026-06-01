import React from 'react';

export const GoogleMapsGuard: React.FC<{ children: React.ReactNode }> = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full w-full p-8 text-center bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      {/* Dynamic Glow Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Subtle Glowing Radial Gradient Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center max-w-md">
        {/* Elegant "NEEDS FUNDING" Badge */}
        <div className="mb-6 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Needs Funding
        </div>

        {/* System Icon */}
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center mb-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <svg className="w-8 h-8 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          Interactive Maps Suspended
        </h2>

        {/* Description */}
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
          Google Maps Platform API services for DirectRent have been temporarily paused due to a lack of an active GCP billing account.
        </p>

        {/* Helper Action Suggestions */}
        <div className="text-left w-full space-y-3 bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Platform Continuity Guide:</h4>
          
          <div className="flex gap-2.5 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Browse safe listings seamlessly using the primary Grid list view.
            </p>
          </div>
          
          <div className="flex gap-2.5 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Direct live chats, agent KYC, and AI audit panels remain fully online.
            </p>
          </div>

          <div className="flex gap-2.5 items-start">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Book real viewings or view landmark text on the listing page.
            </p>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase font-medium">
          DIRECTRENT CORE OPERATIONS ACTIVE
        </p>
      </div>
    </div>
  );
};
