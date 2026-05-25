import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  AlertCircle, 
  ChevronRight, 
  ShieldAlert, 
  Loader2, 
  X,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Server,
  Database
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  doc, 
  writeBatch, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { FEATURED_LISTINGS } from '../../data';
import { 
  purgeAllChats, 
  purgeAllFavorites, 
  resetAllAnalytics,
  purgeAllNotifications,
  purgeAllReports,
  purgeAllReviews,
  purgeAllTours
} from '../../utils/adminCleanup';

const HealthCheck = () => {
  const [status, setStatus] = useState<{
    firestore: 'checking' | 'healthy' | 'error';
    auth: 'checking' | 'healthy' | 'error';
    api: 'checking' | 'healthy' | 'error';
  }>({
    firestore: 'checking',
    auth: 'checking',
    api: 'checking'
  });

  const checkHealth = async () => {
    setStatus({ firestore: 'checking', auth: 'checking', api: 'checking' });

    // 1. Check Firestore
    try {
      const q = query(collection(db, 'listings'), limit(1));
      await getDocs(q);
      setStatus(prev => ({ ...prev, firestore: 'healthy' }));
    } catch (e) {
      console.error('Health Check: Firestore Fail', e);
      setStatus(prev => ({ ...prev, firestore: 'error' }));
    }

    // 2. Check Auth
    try {
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
        setStatus(prev => ({ ...prev, auth: 'healthy' }));
      } else {
        setStatus(prev => ({ ...prev, auth: 'error' }));
      }
    } catch (e) {
      setStatus(prev => ({ ...prev, auth: 'error' }));
    }

    // 3. Check API
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setStatus(prev => ({ ...prev, api: 'healthy' }));
      } else {
        setStatus(prev => ({ ...prev, api: 'error' }));
      }
    } catch (e) {
      setStatus(prev => ({ ...prev, api: 'error' }));
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const StatusItem = ({ label, state, icon: Icon }: { label: string, state: 'checking' | 'healthy' | 'error', icon: any }) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 ${
          state === 'healthy' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
          state === 'error' ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' :
          'text-slate-400 bg-slate-100 dark:bg-slate-800'
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 italic">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {state === 'checking' && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        {state === 'healthy' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        {state === 'error' && <XCircle className="w-3 h-3 text-rose-500" />}
        <span className={`text-[9px] font-bold uppercase tracking-tighter ${
          state === 'healthy' ? 'text-emerald-600' :
          state === 'error' ? 'text-rose-600' :
          'text-slate-400'
        }`}>
          {state}
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-600" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">System Health Monitor</h2>
        </div>
        <button 
          onClick={checkHealth}
          className="text-[9px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
        <StatusItem label="Firestore" state={status.firestore} icon={Database} />
        <StatusItem label="Authentication" state={status.auth} icon={ShieldAlert} />
        <StatusItem label="Infrastructure" state={status.api} icon={Server} />
      </div>
    </div>
  );
};

