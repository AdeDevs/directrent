import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { useEffect, useState, lazy, Suspense, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Listing } from './types';
import ScrollToTop from './components/ScrollToTop';
import { ShieldAlert, Home } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion } from 'motion/react';

import TermsOfUse from './pages/TermsOfUse';
import ErrorBoundary from './components/ErrorBoundary';

// Direct page imports
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAuth from './pages/admin/AdminAuth';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ListingDetails from './pages/ListingDetails';
import AppLayout from './layouts/AppLayout';
import Lockdown from './pages/Lockdown';

const LoadingScreen = ({ message = "Initializing app..." }) => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
    {/* Background Grid Pattern matching Landing */}
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary-600/5 dark:bg-primary-500/5 rounded-full blur-[120px]" />
    </div>

    <div className="relative z-10 flex flex-col items-center gap-8 max-w-xs text-center px-4">
      {/* Premium Minimal Kinetic Column Wave */}
      <div className="flex items-end justify-center gap-1.5 h-10">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="w-2 rounded-full bg-primary-600 dark:bg-primary-500"
            initial={{ height: 12 }}
            animate={{ 
              height: [12, 36, 12]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15
            }}
          />
        ))}
      </div>

      {/* Brand & Message Signature */}
      <div className="flex flex-col gap-2.5">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center gap-2"
        >
          <span className="text-xl font-display font-bold tracking-tight text-slate-800 dark:text-slate-200">
            Direct<span className="text-primary-600 dark:text-primary-500 font-extrabold">Rent</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400 animate-ping" />
        </motion.div>
        
        {/* Message Label */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-[10px] font-sans font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"
        >
          {message}
        </motion.p>
      </div>
    </div>
  </div>
);

const ListingPreviewHandler = () => {
  const { setCurrentListing, currentListing, view, setView } = useAuth();
  const [err, setErr] = useState(false);
  const pathParts = window.location.pathname.split('/');
  const listingId = pathParts[2];
  const isTargetListingLoaded = currentListing && currentListing.id.toString() === listingId;

  useEffect(() => {
    // If the listing is already in context, just switch to app mode mapped
    if (isTargetListingLoaded) {
      if (view !== 'app') setView('app');
      return;
    }

    let isMounted = true;
    const fetchListing = async () => {
      if (!listingId) return;
      try {
        const docSnap = await getDoc(doc(db, 'listings', listingId));
        if (docSnap.exists() && isMounted) {
          const fetchedListing = { ...docSnap.data(), id: docSnap.id } as Listing;
          setView('app');
          setCurrentListing(fetchedListing);
        } else if (isMounted) {
          setErr(true);
        }
      } catch (e) {
        if (isMounted) setErr(true);
      }
    };
    fetchListing();
    
    return () => { isMounted = false; };
  }, [listingId, isTargetListingLoaded, setView, view, setCurrentListing]);

  if (err) return <Navigate to="/" />;
  
  // Just show the loader. Once `setCurrentListing` fires, `AppContent` evaluates the if-condition and renders `AppLayout` natively.
  return <LoadingScreen message="Fetching property details..." />;
};

