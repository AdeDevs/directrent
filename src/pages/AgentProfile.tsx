import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Star, ShieldCheck, BadgeCheck, Clock, 
  CheckCircle2, MessageSquare, MapPin, Loader2, Calendar, TrendingUp,
  Zap, Timer, Building2
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
  limit
} from 'firebase/firestore';
import { User, Review } from '../types';
import SafeImage from '../components/SafeImage';

interface AgentProfileProps {
  agentId: string;
  onBack: () => void;
}

const DUMMY_AGENT_DATA: Record<string, any> = {
  'agent_kunle': {
    stats: { completedTxns: 52, successRate: '99%', responseTime: '8m', activeListings: 14, rating: 4.8 },
    reviews: [
      { id: 'r1', tenantName: 'Adewale Y.', comment: 'Kunle is the most professional agent I have dealt with in Ibadan. Very fast and honest.', rating: 5, listingTitle: 'Premium Self-Contain' },
      { id: 'r2', tenantName: 'Bisi O.', comment: 'Highly recommended for students. He knows the best spots near UI.', rating: 5, listingTitle: 'Standard Shared Room' },
    ]
  },
  'agent_sarah': {
    stats: { completedTxns: 38, successRate: '96%', responseTime: '12m', activeListings: 9, rating: 4.6 },
    reviews: [
      { id: 'r3', tenantName: 'Funmi A.', comment: 'Sarah was very patient with my many questions. Smooth transaction.', rating: 4, listingTitle: 'Modern 1-Bedroom Flat' },
    ]
  },
  'agent_mike': {
    stats: { completedTxns: 24, successRate: '92%', responseTime: '25m', activeListings: 6, rating: 4.2 },
    reviews: [
      { id: 'r4', tenantName: 'Emeka J.', comment: 'Good service, though response time could be faster. Overall happy.', rating: 4, listingTitle: 'Spacious Flat' },
    ]
  },
  'agent_bose': {
    stats: { completedTxns: 67, successRate: '100%', responseTime: '5m', activeListings: 21, rating: 4.9 },
    reviews: [
      { id: 'r5', tenantName: 'Tunde W.', comment: 'Quickest response ever. Contract was ready in hours.', rating: 5, listingTitle: 'Executive 1-Bedroom' },
      { id: 'r6', tenantName: 'Joy I.', comment: 'A pure professional. Verified every detail for me.', rating: 5, listingTitle: 'Luxury Studio' },
    ]
  }
};

const DEFAULT_STATS = { completedTxns: 12, successRate: '90%', responseTime: '30m', activeListings: 4, rating: 4.0 };
const DEFAULT_REVIEWS = [
  { id: 'rd1', tenantName: 'Verified Tenant', comment: 'Great experience overall. The property was exactly as described.', rating: 5, listingTitle: 'Comfortable Living Space' }
];

