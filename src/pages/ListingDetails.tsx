import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, Bookmark, MapPin, BadgeCheck, Star, 
  ShieldCheck, Share2, MessageCircleMore, LayoutGrid, Droplets,
  Navigation, ExternalLink, BarChart3, Eye, Calendar, TrendingUp,
  Settings, Trash2, Edit3, Video, Flag, AlertTriangle, X, CheckSquare,
  Zap, Clock, Building2, Sparkles, Maximize, Lock
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import { ChatModal } from '../components/ChatModal';
import { useAuth } from '../context/AuthContext';
import { addDoc, collection, serverTimestamp, query, where, getCountFromServer, doc, onSnapshot } from 'firebase/firestore';
import { purgeListingData } from '../utils/adminCleanup';
import { toast } from 'react-hot-toast';
import { GoogleMapsGuard } from '../components/GoogleMapsGuard';
import { useMap, useMapsLibrary, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

import SafeImage from '../components/SafeImage';
import FullscreenGallery from '../components/FullscreenGallery';
import { HeaderPortal } from '../components/HeaderPortal';
import HamburgerButton from '../components/HamburgerButton';

interface ListingDetailsProps {
  listing: Listing;
  onBack: () => void;
}

const ReportModal = ({ isOpen, onClose, listingId, userId, agentId }: { isOpen: boolean, onClose: () => void, listingId: string | number, userId: string, agentId?: string }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const reasons = ['Inappropriate Behavior', 'Fraudulent Account', 'Hidden Fees', 'Unresponsive', 'Other'];

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        listingId,
        reporterId: userId,
        agentId: agentId || null,
        reason,
        description,
        type: 'listing',
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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="w-full max-w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 transition-all duration-300 pb-safe sm:pb-6"
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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="w-full max-w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 transition-all duration-300 pb-safe sm:pb-6"
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
    if (!routesLib || !map || !google?.maps) return;
    
    try {
      routesLib.Route.computeRoutes({
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        travelMode: google.maps.TravelMode.DRIVING,
      } as any).then(({ routes }: any) => {
        if (routes?.[0] && map) {
          const newPolylines = routes[0].createPolylines();
          newPolylines.forEach((p: any) => p.setMap(map));
          polylinesRef.current = newPolylines;
          if (routes[0].viewport) map.fitBounds(routes[0].viewport);
        }
      }).catch((err: any) => console.error("Directions error:", err));
    } catch (e) {
      console.error("Route computation failed:", e);
    }

    return () => {
      if (polylinesRef.current) {
        polylinesRef.current.forEach(p => p.setMap(null));
      }
    };
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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="w-full max-w-full sm:max-w-full sm:max-w-2xl h-[80vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border-[0.5px] border-slate-200 dark:border-[#0f172b] flex flex-col transition-all duration-300 pb-safe sm:pb-0"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
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

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing: initialListing, onBack }) => {
  const { setCurrentListing, user, setView, setAuthMode, setSelectedAgentId, favorites, toggleFavorite, setActiveTab, isSidebarCollapsed } = useAuth();
  const [listing, setListing] = useState<Listing>(initialListing);

  useEffect(() => {
    setListing(initialListing);
  }, [initialListing]);

  // Live real-time stream of the complete listing details from Firestore
  useEffect(() => {
    if (!initialListing.id) return;
    const listingIdStr = initialListing.id.toString();
    const unsub = onSnapshot(doc(db, 'listings', listingIdStr), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setListing({
          ...initialListing,
          ...data,
          id: initialListing.id,
          agent: {
            ...initialListing.agent,
            ...(data.agent || {}),
          }
        } as Listing);
      }
    }, (err) => {
      console.error("Error fetching full listing details in ListingDetails:", err);
    });
    return () => unsub();
  }, [initialListing.id]);

  const [activeMedia, setActiveMedia] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [realStats, setRealStats] = useState({ 
    views: initialListing.viewCount || 0, 
    inquiries: initialListing.inquiryCount || 0, 
    saves: initialListing.favoritesCount || 0,
    trends: {
      views: '0%',
      inquiries: '0%',
      saves: '0%',
      interaction: '0%'
    }
  });

  const handleShare = async () => {
    setIsSharing(true);
    const shareData = {
      title: `DirectRent: ${listing.title}`,
      text: `Check out this verified ${listing.type} in ${listing.location}. ₦${listing.priceValue?.toLocaleString() || listing.price}/year.`,
      url: `${window.location.origin}/properties/${listing.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!', {
          icon: '🔗',
          style: {
            borderRadius: '1rem',
            background: '#1e293b',
            color: '#fff',
            fontSize: '12px',
          }
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    } finally {
      setIsSharing(false);
    }
  };

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
  
  const renderAgentSection = () => {
    if (!listing.agent) return null;
    return (
      <div 
        onClick={() => setSelectedAgentId(listing.agent!.id!)}
        className="bg-white dark:bg-slate-900 p-[15px] rounded-3xl text-slate-900 dark:text-white border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 shadow-xl relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500/50 transition-all active:scale-[0.98] duration-300"
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
                <span className="text-[10px] uppercase tracking-wider font-bold font-sans">Verified Agent</span>
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
    );
  };
  
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
  
  // Recommended listings (fetch from db or hide for now)
  const [recommended, setRecommended] = useState<Listing[]>([]);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const { collection, query, limit, getDocs } = await import('firebase/firestore');
        const listingsRef = collection(db, 'listings');
        // Simple default query, should exclude current listing but for simple mock we just take length
        const q = query(listingsRef, limit(4));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Listing)).filter(l => l.id !== listing.id).slice(0, 3);
        setRecommended(fetched);
      } catch (e) {
        console.error("Error fetching recommended", e);
      }
    };
    fetchRecommended();
  }, [listing.id]);
  
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

    // Open chat immediately, analytics is secondary
    setIsChatOpen(true);

    // Record intent to message (Analytics only, count happens on first message)
    try {
      await addDoc(collection(db, 'analytics'), {
        listingId: listing.id.toString(),
        type: 'intent_message',
        userId: user.id,
        agentId: listing.agent?.id || null,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'analytics');
      console.warn("Failed to record intent analytic");
    }

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

  if (listing.status === 'suspended' && !canManageListing) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans w-full animate-fade-in"
      >
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-lg font-black text-rose-600 dark:text-rose-450 uppercase tracking-wider mb-2">Property Suspended</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              This property is temporarily unavailable or suspended for safety reasons. You can review your historical messages for reference, but public details and maps are hidden.
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  if (isAgent && !isOwnListing && !isAdmin) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans w-full"
      >
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col items-center gap-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-lg font-black text-amber-600 dark:text-amber-450 uppercase tracking-wider mb-2">Access Denied</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              You are signed in as an Agent. On DirectRent, agents are only authorized to view and manage their own listed properties to ensure peer-to-peer data integrity.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Listing ID</span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{listing.id}</span>
            </div>
          </div>
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-white rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-slate-50 dark:bg-slate-950 flex flex-col w-full transition-colors duration-300"
    >
      <Helmet>
        <title>{`${listing.title} | ${listing.location} | DirectRent Nigeria`}</title>
        <meta name="description" content={`Verified ${listing.type} for rent in ${listing.location}, Nigeria. ₦${listing.priceValue?.toLocaleString() || listing.price}/year. ${listing.description?.slice(0, 160)}`} />
        <meta name="keywords" content={`rent in ${listing.location}, ${listing.type} Nigeria, real estate nigeria, verified listings, local agents nigeria`} />
        
        {/* Canonical */}
        <link rel="canonical" href={`https://directrent.space/properties/${listing.id}`} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="DirectRent Nigeria" />
        <meta property="og:title" content={`${listing.title} - ₦${listing.priceValue?.toLocaleString() || listing.price}/yr`} />
        <meta property="og:description" content={`Verified ${listing.type} available for rent in ${listing.location}. Connect directly with verified agents on DirectRent.`} />
        <meta property="og:image" content={listing.image} />
        <meta property="og:url" content={`https://directrent.space/properties/${listing.id}`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${listing.title} - ₦${listing.priceValue?.toLocaleString() || listing.price}/yr`} />
        <meta name="twitter:description" content={`Verified ${listing.type} available for rent in ${listing.location}. Connect directly with verified agents on DirectRent.`} />
        <meta name="twitter:image" content={listing.image} />

        {/* JSON-LD Structured Data for Google Indexing */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Accommodation",
            "name": listing.title,
            "description": listing.description,
            "image": listing.image,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": listing.location,
              "addressCountry": "NG"
            },
            "offers": {
              "@type": "Offer",
              "price": listing.priceValue || 0,
              "priceCurrency": "NGN",
              "availability": "https://schema.org/InStock"
            }
          })}
        </script>
      </Helmet>
      {/* Fullscreen Gallery Modal replacement */}
      <FullscreenGallery 
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        images={images}
        video={listing.video}
        initialIndex={galleryIndex}
      />

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
          agentId={listing.agent?.id || (listing as any).agentId}
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
      {!!listing.latitude && !!listing.longitude && (
        <DirectionsModal
          isOpen={showDirectionsModal}
          onClose={() => setShowDirectionsModal(false)}
          destination={{ lat: listing.latitude, lng: listing.longitude }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-full sm:max-w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 transition-all duration-300 pb-safe sm:pb-6"
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

      <HeaderPortal>
        <div className="hidden md:flex flex-1 items-center justify-end px-6 py-2 pb-3 mb-1 gap-2">
            <button 
              onClick={handleReportClick}
              className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
              title="Report Listing"
            >
              <Flag className="w-5 h-5" />
            </button>
            <button 
              onClick={handleShare}
              className={`w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary-500 transition-all cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700 ${isSharing ? 'animate-pulse' : ''}`}
              title="Share Listing"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {!isAgent && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoriteWithAnalytics(listing.id.toString());
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm border ${isFavorite ? 'bg-primary-600 text-white shadow-primary-500/40 border-primary-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary-500 border-slate-200 dark:border-slate-700'}`}
              >
                <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-current text-white' : ''}`} />
              </button>
            )}
        </div>
      </HeaderPortal>

      {/* Media Gallery / Header */}
      <div className="relative w-full bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Top Header Buttons overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 px-4 pt-4 md:pt-6 z-40 flex justify-between items-center pointer-events-none lg:hidden">
          <div className="flex items-center gap-2 pointer-events-auto">
            <HamburgerButton className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center shadow-md border border-white/20 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer active:scale-[0.98]" />
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button 
              onClick={handleReportClick}
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all cursor-pointer shadow-md border border-white/20"
              title="Report Listing"
            >
              <Flag className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={handleShare}
              className={`w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-primary-500 transition-all cursor-pointer shadow-md border border-white/20 ${isSharing ? 'animate-pulse' : ''}`}
              title="Share Listing"
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>
            {!isAgent && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoriteWithAnalytics(listing.id.toString());
                }}
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-md border border-white/20 ${isFavorite ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/40' : 'bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-primary-500'}`}
              >
                <Bookmark className={`w-4.5 h-4.5 ${isFavorite ? 'fill-current text-white' : ''}`} />
              </button>
            )}
          </div>
        </div>

        <div className="w-full">
          {/* Desktop Mosaic Gallery */}
          <div className={`hidden md:grid gap-1.5 h-[500px] overflow-hidden cursor-pointer group/mosaic relative ${
             images.length === 1 ? 'grid-cols-1' :
             images.length === 2 ? 'grid-cols-2' :
             images.length === 3 ? 'grid-cols-2 grid-rows-2' :
             images.length === 4 ? 'grid-cols-2 grid-rows-2' :
             'grid-cols-4 grid-rows-2'
          }`}>
            {/* Template-based dynamic gallery layout mapping */}
            {images.slice(0, 5).map((img, idx) => (
              <div 
                key={`listing-${listing.id}-mosaic-item-${idx}`} 
                className={`relative overflow-hidden ${
                  // Map specific positions by index based on total image count
                  images.length === 1 ? 'col-span-1 row-span-2' :
                  images.length === 2 ? 'col-span-1 row-span-2' :
                  images.length === 3 ? (idx === 0 ? 'col-span-1 row-span-2' : 'col-span-1') :
                  images.length === 4 ? 'col-span-1 row-span-1' :
                  // 5+ images layout template
                  (idx === 0 ? 'col-span-2 row-span-2' : idx < 3 ? 'col-span-1 row-span-1' : 'col-span-1 row-span-1')
                }`}
                onClick={() => handleMediaClick(idx)}
              >
                <SafeImage src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/0 group-hover/mosaic:bg-black/10 transition-colors pointer-events-none" />
                {idx === 4 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center text-white flex-col gap-1">
                    <span className="text-xl font-black">+{images.length - 5}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">More</span>
                  </div>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => handleMediaClick(0)}
              className="absolute bottom-6 right-6 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-205 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all active:scale-[0.98] z-10"
            >
              <LayoutGrid className="w-4 h-4" />
              Show All Photos
            </button>
          </div>

          {/* Mobile Snap Carousel */}
          <div className="md:hidden relative aspect-[4/3] rounded-none overflow-hidden -mx-1 group/mobile-carousel">
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
                  key={`listing-${listing.id}-carousel-item-${idx}`} 
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
                <div key={`listing-${listing.id}-pagination-dot-${idx}`} className={`h-1.5 rounded-full transition-all ${idx === activeMedia ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>

            {/* Mobile Photo Count */}
            <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-tight z-20">
              {activeMedia + 1} / {images.length}
            </div>
          </div>
        </div>
      </div>
      <div className={`w-full px-[15px] flex flex-col gap-[15px] pt-4 pb-0 transition-all duration-300 ${
        isSidebarCollapsed 
          ? 'md:flex-row md:gap-[15px] lg:gap-[15px]' 
          : 'md:flex-row lg:flex-col xl:flex-row xl:gap-[15px]'
      }`}>
        
        {/* Left Column: Details */}
        <div className="flex-1 space-y-4">
          {/* Universal Header Card - Beautifully Restructured & Highly Readable */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-[15px] shadow-sm space-y-4">
            {/* Row 1: Type and Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg border border-indigo-100/50 dark:border-indigo-900/10">
                {listing.type}
              </span>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                listing.verified 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/10' 
                  : 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border border-amber-100/30 dark:border-amber-900/10'
              }`}>
                {listing.verified ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Verified Property
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    Unverified Listing
                  </>
                )}
              </div>
            </div>

            {/* Row 2: Title */}
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {listing.title}
              </h1>
            </div>

            {/* Row 3: Price */}
            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight leading-none">
                  {listing.price}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                  {listing.initialPayment ? '1st Payment / Deposit' : (
                    listing.paymentPeriod === 'monthly' ? 'per month' :
                    listing.paymentPeriod === 'quarterly' ? 'per quarter' :
                    listing.paymentPeriod === 'bi-annually' ? 'per 6-months' :
                    listing.paymentPeriod === 'custom' ? 'per lease term' : 'per year'
                  )}
                </span>
              </div>
            </div>

            {/* Row 4: Location then Get Directions Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40 p-[12px] sm:p-[15px] rounded-2xl border border-slate-100/80 dark:border-slate-800/60 w-full">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="text-xs sm:text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 capitalize leading-none">{listing.location}</span>
              </div>
              <button 
                onClick={() => {
                  if (listing.latitude && listing.longitude) {
                    setShowDirectionsModal(true);
                    return;
                  }
                  toast.success("Redirecting to Google Maps! Since this is a custom-typed location, navigation accuracy depends on map recognition.");
                  const destination = encodeURIComponent(`${listing.location}, ${listing.landmark || ''}, Nigeria`);
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 md:py-2 bg-indigo-50 dark:bg-indigo-950/60 border border-primary-200 dark:border-indigo-805/50 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-100/40 dark:hover:bg-indigo-900/50 text-indigo-705 dark:text-indigo-400 rounded-lg text-[9px] sm:text-[10px] sm:text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 uppercase tracking-wide shrink-0"
              >
                <Navigation className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                Get Directions
              </button>
            </div>

            {/* Divider and Row 5: Description (About this space) moved into this same container */}
            <div className="border-t border-slate-150 dark:border-slate-800/80 pt-4 mt-2">
              <h2 className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 leading-none">About This Space</h2>
              <p className="text-slate-650 dark:text-slate-400 text-xs sm:text-sm leading-relaxed tracking-tight font-medium break-words break-all whitespace-pre-wrap hyphens-auto">
                {listing.description || `Experience comfortable living in this highly sought-after ${listing.type.toLowerCase()} located in the heart of ${listing.location}. This property offers an excellent blend of convenience, security, and affordability.`}
              </p>
            </div>
          </div>

          {/* Redesigned Mobile Agent Management Box / Booking Actions */}
          {listing.agent && (
            <div className="md:hidden">
              {canManageListing ? (
                /* Mobile Management Suite */
                <div className="bg-white dark:bg-slate-900 p-[15px] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-primary-150/60 dark:bg-primary-950/40 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm overflow-hidden relative">
                        {listing.agent.avatarUrl ? (
                          <img src={listing.agent.avatarUrl} className="w-full h-full object-cover rounded-full" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          listing.agent.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {isOwnListing ? 'Your Listing Control' : 'Admin Listing Control'}
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{realStats.views.toLocaleString()} Total Views</span>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${listing.isApproved ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
                      {listing.isApproved ? 'Live' : 'Pending'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button 
                      disabled={isDeleting}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('create');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white h-10 rounded-lg font-bold text-xs shadow-lg shadow-indigo-500/15 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Listing
                    </button>
                    <button 
                      disabled={isDeleting}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-955/25 disabled:opacity-50 text-slate-600 dark:text-slate-350 hover:text-rose-600 h-10 rounded-lg font-bold text-xs transition-all border border-slate-205 dark:border-white/5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? 'Deleting' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Mobile Booking & Messaging Suite */
                <div 
                  onClick={() => setSelectedAgentId(listing.agent!.id!)}
                  className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer active:opacity-75 transition-opacity"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm overflow-hidden relative">
                      {listing.agent.avatarUrl ? (
                        <img src={listing.agent.avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      ) : (
                        listing.agent.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{listing.agent.name}</h4>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-amber-500 fill-current" /> {listing.agent.rating}
                        </div>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>Verified Agent</span>
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
                </div>
              )}
            </div>
          )}

          {/* Property Specific Specifications Overview */}
          <div className="py-2 my-2">
            <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-8 gap-y-4 sm:gap-y-6">
              {!!listing.type && (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Property Type</div>
                    <div className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white leading-none uppercase tracking-wide">{listing.type}</div>
                  </div>
                </div>
              )}

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Amenities</div>
                    <div className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white leading-none uppercase tracking-wide">{listing.amenities.length} Features Included</div>
                  </div>
                </div>
              )}

              {!!listing.area && (
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
            </div>
          </div>

          {/* New Insight Tiles Section (Commented out until we start actively checking these items)
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { 
                id: 'security',
                icon: <ShieldCheck className="w-4 h-4" />, 
                label: "Security", 
                value: listing.amenities.some(a => ['Security', 'Fenced', 'Secured Gate', 'CCTV'].includes(a)) ? "High" : "Standard", 
                color: "text-emerald-500" 
              },
              { 
                id: 'water',
                icon: <Droplets className="w-4 h-4" />, 
                label: "Water", 
                value: listing.amenities.some(a => ['Water', 'Steady Water', 'Clean Water', 'Borehole'].includes(a)) ? "Constant" : "Periodic", 
                color: "text-blue-500" 
              },
              { 
                id: 'power',
                icon: <Zap className="w-4 h-4" />, 
                label: "Power", 
                value: listing.amenities.some(a => ['Solar', 'Generator', 'Inverter', 'Prepaid Meter'].includes(a)) ? "Good" : "Reliable", 
                color: "text-amber-500" 
              },
              { 
                id: 'checkin',
                icon: <Clock className="w-4 h-4" />, 
                label: "Check-in", 
                value: "Flexible", 
                color: "text-slate-500" 
              }
            ].map((insight) => (
              <div key={`insight-${insight.id}`} className="p-3 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm">
                <div className={`${insight.color} mb-1 opacity-70`}>{insight.icon}</div>
                <div className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{insight.label}</div>
                <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{insight.value}</div>
              </div>
            ))}
          </div>
          */}

          {/* Listed By / Management when sidebar is expanded */}
          {!isSidebarCollapsed && (
            <div className="space-y-4">
              {renderAgentSection()}
            </div>
          )}

          {/* Video Tour Section */}
          {!!listing.video && (
            <div className="space-y-4">
              <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Video Tour</h2>
              <div 
                onClick={() => handleMediaClick(images.length)}
                className="group relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <video src={listing.video || undefined} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Video className="w-8 h-8 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lease & Payment Terms Breakdown */}
          {!!(listing.paymentPeriod || listing.initialPayment || listing.leaseDuration) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-[15px] space-y-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-150 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none">Financial Structure</span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider mt-1">Lease & Payment Terms</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    {listing.initialPayment ? 'Upfront Deposit Plan' : 'Standard Rate Plan'}
                  </span>
                </div>
              </div>

              {/* Grid Content for Desktop/Tablet */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Column 1: Core Terms */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">Core Agreement</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-[13px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150/40 dark:border-slate-900/40">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Billing Period</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase">
                        {listing.paymentPeriod === 'monthly' ? 'Monthly' :
                         listing.paymentPeriod === 'quarterly' ? 'Quarterly' :
                         listing.paymentPeriod === 'bi-annually' ? 'Every 6 Months' :
                         listing.paymentPeriod === 'custom' ? 'Custom Lease' : 'Annually'}
                      </span>
                    </div>

                    <div className="p-[13px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150/40 dark:border-slate-900/40">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Min Stay Lease</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                        {listing.leaseDuration || '1 Year'}
                      </span>
                    </div>
                  </div>

                  <div className="p-[13px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150/40 dark:border-slate-900/40 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Ongoing Subsequent Rate</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Renewal rate post deposit</span>
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                      {listing.subsequentPayment || listing.initialPayment || listing.price}/
                      {listing.paymentPeriod === 'monthly' ? 'mo' :
                       listing.paymentPeriod === 'quarterly' ? 'qt' :
                       listing.paymentPeriod === 'bi-annually' ? '6mo' :
                       listing.paymentPeriod === 'custom' ? 'term' : 'yr'}
                    </span>
                  </div>
                </div>

                {/* Column 2: Financial Timeline Breakdown */}
                <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/60 rounded-2xl p-[15px] flex flex-col justify-between space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-450 dark:text-slate-500">Payment Schedule</h3>
                  <div className="relative border-l-2 border-primary-500/30 ml-3 pl-5 space-y-6 py-1">
                    {/* Move In Step */}
                    <div className="relative">
                      <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary-600 ring-4 ring-white dark:ring-slate-950">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Day 1: Move-In Secure</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Includes Rent deposit + administrative fees</p>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-primary-650 dark:text-primary-400 text-right whitespace-nowrap">
                          {listing.initialPayment || listing.price}
                        </span>
                      </div>
                    </div>

                    {/* Subsequent Period Step */}
                    <div className="relative">
                      <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-800 ring-4 ring-white dark:ring-slate-950">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                      </span>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 font-bold">Ongoing billing cycles</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Recurring schedule payments</p>
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-350 text-right whitespace-nowrap">
                          {listing.subsequentPayment || listing.initialPayment || listing.price} / {
                            listing.paymentPeriod === 'monthly' ? 'mo' :
                            listing.paymentPeriod === 'quarterly' ? 'qt' :
                            listing.paymentPeriod === 'bi-annually' ? '6mo' :
                            listing.paymentPeriod === 'custom' ? 'term' : 'yr'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* Amenities */}
          <div>
            <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white mb-2 sm:mb-4 uppercase tracking-wider">Features</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {listing.amenities.map((amenity) => (
                <div key={`amenity-${listing.id}-${amenity.replace(/\s+/g, '-').toLowerCase()}`} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] sm:text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-all uppercase tracking-wide">
                  <BadgeCheck className="w-3.5 h-3.5 text-primary-500" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Sticky Sidebar for Desktop */}
        <div className={`hidden md:block w-full flex-shrink-0 transition-all duration-300 ${
          isSidebarCollapsed 
            ? 'md:w-[310px] lg:w-[340px] xl:w-[350px]' 
            : 'md:w-[310px] lg:w-full xl:w-[350px]'
        }`}>
          <div className="sticky top-24 flex flex-col gap-6 lg:gap-8 transition-all duration-300">
            
            {/* Sidebar Content */}
            {canManageListing ? (
              <div className="space-y-6">
                {/* Status & Quick Actions */}
                <div className="bg-white dark:bg-slate-900 border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 p-[15px] rounded-xl shadow-sm transition-all duration-300">
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
                          className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 h-11 rounded-lg font-bold text-sm transition-all border border-slate-205 dark:border-white/5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete Listing'}
                        </button>
                      </div>
                </div>

                {/* Visibility Insights */}
                <div className="bg-white dark:bg-slate-900 p-[15px] rounded-xl text-slate-900 dark:text-white border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-300">
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
                {isSidebarCollapsed && renderAgentSection()}

                {/* Safety Banner */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border-[0.5px] border-blue-100/30 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-800 p-[15px] rounded-3xl flex flex-col lg:flex-row gap-4 items-start text-blue-900 dark:text-blue-300 transition-all duration-300">
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
        <div className="px-[15px] pt-10 pb-8 w-full flex-1">
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
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 dark:divide-slate-800">
                    {[
                      { id: 'views', label: "Total Views", value: realStats.views.toLocaleString(), change: realStats.trends.views, color: "text-indigo-600 dark:text-indigo-400" },
                      { id: 'interest', label: "Active Interests", value: realStats.saves.toLocaleString(), change: realStats.trends.saves, color: "text-blue-600 dark:text-blue-400" },
                      { id: 'rate', label: "Interaction Rate", value: realStats.views > 0 ? `${Math.round(((realStats.inquiries + realStats.saves) / realStats.views) * 100)}%` : '0%', change: realStats.trends.interaction, color: "text-emerald-600 dark:text-emerald-400" },
                      { id: 'inq', label: "Total Inquiries", value: realStats.inquiries.toLocaleString(), change: realStats.trends.inquiries, color: "text-amber-600 dark:text-amber-400" }
                    ].map((stat) => (
                      <div key={`insight-stat-${stat.id}`} className="p-6 sm:p-8 flex flex-col justify-center">
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
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-72 sm:h-96 flex flex-col items-center justify-center text-center space-y-4 transition-colors duration-300 relative overflow-hidden">
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
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-4 sm:gap-6 lg:gap-8">
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
