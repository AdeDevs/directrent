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
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Listing } from '../types';
import NotificationBadge from '../components/NotificationBadge';

export default function MyListings() {
  const { user, setCurrentListing, setActiveTab } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'approved' | 'pending'>('all');

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

  const filteredListings = listings.filter(l => {
    if (activeFilter === 'approved') return l.isApproved === true;
    if (activeFilter === 'pending') return l.isApproved !== true;
    return true;
  });

  const stats = [
    { 
      label: 'Total', 
      title: 'Total Listings',
      value: listings.length, 
      icon: <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-100/50 dark:border-indigo-800/30'
    },
    { 
      label: 'Live', 
      title: 'Approved',
      value: listings.filter(l => l.isApproved).length, 
      icon: <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-100/50 dark:border-emerald-800/30'
    },
    { 
      label: 'Pending', 
      title: 'Pending Review',
      value: listings.filter(l => !l.isApproved).length, 
      icon: <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-100/50 dark:border-amber-800/30'
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
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 h-14 sm:h-16 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight ml-1">My Listings</h1>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 transition-colors" />
            <NotificationBadge />
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      <main className="w-full px-3 py-4 sm:p-6 space-y-6 sm:space-y-10 pb-[14px] mb-0">
        {/* Stats Grid */}
        <section className="grid grid-cols-3 gap-2.5 sm:gap-4">
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
        <section className="flex gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-lg w-fit">
          {(['all', 'approved', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold capitalize transition-all ${activeFilter === f ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
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
                className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-3 sm:gap-4 group cursor-pointer active:scale-[0.98] transition-all"
                onClick={() => setCurrentListing(listing)}
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 relative">
                  <img 
                    src={listing.image} 
                    alt={listing.title} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  {!listing.isApproved && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 text-sm sm:text-base leading-tight">{listing.title}</h3>
                        {listing.isApproved && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{listing.location}</p>
                    </div>
                    {!listing.isApproved && (
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
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md" title="Total Views">
                        <Eye className="w-2.5 h-2.5" />
                        <span className="text-[10px] font-semibold text-slate-500">{listing.viewCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded-md" title="Total Leads">
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span className="text-[10px] font-semibold text-slate-500">{listing.inquiryCount || 0}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform hidden sm:block" />
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
      </main>
    </div>
  );
}
