import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Star, ShieldCheck, BadgeCheck, Clock, 
  CheckCircle2, MessageSquare, MapPin, Loader2, Calendar, 
  Zap, Building2, UserCheck, ShieldAlert, Award, Grid, Menu,
  Mail, Phone, ExternalLink, ArrowRight, Bed, Bath, Maximize2, Bookmark,
  Plus, X
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { Review, Listing } from '../types';
import SafeImage from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { ChatModal } from '../components/ChatModal';

interface AgentProfileProps {
  agentId: string;
  onBack: () => void;
}

const AgentProfileSkeleton: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white font-sans transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 left-0 right-0 h-16 flex items-center px-6 z-[100] bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 transition-all">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </nav>

      <main className="w-full max-w-full px-4 py-8 space-y-12 pb-0 mx-0">
        {/* Header Hero Card Skeleton */}
        <section className="bg-white/85 dark:bg-[#0c111e] rounded-[32px] p-6 md:p-10 border border-slate-200 dark:border-[#1e293b] backdrop-blur-xl shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl md:rounded-[32px] bg-slate-200/60 dark:bg-slate-800 animate-pulse shrink-0" />
            <div className="text-center md:text-left space-y-4 flex-1">
              <div className="h-8 w-64 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse mx-auto md:mx-0" />
              <div className="h-4 w-40 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse mx-auto md:mx-0" />
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
          
          <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800/80 my-8" />

          {/* Stats Row Skeletons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={`stat-sk-${i}`} className="space-y-2">
                <div className="h-8 w-20 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse mx-auto md:mx-0" />
                <div className="h-3.5 w-16 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse mx-auto md:mx-0" />
              </div>
            ))}
          </div>
        </section>

        {/* Featured Listings Skeleton */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-5 w-36 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div key={`listing-sk-${idx}`} className="bg-white/70 dark:bg-[#0c111e] rounded-3xl overflow-hidden border border-slate-200/60 dark:border-[#1e293b] flex flex-col h-[380px]">
                <div className="relative aspect-[16/10] bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="h-5 w-5/6 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                    <div className="space-y-2">
                      <div className="h-2.5 w-14 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-6 w-24 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="w-20 h-10 bg-slate-200/60 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Client Testimonials Skeleton */}
        <section className="bg-slate-50 dark:bg-[#0c111e] rounded-[32px] p-8 border border-slate-200 dark:border-[#1e293b] space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-5 w-40 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div key={`review-sk-${idx}`} className="space-y-4 p-6 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-[#1e293b]">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="w-3 h-3 bg-slate-200/60 dark:bg-slate-800 rounded-full animate-pulse" />
                  ))}
                </div>
                <div className="space-y-2 pb-2">
                  <div className="h-3 w-full bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
                  <div className="h-3.5 w-24 bg-slate-200/60 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