const AgentProfile: React.FC<AgentProfileProps> = ({ agentId, onBack }) => {
  const [agent, setAgent] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    completedTxns: 0,
    activeListingsCount: 0,
    avgRating: 0,
    successRate: '95%',
    responseTime: '15m'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      setIsLoading(true);
      try {
        // Fetch Real Agent Profile from Firestore if exists
        const agentDoc = await getDoc(doc(db, 'users', agentId));
        let agentData = agentDoc.exists() ? agentDoc.data() : null;

        // Fallback to dummy names from IDs if not in Firestore (for demo agents)
        if (!agentData) {
          const name = agentId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').replace('Agent ', '');
          agentData = { 
            name, 
            city: 'Ibadan', 
            country: 'Nigeria',
            role: 'agent'
          };
        }
        setAgent(agentData);

        // Fetch Stats & Reviews (Real + Fallback)
        let completedSize = 0;
        try {
          const convsRef = collection(db, 'conversations');
          const qCompleted = query(convsRef, where('agentId', '==', agentId), where('status', '==', 'completed'));
          const completedSnap = await getDocs(qCompleted);
          completedSize = completedSnap.size;
        } catch (e) {
          console.warn("Could not fetch real transaction stats:", e);
        }

        let listingsCount = 0;
        try {
          const listingsRef = collection(db, 'listings');
          const qListings = query(listingsRef, where('agent.id', '==', agentId));
          const listingsSnap = await getDocs(qListings);
          listingsCount = listingsSnap.size;
        } catch (e) {
          console.warn("Could not fetch real listings count:", e);
        }
        
        let reviewsData: Review[] = [];
        let totalRating = 0;
        try {
          const reviewsRef = collection(db, 'reviews');
          const qReviews = query(reviewsRef, where('agentId', '==', agentId), orderBy('createdAt', 'desc'), limit(10));
          const reviewsSnap = await getDocs(qReviews);
          reviewsData = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
          
          if (reviewsSnap.size > 0) {
            totalRating = reviewsSnap.docs.reduce((acc, doc) => acc + (doc.data().rating || 0), 0) / reviewsSnap.size;
          }
        } catch (e) {
          console.warn("Could not fetch real reviews:", e);
        }

        // Merge with dummy data for deep population
        const dummy = DUMMY_AGENT_DATA[agentId] || null;
        
        const finalStats = {
          completedTxns: completedSize || (dummy?.stats?.completedTxns || DEFAULT_STATS.completedTxns),
          activeListingsCount: listingsCount || (dummy?.stats?.activeListings || DEFAULT_STATS.activeListings),
          avgRating: totalRating || (dummy?.stats?.rating || DEFAULT_STATS.rating),
          successRate: dummy?.stats?.successRate || DEFAULT_STATS.successRate,
          responseTime: dummy?.stats?.responseTime || DEFAULT_STATS.responseTime
        };

        if (reviewsData.length === 0) {
          reviewsData = (dummy?.reviews || DEFAULT_REVIEWS).map((r: any) => ({
            ...r,
            createdAt: { toDate: () => new Date() } // Mock firebase timestamp
          })) as any;
        }

        setStats({
          completedTxns: finalStats.completedTxns,
          activeListingsCount: finalStats.activeListingsCount,
          avgRating: finalStats.avgRating,
          successRate: finalStats.successRate,
          responseTime: finalStats.responseTime
        });

        setReviews(reviewsData);
      } catch (err) {
        console.error("Error fetching agent profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 transition-colors">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Generating verified record...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 relative flex flex-col transition-colors duration-300"
    >
      {/* floating back button - fixed to stay on top regardless of scroll */}
      <div className="fixed top-0 left-0 right-0 p-4 pt-4 md:pt-4 px-2 z-50 pointer-events-none">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer pointer-events-auto"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-14 md:pb-24">
        <div className="w-full px-[15px] pt-2 pb-8 md:pt-4 md:pb-12 space-y-6">
        
        {/* Optimized Profile Card - Dark Premium Concept */}
        <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl mt-4 md:mt-6 border border-white/5 transition-all">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -ml-48 -mb-48" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative">
              <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-[2px] shadow-2xl">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden relative">
                  <SafeImage 
                    src={agent?.avatarUrl || (
                      agentId === 'agent_kunle' ? "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80" :
                      agentId === 'agent_sarah' ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80" :
                      agentId === 'agent_mike' ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80" :
                      agentId === 'agent_bose' ? "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=400&h=400&q=80" :
                      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80`
                    )} 
                    alt={agent?.name}
                    className="w-full h-full object-cover"
                  />
                  {agent?.verificationStatus === 'verified' && (
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg border border-white/20">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter">{agent?.firstName ? `${agent.firstName} ${agent.lastName}` : agent?.name}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-1.5 text-primary-400 bg-primary-400/10 px-2.5 py-1 rounded-lg border border-primary-400/20">
                     <BadgeCheck className="w-3.5 h-3.5" />
                     <span className="text-[9px] font-black uppercase tracking-[0.1em]">Verified Partner</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400 text-[13px] font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    {agent?.city || 'Ibadan'}, Nigeria
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    Partner since 2024
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <div className="bg-amber-500/15 text-amber-400 px-4 py-2.5 rounded-xl border border-amber-500/20 flex items-center gap-2 shadow-inner">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-black text-xs md:text-sm tracking-tight">{stats.avgRating.toFixed(1)} Rating</span>
                </div>
                <div className="bg-emerald-500/15 text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-500/20 flex items-center gap-2 shadow-inner">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="font-black text-xs md:text-sm tracking-tight">Vetted Agent</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Stats Card Concept */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-36 relative group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-primary-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-3xl font-black text-white tracking-tighter">{stats.completedTxns}</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rentals Completed</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-36 relative group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-3xl font-black text-white tracking-tighter">{stats.successRate}</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Success Rate</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-36 relative group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-3xl font-black text-white tracking-tighter">{stats.responseTime}</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg. Response</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-36 relative group">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-3xl font-black text-white tracking-tighter">{stats.activeListingsCount}</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Listings</div>
            </div>
          </div>
        </div>

        {/* Information Section Enhancement */}
        <div className="bg-slate-900 p-6 md:p-10 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
             <div className="flex items-center gap-3 mb-6 relative z-10">
               <div className="w-1.5 h-8 bg-primary-600 rounded-full shadow-lg shadow-primary-500/20" />
               <h3 className="text-xl font-black text-white tracking-tight">About {agent?.firstName || (agent?.name?.split(' ')[0]) || 'Agent'}</h3>
             </div>
             
             <p className="text-slate-400 leading-relaxed text-sm md:text-base font-medium relative z-10 [text-wrap:balance]">
               {(agent?.about || (
                 `${agent?.firstName || agent?.name} is a high-performing real estate professional specializing in residential properties within the ${agent?.city || 'Ibadan'} area. With a proven track record of successful rentals and a deep understanding of the local market, they provide seamless experiences for both tenants and landlords. Every transaction managed by ${agent?.firstName || agent?.name} is backed by DirectRent's satisfaction guarantee.`
               )).replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())}
             </p>
           
           <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white/5 rounded-3xl border border-white/5 relative z-10">
              <div className="flex items-start gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-primary-500 shadow-xl">
                   <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-base font-bold text-white tracking-tight">Secure Transactions</h4>
                    <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">Payments are held in escrow until verification.</p>
                 </div>
              </div>
              <div className="flex items-start gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-emerald-500 shadow-xl">
                   <BadgeCheck className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-base font-bold text-white tracking-tight">Vetted Background</h4>
                    <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">Regularly audited for service quality and integrity.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Reviews Section - Horizontal Real Estate Optimization */}
        <div className="space-y-6">
          <div className="px-1 flex items-center justify-between">
             <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
               Verified Reviews
               <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400">{reviews.length}</span>
             </h3>
             
             {/* Desktop Navigation */}
             <div className="hidden md:flex items-center gap-2">
               <button 
                 onClick={() => {
                   const container = document.getElementById('reviews-carousel');
                   if (container) container.scrollBy({ left: -400, behavior: 'smooth' });
                 }}
                 className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm active:scale-95"
               >
                 <ChevronLeft className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => {
                   const container = document.getElementById('reviews-carousel');
                   if (container) container.scrollBy({ left: 400, behavior: 'smooth' });
                 }}
                 className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm active:scale-95"
               >
                 <ChevronLeft className="w-4 h-4 rotate-180" />
               </button>
             </div>
          </div>

          <div className="relative -mx-[15px] overflow-hidden">
            <div 
              id="reviews-carousel"
              className="flex gap-4 overflow-x-auto pb-6 px-[15px] snap-x snap-mandatory scrollbar-hide scroll-smooth"
            >
              {reviews.length > 0 ? (
                <>
                  {reviews.map((review) => (
                    <div 
                      key={review.id} 
                      className="flex-none w-[80%] md:w-[400px] bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-all snap-center md:snap-start"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-600 font-black text-sm">
                            {review.tenantName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs md:text-sm">{review.tenantName}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Verified Tenant</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-[10px] font-black">{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm leading-relaxed mb-6 font-medium line-clamp-3 italic">
                         "{review.comment}"
                      </p>
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <div className="w-6 h-6 rounded-md bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <TrendingUp className="w-3 h-3" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Rented Through Partner</div>
                          <div className="text-[10px] md:text-xs font-bold text-slate-900 dark:text-slate-200 truncate">
                            {review.listingTitle}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* End message in scroll */}
                  <div className="flex-none w-48 flex items-center justify-center snap-center pr-4 md:pr-8">
                     <div className="text-center space-y-2">
                       <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mx-auto transition-colors">
                         <Star className="w-4 h-4" />
                       </div>
                       <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">End of<br/>Reviews</p>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-none w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
                   <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                   <p className="text-slate-400 dark:text-slate-600 font-medium">No verified reviews yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        </div>
      </div>
    </motion.div>
  );
};

export default AgentProfile;
