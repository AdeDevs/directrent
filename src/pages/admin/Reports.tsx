import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Flag,
  Search,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  X,
  Check,
  Loader2,
  Eye,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logModeratorAction } from '../../lib/auditLogger';
import { toast } from 'react-hot-toast';
import { Listing } from '../../types';

interface Report {
  id: string;
  type?: 'listing' | 'agent' | 'appeal';
  listingId?: string | number;
  agentId?: string;
  reporterId: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: any;
  moderatorNote?: string;
  resolvedAt?: any;
}

interface ReportsProps {
  onNavigateToListing?: (listingId: string) => void;
  onNavigateToAgent?: (agentId: string) => void;
  preSelectedReportId?: string | null;
  clearPreSelectedReportId?: () => void;
}

const Reports: React.FC<ReportsProps> = ({ 
  onNavigateToListing, 
  onNavigateToAgent,
  preSelectedReportId,
  clearPreSelectedReportId
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'agents' | 'appeals'>('listings');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cache state for fetched entities to avoid repeated queries
  const [agentCache, setAgentCache] = useState<Record<string, any>>({});
  const [listingCache, setListingCache] = useState<Record<string, Listing>>({});
  const [reporterCache, setReporterCache] = useState<Record<string, any>>({});
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Subscribe to all reports
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      // Cleanup previous listener if it exists
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      if (!user) {
        setLoading(false);
        setReports([]);
        return;
      }

      const q = collection(db, 'reports');
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Report));
        setReports(fetched);
        setLoading(false);
      }, (error) => {
        // Suppress permission error during logout/transition
        if (error.code === 'permission-denied' && !auth.currentUser) {
          return;
        }
        console.error("Failed to load reports queue:", error);
        toast.error("Error reading moderator reports queue");
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
      authUnsubscribe();
    };
  }, []);

  // Auto-select report if navigated to from notifications
  useEffect(() => {
    if (preSelectedReportId && reports.length > 0) {
      const foundReport = reports.find(r => String(r.id) === String(preSelectedReportId));
      if (foundReport) {
        setSelectedReport(foundReport);
        if (clearPreSelectedReportId) {
          clearPreSelectedReportId();
        }
      }
    }
  }, [preSelectedReportId, reports, clearPreSelectedReportId]);

  // Lazy fetch related details when reports update
  useEffect(() => {
    reports.forEach(async (report) => {
      // 1. Fetch Reporter details if not cached
      if (report.reporterId && !reporterCache[report.reporterId]) {
        try {
          const userSnap = await getDoc(doc(db, 'users', report.reporterId));
          if (userSnap.exists()) {
            setReporterCache(prev => ({ ...prev, [report.reporterId]: userSnap.data() }));
          }
        } catch (e) {
          console.error("Failed to fetch reporter:", report.reporterId, e);
        }
      }

      // 2. Fetch Listing details if list report
      if (report.listingId && !listingCache[String(report.listingId)]) {
        try {
          const listingSnap = await getDoc(doc(db, 'listings', String(report.listingId)));
          if (listingSnap.exists()) {
            const lst = { id: listingSnap.id, ...listingSnap.data() } as Listing;
            setListingCache(prev => ({ ...prev, [String(report.listingId!)]: lst }));
            
            if (lst.agent?.id && !agentCache[lst.agent.id]) {
               getDoc(doc(db, 'users', lst.agent.id)).then(agentSnap => {
                 if (agentSnap.exists()) {
                   setAgentCache(prev => ({ ...prev, [lst.agent!.id!]: agentSnap.data() }));
                 }
               });
            }
          }
        } catch (e) {
          console.error("Failed to fetch listing:", report.listingId, e);
        }
      }

      // 3. Fetch Agent details if agent report
      if (report.agentId && !agentCache[report.agentId]) {
        try {
          const agentSnap = await getDoc(doc(db, 'users', report.agentId));
          if (agentSnap.exists()) {
            setAgentCache(prev => ({ ...prev, [report.agentId!]: agentSnap.data() }));
          }
        } catch (e) {
          console.error("Failed to fetch agent:", report.agentId, e);
        }
      }
    });
  }, [reports, reporterCache, listingCache, agentCache]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchQuery]);

  // Filter listings based on tab & searchQuery
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Determine if it is agent or listing or appeal
      const isAppeal = report.type === 'appeal';
      if (activeTab === 'appeals' && !isAppeal) return false;
      if (activeTab !== 'appeals' && isAppeal) return false;

      const isAgentReport = report.type === 'agent' || (!report.type && !!report.agentId && !report.listingId);
      if (activeTab === 'agents' && !isAgentReport) return false;
      if (activeTab === 'listings' && isAgentReport) return false;

      // Status Filter
      if (report.status !== statusFilter) return false;

      // Search matching details
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const reasonMatch = report.reason?.toLowerCase().includes(query);
        const descMatch = report.description?.toLowerCase().includes(query);
        
        let targetMatch = false;
        if (isAgentReport && report.agentId) {
          const ag = agentCache[report.agentId];
          const name = ag ? `${ag.firstName || ''} ${ag.lastName || ''}`.toLowerCase() : '';
          targetMatch = name.includes(query);
        } else if (report.listingId) {
          const lst = listingCache[report.listingId];
          targetMatch = lst ? lst.title?.toLowerCase().includes(query) : false;
        }

        return reasonMatch || descMatch || targetMatch;
      }

      return true;
    });
  }, [reports, activeTab, statusFilter, searchQuery, agentCache, listingCache]);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  const handleResolveReport = async (report: Report, deleteTarget: boolean) => {
    if (isProcessing) return;
    if (!actionReason.trim()) {
      toast.error("Please provide an Internal Resolution Summary");
      return;
    }
    
    setIsProcessing(true);
    const toastId = toast.loading("Processing report resolution...");

    try {
      const reportRef = doc(db, 'reports', report.id);
      
      if (report.type === 'appeal') {
        if (deleteTarget) {
          // Accept appeal -> Restore listing
          if (report.listingId) {
            await updateDoc(doc(db, 'listings', String(report.listingId)), {
              status: 'active',
              suspendedReason: null
            });
            toast.success("Listing restored successfully.");
            
            import('../../lib/notifications').then(({ createNotification }) => {
              createNotification(report.agentId!, "Appeal Accepted", `Your listing has been restored after reviewing your appeal.`, "system", undefined, String(report.listingId));
            });
          }
        } else {
          // Reject appeal -> Listing remains suspended
          toast.success("Appeal rejected. Listing remains suspended.");
        }
      } else if (deleteTarget) {
        // Takedown logic
        if (report.type === 'listing' || (report.listingId && !report.type)) {
          // Listing Takedown -> Suspend Listing
          await updateDoc(doc(db, 'listings', String(report.listingId)), {
            status: 'suspended',
            suspendedReason: actionReason
          });
          toast.success("Listing suspended successfully.");
          
          if (report.agentId) {
            import('../../lib/notifications').then(({ createNotification }) => {
              createNotification(report.agentId!, "Listing Suspended", `Your listing was suspended. You can appeal this from your listings page.`, "system", undefined, String(report.listingId));
            });
          }

          logModeratorAction('suspend', 'listing', String(report.listingId), { reason: `Suspended listing ${report.listingId} due to report: ${report.reason}`, internalNotes: actionReason || "Violated terms: Fraud/Scam" });
        } else if (report.type === 'agent' || report.agentId) {
          // Suspend Agent
          await updateDoc(doc(db, 'users', report.agentId!), {
            suspended: true,
            status: 'suspended'
          });
          toast.success("Agent suspended. Active listings will be sequestered.");
          logModeratorAction('suspend', 'agent', report.agentId!, { reason: `Suspended fraudulent broker profile ${report.agentId} on report: ${report.reason}`, internalNotes: actionReason || "Account reported: suspicious activities" });
        }
      } else {
        // Dismiss logic
        toast.success("Report safely dismissed without actions.");
        logModeratorAction('reject', report.type === 'agent' ? 'agent' : 'listing', String(report.listingId || report.agentId), { reason: `Dismissed report ${report.id} on reason: ${report.reason}`, internalNotes: actionReason || "Cleared after visual review" });
      }

      // Mark report status as resolved or dismissed
      await updateDoc(reportRef, {
        status: deleteTarget ? 'resolved' : 'dismissed',
        moderatorNote: actionReason,
        resolvedAt: serverTimestamp()
      });

      setSelectedReport(null);
      setActionReason('');
    } catch (err) {
      console.error("Resolution failed:", err);
      toast.error("An error occurred executing moderator response");
    } finally {
      setIsProcessing(false);
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Admin</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 dark:text-white">Trust & Safety Reports</span>
      </div>

      <div className="space-y-8">
        {/* Main List Section */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports Queue</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and manage flagged listings, fraud reports, and agent misconduct submissions.</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button 
              onClick={() => { setActiveTab('listings'); setSelectedReport(null); }}
              className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors flex-shrink-0 ${
                activeTab === 'listings' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span>Listings Reports</span>
              <span className="bg-primary-600 dark:bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                {reports.filter(r => (r.type === 'listing' || (!r.type && r.listingId)) && r.status === 'pending').length}
              </span>
              {activeTab === 'listings' && (
                <motion.div layoutId="ReportTabBadge" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('agents'); setSelectedReport(null); }}
              className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors flex-shrink-0 ${
                activeTab === 'agents' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span>Agent Reports</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {reports.filter(r => (r.type === 'agent' || (!r.type && r.agentId && !r.listingId)) && r.status === 'pending').length}
              </span>
              {activeTab === 'agents' && (
                <motion.div layoutId="ReportTabBadge" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600 dark:bg-primary-400" />
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('appeals'); setSelectedReport(null); }}
              className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors flex-shrink-0 ${
                activeTab === 'appeals' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span>Appeals</span>
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {reports.filter(r => r.type === 'appeal' && r.status === 'pending').length}
              </span>
              {activeTab === 'appeals' && (
                <motion.div layoutId="ReportTabBadge" className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500" />
              )}
            </button>
          </div>

          {/* Search + Filters row - Matching Approvals */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 w-full lg:w-fit overflow-x-auto no-scrollbar">
              {(['pending', 'resolved', 'dismissed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 lg:flex-none px-6 py-2 lg:py-1.5 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-widest ${
                    statusFilter === status 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter reports..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none px-10 py-3 lg:py-2 text-xs font-medium focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none rounded-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Fetching queue data...</p>
              </div>
            ) : filteredReports.length > 0 ? (
              <>
                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {paginatedReports.map((report) => {
                    const reporter = reporterCache[report.reporterId];
                    const reporterName = reporter ? `${reporter.firstName || ''} ${reporter.lastName || ''}` : `ID: ${report.reporterId.slice(0, 6)}`;
                    return (
                      <div key={`report-mobile-${report.id}`} className="p-4 space-y-4">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-none bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 relative flex-shrink-0">
                            {report.type === 'listing' || report.listingId ? (
                              listingCache[String(report.listingId)]?.images?.[0] || listingCache[String(report.listingId)]?.image ? (
                                <img src={listingCache[String(report.listingId)]?.images?.[0] || listingCache[String(report.listingId)]?.image} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <Building2 className="w-8 h-8 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                              )
                            ) : (
                              agentCache[report.agentId!]?.avatarUrl ? (
                                <img src={agentCache[report.agentId!]?.avatarUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <Flag className="w-8 h-8 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                              )
                            )}
                            <div className="absolute top-1 left-1">
                              <span className={`inline-flex px-2 py-0.5 rounded-none text-[8px] font-bold uppercase tracking-wider ${
                                report.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                                report.status === 'resolved' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {report.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{report.reason}</h3>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                By {reporterName} • {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-1 italic">
                                "{report.description}"
                              </p>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-800 dark:border-slate-700 h-10 shadow-lg"
                        >
                          <Eye className="w-4 h-4 text-white" />
                          <span>Review Report</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop view */}
                <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type / Reason</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reporter</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedReports.map((report) => {
                        const reporter = reporterCache[report.reporterId];
                        const reporterName = reporter ? `${reporter.firstName || ''} ${reporter.lastName || ''}` : `ID: ${report.reporterId.slice(0, 6)}`;
                        return (
                          <tr key={`desktop-report-${report.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                                  {report.type === 'listing' || report.listingId ? (
                                    listingCache[String(report.listingId)]?.images?.[0] || listingCache[String(report.listingId)]?.image ? (
                                      <img src={listingCache[String(report.listingId)]?.images?.[0] || listingCache[String(report.listingId)]?.image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <Building2 className="w-4 h-4 text-slate-400" />
                                    )
                                  ) : (
                                    agentCache[report.agentId!]?.avatarUrl ? (
                                      <img src={agentCache[report.agentId!]?.avatarUrl} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <User className="w-4 h-4 text-slate-400" />
                                    )
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{report.reason}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">ID: {report.listingId || report.agentId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-mono text-slate-600 dark:text-slate-400 uppercase">
                                {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-none bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                  {reporter?.avatarUrl ? (
                                    <img src={reporter.avatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                      {reporterName.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{reporterName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                report.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                                report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setSelectedReport(report)}
                                className="p-2 rounded-none transition-all text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 group-hover:text-primary-600"
                                title="Review Submission"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800/30 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                    Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredReports.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{filteredReports.length}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="p-2 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                    </button>
                    
                    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
                      {Array.from({ length: Math.ceil(filteredReports.length / itemsPerPage) }).map((_, i) => {
                        const pageNum = i + 1;
                        if (Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== Math.ceil(filteredReports.length / itemsPerPage)) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
                              currentPage === pageNum 
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button 
                      disabled={currentPage === Math.ceil(filteredReports.length / itemsPerPage) || filteredReports.length === 0}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="p-2 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-[#0c111e] border-2 border-dashed border-slate-200 dark:border-slate-850 p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-350 dark:text-slate-700">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest">Queue Clean</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">No pending reports found matching this criteria.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Detail Modal / Overlay - Matching Approvals */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-2xl h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    {selectedReport.reason}
                    <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest ${
                      selectedReport.status === 'pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' :
                      selectedReport.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' :
                      'bg-slate-100 text-slate-500 dark:bg-slate-800 font-mono'
                    }`}>
                      {selectedReport.status}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Reviewing user report #{selectedReport.id.slice(0, 8)}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-[15px] sm:p-6 space-y-8">
                <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-primary-600">Target Asset Inspection</h4>
                      {selectedReport.type === 'listing' ? (
                        (() => {
                          const lst = listingCache[String(selectedReport.listingId)];
                          const ownerAg = (lst?.agent?.id && agentCache[lst.agent.id]) || (selectedReport.agentId && agentCache[selectedReport.agentId]) || null;
                          return (
                            <div className="space-y-4">
                              <div className="border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                                <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative group">
                                  <AnimatePresence mode="wait">
                                    {lst?.images && lst.images.length > 0 && currentImageIndex < lst.images.length ? (
                                      <motion.img 
                                        key={currentImageIndex}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        src={lst.images[currentImageIndex]}
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                      />
                                    ) : lst?.video ? (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <video 
                                          key={lst.video}
                                          src={lst.video} 
                                          className="w-full h-full object-contain" 
                                          controls 
                                        />
                                      </div>
                                    ) : (
                                      <motion.img 
                                        key="default-image"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        src={lst?.image} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                      />
                                    )}
                                  </AnimatePresence>

                                  {((lst?.images && lst.images.length > 1) || lst?.video) && (
                                    <>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const numImages = (lst?.images || []).length;
                                          const totalItems = numImages + (lst?.video ? 1 : 0);
                                          setCurrentImageIndex(prev => (prev === 0 ? totalItems - 1 : prev - 1));
                                        }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                                      >
                                        <ChevronLeft className="w-5 h-5" />
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const numImages = (lst?.images || []).length;
                                          const totalItems = numImages + (lst?.video ? 1 : 0);
                                          setCurrentImageIndex(prev => (prev === totalItems - 1 ? 0 : prev + 1));
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                                      >
                                        <ChevronRight className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                  
                                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 border border-white/10 flex items-center gap-2 z-10">
                                    <Building2 className="w-3.5 h-3.5 text-white" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Listing Asset</span>
                                  </div>
                                </div>
                                <div className="p-[15px] space-y-4">
                                  <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{lst?.title || "Unknown Listing"}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1"><MapPin className="w-3 h-3 text-slate-400" /> {lst?.location}</p>
                                  </div>
                                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-black text-primary-600 font-mono">₦{lst?.priceValue?.toLocaleString() || '---'}</span>
                                    <button onClick={(e) => {
                                      if (onNavigateToListing) { e.preventDefault(); onNavigateToListing(String(selectedReport.listingId)); setSelectedReport(null); }
                                      else { window.open(`/listing/${selectedReport.listingId}`, '_blank'); }
                                    }} className="text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest cursor-pointer">
                                      View Details <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {ownerAg && (
                                <div className="p-[15px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-4 sm:gap-6">
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                    {ownerAg?.avatarUrl ? <img src={ownerAg.avatarUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-2xl sm:text-3xl uppercase">{(ownerAg?.firstName || ownerAg?.name || 'A').charAt(0)}</div>}
                                  </div>
                                  <div className="flex-1 space-y-1.5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listing Owner</h4>
                                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{ownerAg?.name || `${ownerAg?.firstName || ''} ${ownerAg?.lastName || ''}`.trim() || 'Unknown Agent'}</h3>
                                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">{ownerAg.email}</p>
                                    <div className="pt-1">
                                      <span className={`inline-flex px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${ownerAg?.suspended ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
                                        {ownerAg?.suspended ? 'Suspended' : 'Active'}
                                      </span>
                                    </div>
                                  </div>
                                  <button onClick={(e) => {
                                    if (onNavigateToAgent) { e.preventDefault(); onNavigateToAgent(String(lst.agent?.id)); setSelectedReport(null); }
                                    else { window.open(`/agent/${lst.agent?.id}`, '_blank'); }
                                  }} className="w-8 h-8 sm:w-10 sm:h-10 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer">
                                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        (() => {
                          const ag = agentCache[selectedReport.agentId!];
                          return (
                            <div className="p-[15px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-6">
                              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                {ag?.avatarUrl ? <img src={ag.avatarUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-3xl uppercase">{ag?.firstName?.charAt(0) || 'A'}</div>}
                              </div>
                              <div className="flex-1 space-y-2">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{ag ? `${ag.firstName} ${ag.lastName}` : "Unknown Agent"}</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">{ag?.email}</p>
                                <div className="pt-2">
                                  <span className={`inline-flex px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest ${ag?.suspended ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
                                    {ag?.suspended ? 'Currently Suspended' : 'Account Active'}
                                  </span>
                                </div>
                              </div>
                              <button onClick={(e) => {
                                if (onNavigateToAgent) { e.preventDefault(); onNavigateToAgent(String(selectedReport.agentId)); setSelectedReport(null); }
                                else { window.open(`/agent/${selectedReport.agentId}`, '_blank'); }
                              }} className="w-10 h-10 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })()
                      )}
                    </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Allegation Dossier</h4>
                      <div className="p-[15px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          "{selectedReport.description || "No specific notes provided by the reporter."}"
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {selectedReport.createdAt?.seconds ? new Date(selectedReport.createdAt.seconds * 1000).toLocaleString() : 'Unknown Date'}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /> Reporter ID: {selectedReport.reporterId.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Investigative Actions</h4>
                      <div className="p-[15px] bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Internal Resolution Summary</label>
                          <textarea 
                            className="w-full h-32 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-4 text-xs font-medium focus:ring-1 focus:ring-primary-500 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900"
                            placeholder={selectedReport.status !== 'pending' ? 'No summary provided...' : "Describe relevant reasoning and investigative findings for archival..."}
                            value={selectedReport.status !== 'pending' ? (selectedReport.moderatorNote || '') : actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            disabled={selectedReport.status !== 'pending'}
                          />
                        </div>

                        {selectedReport.status === 'pending' && (
                          <div className="flex flex-col gap-3">
                            <button 
                              disabled={isProcessing}
                              onClick={() => handleResolveReport(selectedReport, true)}
                              className={`w-full py-3 sm:py-4 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${selectedReport.type === 'appeal' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (selectedReport.type === 'appeal' ? <CheckCircle2 className="w-4 h-4 text-white" /> : <AlertTriangle className="w-4 h-4 text-white" />)}
                              {selectedReport.type === 'agent' ? 'Suspension / Deletion' : selectedReport.type === 'appeal' ? 'Accept Appeal / Restore Listing' : 'Execute Sanctions / Takedown'}
                            </button>
                            <button 
                              disabled={isProcessing}
                              onClick={() => handleResolveReport(selectedReport, false)}
                              className="w-full py-3 sm:py-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              {selectedReport.type === 'appeal' ? <XCircle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4" />}
                              {selectedReport.type === 'appeal' ? 'Reject Appeal' : 'Dismiss Report'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex gap-4">
                      <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                      <p className="text-[10px] text-amber-800 dark:text-amber-400/70 font-medium leading-relaxed italic">
                        Moderator actions are immutable and tied to your administrator profile signature. Takedowns will immediately hide content from public results and notify the subject entity of the policy violation.
                      </p>
                    </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
