import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Settings2, MapPin, FilterX, Home as HomeIcon, Trash2, Bell, Map, LayoutGrid, Navigation } from 'lucide-react';
import { Map as PigeonMap, Marker, ZoomControl } from 'pigeon-maps';
import ListingCard from '../components/ListingCard';
import { FEATURED_LISTINGS } from '../data';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Listing, Notification } from '../types';
import NotificationBadge from '../components/NotificationBadge';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [maxBudget, setMaxBudget] = useState(1000000000); // Set to max initially
  const [showFilters, setShowFilters] = useState(false);
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  const [isMapView, setIsMapView] = useState(false);
  const { user, setCurrentListing, setActiveTab } = useAuth();

  useEffect(() => {
    const listingsRef = collection(db, 'listings');
    const q = query(listingsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id as any,
        ...doc.data()
      } as Listing)).sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setDbListings(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'listings');
    });

    return () => unsubscribe();
  }, []);

  const isAgent = user?.role === 'agent';

  const filters = ['All', 'Self-Contain', '1 Bedroom Flat', 'Shared'];

  const filteredListings = useMemo(() => {
    // Merge static listings with DB ones
    let baseListings = [...dbListings, ...FEATURED_LISTINGS];
    
    // Deduplicate by ID
    const seenIds = new Set();
    baseListings = baseListings.filter(l => {
      if (seenIds.has(String(l.id))) return false;
      seenIds.add(String(l.id));
      return true;
    });
    
    // Sort merged listings by id or date? DB ones are already sorted by date in query
    
    // Filter based on user role and approval status
    if (isAgent && user) {
      // Agents ONLY see their OWN approved listings on Home
      baseListings = baseListings.filter(l => 
        l.agent?.id && String(l.agent.id) === String(user.id) && (l.isApproved === true || l.isApproved === undefined)
      );
    } else {
      // Tenants see approved DB listings AND all Featured listings
      // Using a more robust check for isApproved
      baseListings = baseListings.filter(l => {
        const approved = l.isApproved === true || String(l.isApproved) === 'true' || l.isApproved === undefined;
        return approved;
      });
    }

    return baseListings.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             listing.amenities.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'All' || listing.type === activeFilter;
      const matchesBudget = listing.priceValue <= maxBudget;
      return matchesSearch && matchesFilter && matchesBudget;
    });
  }, [searchQuery, activeFilter, maxBudget, isAgent, user?.id, dbListings]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
    setMaxBudget(1000000000);
  };

  const handleDelete = async (listingId: string | number) => {
    const idStr = String(listingId);
    try {
      await deleteDoc(doc(db, 'listings', idStr));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `listings/${idStr}`);
    }
  };

  const [isSavingSearch, setIsSavingSearch] = useState(false);

  const handleSaveSearch = async () => {
    if (!user) return;
    setIsSavingSearch(true);
    try {
      await addDoc(collection(db, 'saved_searches'), {
        userId: user.id,
        query: searchQuery,
        type: activeFilter,
        maxPrice: maxBudget,
        createdAt: serverTimestamp()
      });
      // Trigger a local notification or toast
      alert('Search alert saved! We will notify you when matching properties are posted.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'saved_searches');
    } finally {
      setIsSavingSearch(false);
    }
  };

  const showSaveSearch = !isAgent && (searchQuery || activeFilter !== 'All' || maxBudget < 1000000000);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="w-full max-w-full px-2 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <HomeIcon className="text-white w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white tracking-tight">Direct<span className="text-primary-600">Rent</span></span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMapView(!isMapView)}
              className={`p-2 rounded-full transition-all flex items-center justify-center ${isMapView ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
              title={isMapView ? "Switch to Grid View" : "Switch to Map View"}
            >
              {isMapView ? <LayoutGrid className="w-5 h-5" /> : <Map className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 transition-colors" />
              <NotificationBadge />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-[60px] sm:pt-[72px] px-[15px] pb-[0px]" style={{paddingTop: '16px'}}>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }} 
          className="w-full space-y-6 sm:space-y-10"
        >
          {/* Search and Advanced Filter Section */}
          <div className="space-y-4 sm:space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-400 group-focus-within:text-primary-500 transition-all" />
          <input 
            type="text" 
            placeholder="Search area or landmark..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-xs sm:text-sm shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 dark:text-white"
          />
          <button 
            onClick={() => {
              setShowFilters(!showFilters);
              if (!showFilters && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(10);
              }
            }}
            className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg sm:rounded-2xl transition-all cursor-pointer ${showFilters ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-black/20 space-y-4 sm:space-y-6 overflow-hidden"
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Property Type</label>
                  {(searchQuery || activeFilter !== 'All' || maxBudget < 1000000000) && (
                    <button onClick={clearFilters} className="text-[9px] sm:text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer">
                      <FilterX className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {filters.map(filter => (
                    <button 
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-2xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${activeFilter === filter ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Maximum Annual Budget</label>
                  <div className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    <span className="text-[9px] opacity-60">UP TO</span> ₦{maxBudget.toLocaleString()}
                  </div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1000000000" 
                  step="500000"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(parseInt(e.target.value))}
                  className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[8px] sm:text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider px-1">
                  <span>₦0</span>
                  <span>₦5M</span>
                  <span>₦500M</span>
                  <span>₦1B+</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          {isAgent ? 'Your Listings' : 'Available Listings'}
        </h1>
        <div className="flex items-center gap-3">
          {showSaveSearch && (
            <button 
              onClick={handleSaveSearch}
              disabled={isSavingSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary-100 dark:border-primary-800/50 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-3 h-3" /> {isSavingSearch ? 'Saving...' : 'Save Alert'}
            </button>
          )}
          {filteredListings.length > 0 && (
            <button onClick={clearFilters} className="text-[9px] sm:text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline transition-all cursor-pointer">
              Show all
            </button>
          )}
        </div>
      </div>

      {/* Responsive Grid Layout / Map View */}
      <AnimatePresence mode="wait">
        {isMapView ? (
          <motion.div 
            key="map-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full h-[600px] rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl relative"
          >
            <PigeonMap 
              defaultCenter={[6.5244, 3.3792]} // Lagos center
              defaultZoom={11}
              boxClassname="pigeon-filters"
            >
              <ZoomControl />
              {filteredListings.map(listing => (
                <Marker 
                  // @ts-ignore
                  key={listing.id} 
                  width={50}
                  anchor={[6.5244 + (Math.random() - 0.5) * 0.1, 3.3792 + (Math.random() - 0.5) * 0.1]} // Random offset around Lagos for demo
                  onClick={() => setCurrentListing(listing)}
                >
                  <div className="group relative">
                    <div className="bg-primary-600 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-lg shadow-primary-500/40 transform -translate-y-full mb-1 flex items-center gap-1 group-hover:scale-110 transition-transform">
                      ₦{listing.priceValue >= 1000000 ? `${(listing.priceValue / 1000000).toFixed(1)}M` : `${(listing.priceValue / 1000).toFixed(0)}k`}
                    </div>
                    <div className="w-4 h-4 bg-primary-600 border-2 border-white dark:border-slate-900 rounded-full shadow-lg m-auto" />
                  </div>
                </Marker>
              ))}
            </PigeonMap>
            <div className="absolute top-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Discover Area</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Viewing {filteredListings.length} matching properties in this area.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
            {filteredListings.length > 0 ? (
              filteredListings.map((listing, i) => (
                <ListingCard 
                  key={`${listing.id}-${i}`} 
                  listing={listing} 
                  onViewDetails={() => setCurrentListing(listing)}
                  isAgentView={isAgent}
                  onEdit={() => {
                    setCurrentListing(listing);
                    setActiveTab('create');
                  }}
                  onDelete={() => handleDelete(listing.id)}
                />
              ))
            ) : (
              <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  {isAgent ? <HomeIcon className="w-10 h-10 text-slate-200 dark:text-slate-700" /> : <Search className="w-10 h-10 text-slate-200 dark:text-slate-700" />}
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold">{isAgent ? "You have no listings yet" : "No matches found"}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    {isAgent ? "Start by posting your first property to find tenants" : "Try adjusting your budget or search terms"}
                  </p>
                </div>
                <button 
                  onClick={isAgent ? () => setActiveTab('create') : clearFilters}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                >
                  {isAgent ? "Post a Listing" : "Clear all filters"}
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  </main>
</div>
  );
};

export default Home;