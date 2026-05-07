import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, Bookmark, MapPin, BadgeCheck, Star, 
  ShieldCheck, Share2, MessageCircleMore, LayoutGrid, Droplets,
  Navigation, ExternalLink, BarChart3, Eye, Calendar, TrendingUp,
  Settings, Trash2, Edit3, Video, Flag, AlertTriangle, X, CheckSquare,
  Zap, Clock, Bed, Bath, Maximize
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import ChatModal from '../components/ChatModal';
import { FEATURED_LISTINGS } from '../data';
import { useAuth } from '../context/AuthContext';
import { addDoc, collection, serverTimestamp, query, where, getCountFromServer, doc } from 'firebase/firestore';
import { purgeListingData } from '../utils/adminCleanup';
import { toast } from 'react-hot-toast';
import { GoogleMapsGuard } from '../components/GoogleMapsGuard';
import { useMap, useMapsLibrary, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

import SafeImage from '../components/SafeImage';

interface ListingDetailsProps {
  listing: Listing;
  onBack: () => void;
}

const ReportModal = ({ isOpen, onClose, listingId, userId }: { isOpen: boolean, onClose: () => void, listingId: string | number, userId: string }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reasons = ['Fraud / Scam', 'Fake Photos', 'Incorrect Price', 'Already Rented', 'Other'];

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        listingId,
        reporterId: userId,
        reason,
        description,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800"
      >
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Report Received</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Thank you for helping keep DirectRent safe. Our admins will review this listing.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl flex items-center justify-center">
                  <Flag className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Report Listing</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Reason</label>
                <div className="grid grid-cols-1 gap-2">
                  {reasons.map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full p-3 rounded-xl text-left text-sm font-bold transition-all border-2 ${reason === r ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why this listing is suspicious..."
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent p-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 transition-all resize-none h-24"
                />
              </div>

              <button
                disabled={!reason || isSubmitting}
                onClick={handleSubmit}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const ScheduleTourModal = ({ isOpen, onClose, listing, userId }: { isOpen: boolean, onClose: () => void, listing: Listing, userId: string }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'tours'), {
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.image,
        agentId: listing.agent?.id,
        tenantId: userId,
        date,
        time,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tours');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800"
      >
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Tour Requested!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">The agent will be notified of your request. Check your chats for confirmation.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Schedule Tour</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Available Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent p-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Preferred Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent p-4 rounded-2xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/20 transition-all font-mono"
                />
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-[11px] font-bold leading-relaxed">Safety Tip: Never pay a tour fee before arrival.</p>
              </div>

              <button
                disabled={!date || !time || isSubmitting}
                onClick={handleSubmit}
                className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary-500/20 hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Requesting...' : 'Confirm Request'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const DirectionsDisplay = ({ origin, destination }: { origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;
    
    routesLib.Route.computeRoutes({
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      travelMode: google.maps.TravelMode.DRIVING,
    } as any).then(({ routes }: any) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => p.setMap(map));
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) map.fitBounds(routes[0].viewport);
      }
    });

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, origin, destination]);

  return null;
};

