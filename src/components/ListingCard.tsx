import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Bookmark, ArrowUpRight, Star, BadgeCheck, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ui/ConfirmationModal';
import FullscreenGallery from './FullscreenGallery';

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

const ListingCard: React.FC<ListingCardProps> = React.memo(({ 
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const isFav = favorites.includes(listing.id);
  const isAgent = user?.role === 'agent';

  const images = listing.images && listing.images.length > 0 ? listing.images : [listing.image];
  const hasMultipleImages = images.length > 1;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderBadges = () => {
    const isApproved = listing.isApproved === true || listing.isApproved === undefined;
    const isRecent = listing.isRecentlyAdded || (listing.createdAt && (Date.now() - ((listing.createdAt.seconds || 0) * 1000) < 24 * 60 * 60 * 1000));
    const badges = [];

    if (isApproved && isRecent) {
      badges.push(
        <span key="badge-recent" className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
          Just Added
        </span>
      );
    }
    
    if (!listing.verified) {
      badges.push(
        <span key="badge-unverified" className="bg-amber-500 text-slate-950 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 border border-amber-650/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Unverified</span>
        </span>
      );
    }

    if (user?.id && String(listing.agent?.id) === String(user.id) && listing.isApproved === false) {
      badges.push(
        <span key="badge-pending" className="bg-amber-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
          Pending Verification
        </span>
      );
    }

    return badges;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="h-full w-full"
    >
      <div 
      onClick={onViewDetails}
      className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-[0.5px] border-slate-200 dark:border-[#0f172b] hover:border-slate-400 dark:hover:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-200/45 dark:hover:shadow-black/25 transition-all duration-300 flex flex-col h-full group cursor-pointer relative"
    >
      <div className="relative aspect-[4/3] overflow-hidden group/image">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <SafeImage 
              src={images[currentImageIndex]} 
              alt={listing.title} 
              className="w-full h-full object-cover group-hover/image:scale-[1.04] transition-transform duration-700 ease-out"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-80 group-hover/image:opacity-60 transition-opacity" />

        {hasMultipleImages && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/95 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-full backdrop-blur-md opacity-0 group-hover/image:opacity-100 shadow-md transition-all hover:bg-white hover:scale-105 z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/95 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-full backdrop-blur-md opacity-0 group-hover/image:opacity-100 shadow-md transition-all hover:bg-white hover:scale-105 z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-slate-950/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {images.map((_, idx) => (
                <div 
                  key={`dot-${listing.id}-${idx}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>

            <div 
              onClick={(e) => { e.stopPropagation(); setIsGalleryOpen(true); }}
              className="absolute top-3 right-12 px-2.5 py-1 bg-slate-950/60 backdrop-blur-xl rounded-full text-[8px] font-black text-white uppercase tracking-wider opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center gap-1.5 hover:bg-slate-950/80 border border-white/10"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              {currentImageIndex + 1} / {images.length} Photos
            </div>
          </>
        )}
        <div className="absolute top-3.5 left-3.5 flex flex-col items-start gap-1.5">
          {renderBadges()}
          {!!listing.slotsLeft && (
            <span className="bg-rose-500 text-white px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1 border border-rose-450/20">
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
              <span>Only {listing.slotsLeft} Left</span>
            </span>
          )}
        </div>
        {!hideHeart && !isAgentView && !isAgent && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id, listing.agent?.id); }}
            className={`absolute top-3.5 right-3.5 p-2 rounded-full backdrop-blur-xl shadow-md transition-all cursor-pointer active:scale-95 ${isFav ? 'bg-primary-600 text-white border border-primary-500' : 'bg-white/70 hover:bg-white text-slate-800 border border-white/20'}`}
          >
            <Bookmark className={`w-4 h-4 transition-colors ${isFav ? 'fill-current text-white' : 'text-slate-850'}`} />
          </button>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 bg-white dark:bg-slate-900 border-t-[0.5px] border-slate-200 dark:border-[#0f172b]/50">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="text-slate-900 dark:text-white text-base font-display font-extrabold leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-450 transition-colors tracking-tight line-clamp-1">
            {listing.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-3.5">
          <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <span className="text-[11px] font-bold tracking-wide uppercase truncate">{listing.location}</span>
          {listing.landmark && (
            <span className="text-[11px] text-slate-450 dark:text-slate-500 truncate font-medium">• {listing.landmark}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4.5">
          {(listing.amenities || []).slice(0, 3).map((amenity, idx) => (
            <span key={`card-amenity-${listing.id}-${amenity}-${idx}`} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/80 text-slate-550 dark:text-slate-350 rounded-full text-[9px] font-bold uppercase tracking-wider border border-slate-250 dark:border-slate-700/60">
              {amenity}
            </span>
          ))}
        </div>

        {!hideAgent && !isAgentView && listing.agent && (
          <div className="pt-4 border-t-[0.5px] border-slate-200 dark:border-[#0f172b]/60 flex items-center justify-between mb-4.5">
            <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity">
              <div className="w-8.5 h-8.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 overflow-hidden border border-slate-250 dark:border-slate-800 shadow-inner relative">
                {(listing.agent as any).avatarUrl ? (
                  <img src={(listing.agent as any).avatarUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  listing.agent.name.charAt(0)
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{listing.agent.name}</span>
                  {listing.agent.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-0.5 text-amber-500 mt-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span className="text-[9px] font-black tracking-tight uppercase leading-none">{listing.agent.rating} Rating</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Beautiful bottom details and pricing bar - Stacks beautifully on long prices */}
        <div className="mt-auto pt-4 border-t-[0.5px] border-slate-200 dark:border-[#0f172b]/60 flex flex-col justify-between gap-4 bg-transparent">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
              {listing.initialPayment ? '1st Pay / Deposit' : (
                listing.paymentPeriod === 'monthly' ? 'Monthly Rent' :
                listing.paymentPeriod === 'quarterly' ? 'Quarterly Rent' :
                listing.paymentPeriod === 'bi-annually' ? 'Semi-Annual Rent' :
                listing.paymentPeriod === 'custom' ? 'Custom Lease' : 'Annual Rent'
              )}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-900 dark:text-white font-sans font-black text-base sm:text-lg leading-none tracking-tight break-all">
                {listing.initialPayment || listing.price}
                {!listing.initialPayment && (
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-0.5 uppercase">
                    /{listing.paymentPeriod === 'monthly' ? 'mo' :
                      listing.paymentPeriod === 'quarterly' ? 'qt' :
                      listing.paymentPeriod === 'bi-annually' ? '6mo' :
                      listing.paymentPeriod === 'custom' ? 'term' : 'yr'}
                  </span>
                )}
              </span>
              
              {(!isAgentView && listing.verified) && (
                <div className="flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-750 dark:text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-900/30 shadow-none gap-0.5 leading-none shrink-0" title="Verified Property">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-black uppercase tracking-wider">Verified</span>
                </div>
              )}
            </div>
            {listing.initialPayment && (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-tight mt-1 leading-none">
                Subseq: <span className="text-slate-700 dark:text-slate-300 font-extrabold">{listing.subsequentPayment}</span>/
                {listing.paymentPeriod === 'monthly' ? 'mo' :
                 listing.paymentPeriod === 'quarterly' ? 'qt' :
                 listing.paymentPeriod === 'bi-annually' ? '6mo' :
                 listing.paymentPeriod === 'custom' ? 'term' : 'yr'}
                {listing.leaseDuration && ` | ${listing.leaseDuration}`}
              </span>
            )}
          </div>

          <div className="flex items-center w-full mt-2">
            {isAgentView ? (
              <div className="flex gap-1.5 w-full">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                  className="flex-1 h-9.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-150/85 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                  Edit
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowDeleteModal(true);
                  }}
                  className="flex-1 h-9.5 px-3 rounded-xl text-xs font-bold text-rose-650 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border border-rose-150 dark:border-rose-900 uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                  Delete
                </button>
              </div>
            ) : (
              <button 
                onClick={onViewDetails}
                className="w-full h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-primary-600 hover:bg-primary-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary-500/10 active:scale-95 cursor-pointer"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
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
    <FullscreenGallery 
      isOpen={isGalleryOpen}
      onClose={() => setIsGalleryOpen(false)}
      images={images}
      video={listing.video}
      initialIndex={currentImageIndex}
    />
    </motion.div>
  );
});

export default ListingCard;