const SuspendedScreen = ({ onLogout, userId }: { onLogout: () => void; userId: string }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-rose-500/30 selection:text-white">
      <div className="max-w-md w-full border border-slate-800 bg-slate-950/40 backdrop-blur-md p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-rose-600" />
        
        <div className="w-16 h-16 bg-rose-950/30 border border-rose-800/40 text-rose-500 rounded-none flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold uppercase tracking-widest text-white mb-2 font-sans">
          Access Restriction
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-rose-500 font-mono mb-6">
          Security Policy Enforcement
        </p>

        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Your account has been suspended by a moderator for violating DirectRent's standard of conduct or posting guidelines. This administrative lock restricts all search, creation, and communication capabilities.
        </p>

        <div className="p-4 bg-slate-900 border border-slate-800 text-left rounded-none font-mono text-xs text-slate-500 space-y-1.5 mb-8">
          <div className="flex justify-between">
            <span className="text-slate-600 font-bold uppercase text-[10px]">Enforcement:</span>
            <span className="text-rose-500 font-bold">SUSPENSION</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-bold uppercase text-[10px]">Status:</span>
            <span>GLOBAL ACCESS RESTRICTED</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              window.location.href = `mailto:adeyemiakinyemi01@gmail.com?subject=Account%20Suspension%20Appeal&body=Hello,%0A%0AI would like to appeal my account suspension.%0A%0AAccount ID: ${userId}%0A%0AMy reasoning:%0A[Insert reason here]%0A`;
            }}
            className="w-full py-4 px-6 bg-slate-100 hover:bg-white text-slate-900 text-xs font-bold uppercase tracking-widest transition-all shadow-md focus:ring-2 focus:ring-slate-500 focus:outline-none"
          >
            Appeal Suspension
          </button>
          <button
            onClick={onLogout}
            className="w-full py-4 px-6 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md focus:ring-2 focus:ring-rose-500 focus:outline-none"
          >
            Disconnect Account
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { view, setView, isLoading, user, logout, currentListing, selectedAgentId } = useAuth();
  const path = window.location.pathname;

  // Track if we explicitly bypassed the lockdown screen to access the agent portal
  const [agentPortalActive, setAgentPortalActive] = useState(() => {
    return sessionStorage.getItem('agent_portal_active') === 'true';
  });

  const setAgentPortalActiveWithStorage = (val: boolean) => {
    setAgentPortalActive(val);
    sessionStorage.setItem('agent_portal_active', String(val));
  };

  const isLockdownActive = () => {
    const targetDate = new Date("2026-08-23T06:00:58-07:00").getTime();
    return Date.now() < targetDate;
  };

  const isBypassedUser = user && (user.role === 'agent' || user.role === 'admin' || user.role === 'moderator');
  const lockdownActive = isLockdownActive();

  const shouldShowLockdown = lockdownActive && 
    !isBypassedUser && 
    view !== 'legal' && 
    !(agentPortalActive && (view === 'auth' || view === 'admin-auth'));

  // Track if path is listing detail
  const isListingPath = (path.startsWith('/listings/') || path.startsWith('/property/') || path.startsWith('/properties/')) && path.split('/').length >= 3;

  useEffect(() => {
    if (isListingPath && !user && !isLoading) {
      sessionStorage.setItem('redirect_after_auth', path);
    }
  }, [isListingPath, user, isLoading, path]);

  // Handle views based on AuthContext state
  const ViewComponent = useMemo(() => {
    switch (view) {
      case 'landing':
        return <Landing />;
      case 'auth':
        return <Auth />;
      case 'admin-auth':
        return <AdminAuth />;
      case 'admin':
        return <AdminDashboard />;
      case 'legal':
        return <TermsOfUse />;
      case 'app':
        return <AppLayout />;
      default:
        return <Landing />;
    }
  }, [view]);

  if (isLoading) {
    return <LoadingScreen message="Initializing DirectRent..." />;
  }

  // Intercept access for suspended users
  if (user && (user as any).isSuspended) {
    return <SuspendedScreen onLogout={logout} userId={(user as any).id || "Unknown"} />;
  }

  // Intercept lockdown mode
  if (shouldShowLockdown) {
    return (
      <Suspense fallback={<LoadingScreen message="Loading private portal..." />}>
        <Lockdown 
          user={user}
          onLogout={async () => {
            await logout();
            setAgentPortalActiveWithStorage(false);
          }}
          onBypass={() => {
            setAgentPortalActiveWithStorage(true);
            setView('auth');
          }} 
        />
      </Suspense>
    );
  }

  // Priority: If path is listing detail, show it or prompt to register if not signed in
  // ONLY if not already handled by AppLayout internally (currentListing is not set)
  if (isListingPath && !currentListing && !selectedAgentId) {
    if (!user) {
      return (
        <Suspense fallback={<LoadingScreen message="Prompting account creation..." />}>
          <Auth />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<LoadingScreen message="Loading property..." />}>
        <ListingPreviewHandler />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen message="Switching views..." />}>
        {ViewComponent}
      </Suspense>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <Router>
      
        <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <ScrollToTop />
          <Toaster 
            position="top-right" 
            containerStyle={{ zIndex: 99999, top: 40, right: 40 }}
            toastOptions={{
              duration: 4000,
              className: 'rounded-none border border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-950 !text-slate-900 dark:!text-slate-100 shadow-2xl p-4 text-[11px] font-bold uppercase tracking-widest font-sans',
              style: {
                borderRadius: '0px',
                padding: '14px 18px',
              },
              success: {
                iconTheme: {
                  primary: '#059669', // Emerald 600
                  secondary: '#ffffff',
                },
                className: 'rounded-none border-l-4 border-l-emerald-600 border border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-950 !text-slate-900 dark:!text-slate-50 shadow-2xl font-bold text-[11px] uppercase tracking-widest',
              },
              error: {
                iconTheme: {
                  primary: '#dc2626', // Red 600
                  secondary: '#ffffff',
                },
                className: 'rounded-none border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-950 !text-slate-900 dark:!text-slate-50 shadow-2xl font-bold text-[11px] uppercase tracking-widest',
              },
              loading: {
                className: 'rounded-none border-l-4 border-l-blue-600 border border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-950 !text-slate-900 dark:!text-slate-50 shadow-2xl font-bold text-[11px] uppercase tracking-widest',
              }
            }} 
          />
          <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
      
    </Router>
  );
}

export default App;
