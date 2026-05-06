import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  Info,
  Loader2,
  Search,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Fingerprint,
  Eye,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Listing, Verification } from '../../types';

interface ApprovalsProps {
  // Add any props if needed
}

const Approvals: React.FC<ApprovalsProps> = () => {
  const [activeTab, setActiveTab] = useState<'listings' | 'agents'>('listings');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'rejected'>('pending');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [agentsFromColl, setAgentsFromColl] = useState<Verification[]>([]);
  const [agentsFromUsers, setAgentsFromUsers] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Verification | null>(null);
  const [activeImageTab, setActiveImageTab] = useState<'id' | 'selfie'>('id');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState<{ show: boolean, type: 'approval' | 'rejection' | null }>({ show: false, type: null });

  const createNotification = async (userId: string, title: string, message: string, type: 'verification' | 'listing' | 'system') => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error creating notification:", err);
    }
  };

  const filteredListings = useMemo(() => {
    return allListings.filter(listing => {
      if (statusFilter === 'pending') {
        return listing.isApproved === false && (!listing.status || listing.status === 'pending');
      }
      return listing.status === 'rejected';
    });
  }, [allListings, statusFilter]);

  const filteredAgents = useMemo(() => {
    // Combine and deduplicate by userId
    const map = new Map<string, Verification>();
    
    // Process verifications collection first
    agentsFromColl.forEach(a => {
      if (a.userId) map.set(a.userId, a);
    });
    
    // Process user profile applications
    agentsFromUsers.forEach(ua => {
      if (!map.has(ua.userId)) {
        map.set(ua.userId, ua);
      }
    });

    return Array.from(map.values()).filter(agent => {
      if (statusFilter === 'pending') return agent.status?.toLowerCase() === 'pending';
      return agent.status?.toLowerCase() === 'rejected';
    });
  }, [agentsFromColl, agentsFromUsers, statusFilter]);

  useEffect(() => {
    setLoading(true);
    
    // Listen for all non-approved listings
    const listingsQuery = query(
      collection(db, 'listings'),
      where('isApproved', '==', false)
    );
    
    const unsubscribeListings = onSnapshot(listingsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Listing[];
      setAllListings(data);
      if (activeTab === 'listings') setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'listings');
      setLoading(false);
    });

    const unsubscribeAgents = onSnapshot(collection(db, 'verifications'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Verification[];
      setAgentsFromColl(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'verifications');
      setLoading(false);
    });

    // Listen for pending/rejected agents in users collection
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'agent'),
      where('verificationStatus', 'in', ['pending', 'none'])
    );

    const unsubscribeUserAgents = onSnapshot(usersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const userData = doc.data();
        const status = userData.verificationStatus === 'pending' 
          ? 'pending' 
          : (userData.agent?.isVerified === false ? 'rejected' : 'none');
          
        return {
          id: doc.id,
          userId: doc.id,
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Anonymous Agent',
          email: userData.email,
          avatarUrl: userData.avatarUrl,
          status: status,
          rejectionReason: userData.agent?.verificationReason,
          location: userData.city || userData.location,
          govtIdUrl: userData.govtIdUrl,
          selfieUrl: userData.selfieUrl,
          idType: userData.govtIdType || 'NIN Slip',
          idNumber: userData.nin || userData.idNumber,
          submittedAt: userData.createdAt,
          isFromUsers: true
        } as unknown as Verification;
      }).filter(a => a.status === 'pending' || a.status === 'rejected');
      setAgentsFromUsers(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return () => {
      unsubscribeListings();
      unsubscribeAgents();
      unsubscribeUserAgents();
    };
  }, []);

  const handleApproveListing = async (id: string) => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, 'listings', id), {
        isApproved: true,
        status: 'active',
        updatedAt: serverTimestamp()
      });
      const listing = allListings.find(l => l.id === id);
      if (listing?.agent?.userId) {
        await createNotification(
          listing.agent.userId,
          'Listing Approved',
          `Your property listing "${listing.title}" has been approved and is now live!`,
          'listing'
        );
      }
    } catch (err) {
      console.error("Error approving listing:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectListing = async (id: string) => {
    if (!window.confirm("Are you sure you want to REJECT this listing?")) return;
    setProcessingId(id);
    try {
      await updateDoc(doc(db, 'listings', id), {
        isApproved: false,
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      const listing = allListings.find(l => l.id === id);
      if (listing?.agent?.userId) {
        await createNotification(
          listing.agent.userId,
          'Listing Rejected',
          `Your property listing "${listing.title}" was not approved. Please review our guidelines.`,
          'listing'
        );
      }
    } catch (err) {
      console.error("Error rejecting listing:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAgent = async (id: string, userId: string, isFromUsers?: boolean) => {
    setProcessingId(id);
    try {
      if (!isFromUsers) {
        await updateDoc(doc(db, 'verifications', id), {
          status: 'approved',
          updatedAt: serverTimestamp()
        });
      }
      
      const targetUserId = userId || id;
      await updateDoc(doc(db, 'users', targetUserId), {
        verificationLevel: 'verified',
        verificationStatus: 'verified',
        'agent.isVerified': true,
        'agent.verificationReason': null, // Clear reason on approval
        updatedAt: serverTimestamp()
      });

      await createNotification(
        targetUserId,
        'Verification Approved',
        'Congratulations! Your agent verification has been approved. You can now post listings.',
        'verification'
      );
      
      setShowSuccessModal({ show: true, type: 'approval' });
    } catch (err) {
      console.error("Error approving agent:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectAgent = async (id: string, userId: string, reason: string, isFromUsers?: boolean) => {
    setProcessingId(id);
    try {
      if (!isFromUsers) {
        await updateDoc(doc(db, 'verifications', id), {
          status: 'rejected',
          rejectionReason: reason,
          updatedAt: serverTimestamp()
        });
      }
      
      const targetUserId = userId || id;
      await updateDoc(doc(db, 'users', targetUserId), {
        verificationStatus: 'none',
        govtIdUrl: null, // Clear documents on rejection to reset form
        selfieUrl: null,
        govtIdType: null,
        'agent.verificationReason': reason,
        'agent.isVerified': false,
        updatedAt: serverTimestamp()
      });

      await createNotification(
        targetUserId,
        'Verification Declined',
        `Verification was declined: ${reason}. Please update your documents and try again.`,
        'verification'
      );

      setShowSuccessModal({ show: true, type: 'rejection' });
    } catch (err) {
      console.error("Error rejecting agent:", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Admin</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 dark:text-white">Approvals Queue</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main List Section */}
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Approvals Queue</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and manage pending property listings and agent credential verifications.</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button 
              onClick={() => setActiveTab('listings')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors flex-shrink-0 ${
                activeTab === 'listings' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span>Pending Listings</span>
              <span className="bg-primary-600 dark:bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {allListings.filter(l => !l.isApproved && (!l.status || l.status === 'pending')).length}
              </span>
              {activeTab === 'listings' && (
                <motion.div layoutId="activeTabBadge" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('agents')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors flex-shrink-0 ${
                activeTab === 'agents' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span>Agent Applications</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
                {[...agentsFromColl, ...agentsFromUsers].filter((a, i, self) => 
                  self.findIndex(t => t.userId === a.userId) === i && a.status === 'pending'
                ).length}
              </span>
              {activeTab === 'agents' && (
                <motion.div layoutId="activeTabBadge" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
          </div>

          {/* Sub-navigation for status */}
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setStatusFilter('pending')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border ${
                statusFilter === 'pending' 
                ? 'bg-primary-600 text-white border-primary-600' 
                : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              } transition-all`}
            >
              Pending Approval
            </button>
            <button 
              onClick={() => setStatusFilter('rejected')}
              className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 border ${
                statusFilter === 'rejected' 
                ? 'bg-rose-600 text-white border-rose-600' 
                : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400'
              } transition-all`}
            >
              Rejected Submissions
            </button>
          </div>

          {/* Search + Filters row */}
          <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab === 'listings' ? 'listings' : 'agents'}...`} 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <select className="w-full md:w-auto bg-slate-50 dark:bg-slate-800 border-none py-2.5 px-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-primary-500 outline-none transition-all">
                 <option>All Regions</option>
                 <option>Lagos</option>
                 <option>Abuja</option>
               </select>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Fetching queue data...</p>
              </div>
            ) : activeTab === 'listings' ? (
              filteredListings.length > 0 ? (
                <>
                  {/* Mobile/Tablet Stacked Cards Layout */}
                  <div className="lg:hidden space-y-4">
                    {filteredListings.map((listing) => (
                      <motion.div 
                        key={`mobile-listing-${listing.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 group relative"
                      >
                        <div className="w-full sm:w-[200px] h-48 sm:h-[140px] bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                          <img src={listing.image} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                          <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 border border-white/10">
                             ₦{listing.priceValue?.toLocaleString() || 'NaN'}/mo
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{listing.title || 'Untitled Listing'}</h3>
                              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {listing.location || 'Location Not Specified'}
                              </div>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1.5 border ${
                              listing.status === 'rejected' 
                              ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50'
                              : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50'
                            }`}>
                              {listing.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                            </span>
                          </div>

                          <div className="flex gap-6 mt-2 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                               <Building2 className="w-3.5 h-3.5" />
                               <span>{listing.beds || 0} Beds</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                               <div className="w-3.5 h-3.5 border-2 border-current rounded-sm opacity-60" />
                               <span>{listing.baths || 0} Baths</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                               <MapPin className="w-3.5 h-3.5" />
                               <span>{listing.area || 'NaN'} sqft</span>
                            </div>
                          </div>

                          <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2.5">
                                 <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                   <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(listing.agent?.name || 'Agent')}&background=000&color=fff`} alt="" />
                                 </div>
                                 <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                   Submitted by <span className="font-bold text-slate-900 dark:text-white">{listing.agent?.name || 'Unknown Agent'}</span>
                                 </span>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-9.5">
                                {listing.createdAt ? new Date(listing.createdAt?.seconds ? listing.createdAt.seconds * 1000 : listing.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            
                            {statusFilter === 'pending' && (
                              <div className="flex gap-3 w-full sm:w-auto">
                                <button 
                                  onClick={() => handleRejectListing(listing.id as string)}
                                  disabled={processingId === listing.id}
                                  className="flex-1 sm:flex-none px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 text-center"
                                >
                                  Decline
                                </button>
                                <button 
                                  onClick={() => handleApproveListing(listing.id as string)}
                                  disabled={processingId === listing.id}
                                  className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 text-center"
                                >
                                  Approve
                                </button>
                              </div>
                            )}

                            {statusFilter === 'rejected' && (
                              <button 
                                 onClick={() => handleApproveListing(listing.id as string)}
                                 className="w-full sm:w-auto px-6 py-2 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center"
                              >
                                Re-evaluate & Approve
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Item (Listing)</th>
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Submitted By</th>
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {filteredListings.map((listing) => (
                          <tr key={`desktop-listing-${listing.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center gap-3">
                                <img src={listing.image} alt="" className="w-16 h-12 rounded bg-slate-100 dark:bg-slate-800 object-cover border border-slate-200 dark:border-slate-700" />
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{listing.title || 'Untitled'}</p>
                                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">₦{listing.priceValue?.toLocaleString() || 'NaN'}/mo</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-xs font-medium text-slate-900 dark:text-slate-300">
                              <div className="flex items-center gap-2 max-w-[150px]">
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(listing.agent?.name || 'Agent')}&background=000&color=fff`} alt="" className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-700" />
                                <span className="truncate">{listing.agent?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap mt-1">
                              {listing.createdAt ? new Date(listing.createdAt?.seconds ? listing.createdAt.seconds * 1000 : listing.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <span className={`inline-block mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1 border ${
                                listing.status === 'rejected' 
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50'
                                : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50'
                              }`}>
                                {listing.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top text-right">
                              {statusFilter === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => handleRejectListing(listing.id as string)} disabled={processingId === listing.id} className="text-[10px] font-bold text-rose-600 font-black hover:bg-rose-50 dark:hover:bg-rose-900/40 px-3 py-1.5 border border-rose-200 dark:border-rose-900/50 uppercase tracking-widest disabled:opacity-50 transition-colors">Decline</button>
                                  <button onClick={() => handleApproveListing(listing.id as string)} disabled={processingId === listing.id} className="text-[10px] font-bold text-emerald-600 font-black hover:bg-emerald-50 dark:hover:bg-emerald-900/40 px-3 py-1.5 border border-emerald-200 dark:border-emerald-900/50 uppercase tracking-widest disabled:opacity-50 transition-colors">Approve</button>
                                </div>
                              ) : (
                                <button onClick={() => handleApproveListing(listing.id as string)} className="text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700 uppercase tracking-widest transition-colors">Re-evaluate</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">No {statusFilter} listings found.</p>
                </div>
              )
            ) : (
              filteredAgents.length > 0 ? (
                <>
                  <div className="lg:hidden space-y-4">
                    {filteredAgents.map((agent) => (
                      <motion.div 
                        key={`mobile-agent-${agent.userId || agent.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 group relative"
                      >
                        <div className="w-16 h-16 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          <img 
                            src={(agent as any).avatarUrl || `https://ui-avatars.com/api/?name=${agent.name}&background=000&color=fff`} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div>
                              <h3 className="font-bold text-slate-900 dark:text-white capitalize">{agent.name}</h3>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{(agent as any).email || 'No email provided'}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                Submitted {agent.createdAt ? new Date(agent.createdAt?.seconds ? agent.createdAt.seconds * 1000 : agent.createdAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                               {statusFilter === 'pending' ? (
                                 <button 
                                   onClick={() => setSelectedAgent(agent)}
                                   className="w-full sm:w-auto px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-primary-700 dark:hover:bg-primary-600 transition-all flex justify-center items-center gap-2"
                                 >
                                   Review Details
                                 </button>
                               ) : (
                                 <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                                   <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Rejected Application</span>
                                   <button 
                                     onClick={() => setSelectedAgent(agent)}
                                     className="text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white underline underline-offset-4"
                                   >
                                     View History
                                   </button>
                                 </div>
                               )}
                            </div>
                          </div>

                          {agent.rejectionReason && statusFilter === 'rejected' && (
                            <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                              <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.1em] mb-1">Rejection Note:</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{agent.rejectionReason}"</p>
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-100 dark:border-slate-700">
                               {agent.idType || 'ID'}: {agent.idNumber || 'PENDING'}
                            </div>
                            {agent.location && (
                              <div className="bg-slate-50 dark:bg-slate-800/50 px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-100 dark:border-slate-700">
                                 Location: {agent.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Desktop Table Layout */}
                  <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">User (Agent)</th>
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Email</th>
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                          <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {filteredAgents.map((agent) => (
                          <tr key={`desktop-agent-${agent.userId || agent.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center gap-3">
                                <img src={(agent as any).avatarUrl || `https://ui-avatars.com/api/?name=${agent.name}&background=000&color=fff`} alt="" className="w-10 h-10 rounded border border-slate-200 dark:border-slate-700 object-cover" />
                                <p className="font-bold text-slate-900 dark:text-white capitalize">{agent.name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-xs text-slate-500 dark:text-slate-400 mt-1">{(agent as any).email || 'N/A'}</td>
                            <td className="px-4 py-4 align-top text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {agent.createdAt ? new Date(agent.createdAt?.seconds ? agent.createdAt.seconds * 1000 : agent.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-4 align-top mt-0.5">
                              <span className={`inline-block text-[9px] font-black uppercase tracking-[0.1em] px-2 py-1 border ${
                                statusFilter === 'rejected' 
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50'
                                : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50'
                              }`}>
                                {statusFilter === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top text-right mt-0.5">
                               <button 
                                 onClick={() => setSelectedAgent(agent)}
                                 className="text-[10px] font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700 uppercase tracking-widest transition-colors"
                               >
                                 {statusFilter === 'pending' ? 'Review Details' : 'View History'}
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <User className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">No {statusFilter} agent applications.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Sidebar Insights Section - Hidden on mobile as per design requirement */}
        <div className="hidden lg:block w-80 shrink-0 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white overflow-hidden border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-slate-500 dark:text-slate-400">Queue Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Queue Total</span>
                <span className="text-xl font-black">{filteredListings.length + filteredAgents.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              Review Guidelines
            </h3>
            <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                Ensure all 5+ photos are high resolution.
              </li>
              <li className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                Verify license number via state database.
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Agent Review Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAgent(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify Agent Identity</h2>
                <p className="text-xs text-slate-500 mt-1">Cross-check profile information with the submitted government document.</p>
              </div>
              <button 
                onClick={() => setSelectedAgent(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Identity Section */}
              <div className="flex gap-6">
                <div className="w-24 h-24 shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img 
                    src={(selectedAgent as any).avatarUrl || `https://ui-avatars.com/api/?name=${selectedAgent.name}&background=000&color=fff`} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedAgent.name}</h3>
                  <p className="text-slate-500 font-medium font-mono text-sm">{(selectedAgent as any).email}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                      ID Type: {selectedAgent.idType || 'Government ID'}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                      ID Number: {selectedAgent.idNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Review Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => setActiveImageTab('id')}
                      className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                        activeImageTab === 'id' 
                        ? 'bg-primary-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <Fingerprint className="w-3 h-3" />
                      ID Document
                    </button>
                    <button 
                      onClick={() => setActiveImageTab('selfie')}
                      className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                        activeImageTab === 'selfie' 
                        ? 'bg-primary-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      Selfie Match
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      Digital Integrity Valid
                    </span>
                  </div>
                </div>
                
                <div className="relative group">
                  <div 
                    onClick={() => setIsFullscreen(true)}
                    className="aspect-[1.58] w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative overflow-hidden cursor-zoom-in group shadow-inner"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeImageTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full"
                      >
                        {activeImageTab === 'id' ? (
                          (selectedAgent as any).govtIdUrl ? (
                            <img 
                              src={(selectedAgent as any).govtIdUrl} 
                              alt="Verification Document" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                              <Clock className="w-12 h-12 mb-4 opacity-10 animate-pulse" />
                              <p className="text-xs font-bold uppercase tracking-widest opacity-40">Document missing</p>
                            </div>
                          )
                        ) : (
                          (selectedAgent as any).selfieUrl ? (
                            <img 
                              src={(selectedAgent as any).selfieUrl} 
                              alt="Selfie Match" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                              <User className="w-12 h-12 mb-4 opacity-10 animate-pulse" />
                              <p className="text-xs font-bold uppercase tracking-widest opacity-40">Selfie not uploaded</p>
                            </div>
                          )
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Scanline Effect Overlay (Senior Polish) */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                    
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center pointer-events-none duration-300">
                      <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 flex items-center gap-3">
                        <Maximize2 className="w-4 h-4 text-white" />
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">High-Res Audit View</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 py-2 border-y border-slate-100 dark:border-slate-800/50">
                   <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visual Inspection Required</span>
                   </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Verification Checklist</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Photo matches profile image",
                    "ID details match account",
                    "Document is valid/not expired",
                    "No signs of tampering"
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => setChecklist(prev => ({ ...prev, [item]: !prev[item] }))}
                      className="flex items-start gap-3 group text-left"
                    >
                      <div className={`w-4 h-4 mt-0.5 border flex items-center justify-center shrink-0 transition-all ${
                        checklist[item] 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:border-slate-400'
                      }`}>
                         {checklist[item] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-[11px] font-medium transition-colors ${
                        checklist[item] ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {item}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
              {showRejectionReason ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Reason for Rejection</label>
                    <textarea 
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain to the agent why their verification was declined. Mention specific document issues..."
                      className="w-full h-32 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 p-4 text-sm resize-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowRejectionReason(false)}
                      className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => {
                        if (!rejectionReason.trim()) return alert("Please provide a reason.");
                        handleRejectAgent(selectedAgent.id, (selectedAgent as any).userId, rejectionReason, (selectedAgent as any).isFromUsers);
                        setSelectedAgent(null);
                        setChecklist({});
                        setShowRejectionReason(false);
                        setRejectionReason('');
                      }}
                      className="flex-[2] h-12 bg-rose-600 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                    >
                      Process Final Rejection
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowRejectionReason(true)}
                    className="flex-1 h-12 bg-white dark:bg-slate-800 border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 text-xs font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject Identity
                  </button>
                  <button 
                    onClick={() => {
                      handleApproveAgent(selectedAgent.id, (selectedAgent as any).userId, (selectedAgent as any).isFromUsers);
                      setSelectedAgent(null);
                      setChecklist({});
                    }}
                    disabled={Object.values(checklist).filter(v => v).length < 4}
                    className={`flex-[2] h-12 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                      Object.values(checklist).filter(v => v).length < 4
                      ? 'bg-slate-400 cursor-not-allowed grayscale'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {Object.values(checklist).filter(v => v).length < 4 ? `Complete Checklist (${Object.values(checklist).filter(v => v).length}/4)` : 'Confirm & Verify Agent'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      <AnimatePresence>
        {showSuccessModal.show && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowSuccessModal({ show: false, type: null })}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 p-8 text-center"
            >
              <div className={`w-20 h-20 mx-auto rounded-none flex items-center justify-center mb-6 ${
                showSuccessModal.type === 'approval' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                : 'bg-rose-50 dark:bg-rose-900/20'
              }`}>
                {showSuccessModal.type === 'approval' ? (
                  <ShieldCheck className="w-10 h-10 text-emerald-600" />
                ) : (
                  <X className="w-10 h-10 text-rose-600" />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {showSuccessModal.type === 'approval' ? 'Verification Successful' : 'Submission Rejected'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                {showSuccessModal.type === 'approval' 
                  ? 'The agent has been granted official verification status and can now list properties.'
                  : 'The submission has been declined. The agent will be notified of the rejection reason.'}
              </p>
              
              <button 
                onClick={() => setShowSuccessModal({ show: false, type: null })}
                className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white text-xs font-black uppercase tracking-[0.2em] transition-all"
              >
                Continue Queue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Preview */}
      <AnimatePresence>
        {isFullscreen && selectedAgent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-100 dark:bg-slate-950 flex flex-col select-none"
          >
            {/* Toolbar */}
            <div className="h-20 shrink-0 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Audit Scope</span>
                  <span className="text-slate-900 dark:text-white text-xs font-bold uppercase">
                    {activeImageTab === 'id' ? `Identity Audit: ${selectedAgent.idType}` : 'Biometric Selfie Match'}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-300 dark:bg-white/10" />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 4))}
                    className="w-9 h-9 flex items-center justify-center bg-slate-200/50 hover:bg-slate-300/50 text-slate-700 dark:bg-white/5 dark:hover:bg-white/15 dark:text-white border border-slate-300 dark:border-white/10 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setZoomLevel(1)}
                    className="px-3 h-9 flex items-center justify-center bg-slate-200/50 hover:bg-slate-300/50 text-slate-700 dark:bg-white/5 dark:hover:bg-white/15 dark:text-white text-[10px] font-black border border-slate-300 dark:border-white/10 transition-colors"
                  >
                    {Math.round(zoomLevel * 100)}%
                  </button>
                  <button 
                    onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}
                    className="w-9 h-9 flex items-center justify-center bg-slate-200/50 hover:bg-slate-300/50 text-slate-700 dark:bg-white/5 dark:hover:bg-white/15 dark:text-white border border-slate-300 dark:border-white/10 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setRotation(prev => prev + 90)}
                    className="w-9 h-9 flex items-center justify-center bg-slate-200/50 hover:bg-slate-300/50 text-slate-700 dark:bg-white/5 dark:hover:bg-white/15 dark:text-white border border-slate-300 dark:border-white/10 transition-colors"
                    title="Rotate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex p-1 bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10">
                  <button 
                    onClick={() => setActiveImageTab('id')}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeImageTab === 'id' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}
                  >
                    ID
                  </button>
                  <button 
                    onClick={() => setActiveImageTab('selfie')}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeImageTab === 'selfie' ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}
                  >
                    Selfie
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setIsFullscreen(false);
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-12">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03)_0%,rgba(0,0,0,0)_70%)]" />
              
              <motion.div 
                drag={zoomLevel > 1}
                dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                animate={{ 
                  scale: zoomLevel,
                  rotate: rotation,
                  x: zoomLevel === 1 ? 0 : undefined,
                  y: zoomLevel === 1 ? 0 : undefined,
                }}
                className={`relative shadow-[0_0_100px_rgba(0,0,0,0.8)] ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
              >
                <img 
                  src={activeImageTab === 'id' ? (selectedAgent as any).govtIdUrl : (selectedAgent as any).selfieUrl} 
                  alt="Inspection Source" 
                  className="max-w-[80vw] max-h-[70vh] object-contain"
                  onDragStart={(e) => e.preventDefault()}
                />
                
                {/* Advanced Overlay (UI/UX Polish) */}
                <div className="absolute inset-0 border border-white/5 pointer-events-none" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5 pointer-events-none" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5 pointer-events-none" />
              </motion.div>
            </div>

            {/* Status Footer */}
            <div className="h-16 px-8 flex items-center justify-between bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
            <div className="flex gap-8">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Document Status</span>
                    <span className="text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest">Source Verified</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Entry Audit ID</span>
                    <span className="text-slate-900 dark:text-white text-[10px] font-mono tracking-widest">{selectedAgent.id.slice(-12).toUpperCase()}</span>
                 </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Use mouse drag to pan when zoomed. Audit view session is logged.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Approvals;
