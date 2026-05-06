import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export const GoogleMapsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Google Maps API Key Required</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mb-8">
          To enable real maps and location features, you need to add your Google Maps Platform API key to the project secrets.
        </p>
        
        <div className="space-y-4 text-left w-full max-w-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">1</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Get an API key from the <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener noreferrer" className="text-primary-600 font-bold hover:underline">Google Cloud Console</a>
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">2</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Open <b>Settings</b> (⚙️ gear icon) &rarr; <b>Secrets</b>
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">3</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> with your key value
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-xs text-slate-400 dark:text-slate-500 italic">
          The app will rebuild automatically after you save the secret.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly" solutionChannel="gmp_mcp_codeassist_v1_aistudio">
      {children}
    </APIProvider>
  );
};
