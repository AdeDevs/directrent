import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Sliders, MapPin, FilterX } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { FEATURED_LISTINGS } from '../data';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [maxBudget, setMaxBudget] = useState(1500000); // Set to max initially
  const [showFilters, setShowFilters] = useState(false);
  const { setCurrentListing } = useAuth();

  const filters = ['All', 'Self-Contain', '1 Bedroom Flat', 'Shared'];

  const filteredListings = useMemo(() => {
    return FEATURED_LISTINGS.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             listing.amenities.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'All' || listing.type === activeFilter;
      const matchesBudget = listing.priceValue <= maxBudget;
      return matchesSearch && matchesFilter && matchesBudget;
    });
  }, [searchQuery, activeFilter, maxBudget]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
    setMaxBudget(1500000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      className="space-y-8"
    >
      {/* Search and Advanced Filter Section */}
      <div className="space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary-500 transition-all" />
          <input 
            type="text" 
            placeholder="Search area, landmark, or features (e.g. Solar, Water)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-3xl py-4 pl-12 pr-4 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all text-sm shadow-sm placeholder:text-slate-300"
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-2xl transition-all cursor-pointer ${showFilters ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 space-y-6 overflow-hidden"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Type</label>
                  {(searchQuery || activeFilter !== 'All' || maxBudget < 1500000) && (
                    <button onClick={clearFilters} className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer">
                      <FilterX className="w-3 h-3" /> Reset Filters
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {filters.map(filter => (
                    <button 
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${activeFilter === filter ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maximum Annual Budget</label>
                  <div className="text-sm font-bold text-primary-600 flex items-center gap-1">
                    <span className="text-[10px] opacity-60">UP TO</span> ₦{maxBudget.toLocaleString()}
                  </div>
                </div>
                <input 
                  type="range" 
                  min="50000" 
                  max="1500000" 
                  step="50000"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-wider px-1">
                  <span>₦50k</span>
                  <span>₦500k</span>
                  <span>₦1M</span>
                  <span>₦1.5M+</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Available Listings</h1>
        <button onClick={clearFilters} className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline transition-all cursor-pointer">
          Show all
        </button>
      </div>

      {/* Responsive Grid Layout - 1 col on small phones, 2 on wide/tablets, 3 on desktop, max 4 on ultra-wide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {filteredListings.length > 0 ? (
          filteredListings.map((listing, i) => (
            <ListingCard 
              key={`${listing.id}-${i}`} 
              listing={listing} 
              onViewDetails={() => setCurrentListing(listing)}
            />
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <div>
              <p className="text-slate-900 font-bold">No matches found</p>
              <p className="text-slate-400 text-xs mt-1">Try adjusting your budget or search terms</p>
            </div>
            <button 
              onClick={clearFilters}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Home;
