import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Heart, ArrowRight, Star, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';

import SafeImage from './SafeImage';

interface ListingCardProps {
  listing: Listing;
  onViewDetails?: () => void;
  hideHeart?: boolean;
  hideAgent?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onViewDetails, hideHeart, hideAgent }) => {
  const { favorites, toggleFavorite } = useAuth();
  const isFav = favorites.includes(listing.id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={onViewDetails}
      className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 flex flex-col h-full group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage 
          src={listing.image} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
          {listing.isRecentlyAdded && (
            <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
              Recently Added
            </span>
          )}
          {listing.slotsLeft && (
            <span className="bg-rose-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
              Only {listing.slotsLeft} Left
            </span>
          )}
        </div>
        {!hideHeart && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${isFav ? 'bg-red-50 text-red-500 shadow-lg shadow-red-200/50' : 'bg-white/30 text-white hover:bg-white hover:text-red-50'}`}
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-current text-red-500' : 'text-white'}`} />
          </button>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-2 gap-2">
          <h3 className="text-slate-900 sm:text-base font-bold leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight">
            {listing.title}
          </h3>
          <div className="text-primary-600 font-bold text-xs sm:text-sm bg-primary-50 px-3 py-1 rounded-xl whitespace-nowrap tracking-tighter shadow-sm">
            {listing.price}
          </div>
        </div>

        <div className="space-y-0 mb-4">
          <div className="flex items-center gap-1.5 text-slate-500">
            <MapPin className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-bold tracking-wide uppercase">{listing.location}</span>
          </div>
          {listing.landmark && (
            <p className="text-[11px] text-slate-400 font-semibold ml-5.5 tracking-tight lowercase -mt-0.5">
              {listing.landmark}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {listing.amenities.slice(0, 3).map(amenity => (
            <span key={amenity} className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[9px] font-bold uppercase tracking-wider border border-slate-100/50">
              {amenity}
            </span>
          ))}
        </div>

        {!hideAgent && listing.agent && (
          <div className="pt-4 border-t border-slate-50 flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden border-2 border-slate-50 shadow-sm">
                {listing.agent.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">{listing.agent.name}</span>
                  {listing.agent.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                </div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-2 h-2 fill-current" />
                  <span className="text-[9px] font-bold tracking-tight uppercase">{listing.agent.rating} Rating</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center gap-2">
          {listing.verified && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 h-11 rounded-xl border border-emerald-100 shadow-sm cursor-default" title="Verified Property">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Verified</span>
            </div>
          )}
          <button 
            onClick={onViewDetails}
            className="flex-1 h-11 rounded-xl text-[11px] font-bold text-primary-600 bg-primary-50 hover:bg-primary-600 hover:text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm border border-primary-100 cursor-pointer"
          >
            View Details <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ListingCard;
