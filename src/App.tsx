import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useEffect, useState, lazy, Suspense } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Listing } from './types';
import ScrollToTop from './components/ScrollToTop';

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

const AppContent = () => {
  const { view, isLoading } = useAuth();
  const path = window.location.pathname;

  if (isLoading) {
    return <LoadingScreen message="Initializing DirectRent..." />;
  }

  // Priority: If path is listing detail, show it regardless of view state
  if (path.startsWith('/listings/') && path.split('/').length >= 3) {
    return (
      <Suspense fallback={<LoadingScreen message="Loading property..." />}>
        <ListingPreviewHandler />
      </Suspense>
    );
  }

  // Handle views based on AuthContext state
  const ViewComponent = () => {
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
  };

  return (
    <Suspense fallback={<LoadingScreen message="Switching views..." />}>
      <ViewComponent />
    </Suspense>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ScrollToTop />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