const Maintenance = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isPruning, setIsPruning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    type: 'rebuild' | 'purge' | 'reset-activity';
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const handleResetInteractionData = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      console.log("Starting consolidated reset...");
      await purgeAllChats();
      await purgeAllFavorites();
      await resetAllAnalytics();
      await purgeAllNotifications();
      await purgeAllReports();
      await purgeAllReviews();
      await purgeAllTours();
      setMessage({ type: 'success', text: 'Message history, favorites, analytics, notifications, reports, reviews, and tours have been reset across the entire platform.' });
    } catch (err: any) {
      console.error('Reset error:', err);
      setMessage({ type: 'error', text: 'Failed to reset interaction data: ' + err.message });
    } finally {
      setIsSyncing(false);
      setConfirmModal(null);
    }
  };

  const handleRebuildRegistry = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      for (const listing of FEATURED_LISTINGS) {
        const docRef = doc(db, 'listings', listing.id.toString());
        batch.set(docRef, {
          ...listing,
          viewCount: 0,
          favoritesCount: 0,
          inquiryCount: 0,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          isApproved: true,
          status: 'ACTIVE'
        });
      }
      await batch.commit();
      setMessage({ type: 'success', text: 'Listing registry successfully rebuilt and counters zeroed.' });
    } catch (err) {
      console.error('Rebuild error:', err);
      setMessage({ type: 'error', text: 'Failed to rebuild registry.' });
    } finally {
      setIsSyncing(false);
      setConfirmModal(null);
    }
  };

  const handleGlobalPurge = async () => {
    setIsPurging(true);
    setMessage(null);
    try {
      const batchSize = 100;
      let totalDeleted = 0;
      
      const q = query(collection(db, 'listings'));
      const querySnapshot = await getDocs(q);
      
      const usersSnap = await getDocs(collection(db, 'users'));
      const realUserIds = new Set(usersSnap.docs.map(u => u.id));
      
      const systemAgentIds = ['agent_kunle', 'agent_sarah', 'agent_mike', 'agent_bose', 'agent_ibrahim', 'agent_janet', 'agent_samuel', 'agent_tayo', 'agent_moses', 'agent_comfort'];
      
      const docsToDelete = querySnapshot.docs.filter(docSnap => {
        const data = docSnap.data();
        const agentId = data.agent?.id;
        
        const isSystemAgent = systemAgentIds.includes(agentId);
        const isNumericId = !isNaN(Number(docSnap.id));
        const isOrphan = agentId && !realUserIds.has(agentId);
        
        return isSystemAgent || isNumericId || isOrphan || !agentId;
      });

      if (docsToDelete.length === 0) {
        setMessage({ type: 'success', text: 'No system or orphan listings found to purge.' });
        return;
      }

      for (let i = 0; i < docsToDelete.length; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatch = docsToDelete.slice(i, i + batchSize);
        currentBatch.forEach(d => {
          batch.delete(d.ref);
          totalDeleted++;
        });
        await batch.commit();
      }

      setMessage({ type: 'success', text: `Purge complete. Deleted ${totalDeleted} system/orphan listings.` });
    } catch (err) {
      console.error('Purge error:', err);
      setMessage({ type: 'error', text: 'An error occurred during the purge process.' });
    } finally {
      setIsPurging(false);
      setConfirmModal(null);
    }
  };



  const maintenanceTools = [
    {
      id: 'rebuild',
      title: 'Rebuild Registry',
      description: 'Re-initializes the system with default featured listings from data.ts. Use this to reset the testing environment or fix mapping errors.',
      icon: RefreshCw,
      variant: 'neutral',
      action: () => setConfirmModal({
        type: 'rebuild',
        title: 'Rebuild Listing Registry',
        description: 'This will delete current listings and recreate the defaults. All manually added listings may be lost if they are not tied to verified agents.',
        onConfirm: handleRebuildRegistry
      })
    },
    {
      id: 'purge',
      title: 'Database Purge',
      description: 'Finds and removes all orphan listings and system-generated demo records. Recommended before migrating to a production database.',
      icon: Trash2,
      variant: 'danger',
      action: () => setConfirmModal({
        type: 'purge',
        title: 'Global Data Purge',
        description: 'This will perform a deep scan of the database and delete any documents that lack a verified relationship. This is irreversible.',
        onConfirm: handleGlobalPurge
      })
    },
    {
      id: 'reset',
      title: 'Reset Interaction Data',
      description: 'Consolidates messaging purge, favorites clearing, analytics reset, and removal of notifications, reports, reviews, and tours into a single operation.',
      icon: Zap,
      variant: 'danger',
      action: () => setConfirmModal({
        type: 'reset-activity',
        title: 'Clear All Engagement Data',
        description: 'This will permanently delete all chat history, clear all user favorites, zero out view counters, and remove all notifications, reports, reviews, and tours. This action is irreversible.',
        onConfirm: handleResetInteractionData
      })
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 w-full max-w-none"
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Admin</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 dark:text-white">Maintenance</span>
      </div>

      <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-6 mb-5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Maintenance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
          Administrative tools for data integrity, orphan cleanup, and environment resets.
          Ensure you have backups before executing terminal commands.
        </p>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 border flex items-start gap-3 ${
              message.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`text-sm font-bold ${message.type === 'success' ? 'text-emerald-900 dark:text-emerald-400' : 'text-rose-900 dark:text-rose-400'}`}>
                {message.type === 'success' ? 'Operation Successful' : 'Action Failed'}
              </h3>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{message.text}</p>
            </div>
            <button 
              onClick={() => setMessage(null)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <HealthCheck />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maintenanceTools.map((tool) => (
          <div 
            key={tool.id} 
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-none ${
                tool.variant === 'primary' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20' :
                tool.variant === 'danger' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' :
                tool.variant === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                'bg-slate-50 text-slate-600 dark:bg-slate-800'
              }`}>
                <tool.icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {tool.title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mb-6 flex-1">
              {tool.description}
            </p>
            <button 
              onClick={tool.action}
              disabled={isSyncing || isPurging || isPruning}
              className={`w-full py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                tool.variant === 'primary' ? 'bg-slate-900 text-white hover:bg-slate-800' :
                tool.variant === 'danger' ? 'border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-900/30' :
                'border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white dark:border-slate-700 dark:text-slate-400'
              } disabled:opacity-50`}
            >
              Execute Command
            </button>
          </div>
        ))}
      </div>

      <div className="p-[15px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex gap-4">
        <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold italic">
          Automatic Reconciliation Policy: These tools are intended for manual cleanup of persistent anomalies.
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm h-screen w-screen">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-0 flex justify-between items-start">
                <div className={`p-3 rounded-none ${
                    confirmModal.type === 'purge' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                }`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <button onClick={() => setConfirmModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {confirmModal.description}
                </p>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  disabled={isSyncing || isPurging || isPruning}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  disabled={isSyncing || isPurging || isPruning}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 ${
                    confirmModal.type === 'purge' || confirmModal.type === 'reset-activity' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-black'
                  }`}
                >
                  {(isSyncing || isPurging || isPruning) && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Command
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Maintenance;
