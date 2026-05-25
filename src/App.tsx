import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useEffect, useState, lazy, Suspense, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Listing } from './types';
import ScrollToTop from './components/ScrollToTop';
import { ShieldAlert } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Lazy load components for code splitting
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAuth = lazy(() => import('./pages/admin/AdminAuth'));
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const ListingDetails = lazy(() => import('./pages/ListingDetails'));
const AppLayout = lazy(() => import('./layouts/AppLayout'));

const LoadingScreen = ({ message = "Initializing app..." }) => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors gap-4">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-900 rounded-full" />
      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
    </div>
    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">{message}</p>
  </div>
);

const ListingPreviewHandler = () => {
  const [listing, setListing] = useState<Listing | null>(null);
  const [err, setErr] = useState(false);
  const pathParts = window.location.pathname.split('/');
  const listingId = pathParts[2];

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;
      try {
        const docSnap = await getDoc(doc(db, 'listings', listingId));
        if (docSnap.exists()) {
          setListing({ ...docSnap.data(), id: docSnap.id } as Listing);
        } else {
          setErr(true);
        }
      } catch (e) {
        setErr(true);
      }
    };
    fetchListing();
  }, [listingId]);

  if (err) return <Navigate to="/" />;
  if (!listing) return <LoadingScreen message="Fetching listing details..." />;

  return (
    <ListingDetails 
      listing={listing} 
      onBack={() => {
        window.location.href = '/';
      }} 
    />
  );
};

const SuspendedScreen = ({ onLogout }: { onLogout: () => void }) => {
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

        <button
          onClick={onLogout}
          className="w-full py-4 px-6 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md focus:ring-2 focus:ring-rose-500 focus:outline-none"
        >
          Disconnect Account
        </button>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { view, isLoading, user, logout } = useAuth();
  const path = window.location.pathname;

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
    return <SuspendedScreen onLogout={logout} />;
  }

  // Priority: If path is listing detail, show it regardless of view state
  if (path.startsWith('/listings/') && path.split('/').length >= 3) {
    return (
      <Suspense fallback={<LoadingScreen message="Loading property..." />}>
        <ListingPreviewHandler />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen message="Switching views..." />}>
      {ViewComponent}
    </Suspense>
  );
};

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
