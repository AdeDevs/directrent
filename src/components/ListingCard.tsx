import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Bookmark, ArrowUpRight, Star, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ui/ConfirmationModal';

import SafeImage from './SafeImage';

interface ListingCardProps {
  listing: Listing;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  hideHeart?: boolean;
  hideAgent?: boolean;
  isAgentView?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  hideHeart, 
  hideAgent, 
  isAgentView 
}) => {
  const { user, favorites, toggleFavorite } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isFav = favorites.includes(listing.id);

  return (
    <>
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={onViewDetails}
      className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-black/20 transition-all duration-300 flex flex-col h-full group cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage 
          src={listing.image} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
          {(() => {
            const isApproved = listing.isApproved === true || listing.isApproved === undefined;
            const isRecent = listing.isRecentlyAdded || (listing.createdAt && (Date.now() - (listing.createdAt.seconds * 1000) < 48 * 60 * 60 * 1000));
            
            if (isApproved && isRecent) {
              return (
                <span className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
                  Just Added
                </span>
              );
            }
            
            // If it's the agent's own listing and not approved
            if (user?.id && String(listing.agent?.id) === String(user.id) && listing.isApproved === false) {
              return (
                <span className="bg-amber-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
                  Pending Verification
                </span>
              );
            }
            
            return null;
          })()}
          {listing.slotsLeft && (
            <span className="bg-rose-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
              Only {listing.slotsLeft} Left
            </span>
          )}
        </div>
        {!hideHeart && !isAgentView && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id); }}
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer active:scale-90 ${isFav ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 shadow-lg shadow-primary-200/50 dark:shadow-none' : 'bg-white/30 dark:bg-slate-800/30 text-white hover:bg-white dark:hover:bg-slate-800 hover:text-primary-600 transition-colors'}`}
          >
            <Bookmark className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-current text-primary-600 dark:text-primary-400' : 'text-white'}`} />
          </button>
        )}
      </div>

      <div className="p-3 sm:p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start sm:items-center mb-1 sm:mb-2 gap-2">
          <h3 className="text-slate-900 dark:text-white text-xs sm:text-base font-display font-bold leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight">
            {listing.title}
          </h3>
          <div className="text-primary-600 dark:text-primary-400 font-bold text-[10px] sm:text-sm bg-primary-50 dark:bg-primary-900/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl whitespace-nowrap tracking-tighter shadow-sm">
            {listing.price}
          </div>
        </div>

        <div className="space-y-0.5 sm:space-y-0 mb-3 sm:mb-4">
          <div className="flex items-center gap-1 sm:gap-1.5 text-slate-500 dark:text-slate-400">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary-500" />
            <span className="text-[10px] sm:text-xs font-bold tracking-wide uppercase">{listing.location}</span>
          </div>
          {listing.landmark && (
            <p className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-semibold ml-4 sm:ml-5.5 tracking-tight lowercase -mt-0.5">
              {listing.landmark}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-4 sm:mb-5">
          {listing.amenities.slice(0, 3).map(amenity => (
            <span key={amenity} className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-wider border border-slate-100/50 dark:border-slate-700/50">
              {amenity}
            </span>
          ))}
        </div>

        {!hideAgent && !isAgentView && listing.agent && (
          <div className="pt-3 sm:pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 overflow-hidden border-2 border-slate-50 dark:border-slate-800 shadow-sm relative">
                {(listing.agent as any).avatarUrl ? (
                  <img src={(listing.agent as any).avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  listing.agent.name.charAt(0)
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px] sm:max-w-[100px]">{listing.agent.name}</span>
                  {listing.agent.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                </div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-2 h-2 fill-current" />
                  <span className="text-[8px] sm:text-[9px] font-bold tracking-tight uppercase">{listing.agent.rating} Rating</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center gap-1.5 sm:gap-2">
          {(!isAgentView && listing.verified) && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 sm:px-3 h-9 sm:h-11 rounded-lg sm:rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm cursor-default" title="Verified Property">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Verified</span>
            </div>
          )}
          {isAgentView ? (
            <div className="flex-1 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                className="flex-1 h-9 sm:h-11 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold text-white bg-primary-600 hover:bg-primary-700 uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                Edit
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowDeleteModal(true);
                }}
                className="px-3 sm:px-4 h-9 sm:h-11 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 hover:bg-rose-600 hover:text-white uppercase tracking-widest transition-all flex items-center justify-center active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
          ) : (
            <button 
              onClick={onViewDetails}
              className="flex-1 h-9 sm:h-11 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm border border-primary-100 dark:border-primary-800 cursor-pointer active:scale-[0.98]"
            >
              View <span className="hidden sm:inline">Details</span> <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

    </motion.div>
    <ConfirmationModal
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      onConfirm={onDelete || (() => {})}
      title="Delete Listing"
      message="Are you sure you want to delete this property listing? This action cannot be undone and will remove it from all searches."
      confirmText="Delete Now"
      cancelText="Keep Listing"
      variant="danger"
    />
    </>
  );
};

export default ListingCard;