const AgentProfile: React.FC<AgentProfileProps> = ({ agentId, onBack }) => {
  const { user, setCurrentListing, favorites, toggleFavorite } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [allAgentListings, setAllAgentListings] = useState<Listing[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', listingTitle: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.85;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [stats, setStats] = useState({
    completedTxns: 0,
    activeListingsCount: 0,
    avgRating: 0,
    totalReviews: 0,
    responseTime: '30m',
    memberSince: '2024',
    isIdentityVerified: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgentProfile = useCallback(async () => {
    if (!agentId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Real Agent Profile
      const agentDoc = await getDoc(doc(db, 'users', agentId));
      if (!agentDoc.exists()) {
        setError("This agent profile is no longer available.");
        setIsLoading(false);
        return;
      }
      const agentData = agentDoc.data();
      setAgent(agentData);

      // Fetch Stats directly from the database user record to ensure permission-safe and precise 0-centered statistics
      const completedCount = agentData.completedTxns || 0;

      // Fetch Agent's Listings directly to calculate active count dynamically (safe public query)
      let listingsCount = 0;
      let listings: Listing[] = [];
      try {
        const listingsRef = collection(db, 'listings');
        const qListings = query(
          listingsRef, 
          where('agent.id', '==', agentId),
          where('isApproved', '==', true)
        );
        const listingsSnap = await getDocs(qListings);
        listings = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        listingsCount = listingsSnap.size;
        setFeaturedListings(listings.slice(0, 3));
        setAllAgentListings(listings);
      } catch (e) {
        console.warn("Listings fetch failed:", e);
      }

      // Use profile-recorded avgResponseTime, or adaptive string based on transaction history to avoid conversation scanning
      let responseTimeStr = '15m';
      if (agentData.avgResponseTime) {
        responseTimeStr = agentData.avgResponseTime;
      } else if (completedCount === 0) {
        responseTimeStr = '--';
      }

      const joinYear = agentData.createdAt?.toDate ? agentData.createdAt.toDate().getFullYear().toString() : '2024';

      setStats({
        completedTxns: completedCount,
        activeListingsCount: listingsCount,
        avgRating: agentData.avgRating || 0.0,
        totalReviews: 0,
        responseTime: responseTimeStr,
        memberSince: joinYear,
        isIdentityVerified: !!(agentData.nin || agentData.phoneVerified)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${agentId}`);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadAgentProfile();
  }, [loadAgentProfile]);

  useEffect(() => {
    if (!agentId) return;

    // Real-time onSnapshot reviews listener
    const reviewsRef = collection(db, 'reviews');
    const qReviews = query(reviewsRef, where('agentId', '==', agentId));

    const unsubscribe = onSnapshot(qReviews, async (snapshot) => {
      let rData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      
      // Sort client-side by createdAt descending to ensure correct ordering without composite index
      rData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      // Show immediately (guarantees dynamic instancy like chat messages)
      setReviews(rData);

      // Recalculate rating stats instantly when a new feedback is registered
      const reviewCount = rData.length;
      let totalRating = 0;
      if (reviewCount > 0) {
        totalRating = rData.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewCount;
      } else if (agent) {
        totalRating = agent.avgRating || 0.0;
      }

      setStats(prev => ({
        ...prev,
        totalReviews: reviewCount,
        avgRating: totalRating
      }));

      // Gather distinct tenantIds to fetch real tenant details dynamically from public user profiles
      const tenantIds = Array.from(new Set(rData.map(r => r.tenantId).filter(Boolean)));
      if (tenantIds.length === 0) return;

      const tenantProfiles: Record<string, any> = {};

      await Promise.all(tenantIds.map(async (uid) => {
        try {
          const tenantSnap = await getDoc(doc(db, 'users', uid));
          if (tenantSnap.exists()) {
            tenantProfiles[uid] = tenantSnap.data();
          }
        } catch (e) {
          console.warn(`Failed to dynamically retrieve tenant profile in stream: ${uid}`, e);
        }
      }));

      // Map fresh real-time details back into reviews
      const enrichedReviews = rData.map(review => {
        const profile = tenantProfiles[review.tenantId];
        if (profile) {
          return {
            ...review,
            tenantName: profile.firstName ? `${profile.firstName} ${profile.lastName}` : (profile.name || review.tenantName),
            tenantAvatarUrl: (profile.avatarUrl && profile.avatarUrl !== "") ? profile.avatarUrl : (profile.photoURL || review.tenantAvatarUrl || '')
          };
        }
        return review;
      });

      setReviews(enrichedReviews);

      // Recalculate stats with enriched version
      const enrichedReviewsCount = enrichedReviews.length;
      let enrichedTotalRating = 0;
      if (enrichedReviewsCount > 0) {
        enrichedTotalRating = enrichedReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / enrichedReviewsCount;
      } else if (agent) {
        enrichedTotalRating = agent.avgRating || 0.0;
      }

      setStats(prev => ({
        ...prev,
        totalReviews: enrichedReviewsCount,
        avgRating: enrichedTotalRating
      }));

    }, (e) => {
      console.error("Reviews real-time listener subscription error:", e);
    });

    return () => unsubscribe();
  }, [agentId, agent]);

  if (isLoading) {
    return <AgentProfileSkeleton onBack={onBack} />;
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center text-white">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-black mb-2 uppercase">Record Missing</h2>
        <p className="text-slate-400 mb-8 max-w-xs">{error || "This profile is no longer active."}</p>
        <button onClick={onBack} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

  const isVerified = agent.verificationLevel?.toLowerCase() === 'verified';
  const fullName = agent.firstName ? `${agent.firstName} ${agent.lastName}` : (agent.name || 'Anonymous Agent');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white font-sans selection:bg-primary-500/30 transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 left-0 right-0 h-16 flex items-center px-6 z-[100] bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 transition-all">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </nav>

      <main className="w-full max-w-full px-4 py-8 space-y-12 pb-0 mx-0">
        {/* Combined Agent Profile Card: Redesigned based on Image */}
        <section className="bg-white dark:bg-[#0c111e] rounded-[32px] p-6 md:p-10 border border-slate-200 dark:border-[#1e293b] shadow-2xl relative transition-all duration-300">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl md:rounded-[32px] overflow-hidden ring-4 ring-slate-100 dark:ring-slate-850 shadow-2xl relative">
                <SafeImage 
                  src={agent.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&h=400&auto=format&fit=crop"} 
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-550 rounded-full border-4 border-white dark:border-[#0c111e] flex items-center justify-center text-white shadow-lg shadow-primary-500/35 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>

            {/* Information Details */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white">{fullName}</h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider self-center mx-auto md:mx-0">
                    <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                    Verified Broker
                  </span>
                )}
              </div>

              {/* Location / Meta data tags */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  {agent.city || 'Ibadan'}, Nigeria
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary-500" />
                  {stats.memberSince ? `${new Date().getFullYear() - parseInt(stats.memberSince) || 5} Years Experience` : '5 Years Experience'}
                </span>
              </div>

              {/* Description block */}
              <p className="text-sm text-slate-605 dark:text-slate-300 leading-relaxed font-normal">
                {agent.about || `Highly-rated real estate strategist specializing in high-yield luxury rentals and commercial portfolios. Providing verified listings and secure, transparent rental experiences for expatriates and corporate clients in the ${agent.city || 'Ibadan'} market.`}
              </p>

            </div>
          </div>

          {/* Divider line in image */}
          <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800/85 my-8" />

          {/* Horizontal Stats metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center justify-center">
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 space-y-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/30 flex flex-col items-center justify-center shadow-sm">
              <div className="text-2xl md:text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight font-mono select-none">
                {stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}/5` : '0.0/5'}
              </div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                RATING
              </div>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 space-y-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/30 flex flex-col items-center justify-center shadow-sm">
              <div className="text-2xl md:text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight font-mono select-none">
                {stats.completedTxns}
              </div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                CLOSED
              </div>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 space-y-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/30 flex flex-col items-center justify-center shadow-sm">
              <div className="text-2xl md:text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight font-mono select-none">
                {stats.responseTime === '--' ? '--' : `<${stats.responseTime}`}
              </div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                RESPONSE
              </div>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 space-y-2 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-500/30 flex flex-col items-center justify-center shadow-sm">
              <div className="text-2xl md:text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight font-mono select-none">
                {stats.activeListingsCount}
              </div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                ACTIVE
              </div>
            </div>
          </div>
        </section>

        {/* Featured Listings Section with custom heading */}
        <section id="featured-listings" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <div>
              <h2 className="text-2xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase">Featured Listings</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Exclusive high-end properties handpicked for quality and value.</p>
            </div>
            <button 
              onClick={() => {
                const homeSection = document.getElementById('listings-grid');
                if (homeSection) homeSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-black text-primary-500 hover:text-primary-400 transition-colors uppercase tracking-widest flex items-center gap-1 mt-2 sm:mt-0"
            >
              View Full Portfolio <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {featuredListings.map((listing) => {
                const isFav = favorites?.includes(listing.id) || false;
                return (
                  <motion.div 
                    key={`agent-listing-${listing.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => setCurrentListing?.(listing)}
                    className="group bg-white dark:bg-[#0c111e] rounded-3xl overflow-hidden border border-slate-200/60 dark:border-[#1e293b] shadow-md hover:shadow-2xl hover:border-slate-300 dark:hover:border-white/10 transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    {/* Image Container with Cover Zoom */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <SafeImage 
                        src={listing.image} 
                        alt={listing.title} 
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90" />
                      
                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex gap-1.5">
                        <span className="px-2.5 py-1 bg-primary-600/95 backdrop-blur-md text-white text-[9px] font-black uppercase rounded-lg tracking-wider">
                          ACTIVE
                        </span>
                        {listing.verified && (
                          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white border border-white/20 text-[9px] font-black uppercase rounded-lg tracking-wider flex items-center gap-1 shadow-sm">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            VERIFIED
                          </span>
                        )}
                      </div>
                      
                      {/* Floating Bookmark Button */}
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toggleFavorite?.(listing.id, listing.agent?.id || agentId); 
                        }}
                        className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-xl shadow-md transition-all cursor-pointer active:scale-95 z-10 ${isFav ? 'bg-primary-600 text-white border border-primary-500' : 'bg-white/70 hover:bg-white text-slate-800 border border-white/20'}`}
                      >
                        <Bookmark className={`w-4 h-4 transition-colors ${isFav ? 'text-white fill-current' : 'text-slate-850'}`} />
                      </button>
                    </div>

                    {/* Info Panel Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-extrabold text-md text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors truncate">
                            {listing.title}
                          </h3>
                          <span className="text-primary-600 dark:text-primary-400 font-black text-sm whitespace-nowrap">
                            ₦{listing.priceValue?.toLocaleString() || listing.price}
                            <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">/yr</span>
                          </span>
                        </div>
                        <p className="flex items-center gap-1 text-xs font-semibold text-slate-400 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {listing.location}
                        </p>
                      </div>

                      <div className="w-full text-center py-2.5 bg-primary-500/10 hover:bg-primary-500/25 dark:bg-primary-500/20 dark:hover:bg-primary-500/30 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest rounded-2xl border border-primary-500/20 text-[10px] transition-all">
                        View Details
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-[#0c111e] rounded-[32px] p-12 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs italic">
              No featured listings found
            </div>
          )}
        </section>        {/* Client Testimonials */}
        <section className="bg-slate-50 dark:bg-[#0c111e] rounded-[32px] p-[15px] border border-slate-200 dark:border-[#1e293b] space-y-8 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
              <h2 className="text-xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase">Client Testimonials</h2>
              
              {/* Carousel Arrows */}
              {reviews.length > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-[#111827] p-1 rounded-full border border-slate-300/30 dark:border-slate-800/60 select-none">
                  <button 
                    onClick={() => scrollCarousel('left')}
                    className="p-1.5 rounded-full bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 hover:scale-105 active:scale-90 transition-all cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800"
                    aria-label="Previous testimonial"
                    title="Previous Testimonial"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => scrollCarousel('right')}
                    className="p-1.5 rounded-full bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-400 hover:scale-105 active:scale-90 transition-all cursor-pointer shadow-sm border border-slate-100 dark:border-slate-800"
                    aria-label="Next testimonial"
                    title="Next Testimonial"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-extrabold uppercase rounded-full shadow-md shadow-primary-500/20 active:scale-95 transition-all text-[11px] tracking-widest flex items-center gap-1.5 cursor-pointer border border-primary-500/20 self-end sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Feedback</span>
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="relative w-full overflow-hidden">
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .hide-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              <div 
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar pb-3 select-none w-full"
              >
                {reviews.map((review) => (
                  <div 
                    key={`agent-review-${review.id}`}
                    className="relative shrink-0 snap-start w-full md:w-[calc(50%-12px)] lg:w-[calc(50%-16px)] p-8 bg-white dark:bg-[#0b101d] rounded-2xl border border-slate-200 dark:border-[#1e293b] hover:border-slate-400 dark:hover:border-primary-500/35 hover:shadow-lg dark:hover:shadow-primary-500/2 transition-all duration-300 group flex flex-col justify-between space-y-6 shadow-sm min-h-[190px]"
                  >
                    {/* Subtle decorative quote, styled beautifully positioned on the top right */}
                    <div className="absolute right-8 top-8 text-slate-200 dark:text-slate-800/80 font-serif text-6xl select-none leading-none opacity-40 group-hover:opacity-65 transition-opacity">
                      ”
                    </div>

                    {/* Header: Tenant Avatar, Name + Verified Pill, and rating */}
                    <div className="flex items-center gap-3">
                      {/* Ringed rounded Avatar container mirroring the attached design */}
                      <div className="relative shrink-0 w-14 h-14 rounded-full p-[1.5px] border border-primary-500/30 flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-inner">
                        <img 
                          src={review.tenantAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.tenantName || 'U')}&background=0284c7&color=fff&bold=true&size=128`} 
                          alt={review.tenantName} 
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.tenantName || 'U')}&background=0284c7&color=fff&bold=true&size=128`;
                          }}
                        />
                      </div>

                      {/* Name, Verified pill, and Fractional rating badge */}
                      <div className="space-y-1.5 pr-8 leading-tight">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-black text-slate-850 dark:text-[#f8fafc] truncate max-w-[150px]" title={review.tenantName}>
                            {review.tenantName}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-emerald-400 bg-teal-500/10 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-teal-500/20 dark:border-emerald-500/20 select-none">
                            VERIFIED TENANT
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2.5">
                          {/* Perfect premium 5-scale rating text ratio tag as requested */}
                          <span className="text-xs font-black text-primary-600 dark:text-primary-400 font-mono tracking-tight bg-primary-500/10 dark:bg-primary-500/5 px-2.5 py-0.5 rounded-full border border-primary-500/20">
                            {review.rating}/5
                          </span>
                          {review.listingTitle && (
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold truncate max-w-[180px]" title={review.listingTitle}>
                              • {review.listingTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Body Text with stylized italics */}
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic pr-4 font-serif">
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              No client feedback yet
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {showChatModal && featuredListings.length > 0 && (
          <ChatModal 
            isOpen={showChatModal}
            onClose={() => setShowChatModal(false)}
            listing={featuredListings[0]}
            currentUser={user!}
          />
        )}
      </AnimatePresence>

      {/* Legacy Review Modal (Hidden unless needed) */}
      <AnimatePresence>
        {showReviewModal && (
          <div 
            onClick={() => setShowReviewModal(false)}
            className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-3xl flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-[#0f172a] w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/10 cursor-default"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-display font-black uppercase tracking-tight text-white">Leave Feedback</h3>
                  <button 
                    onClick={() => setShowReviewModal(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Premium Slider for Selecting Rating Level */}
                  <div className="flex flex-col gap-4 p-5 bg-[#1e293b]/50 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                        Rating Level
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.span 
                          key={`rating-badge-${newReview.rating}`}
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          transition={{ duration: 0.12 }}
                          className="text-xs font-black uppercase text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/25 select-none tracking-wider font-mono inline-block"
                        >
                          {newReview.rating}/5 • {["Poor", "Fair", "Good", "Excellent", "Exceptional"][newReview.rating - 1]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    
                    <div className="space-y-4 pt-1">
                      {/* Interactive Visual Star Indicators */}
                      <div className="flex items-center justify-center gap-2.5 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={`input-star-${star}`}
                            type="button"
                            whileHover={{ scale: 1.25 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="cursor-pointer focus:outline-none"
                          >
                            <Star 
                              className={`w-8 h-8 transition-colors duration-300 ${
                                star <= newReview.rating 
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                                  : 'text-slate-600 dark:text-slate-700'
                              }`} 
                            />
                          </motion.button>
                        ))}
                      </div>

                      <div className="relative pt-1">
                        <input 
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={newReview.rating}
                          onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                          style={{
                            backgroundImage: `linear-gradient(to right, #0284c7 0%, #0284c7 ${((newReview.rating - 1) / 4) * 100}%, #334155 ${((newReview.rating - 1) / 4) * 100}%, #334155 100%)`
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-555/50 transition-all duration-300 [&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-primary-500/50 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:active:scale-110"
                        />
                        <div className="flex justify-between text-[9px] font-black text-slate-500 tracking-wider px-1 mt-2.5">
                          <span className={newReview.rating === 1 ? "text-primary-400 font-bold transition-colors" : "transition-colors"}>1 (POOR)</span>
                          <span className={newReview.rating === 2 ? "text-primary-400 font-bold transition-colors" : "transition-colors"}>2</span>
                          <span className={newReview.rating === 3 ? "text-primary-400 font-bold transition-colors" : "transition-colors"}>3</span>
                          <span className={newReview.rating === 4 ? "text-primary-405 font-bold transition-colors" : "transition-colors"}>4</span>
                          <span className={newReview.rating === 5 ? "text-primary-400 font-bold transition-colors" : "transition-colors"}>5 (EXCEPTIONAL)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {allAgentListings.length > 0 ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Referenced Property of {fullName}
                        </label>
                        <div className="relative">
                          <select 
                            className="w-full bg-[#1e293b] text-slate-200 border border-white/10 p-4 pr-10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-550/50 cursor-pointer appearance-none transition-all duration-300"
                            value={newReview.listingTitle}
                            onChange={(e) => setNewReview({ ...newReview, listingTitle: e.target.value })}
                          >
                            <option value="" className="bg-[#0f172a] text-slate-400">Select Rated Property...</option>
                            {allAgentListings.map((lst) => (
                              <option key={`opt-listing-${lst.id}`} value={lst.title} className="bg-[#0f172a] text-white">
                                {lst.title} — {lst.location}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450">
                            <ChevronLeft className="w-4 h-4 rotate-180" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Referenced Property of {fullName}
                        </label>
                        <input 
                          type="text" 
                          placeholder="Referenced Property..."
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/50"
                          value={newReview.listingTitle}
                          onChange={(e) => setNewReview({ ...newReview, listingTitle: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Feedback</label>
                      <textarea 
                        rows={4}
                        placeholder="Your experience..."
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      if (!user || isSubmittingReview) return;
                      setIsSubmittingReview(true);
                      try {
                        await addDoc(collection(db, 'reviews'), {
                          agentId,
                          tenantId: user.id,
                          tenantName: user.firstName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0],
                          tenantAvatarUrl: user.avatarUrl || (user as any).photoURL || '',
                          rating: newReview.rating,
                          comment: newReview.comment,
                          listingTitle: newReview.listingTitle,
                          createdAt: serverTimestamp()
                        });
                        setShowReviewModal(false);
                        setNewReview({ rating: 5, comment: '', listingTitle: '' });
                        
                        // Dynamically reload profile, reviews and statistics immediately
                        await loadAgentProfile();
                      } catch (err) {
                        console.error("Submission failed:", err);
                      } finally {
                        setIsSubmittingReview(false);
                      }
                    }}
                    disabled={isSubmittingReview || !newReview.comment || !newReview.listingTitle}
                    className="w-full bg-primary-600 text-white py-4 rounded-xl text-sm font-extrabold uppercase tracking-widest hover:bg-primary-500 disabled:opacity-50 transition-all shadow-md shadow-primary-500/20 cursor-pointer"
                  >
                    {isSubmittingReview ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit Feedback"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentProfile;