const DirectionsModal = ({ isOpen, onClose, destination }: { isOpen: boolean, onClose: () => void, destination: { lat: number, lng: number } }) => {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
        },
        () => {
          // Fallback to a default location (e.g., Lagos center) if denied
          setUserLocation({ lat: 6.5244, lng: 3.3792 });
          setIsLocating(false);
          toast.error("Location access denied. Showing directions from Lagos center.");
        }
      );
    } else {
      setIsLocating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl h-[80vh] bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800 flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Get Directions</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">To Listing Location</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 relative">
          <GoogleMapsGuard>
            {isLocating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
                <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Pinpointing your location...</p>
              </div>
            ) : userLocation && (
              <GoogleMap
                defaultCenter={destination}
                defaultZoom={13}
                mapId="DIRECTIONS_MAP"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                <DirectionsDisplay origin={userLocation} destination={destination} />
                <AdvancedMarker position={destination}>
                  <Pin background="#4f46e5" glyphColor="#fff" />
                </AdvancedMarker>
                <AdvancedMarker position={userLocation}>
                  <Pin background="#10b981" glyphColor="#fff" />
                </AdvancedMarker>
              </GoogleMap>
            )}
          </GoogleMapsGuard>
        </div>
      </motion.div>
    </div>
  );
};

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing, onBack }) => {
  const { setCurrentListing, user, setView, setAuthMode, setSelectedAgentId, favorites, toggleFavorite, setActiveTab } = useAuth();
  const [activeMedia, setActiveMedia] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [realStats, setRealStats] = useState({ 
    views: listing.viewCount || 0, 
    inquiries: listing.inquiryCount || 0, 
    saves: listing.favoritesCount || 0,
    trends: {
      views: '0%',
      inquiries: '0%',
      saves: '0%',
      interaction: '0%'
    }
  });

  // Keep stats in sync with listing object if it updates (e.g. real-time)
  useEffect(() => {
    setRealStats(prev => ({
      ...prev,
      views: Math.max(prev.views, listing.viewCount || 0),
      inquiries: Math.max(prev.inquiries, listing.inquiryCount || 0),
      saves: Math.max(prev.saves, listing.favoritesCount || 0)
    }));
  }, [listing.viewCount, listing.inquiryCount, listing.favoritesCount]);

  const isFavorite = favorites.includes(listing.id);
  const isAgent = user?.role === 'agent';
  const isAdminUser = user?.role === 'admin' || user?.role === 'moderator' || user?.email?.toLowerCase() === 'adeyemiakinyemi01@gmail.com';
  const isOwnListing = (isAgent && listing.agent?.id === user?.id);
  const isAdmin = isAdminUser;
  const canManageListing = isOwnListing || isAdmin;
  
  // Track View on Mount
  useEffect(() => {
    const recordView = async () => {
      // Don't count view if it's the specific agent's listing 
      // Admins should count as views for testing unless they are also the listed agent
      if (isOwnListing) return;

      // Use a session storage key to prevent over-counting in same session
      const sessionKey = `viewed_${listing.id}`;
      if (sessionStorage.getItem(sessionKey)) return;

      // Mark as viewed immediately to prevent double-firing during auth transitions
      sessionStorage.setItem(sessionKey, 'true');

      try {
        const { setDoc, doc, increment } = await import('firebase/firestore');
        const listingIdStr = listing.id.toString();
        const listingRef = doc(db, 'listings', listingIdStr);
        
        // Atomically increment the view count on the main listing document
        await setDoc(listingRef, {
          viewCount: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => {
          console.warn("Failed to record viewCount:", err);
          // Only clear if it failed due to some transient error, 
          // but usually it's safer to leave as true to avoid spamming
        });

        // Simplified analytics record for history
        if (listing.agent?.id) {
          await addDoc(collection(db, 'analytics'), {
            listingId: listingIdStr,
            type: 'view',
            userId: user?.id || null,
            agentId: listing.agent.id,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Error recording view:", error);
      }
    };

    recordView();
  }, [listing.id, isOwnListing]); 

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user || !canManageListing) return;

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        const getStatsInRange = async (type: string, start: Date, end: Date) => {
          const q = query(
            collection(db, 'analytics'), 
            where('listingId', '==', listing.id.toString()),
            where('agentId', '==', listing.agent.id),
            where('type', '==', type),
            where('createdAt', '>=', start),
            where('createdAt', '<', end)
          );
          const snap = await getCountFromServer(q);
          return snap.data().count;
        };

        const calculateTrend = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? '+100%' : '0%';
          const diff = ((current - previous) / previous) * 100;
          return `${diff >= 0 ? '+' : ''}${Math.round(diff)}%`;
        };

        // Parallel fetch for current and previous periods
        const [
          currViews, prevViews,
          currInq, prevInq,
          currSaves, prevSaves
        ] = await Promise.all([
          getStatsInRange('view', thirtyDaysAgo, now),
          getStatsInRange('view', sixtyDaysAgo, thirtyDaysAgo),
          getStatsInRange('inquiry', thirtyDaysAgo, now),
          getStatsInRange('inquiry', sixtyDaysAgo, thirtyDaysAgo),
          getStatsInRange('save', thirtyDaysAgo, now),
          getStatsInRange('save', sixtyDaysAgo, thirtyDaysAgo)
        ]);

        const totalViewsQuery = query(
          collection(db, 'analytics'), 
          where('listingId', '==', listing.id.toString()),
          where('agentId', '==', listing.agent.id),
          where('type', '==', 'view')
        );
        const totalViewsCount = await getCountFromServer(totalViewsQuery);

        const totalInqQuery = query(
          collection(db, 'analytics'), 
          where('listingId', '==', listing.id.toString()),
          where('agentId', '==', listing.agent.id),
          where('type', '==', 'inquiry')
        );
        const totalInqCount = await getCountFromServer(totalInqQuery);

        const totalSavesQuery = query(
          collection(db, 'analytics'), 
          where('listingId', '==', listing.id.toString()),
          where('agentId', '==', listing.agent.id),
          where('type', '==', 'save')
        );
        const totalSavesCount = await getCountFromServer(totalSavesQuery);
        
        const totalViews = Math.max(totalViewsCount.data().count, listing.viewCount || 0);
        const totalInq = Math.max(totalInqCount.data().count, listing.inquiryCount || 0);
        const totalSaves = Math.max(totalSavesCount.data().count, listing.favoritesCount || 0);

        const currRate = currViews > 0 ? (currInq + currSaves) / currViews : 0;
        const prevRate = prevViews > 0 ? (prevInq + prevSaves) / prevViews : 0;

        setRealStats({
          views: totalViews,
          inquiries: totalInq,
          saves: totalSaves,
          trends: {
            views: calculateTrend(currViews, prevViews),
            inquiries: calculateTrend(currInq, prevInq),
            saves: calculateTrend(currSaves, prevSaves),
            interaction: calculateTrend(currRate * 100, prevRate * 100)
          }
        });
      } catch (error) {
        console.warn("Real stats partially unavailable - permissions", error);
      }
    };

    fetchStats();
  }, [listing.id, user, isOwnListing, isAdmin]);
  
  // Recommended listings (exclude current, pick 3)
  const recommended = FEATURED_LISTINGS.filter(l => l.id !== listing.id).slice(0, 3);
  
  // Scroll to top when a new listing is selected
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [listing.id]);

  const handleMessageClick = async () => {
    if (isAgent) return; // Prevent agent-to-agent messaging
    if (!user) {
      setAuthMode('login');
      setView('auth');
      return;
    }

    // Record intent to message (Analytics only, count happens on first message)
    try {
      await addDoc(collection(db, 'analytics'), {
        listingId: listing.id.toString(),
        type: 'intent_message',
        userId: user.id,
        agentId: listing.agent?.id || null,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to record intent analytic");
    }

    setIsChatOpen(true);
  };

  const handleReportClick = () => {
    if (!user) {
      setAuthMode('login');
      setView('auth');
      return;
    }
    setShowReportModal(true);
  };

  const handleTourClick = () => {
    if (!user) {
      setAuthMode('login');
      setView('auth');
      return;
    }
    setShowTourModal(true);
  };

  const toggleFavoriteWithAnalytics = async (listingId: string) => {
    if (!user) {
      setAuthMode('login');
      setView('auth');
      return;
    }

    try {
      await toggleFavorite(listingId, listing.agent?.id);
    } catch (e) {
      console.error("Error toggling favorite with analytics:", e);
    }
  };

  const handleTourRequest = async (data: { date: string; time: string }) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'tours'), {
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.image,
        agentId: listing.agent.id,
        tenantId: user.id,
        date: data.date,
        time: data.time,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Record inquiry analytics
      const { setDoc, doc, increment, serverTimestamp: fsServerTimestamp } = await import('firebase/firestore');
      const listingIdStr = listing.id.toString();
      const listingRef = doc(db, 'listings', listingIdStr);
      
      await setDoc(listingRef, {
        inquiryCount: increment(1),
        updatedAt: fsServerTimestamp()
      }, { merge: true }).catch(err => console.warn("Failed to increment inquiryCount:", err));

      await addDoc(collection(db, 'analytics'), {
        listingId: listingIdStr,
        type: 'inquiry',
        userId: user.id,
        agentId: listing.agent?.id || null,
        createdAt: serverTimestamp()
      });

      toast.success('Tour request sent successfully!');
      setShowTourModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tours');
    }
  };

  const images = listing.images && (listing.images as any).length > 0 
    ? listing.images 
    : [listing.image];

  const handleMediaClick = (index: number) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full transition-colors duration-300"
    >
      <Helmet>
        <title>{`${listing.title} | ${listing.location} | DirectRent`}</title>
        <meta name="description" content={`Rent this verified ${listing.type} in ${listing.location} for ₦${listing.price.toLocaleString()}. ${listing.description.slice(0, 150)}...`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${listing.title} - ₦${listing.price.toLocaleString()} | DirectRent`} />
        <meta property="og:description" content={`Verified ${listing.type} available for rent in ${listing.location}. Connect directly with agents on DirectRent.`} />
        <meta property="og:image" content={listing.image} />
        <meta property="og:url" content={`https://directrent.com.ng/property/${listing.id}`} />

        {/* Twitter */}
        <meta name="twitter:title" content={`${listing.title} - ₦${listing.price.toLocaleString()} | DirectRent`} />
        <meta name="twitter:description" content={`Verified ${listing.type} available for rent in ${listing.location}. Connect directly with agents on DirectRent.`} />
        <meta name="twitter:image" content={listing.image} />
      </Helmet>
      {/* Fullscreen Gallery Modal */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
              <div className="text-white/70 font-bold text-sm tracking-widest uppercase">
                {galleryIndex + 1} / {images.length + (listing.video ? 1 : 0)}
              </div>
              <button 
                onClick={() => setIsGalleryOpen(false)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl border border-white/10"
              >
                <ArrowLeft className="w-6 h-6 rotate-90 sm:rotate-0" />
              </button>
            </div>

            {/* Media Content */}
            <div className="w-full h-full relative group">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`gallery-item-${galleryIndex}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="w-full h-full flex items-center justify-center p-4 sm:p-20"
                >
                  {galleryIndex < images.length ? (
                    <img 
                      src={images[galleryIndex]} 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                      alt="" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full max-w-5xl aspect-video flex items-center justify-center">
                      <video 
                        src={listing.video} 
                        className="w-full max-h-full rounded-2xl shadow-2xl border border-white/10" 
                        controls 
                        autoPlay
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 sm:px-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button 
                  onClick={() => setGalleryIndex(prev => Math.max(0, prev - 1))}
                  disabled={galleryIndex === 0}
                  className="w-14 h-14 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all hover:scale-110 disabled:opacity-0 pointer-events-auto cursor-pointer"
                >
                  <ArrowLeft className="w-8 h-8" />
                </button>
                <button 
                  onClick={() => setGalleryIndex(prev => Math.min(images.length + (listing.video ? 0 : -1), prev + 1))}
                  disabled={galleryIndex === images.length + (listing.video ? 0 : -1)}
                  className="w-14 h-14 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all hover:scale-110 disabled:opacity-0 pointer-events-auto cursor-pointer"
                >
                  <ArrowLeft className="w-8 h-8 rotate-180" />
                </button>
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center gap-3 overflow-x-auto scrollbar-none z-50 bg-gradient-to-t from-black/80 to-transparent">
              {images.map((img, i) => (
                <button 
                  key={`gallery-thumb-${i}`}
                  onClick={() => setGalleryIndex(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${galleryIndex === i ? 'border-primary-500 scale-110 shadow-lg shadow-primary-500/30' : 'border-transparent opacity-50'}`}
                >
                  <SafeImage src={img} className="w-full h-full object-cover" />
                </button>
              ))}
              {listing.video && (
                <button 
                  onClick={() => setGalleryIndex(images.length)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-slate-800 flex items-center justify-center ${galleryIndex === images.length ? 'border-primary-500 scale-110' : 'border-transparent opacity-50'}`}
                >
                  <Video className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal Integration */}
      {user && (
        <ChatModal 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          listing={listing} 
          currentUser={user} 
        />
      )}

      {/* Report Modal */}
      {user && (
        <ReportModal 
          isOpen={showReportModal} 
          onClose={() => setShowReportModal(false)} 
          listingId={listing.id} 
          userId={user.id} 
        />
      )}

      {/* Schedule Tour Modal */}
      {user && (
        <ScheduleTourModal 
          isOpen={showTourModal} 
          onClose={() => setShowTourModal(false)} 
          listing={listing} 
          userId={user.id} 
        />
      )}

      {/* Directions Modal */}
      {listing.latitude && listing.longitude && (
        <DirectionsModal
          isOpen={showDirectionsModal}
          onClose={() => setShowDirectionsModal(false)}
          destination={{ lat: listing.latitude, lng: listing.longitude }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl relative z-10 border border-slate-100 dark:border-slate-800"
            >
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Listing?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                This will permanently remove <span className="font-bold text-slate-700 dark:text-slate-200">"{listing.title}"</span>. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await purgeListingData(listing.id.toString());
                      setShowDeleteConfirm(false);
                      setCurrentListing(null);
                      setActiveTab('mylistings');
                    } catch (error) {
                      handleFirestoreError(error, OperationType.DELETE, `listings/${listing.id}`);
                      setIsDeleting(false);
                    }
                  }}
                  className="px-4 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Carousel (Header) */}
      <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-slate-900 overflow-hidden shadow-sm">
        {/* Top Header Buttons overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 px-2 pt-2 md:pt-3 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReportClick}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500/80 transition-all cursor-pointer shadow-sm"
              title="Report Listing"
            >
              <Flag className="w-4.5 h-4.5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer shadow-sm">
              <Share2 className="w-4.5 h-4.5" />
            </button>
            {!isAgent && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoriteWithAnalytics(listing.id);
                }}
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-sm ${isFavorite ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/40' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                <Bookmark className={`w-4.5 h-4.5 ${isFavorite ? 'fill-current text-white' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Snap Scrolling Row */}
        <div 
          className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
          onScroll={(e) => {
            const el = e.currentTarget;
            const idx = Math.round(el.scrollLeft / el.clientWidth);
            if(idx !== activeMedia) setActiveMedia(idx);
          }}
        >
          {images.map((img, idx) => (
            <div 
              key={`carousel-item-${idx}`} 
              className="w-full h-full flex-shrink-0 snap-center relative cursor-zoom-in"
              onClick={() => handleMediaClick(idx)}
            >
              <SafeImage src={img} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-full bg-black/30 backdrop-blur-sm z-20">
           {images.map((_, idx) => (
             <div key={`pagination-dot-${idx}`} className={`h-1.5 rounded-full transition-all ${idx === activeMedia ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
           ))}
        </div>
      </div>

      <div className="w-full px-[15px] py-4 sm:py-10 flex flex-col md:flex-row gap-6 md:gap-12">
        
        {/* Left Column: Details */}
        <div className="flex-1 space-y-6 sm:space-y-10">
          
          {/* Universal Title Header */}
          <div className="pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:justify-between md:items-start gap-2.5 sm:gap-4">
             <div>
               <div className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[9px] sm:text-xs font-bold uppercase tracking-wider rounded-md sm:rounded-lg mb-2 sm:mb-4">
                 {listing.type}
               </div>
               <h1 className="text-xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-1 sm:mb-3">
                 {listing.title}
               </h1>
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-0.5 cursor-default">
                 <div className="flex items-center gap-1 sm:gap-1.5 text-slate-500 dark:text-slate-400">
                   <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-primary-500" />
                   <span className="text-xs sm:text-base font-bold tracking-tight uppercase">{listing.location}</span>
                 </div>
                 <button 
                  onClick={() => {
                    if (listing.latitude && listing.longitude) {
                      setShowDirectionsModal(true);
                      return;
                    }
                    const destination = encodeURIComponent(`${listing.location}, ${listing.landmark || ''}, Nigeria`);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 text-slate-700 dark:text-slate-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-lg text-[9px] sm:text-xs font-black transition-all cursor-pointer w-fit shadow-sm active:scale-95 uppercase tracking-wide"
                >
                  <Navigation className="w-3 h-3 text-primary-500" />
                  Directions
                </button>
               </div>
             </div>
             <div className="text-left md:text-right mt-1 md:mt-0">
               <div className="text-xl sm:text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight">{listing.price}</div>
               <div className="text-[10px] sm:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0 md:mt-1 opacity-70">per year</div>
             </div>
          </div>

           {/* Mobile Fast Action Agent / Message */}
           {listing.agent && (
              <div 
                onClick={() => !isOwnListing && setSelectedAgentId(listing.agent!.id!)}
                className={`md:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-opacity ${!isOwnListing ? 'cursor-pointer active:opacity-75' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-base overflow-hidden relative">
                    {listing.agent.avatarUrl ? (
                      <img src={listing.agent.avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      listing.agent.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {isOwnListing ? 'Your Listing' : isAdmin ? `Agent: ${listing.agent.name}` : listing.agent.name}
                    </h4>
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-0.5">
                      {canManageListing ? (
                        <>
                          <div className="flex items-center gap-1 font-black text-emerald-600">
                             {listing.isApproved ? 'LIVE' : 'PENDING'}
                          </div>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span>{realStats.views.toLocaleString()} Views</span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-amber-500 fill-current" /> {listing.agent.rating}
                          </div>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span>Verified Agent</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {!isAgent && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTourClick();
                      }}
                      className="h-10 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Tour
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageClick();
                      }}
                      className="w-10 h-10 bg-primary-600 text-white rounded-lg shadow-lg shadow-primary-500/20 flex items-center justify-center hover:bg-primary-700 transition-colors cursor-pointer active:scale-95"
                    >
                      <MessageCircleMore className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}
                {canManageListing && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('create');
                    }}
                    className="w-10 h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg shadow-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
           )}

          {/* Property Overview */}
          <div className="py-5 sm:py-6 border-y border-slate-200 dark:border-slate-800 mt-1 sm:mt-2 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-8 gap-y-4 sm:gap-y-6">
              {listing.beds && (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <Bed className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Beds</div>
                    <div className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white leading-none uppercase tracking-wide">{listing.beds} {listing.beds === 1 ? 'Bedroom' : 'Bedrooms'}</div>
                  </div>
                </div>
              )}

              {listing.baths && (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <Bath className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Baths</div>
                    <div className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white leading-none uppercase tracking-wide">{listing.baths} {listing.baths === 1 ? 'Bathroom' : 'Bathrooms'}</div>
                  </div>
                </div>
              )}

              {listing.area && (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Area</div>
                    <div className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white leading-none uppercase tracking-wide">{listing.area}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${listing.verified ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400'}`}>
                    {listing.verified ? <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <div>
                     <div className={`text-[8px] sm:text-[10px] uppercase tracking-widest leading-none mb-1 font-bold ${listing.verified ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-amber-700/70 dark:text-amber-400/70'}`}>Safety Status</div>
                     <div className={`text-[11px] sm:text-sm font-black leading-none ${listing.verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                       {listing.verified ? 'Verified Property' : 'Unverified Listing'}
                     </div>
                  </div>
              </div>
            </div>
          </div>

          {/* New Insight Tiles Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { 
                icon: <ShieldCheck className="w-4 h-4" />, 
                label: "Security", 
                value: listing.amenities.some(a => ['Security', 'Fenced', 'Secured Gate', 'CCTV'].includes(a)) ? "High" : "Standard", 
                color: "text-emerald-500" 
              },
              { 
                icon: <Droplets className="w-4 h-4" />, 
                label: "Water", 
                value: listing.amenities.some(a => ['Water', 'Steady Water', 'Clean Water', 'Borehole'].includes(a)) ? "Constant" : "Periodic", 
                color: "text-blue-500" 
              },
              { 
                icon: <Zap className="w-4 h-4" />, 
                label: "Power", 
                value: listing.amenities.some(a => ['Solar', 'Generator', 'Inverter', 'Prepaid Meter'].includes(a)) ? "Good" : "Reliable", 
                color: "text-amber-500" 
              },
              { 
                icon: <Clock className="w-4 h-4" />, 
                label: "Check-in", 
                value: "Flexible", 
                color: "text-slate-500" 
              }
            ].map((insight, idx) => (
              <div key={`insight-${idx}`} className="p-3 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
                <div className={`${insight.color} mb-1 opacity-70`}>{insight.icon}</div>
                <div className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{insight.label}</div>
                <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{insight.value}</div>
              </div>
            ))}
          </div>

          {/* Video Tour Section */}
          {listing.video && (
            <div className="space-y-4">
              <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Video Tour</h2>
              <div 
                onClick={() => handleMediaClick(images.length)}
                className="group relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <video src={listing.video} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Video className="w-8 h-8 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white mb-2 sm:mb-4 uppercase tracking-wider">About this space</h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-base leading-relaxed tracking-tight">
              {listing.description || `Experience comfortable living in this highly sought-after ${listing.type.toLowerCase()} located in the heart of ${listing.location}. This property offers an excellent blend of convenience, security, and affordability.`}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white mb-2 sm:mb-4 uppercase tracking-wider">Features</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {listing.amenities.map((amenity, idx) => (
                <div key={`${amenity}-${idx}`} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] sm:text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all uppercase tracking-wide">
                  <BadgeCheck className="w-3.5 h-3.5 text-primary-500" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Sticky Sidebar for Desktop */}
        <div className="hidden md:block w-full md:w-[350px] flex-shrink-0">
          <div className="sticky top-24 flex flex-col gap-6 lg:gap-8 transition-all duration-300">
            
            {/* Sidebar Content */}
            {canManageListing ? (
              <div className="space-y-6">
                {/* Status & Quick Actions */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                       {isAdmin && !isOwnListing ? 'Admin Management' : 'Management'}
                    </h2>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${listing.isApproved ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
                      {listing.isApproved ? 'Live' : 'Pending'}
                    </div>
                  </div>
                  
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          disabled={isDeleting}
                          onClick={() => {
                            setActiveTab('create');
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white h-11 rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" /> Edit Listing
                        </button>
                        <button 
                          disabled={isDeleting}
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 h-11 rounded-lg font-bold text-sm transition-all border border-slate-100 dark:border-white/5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete Listing'}
                        </button>
                      </div>
                </div>

                {/* Visibility Insights */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors duration-300">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                  <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Quick Stats
                  </h2>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 dark:bg-white/10 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Views</span>
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white">{realStats.views.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 dark:bg-white/10 rounded-lg flex items-center justify-center">
                          <MessageCircleMore className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Inquiries</span>
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white">{realStats.inquiries}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 dark:bg-white/10 rounded-lg flex items-center justify-center">
                          <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Saves</span>
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white">{realStats.saves}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Agent Bento Card */}
                {listing.agent && (
                  <div 
                    onClick={() => setSelectedAgentId(listing.agent!.id!)}
                    className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-3xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500/50 transition-all active:scale-[0.98]"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />
                    <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">Listed By</h2>
                    
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-primary-600 shadow-inner flex-shrink-0 font-sans overflow-hidden border border-slate-200 dark:border-slate-700">
                        {listing.agent.avatarUrl ? (
                          <img src={listing.agent.avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          listing.agent.name.charAt(0)
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-slate-900 dark:text-white truncate w-full">{listing.agent.name}</span>
                          {listing.agent.isVerified && <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 rounded-lg">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[10px] uppercase tracking-wider font-bold">{listing.agent.rating}</span>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                            <span className="text-[10px] uppercase tracking-wider font-bold">Verified Agent</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isAgent && (
                      <div className="flex flex-col gap-3 relative z-10 w-full">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTourClick();
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 border border-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 h-12 rounded-xl font-black text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest"
                        >
                          <Calendar className="w-4 h-4" /> Schedule Tour
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageClick();
                          }}
                          className="w-full bg-primary-600 text-white h-12 rounded-xl font-bold text-sm shadow-xl shadow-primary-500/20 hover:bg-primary-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <MessageCircleMore className="w-4 h-4" /> Message Agent
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Safety Banner */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-5 rounded-3xl flex flex-col lg:flex-row gap-4 items-start text-blue-900 dark:text-blue-300 transition-colors">
                   <ShieldCheck className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                   <p className="text-sm font-medium leading-relaxed opacity-90">
                     DirectRent protects your payments. Never wire money or pay an agent directly before inspecting the property holding a verified slip.
                   </p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Recommended Section / Insights Dashboard */}
      <div className="w-full border-t border-slate-200 dark:border-slate-800 mt-4 md:mt-8 flex-1 flex flex-col transition-colors duration-300">
        <div className="px-[15px] pt-10 pb-[110px] w-full flex-1" style={{paddingBottom:0}}>
          {canManageListing ? (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isOwnListing ? 'Listing Insights' : 'Admin Metrics Dashboard'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {isOwnListing ? 'Detailed performance analysis of your property listing.' : `Visibility and engagement data for agent: ${listing.agent.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 shadow-sm">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-tight">Last 30 Days</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics Table/Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 dark:divide-slate-800">
                  {[
                    {label: "Total Views", value: realStats.views.toLocaleString(), change: realStats.trends.views, color: "text-indigo-600 dark:text-indigo-400" },
                    { label: "Active Interests", value: realStats.saves.toLocaleString(), change: realStats.trends.saves, color: "text-blue-600 dark:text-blue-400" },
                    { label: "Interaction Rate", value: realStats.views > 0 ? `${Math.round(((realStats.inquiries + realStats.saves) / realStats.views) * 100)}%` : '0%', change: realStats.trends.interaction, color: "text-emerald-600 dark:text-emerald-400" },
                    { label: "Total Inquiries", value: realStats.inquiries.toLocaleString(), change: realStats.trends.inquiries, color: "text-amber-600 dark:text-amber-400" }
                  ].map((stat, i) => (
                    <div key={`stat-${i}`} className="p-6 sm:p-8 flex flex-col justify-center">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 truncate">
                        {stat.label}
                      </span>
                      <div className="flex items-baseline gap-3">
                        <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        <span className={`text-[10px] font-bold ${stat.change.startsWith('+') ? 'text-emerald-500' : stat.change === '0%' ? 'text-slate-400' : 'text-rose-500'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Placeholder Interface */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-72 sm:h-96 flex flex-col items-center justify-center text-center space-y-4 transition-colors duration-300 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                   <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center relative z-10">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Traffic Flow Analytics</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto mt-2 leading-relaxed">
                    Visual engagement patterns and heatmaps will appear as your property reaches more potential tenants.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">
                Similar properties you might like
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
                {recommended.map(recListing => (
                  <ListingCard 
                    key={recListing.id}
                    listing={recListing}
                    onViewDetails={() => setCurrentListing(recListing)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ListingDetails;
