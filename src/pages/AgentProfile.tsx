import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Star, ShieldCheck, BadgeCheck, Clock, 
  CheckCircle2, MessageSquare, MapPin, Loader2, Calendar, 
  Zap, Building2, UserCheck, ShieldAlert, Award, Grid, Menu,
  Mail, Phone, ExternalLink, ArrowRight, Bed, Bath, Maximize2
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
  serverTimestamp
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firebase';
import { Review, Listing } from '../types';
import SafeImage from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../components/ChatModal';

interface AgentProfileProps {
  agentId: string;
  onBack: () => void;
}

const AgentProfile: React.FC<AgentProfileProps> = ({ agentId, onBack }) => {
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', listingTitle: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
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

  useEffect(() => {
    const fetchAgentData = async () => {
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

        // Fetch Stats (Completed Conversations)
        let completedCount = agentData.completedTxns || 0;
        try {
          const convsRef = collection(db, 'conversations');
          const qCompleted = query(convsRef, where('agentId', '==', agentId), where('status', '==', 'completed'));
          const completedSnap = await getDocs(qCompleted);
          completedCount = Math.max(completedCount, completedSnap.size);
        } catch (e: any) {
          console.warn("Stats fetch failed:", e);
        }

        // Fetch Agent's Listings
        let listingsCount = agentData.listingsCount || 0;
        let listings: Listing[] = [];
        try {
          const listingsRef = collection(db, 'listings');
          const qListings = query(
            listingsRef, 
            where('agent.id', '==', agentId),
            where('isApproved', '==', true),
            limit(3)
          );
          const listingsSnap = await getDocs(qListings);
          listings = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
          listingsCount = Math.max(listingsCount, listingsSnap.size);
          setFeaturedListings(listings);
        } catch (e) {
          console.warn("Listings fetch failed:", e);
        }
        
        // Fetch Reviews and calculate Average Rating
        let reviewsData: Review[] = [];
        let totalRating = agentData.avgRating || 0;
        let reviewCount = 0;
        try {
          const reviewsRef = collection(db, 'reviews');
          const qReviews = query(reviewsRef, where('agentId', '==', agentId), orderBy('createdAt', 'desc'), limit(12));
          const reviewsSnap = await getDocs(qReviews);
          reviewsData = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
          reviewCount = reviewsSnap.size;
          
          if (reviewCount > 0 && !agentData.avgRating) {
            totalRating = reviewsSnap.docs.reduce((acc, doc) => acc + (doc.data().rating || 0), 0) / reviewCount;
          }
        } catch (e) {
          console.warn("Reviews fetch failed:", e);
        }

        const joinYear = agentData.createdAt?.toDate ? agentData.createdAt.toDate().getFullYear().toString() : '2024';

        setStats({
          completedTxns: completedCount,
          activeListingsCount: listingsCount,
          avgRating: totalRating,
          totalReviews: reviewCount,
          responseTime: agentData.avgResponseTime || '30m',
          memberSince: joinYear,
          isIdentityVerified: !!(agentData.nin || agentData.phoneVerified)
        });

        setReviews(reviewsData);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${agentId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (agentId) fetchAgentData();
  }, [agentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
        <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm">Loading Experience...</p>
      </div>
    );
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
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white font-sans selection:bg-emerald-500/30 transition-colors duration-500">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Hero Card */}
        <section className="bg-slate-50 dark:bg-[#0f172a] rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200 dark:border-white/5 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[20px] overflow-hidden ring-4 ring-white dark:ring-white/5 shadow-xl">
                <SafeImage 
                  src={agent.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&auto=format&fit=crop"} 
                  alt={fullName}
                  className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-slate-50 dark:border-[#0f172a] animate-pulse" />
            </div>
            
            <div className="text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{fullName}</h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Agent
                  </span>
                )}
              </div>
              <p className="flex items-center justify-center md:justify-start gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <MapPin className="w-4 h-4 text-primary-500" />
                {agent.city || 'Lagos'}, Nigeria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => document.getElementById('featured-listings')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              View Listings
            </button>
            <button 
              onClick={() => setShowChatModal(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
            >
              Message Agent
            </button>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-[#0f172a] rounded-[24px] p-6 border border-slate-200 dark:border-white/5 flex items-center gap-5 group hover:border-emerald-500/30 transition-all shadow-sm">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '5.0'}</span>
                <span className="text-slate-500 text-xs font-bold">/ 5.0</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stats.totalReviews} TOTAL REVIEWS</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#0f172a] rounded-[24px] p-6 border border-slate-200 dark:border-white/5 flex items-center gap-5 group hover:border-emerald-500/30 transition-all shadow-sm">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 uppercase">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.completedTxns}</div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RENTALS COMPLETED</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#0f172a] rounded-[24px] p-6 border border-slate-200 dark:border-white/5 flex items-center gap-5 group hover:border-emerald-500/30 transition-all shadow-sm">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.responseTime}</div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AVG. RESPONSE TIME</p>
            </div>
          </div>
        </section>

        {/* Main Content: About & Featured */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: About */}
          <section className="lg:col-span-1">
            <div className="bg-slate-50 dark:bg-[#0f172a] rounded-[24px] p-8 border border-slate-200 dark:border-white/5 h-full flex flex-col shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">About Agent</h2>
              </div>
              
              <div className="flex-1 text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                {agent.about ? (
                  <p className="whitespace-pre-wrap">{agent.about}</p>
                ) : (
                  <p className="italic text-slate-500">
                    Trusted real estate professional specializing in the {agent.city || 'local'} market.
                    Providing verified listings and secure rental experiences.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-200 dark:border-white/5">
                {['Luxury Assets', 'Contract Law', 'Local Expert'].map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Right Column: Featured Listings */}
          <section id="featured-listings" className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Grid className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Featured Listings</h2>
              </div>
              <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 transition-colors uppercase tracking-widest flex items-center gap-2">
                View Portfolio
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {featuredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredListings.map(listing => (
                  <motion.div 
                    key={listing.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#0f172a] rounded-[20px] overflow-hidden border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all group cursor-pointer shadow-sm"
                  >
                    <div className="relative aspect-[4/3]">
                      <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-60" />
                      <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500 text-white dark:text-slate-950 text-[10px] font-black uppercase rounded-lg">
                        Active
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-sm truncate text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">{listing.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-emerald-600 dark:text-emerald-400 font-black text-lg">
                          ₦{listing.priceValue?.toLocaleString() || listing.price}
                          <span className="text-slate-500 text-[10px] uppercase ml-1 font-bold">/mo</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{listing.beds || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{listing.baths || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="aspect-[21/9] bg-slate-50 dark:bg-[#0f172a] rounded-[24px] border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-slate-500 italic text-sm">
                No featured listings found
              </div>
            )}
          </section>
        </div>

        {/* Client Testimonials */}
        <section className="bg-slate-50 dark:bg-[#0f172a] rounded-[24px] p-8 border border-slate-200 dark:border-white/5 space-y-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Client Testimonials</h2>
            </div>
            <button className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest">
              View All Reviews
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((review) => (
                <div 
                  key={review.id}
                  className="space-y-4 p-6 bg-white dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm"
                >
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'opacity-20'}`} />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic line-clamp-4">
                    "{review.comment}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold uppercase">
                      {review.tenantName?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{review.tenantName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 italic text-sm">
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
          <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0f172a] w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold uppercase tracking-tight">Leave Feedback</h3>
                  <button 
                    onClick={() => setShowReviewModal(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-3 py-6 bg-white/5 rounded-2xl">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button 
                          key={s}
                          onClick={() => setNewReview({ ...newReview, rating: s })}
                          className={`p-1 transition-all ${s <= newReview.rating ? 'text-amber-400 scale-110' : 'text-slate-700'}`}
                        >
                          <Star className={`w-8 h-8 ${s <= newReview.rating ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Referenced Property..."
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50"
                      value={newReview.listingTitle}
                      onChange={(e) => setNewReview({ ...newReview, listingTitle: e.target.value })}
                    />
                    <textarea 
                      rows={4}
                      placeholder="Your experience..."
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    />
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
                          rating: newReview.rating,
                          comment: newReview.comment,
                          listingTitle: newReview.listingTitle,
                          createdAt: serverTimestamp()
                        });
                        setShowReviewModal(false);
                        setNewReview({ rating: 5, comment: '', listingTitle: '' });
                      } catch (err) {
                        console.error("Submission failed:", err);
                      } finally {
                        setIsSubmittingReview(false);
                      }
                    }}
                    disabled={isSubmittingReview || !newReview.comment || !newReview.listingTitle}
                    className="w-full bg-emerald-500 text-slate-950 py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-emerald-400 disabled:opacity-50 transition-all"
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
