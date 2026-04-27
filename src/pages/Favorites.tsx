import React, { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Grid, Bookmark, MapPin, ArrowRight, MessageCircle, Bell } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { FEATURED_LISTINGS } from "../data";
import { Listing } from "../types";
import SafeImage from "../components/SafeImage";
import NotificationBadge from "../components/NotificationBadge";

const FavoritesPage = () => {
  const { user, favorites, setActiveTab, setCurrentListing, toggleFavorite } =
    useAuth();

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
    if (!user) return;
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

    return () => unsubscribe();
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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="w-full max-w-full px-2 md:px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => setActiveTab("profile")}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Saved Properties
            </h1>
          </div>
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group mr-1"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 transition-colors" />
            <NotificationBadge />
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <main
        className="pt-[72px] px-[15px] w-full pb-[100px] transition-all duration-300"
        style={{ paddingTop: 20}}
      >
        {savedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
            {savedListings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentListing(listing)}
                className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col cursor-pointer group hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-black/20 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <SafeImage
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(listing.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer z-10"
                  >
                    <Bookmark className={`w-4 h-4 transition-colors ${favorites.includes(listing.id) ? 'fill-current' : ''}`} />
                  </button>
                  {activeChatListingIds.includes(listing.id) && (
                    <div className="absolute top-3 left-3 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-white dark:border-slate-800" title="Active conversation">
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] sm:text-xs font-black text-primary-600 dark:text-primary-400">
                      {listing.price}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex flex-col gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-primary-600 transition-colors truncate">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-500 shrink-0" />
                    <span className="truncate">{listing.location}</span>
                  </div>
                  <div className="mt-2 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all">
                      View Details
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-200 dark:text-slate-700 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20 px-8">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
              <Bookmark className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              No saved properties yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto mb-8">
              Start exploring listings and bookmark the ones you love to keep them
              here.
            </p>
            <button
              onClick={() => setActiveTab("home")}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary-600 dark:hover:bg-primary-400 transition-all flex items-center gap-2 shadow-lg shadow-black/10"
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
