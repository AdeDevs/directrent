import { BrowserRouter as Router, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAuth from './pages/admin/AdminAuth';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ListingDetails from './pages/ListingDetails';
import AppLayout from './layouts/AppLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Listing } from './types';
import ScrollToTop from './components/ScrollToTop';

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
  if (!listing) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">Fetching data...</p>
    </div>
  );

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
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">Initializing app...</p>
      </div>
    );
  }

  // Priority: If path is listing detail, show it regardless of view state
  if (path.startsWith('/listings/') && path.split('/').length >= 3) {
    return <ListingPreviewHandler />;
  }

  // Handle views based on AuthContext state
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
