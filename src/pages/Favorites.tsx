import React, { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bookmark, ArrowRight, Bell, Heart, Star } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FEATURED_LISTINGS } from "../data";
import { Listing } from "../types";
import SafeImage from "../components/SafeImage";
import NotificationBadge from "../components/NotificationBadge";

interface SavedListingCardProps {
  listing: Listing;
  onViewDetails: () => void;
  onUnsave: () => void;
}

const SavedListingCard: React.FC<SavedListingCardProps> = ({ 
  listing, 
  onViewDetails, 
  onUnsave 
}) => {
  const coverImage = listing.images && listing.images.length > 0 ? listing.images[0] : (listing.image || "");
  
  return (
    <div 
      onClick={onViewDetails}
      className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-black/25 transition-all duration-300 flex flex-col h-full group cursor-pointer relative"
    >
      {/* Property image container with custom cover hover zoom */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage 
          src={coverImage} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-60" />
        
        {/* Quick Unsave Bookmark Pin */}
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onUnsave();
          }}
          className="absolute top-3.5 right-3.5 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full backdrop-blur-md shadow-md transition-all active:scale-95"
          title="Remove from bookmarks"
        >
          <Bookmark className="w-3.5 h-3.5 fill-current text-white" />
        </button>

        {/* Minimal verified banner only */}
        {listing.verified && (
          <div className="absolute top-3.5 left-3.5 px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[8.5px] font-black uppercase tracking-wider shadow-sm">
            Verified
          </div>
        )}
      </div>

      {/* Reduced listing metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="text-slate-905 dark:text-white text-sm font-display font-black leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-450 transition-colors tracking-tight line-clamp-1">
            {listing.title}
          </h3>
          <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase mt-1 truncate">
            {listing.location}
          </p>
        </div>

        {/* Agent and Price - Clean visual footer */}
        <div className="flex items-center justify-between pt-3 border-t-[0.5px] border-slate-205 dark:border-[#0f172b]/65">
          <div className="text-left leading-none">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">rent/year</span>
            <p className="text-xs font-display font-black text-primary-650 dark:text-primary-400 mt-1">
              ₦{listing.price.toLocaleString()}
            </p>
          </div>

          {/* Clean Agent Signature details */}
          {listing.agent && (
            <div className="flex items-center gap-1.5 max-w-[50%]">
              <div className="w-6.5 h-6.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500 dark:text-slate-400 overflow-hidden border border-slate-250 dark:border-slate-700 shadow-inner relative shrink-0">
                {(listing.agent as any).avatarUrl ? (
                  <img src={(listing.agent as any).avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  listing.agent.name.charAt(0)
                )}
              </div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate">
                {listing.agent.name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FavoritesPage = () => {
  const { user, favorites, setActiveTab, setCurrentListing, toggleFavorite } =
    useAuth();
  const { theme } = useTheme();

  const [activeChatListingIds, setActiveChatListingIds] = useState<(string | number)[]>([]);
  const [dbListings, setDbListings] = useState<Listing[]>([]);

  useEffect(() => {
    const listingsRef = collection(db, 'listings');
    const unsubscribe = onSnapshot(listingsRef, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Listing));
      setDbListings(fetched);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setActiveChatListingIds([]);
      return;
    }
    const conversationsRef = collection(db, "conversations");
    const fieldToFilter = user.role === "tenant" ? "tenantId" : "agentId";
    const q = query(conversationsRef, where(fieldToFilter, "==", user.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listingIds = snapshot.docs.map((doc) => {
        const id = doc.data().listingId;
        return /^\d+$/.test(id) ? parseInt(id) : id;
      });
      setActiveChatListingIds(Array.from(new Set(listingIds)));
    });

    return () => {
      unsubscribe();
      setActiveChatListingIds([]);
    };
  }, [user]);

  const savedListings = useMemo(() => {
    const allAvailable = [...dbListings, ...FEATURED_LISTINGS];
    // Deduplicate by ID
    const seenIds = new Set();
    const uniqueListings = allAvailable.filter(l => {
      if (seenIds.has(String(l.id))) return false;
      seenIds.add(String(l.id));
      return true;
    });
    return uniqueListings.filter((listing) =>
      favorites.includes(listing.id)
    );
  }, [favorites, dbListings]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col transition-colors duration-300"
    >
      {/* Premium Editorial Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-none px-4 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none">Your Bookmarks</span>
              <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Saved Properties
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-650 dark:text-slate-350">
              <span className="font-extrabold text-slate-900 dark:text-white">{savedListings.length}</span> {savedListings.length === 1 ? 'Property' : 'Properties'} saved
            </div>
            <button 
              onClick={() => setActiveTab('notifications')}
              className="p-2.5 relative hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-full transition-all duration-300 group border-[0.5px] border-slate-100 dark:border-[#0f172b] hover:border-slate-350 dark:hover:border-slate-800"
            >
              <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors" />
              <NotificationBadge />
            </button>
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <main className="w-full max-w-none px-4 pt-8 pb-0 flex-1 flex flex-col">
        {savedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-6 sm:gap-8">
            {savedListings.map((listing) => (
              <div 
                key={`fav-${listing.id}`} 
                className="relative"
              >
                {activeChatListingIds.includes(listing.id) && (
                  <div className="absolute top-3.5 left-3.5 z-20 bg-emerald-500 text-white p-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 border border-emerald-400" title="Active conversation">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider">Active Chat</span>
                  </div>
                )}
                <SavedListingCard 
                  listing={listing} 
                  onViewDetails={() => setCurrentListing(listing)}
                  onUnsave={() => toggleFavorite(listing.id, listing.agent?.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 max-w-md mx-auto">
            <div className="w-18 h-18 bg-white dark:bg-slate-900 border-[0.5px] border-slate-100 dark:border-[#0f172b] hover:border-slate-350 dark:hover:border-slate-800 shadow-md rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6 group-hover:scale-105 transition-all duration-300">
              <Bookmark className="w-7 h-7 text-primary-500" />
            </div>
            <h2 className="text-xl font-display font-extrabold text-slate-900 dark:text-white mb-2">
              No saved properties yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light mb-8">
              Explore our real-time coordinates, find your dream spaces on the interactive map, and keep your top property choices close at hand.
            </p>
            <button
              onClick={() => setActiveTab("home")}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/15 duration-200 transition-all flex items-center gap-2 active:scale-95"
            >
              Start Exploring <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </motion.div>
  );
};

export default FavoritesPage;
