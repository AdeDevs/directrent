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
          console.warn("Could not fetch real transaction stats, using fallback:", e);
        }
        
        let reviewsData: Review[] = [];
        try {
          const reviewsRef = collection(db, 'reviews');
          const qReviews = query(reviewsRef, where('agentId', '==', agentId), orderBy('createdAt', 'desc'), limit(10));
          const reviewsSnap = await getDocs(qReviews);
          reviewsData = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
        } catch (e) {
          console.warn("Could not fetch real reviews, using fallback:", e);
        }

        // Merge with dummy data for deep population
        const dummy = DUMMY_AGENT_DATA[agentId] || null;
        
        const finalStats = {
          completedTxns: (dummy?.stats?.completedTxns || DEFAULT_STATS.completedTxns) + completedSize,
          activeListingsCount: dummy?.stats?.activeListings || DEFAULT_STATS.activeListings,
          avgRating: dummy?.stats?.rating || DEFAULT_STATS.rating,
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
      <div className="fixed top-0 left-0 right-0 p-4 pt-4 md:pt-4 px-4 md:px-8 z-50 pointer-events-none">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer pointer-events-auto"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-14 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-2 pb-8 md:pt-4 md:pb-12 space-y-6">
        
        {/* Optimized Profile Card */}
        <div className="bg-slate-900 dark:bg-slate-925 rounded-xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl mt-4 md:mt-6 border dark:border-slate-800 transition-colors">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-white dark:bg-slate-800 p-1 shadow-2xl">
                <div className="w-full h-full rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                  <SafeImage 
                    src={
                      agentId === 'agent_kunle' ? "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80" :
                      agentId === 'agent_sarah' ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80" :
                      agentId === 'agent_mike' ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80" :
                      agentId === 'agent_bose' ? "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=400&h=400&q=80" :
                      `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80`
                    } 
                    alt={agent?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 md:w-11 md:h-11 bg-primary-600 rounded-lg border-4 border-slate-900 dark:border-slate-925 flex items-center justify-center shadow-lg transition-colors">
                <BadgeCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{agent?.name}</h2>
                <div className="flex items-center justify-center md:justify-start gap-1 text-primary-400">
                   <ShieldCheck className="w-3.5 h-3.5" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em]">Verified Partner</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-slate-400 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-500" />
                  {agent?.city}, Nigeria
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  Partner since 2024
                </div>
              </div>

              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2.5">
                <div className="bg-amber-400/10 text-amber-400 px-4 py-2 rounded-xl border border-amber-400/20 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold text-xs md:text-sm tracking-tight">{stats.avgRating.toFixed(1)} Rating</span>
                </div>
                <div className="bg-emerald-400/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-400/20 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-bold text-xs md:text-sm tracking-tight">Vetted Agent</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards - Refined Layout & Relevance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 md:h-36 group hover:border-primary-100 dark:hover:border-primary-900/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 dark:group-hover:bg-primary-500 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.completedTxns}</div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Rentals Completed</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 md:h-36 group hover:border-emerald-100 dark:hover:border-emerald-900/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.successRate}</div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Success Rate</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 md:h-36 group hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Timer className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.responseTime}</div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Avg. Response</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 md:h-36 group hover:border-amber-100 dark:hover:border-amber-900/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 dark:group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.activeListingsCount}</div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Active Listings</div>
            </div>
          </div>
        </div>

        {/* Information Section Enhancement */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
           <div className="flex items-center gap-3 mb-5">
             <div className="w-1 h-5 bg-primary-600 dark:bg-primary-500 rounded-full" />
             <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">About {agent?.name}</h3>
           </div>
           <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
             {agent?.name} is a high-performing real estate professional specializing in residential properties within the {agent?.city || 'Ibadan'} area. With a proven track record of successful rentals and a deep understanding of the local market, they provide seamless experiences for both tenants and landlords. Every transaction managed by {agent?.name} is backed by DirectRent's satisfaction guarantee.
           </p>
           
           <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl transition-colors">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm border dark:border-slate-700">
                   <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Secure Transactions</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Payments are held in escrow until verification.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border dark:border-slate-700">
                   <BadgeCheck className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Vetted Background</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Regularly audited for service quality and integrity.</p>
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

          <div className="relative -mx-4 md:-mx-8 overflow-hidden">
            <div 
              id="reviews-carousel"
              className="flex gap-4 overflow-x-auto pb-6 px-4 md:px-8 snap-x snap-mandatory scrollbar-hide scroll-smooth"
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
