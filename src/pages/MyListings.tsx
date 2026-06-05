import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  MessageSquare,
  BarChart3,
  Search,
  Plus,
  Bell,
  X,
  CreditCard
} from 'lucide-react';
import SafeImage from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Listing } from '../types';
import NotificationBadge from '../components/NotificationBadge';
import HeaderPortal from '../components/HeaderPortal';
import toast from 'react-hot-toast';

export default function MyListings() {
  const { user, setCurrentListing, setActiveTab } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'approved' | 'pending' | 'suspended' | 'completed'>(() => {
    const saved = localStorage.getItem('mylistings_filter');
    if (saved === 'suspended') {
      localStorage.removeItem('mylistings_filter');
      return 'suspended';
    }
    return 'all';
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [appealListingId, setAppealListingId] = useState<string | number | null>(null);
  const [appealReasonText, setAppealReasonText] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const listingsRef = collection(db, 'listings');
    const q = query(listingsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Listing))
        .filter(l => String(l.agent?.id) === String(user.id))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
      setListings(fetched);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'listings');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'transactions'),
      where('agentId', '==', user.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setTransactions(fetched);
    }, (error) => {
      console.error("Failed to load transactions:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredListings = listings.filter(l => {
    if (activeFilter === 'approved') return l.isApproved === true && l.status !== 'suspended' && l.status !== 'completed';
    if (activeFilter === 'pending') return l.isApproved !== true && l.status !== 'suspended' && l.status !== 'completed';
    if (activeFilter === 'suspended') return l.status === 'suspended';
    if (activeFilter === 'completed') return l.status === 'completed';
    if (activeFilter === 'all') return l.status !== 'suspended' && l.status !== 'completed';
    return true;
  });

  const stats = [
    { 
      label: 'Active', 
      title: 'Active Listings',
      value: listings.filter(l => l.status !== 'suspended' && l.status !== 'completed').length, 
      icon: <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200/60 dark:border-indigo-800/40'
    },
    { 
      label: 'Live', 
      title: 'Approved',
      value: listings.filter(l => l.isApproved && l.status !== 'suspended' && l.status !== 'completed').length, 
      icon: <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200/60 dark:border-emerald-800/40'
    },
    { 
      label: 'Completed', 
      title: 'Completed Deals',
      value: listings.filter(l => l.status === 'completed').length, 
      icon: <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600 dark:text-violet-400" />,
      color: 'bg-violet-50 dark:bg-violet-900/20',
      borderColor: 'border-violet-200/60 dark:border-violet-800/40'
    },
    { 
      label: 'Suspended', 
      title: 'Suspended',
      value: listings.filter(l => l.status === 'suspended').length, 
      icon: <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />,
      color: 'bg-rose-50 dark:bg-rose-900/20',
      borderColor: 'border-rose-200/60 dark:border-rose-800/40'
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Fetching your listings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-[0] transition-colors">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between lg:hidden">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none">Agent Panel</span>
          <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">My Listings</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group lg:hidden"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 transition-colors" />
            <NotificationBadge />
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/15 active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New</span>
          </button>
        </div>
      </header>

      <HeaderPortal>
        <div className="hidden lg:flex flex-1 items-center justify-between px-6 h-full">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none">Agent Panel</span>
            <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">My Listings</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/15 active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>
        </div>
      </HeaderPortal>

      <main className="w-full px-[15px] pt-[15px] pb-0 mb-0 space-y-6 sm:space-y-10">
        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {stats.map((stat, i) => (
            <div 
              key={`listing-stat-${i}`} 
              className={`bg-white dark:bg-slate-900 px-3 py-2.5 sm:p-4 rounded-xl sm:rounded-2xl border ${stat.borderColor} shadow-sm transition-all hover:shadow-md flex flex-col items-start gap-1 sm:gap-2.5`}
            >
              <div className={`p-1.5 sm:p-2 rounded-lg ${stat.color} flex-shrink-0 mb-1 sm:mb-0`}>
                {stat.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {stat.label}
                </span>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Filters */}
        <section className="flex gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-lg w-fit overflow-x-auto max-w-full">
          {(['all', 'approved', 'pending', 'completed', 'suspended'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold capitalize transition-all whitespace-nowrap ${activeFilter === f ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              {f}
            </button>
          ))}
        </section>

        {/* Listings List */}
        <section className="space-y-3 sm:space-y-4">
          {filteredListings.length > 0 ? (
            filteredListings.map((listing, idx) => (
              <motion.div
                key={`my-listing-${listing.id}-${idx}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-sm flex gap-3 sm:gap-4 group cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => setCurrentListing(listing)}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 relative">
                  <SafeImage 
                    src={listing.image} 
                    alt={listing.title} 
                    className="w-full h-full object-cover" 
                  />
                  {!listing.isApproved && listing.status !== 'completed' && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                  )}
                  {listing.status === 'completed' && (
                    <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[1px] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 text-sm sm:text-base leading-tight">{listing.title}</h3>
                        {listing.isApproved && listing.status !== 'suspended' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{listing.location}</p>
                    </div>
                    {listing.status === 'suspended' ? (
                      <div className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[8px] font-bold uppercase tracking-wider shrink-0 mt-0.5">
                        Suspended
                      </div>
                    ) : !listing.isApproved && (
                      <div className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-bold uppercase tracking-wider shrink-0 mt-0.5">
                        Pending
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1 sm:mt-2">
                    <p className="text-sm font-bold text-indigo-600 leading-none">
                      {listing.price} <span className="text-[10px] text-slate-400 font-normal tracking-tight">/ yr</span>
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                      {listing.status === 'suspended' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppealListingId(listing.id);
                            setAppealReasonText('');
                          }}
                          className="text-[10px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded-md font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                        >
                          Appeal
                        </button>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md" title="Total Views">
                            <Eye className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-semibold text-slate-500">{listing.viewCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md" title="Total Leads">
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-semibold text-slate-500">{listing.inquiryCount || 0}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform hidden sm:block" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No listings found for this filter.</p>
              <button 
                onClick={() => setActiveTab('create')}
                className="text-indigo-600 font-bold text-sm"
              >
                Post your first listing
              </button>
            </div>
          )}
        </section>
        {/* Transaction History Section */}
        <section className="border-t border-slate-200 dark:border-slate-800 pt-[15px] sm:pt-10 pb-16 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5! " />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-black text-slate-900 dark:text-white tracking-tight">Transaction History</h2>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block mt-0.5">Verified escrow ledger settlements</span>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-150 dark:border-slate-850">
                      <th className="p-3.5 sm:p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Transaction ID</th>
                      <th className="p-3.5 sm:p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Property</th>
                      <th className="p-3.5 sm:p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Buyer</th>
                      <th className="p-3.5 sm:p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Settlement</th>
                      <th className="p-3.5 sm:p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Method</th>
                      <th className="p-3.5 sm:p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {transactions.map((tx, idx) => (
                      <tr key={`tx-${tx.id || idx}`} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-all font-sans text-xs">
                        <td className="p-3.5 sm:p-4 font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight whitespace-nowrap">{tx.id || 'DR-TXN-UNKNOWN'}</td>
                        <td className="p-3.5 sm:p-4 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] whitespace-nowrap">{tx.propertyTitle}</td>
                        <td className="p-3.5 sm:p-4 text-slate-500 font-medium whitespace-nowrap">{tx.tenantName || 'Verified Buyer'}</td>
                        <td className="p-3.5 sm:p-4 font-extrabold text-indigo-600 dark:text-indigo-400 font-mono whitespace-nowrap">{tx.amount}</td>
                        <td className="p-3.5 sm:p-4 text-[10px] text-slate-400 uppercase font-bold tracking-wider whitespace-nowrap">{tx.paymentMethod}</td>
                        <td className="p-3.5 sm:p-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-black text-[9px] uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 rounded-3xl text-center space-y-2">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/40 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-slate-550 dark:text-slate-400 font-medium text-xs">No settlements resolved yet.</p>
              <p className="text-[10px] text-slate-400 leading-normal">Rentals successfully paid via our dummy escrow pipeline will establish dynamic logs here.</p>
            </div>
          )}
        </section>
      </main>

      {/* Custom Modern Appeal Modal */}
      {appealListingId !== null && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAppealListingId(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative z-10 border-[0.5px] border-slate-205 dark:border-white/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-black text-slate-900 dark:text-white tracking-tight">Appeal Suspension</h3>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block mt-0.5">Listing Ref: {appealListingId}</span>
                </div>
              </div>
              <button 
                onClick={() => setAppealListingId(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 p-3.5 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Please explain why this listing does not violate DirectRent guidelines. Provide details to help us reverse the suspension action.</span>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Appeal Reason & Context</label>
                <textarea
                  value={appealReasonText}
                  onChange={(e) => setAppealReasonText(e.target.value)}
                  placeholder="Tell us why your listing is valid (e.g., proof of ownership, corrected pricing, verified coordinates info)..."
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500/25 focus:ring-0 p-4 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none transition-all h-32"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAppealListingId(null)}
                  className="flex-1 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white font-bold text-xs uppercase tracking-widest py-3 rounded-2xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  disabled={!appealReasonText.trim() || isSubmittingAppeal}
                  onClick={async () => {
                    setIsSubmittingAppeal(true);
                    try {
                      await addDoc(collection(db, 'reports'), {
                        type: 'appeal',
                        listingId: appealListingId,
                        agentId: user?.id,
                        reporterId: user?.id,
                        reason: 'Appeal for Suspended Listing',
                        description: appealReasonText,
                        status: 'pending',
                        createdAt: serverTimestamp()
                      });
                      toast.success("Appeal submitted successfully.");
                      setAppealListingId(null);
                    } catch (err) {
                      toast.error("Failed to submit appeal.");
                    } finally {
                      setIsSubmittingAppeal(false);
                    }
                  }}
                  className="flex-1 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-2xl transition-all cursor-pointer shadow-lg shadow-indigo-500/15 text-center"
                >
                  {isSubmittingAppeal ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
