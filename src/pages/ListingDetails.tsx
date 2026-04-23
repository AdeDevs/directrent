import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Heart, MapPin, BadgeCheck, Star, 
  ShieldCheck, Share, MessageSquare, Home, BedDouble, Bath,
  Navigation, ExternalLink
} from 'lucide-react';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import ChatModal from '../components/ChatModal';
import { FEATURED_LISTINGS } from '../data';
import { useAuth } from '../context/AuthContext';

import SafeImage from '../components/SafeImage';

interface ListingDetailsProps {
  listing: Listing;
  onBack: () => void;
}

const ListingDetails: React.FC<ListingDetailsProps> = ({ listing, onBack }) => {
  const { setCurrentListing, user, setView, setAuthMode, setSelectedAgentId, favorites, toggleFavorite } = useAuth();
  const [activeMedia, setActiveMedia] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isFavorite = favorites.includes(listing.id);
  
  // Recommended listings (exclude current, pick 3)
  const recommended = FEATURED_LISTINGS.filter(l => l.id !== listing.id).slice(0, 3);
  
  // Scroll to top when a new listing is selected
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [listing.id]);

  const handleMessageClick = () => {
    if (!user) {
      setAuthMode('login');
      setView('auth');
      return;
    }
    setIsChatOpen(true);
  };

  const images = listing.images && listing.images.length > 0 
    ? listing.images 
    : [listing.image];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full transition-colors duration-300"
    >
      {/* Chat Modal Integration */}
      {user && (
        <ChatModal 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          listing={listing} 
          currentUser={user} 
        />
      )}

      {/* Media Carousel (Header) */}
      <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-slate-900 overflow-hidden shadow-sm">
        {/* Top Header Buttons overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-2 md:pt-3 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all cursor-pointer shadow-sm">
              <Share className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(listing.id);
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-sm ${isFavorite ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
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
            <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
              <SafeImage src={img} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-full bg-black/30 backdrop-blur-sm z-20">
           {images.map((_, idx) => (
             <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === activeMedia ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
           ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 md:py-6 flex flex-col md:flex-row gap-10">
        
        {/* Left Column: Details */}
        <div className="flex-1 space-y-8 md:space-y-10">
          
          {/* Universal Title Header */}
          <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
             <div>
               <div className="inline-block px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-lg mb-3 md:mb-4">
                 {listing.type}
               </div>
               <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-2 md:mb-3">
                 {listing.title}
               </h1>
               <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1 cursor-default">
                 <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                   <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary-500" />
                   <span className="text-sm md:text-base font-medium">{listing.location}</span>
                 </div>
                 <button 
                  onClick={() => {
                    const destination = encodeURIComponent(`${listing.location}, ${listing.landmark || ''}, Nigeria`);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 text-slate-700 dark:text-slate-300 hover:text-primary-700 dark:hover:text-primary-400 rounded-xl text-[10px] md:text-xs font-bold transition-all cursor-pointer w-fit shadow-sm active:scale-95"
                >
                  <Navigation className="w-3 h-3 text-primary-500" />
                  Get Directions
                </button>
               </div>
             </div>
             <div className="text-left md:text-right mt-2 md:mt-0">
               <div className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 tracking-tight">{listing.price}</div>
               <div className="text-xs md:text-sm font-semibold text-slate-400 dark:text-slate-500 mt-0.5 md:mt-1">per year</div>
             </div>
          </div>

           {/* Mobile Fast Action Agent / Message */}
           {listing.agent && (
              <div 
                onClick={() => setSelectedAgentId(listing.agent!.id!)}
                className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer active:opacity-75 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                    {listing.agent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                      {listing.agent.name}
                      {listing.agent.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-500 fill-current" /> {listing.agent.rating} Rating
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMessageClick();
                  }}
                  className="w-12 h-12 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-200/50 flex items-center justify-center hover:bg-primary-700 transition-colors cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
           )}

          {/* Property Overview */}
          <div className="py-6 border-y border-slate-200 dark:border-slate-800 mt-2 mb-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                   <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Type</div>
                   <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">{listing.type}</div>
                </div>
              </div>
              
              {listing.beds && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <div>
                     <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Bedrooms</div>
                     <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">{listing.beds} Bed</div>
                  </div>
                </div>
              )}

              {listing.baths && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <Bath className="w-5 h-5" />
                  </div>
                  <div>
                     <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Bathrooms</div>
                     <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">{listing.baths} Bath</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                     <div className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 font-bold uppercase tracking-wider leading-none mb-1">Verified</div>
                     <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-none">Yes</div>
                  </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-3 md:mb-4">Description</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
              {listing.description || `Experience comfortable living in this highly sought-after ${listing.type.toLowerCase()} located in the heart of ${listing.location}. This property offers an excellent blend of convenience, security, and affordability, perfectly suited for young professionals and students. Don't miss out on this verified listing!`}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-3 md:mb-4">Amenities & Features</h2>
            <div className="flex flex-wrap gap-2.5 md:gap-3">
              {listing.amenities.map(amenity => (
                <div key={amenity} className="flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-colors transition-shadow">
                  <BadgeCheck className="w-4 h-4 text-primary-500" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Sticky Sidebar for Desktop */}
        <div className="hidden md:block w-full md:w-[350px] flex-shrink-0">
          <div className="sticky top-24 flex flex-col gap-6 lg:gap-8 transition-all duration-300">
            
            {/* Agent Bento Card */}
            {listing.agent && (
              <div 
                onClick={() => setSelectedAgentId(listing.agent!.id!)}
                className="bg-slate-900 dark:bg-slate-925 p-6 lg:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500/50 transition-all active:scale-[0.98]"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Listed By</h2>
                
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-xl font-bold text-primary-600 shadow-inner flex-shrink-0 font-sans">
                    {listing.agent.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white truncate w-full">{listing.agent.name}</span>
                      {listing.agent.isVerified && <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg inline-flex">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] uppercase tracking-wider font-bold">{listing.agent.rating} Verification</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 relative z-10 w-full">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessageClick();
                    }}
                    className="w-full bg-primary-600 text-white h-12 rounded-xl font-bold text-sm shadow-xl shadow-primary-500/20 hover:bg-primary-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" /> Message Agent
                  </button>
                </div>
              </div>
            )}

            {/* Safety Banner */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-5 rounded-3xl flex flex-col lg:flex-row gap-4 items-start text-blue-900 dark:text-blue-300 transition-colors">
               <ShieldCheck className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
               <p className="text-sm font-medium leading-relaxed opacity-90">
                 DirectRent protects your payments. Never wire money or pay an agent directly before inspecting the property holding a verified slip.
               </p>
            </div>

          </div>
        </div>
      </div>

      {/* Recommended Section */}
      <div className="w-full border-t border-slate-200 dark:border-slate-800 mt-4 md:mt-8 flex-1 flex flex-col transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-10 pb-24 md:pt-16 md:pb-36 lg:pb-44 w-full flex-1" style={{paddingBottom:"10px"}}>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-8">
            Similar properties you might like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {recommended.map(recListing => (
              <ListingCard 
                key={recListing.id}
                listing={recListing}
                onViewDetails={() => setCurrentListing(recListing)}
              />
            ))}
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default ListingDetails;
