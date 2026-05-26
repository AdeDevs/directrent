import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  ChevronRight,
  Sparkles,
  Inbox
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Notification } from "../types";

type FilterType = 'all' | 'unread' | 'alerts';

const Notifications = () => {
  const { user, setActiveTab } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const nRef = collection(db, "notifications");
    const q = query(
      nRef,
      where("userId", "==", user.id),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(docs);
      setIsLoading(false);
    }, (err) => {
      console.error("Notifications error:", err);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      setNotifications([]);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getStyleForType = (type: string) => {
    switch (type) {
      case 'message': 
        return {
          icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
          wrapperBg: "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-500 border border-indigo-100/40 dark:border-indigo-900/10",
        };
      case 'verification': 
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          wrapperBg: "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100/40 dark:border-emerald-900/10",
        };
      case 'listing': 
        return {
          icon: <Clock className="w-5 h-5 text-amber-500" />,
          wrapperBg: "bg-amber-50/50 dark:bg-amber-955/20 text-amber-550 border border-amber-100/40 dark:border-amber-900/10",
        };
      default: 
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
          wrapperBg: "bg-rose-50/50 dark:bg-rose-950/20 text-rose-500 border border-rose-100/40 dark:border-rose-900/10",
        };
    }
  };

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.type === 'message') {
      setActiveTab('chat');
    } else if (n.type === 'listing') {
      setActiveTab('home');
    } else if (n.type === 'verification') {
      setActiveTab('profile');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'unread') return !n.read;
      if (activeFilter === 'alerts') return n.type === 'verification' || n.type === 'system';
      return true;
    });
  }, [notifications, activeFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 transition-colors">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Loading board...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      
      {/* Visual Editorial Header with sticky blur */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="w-full max-w-none px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 leading-none">Activity Feed</span>
              <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
                  </span>
                )}
              </h1>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 px-3.5 py-2 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-xl transition-all font-mono border border-primary-100/40 dark:border-primary-950"
            >
              Clear dots ({unreadCount})
            </button>
          )}
        </div>
      </header>

      {/* Interactive Tabs for filter queries */}
      <div className="w-full bg-white/45 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800/60 sticky top-18 z-30 backdrop-blur-sm">
        <div className="max-w-none px-4 py-2 flex items-center gap-1">
          {(['all', 'unread', 'alerts'] as FilterType[]).map((filter) => (
            <button
              key={`filter-${filter}`}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wide cursor-pointer ${
                activeFilter === filter 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main notification lists feed */}
      <main className="w-full max-w-none px-4 py-6 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div 
                key="empty-inbox"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-150/70 dark:border-slate-800/80 p-16 text-center shadow-sm my-10 flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-center mb-6 text-slate-350 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
                  <Inbox className="w-7 h-7" />
                </div>
                <h3 className="text-base font-display font-black text-slate-800 dark:text-white mb-2">
                  All caught up!
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[240px] leading-relaxed font-light">
                  No new items found under the selected category feed tab.
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((n, idx) => {
                const layoutStyle = getStyleForType(n.type);
                return (
                  <motion.div
                    key={`redesign-notif-${n.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.4) }}
                    onClick={() => handleNotificationClick(n)}
                    className={`relative group bg-white dark:bg-slate-900 rounded-2.5xl border ${
                      n.read 
                        ? 'border-slate-200 dark:border-slate-800' 
                        : 'border-primary-300 dark:border-primary-900/40 bg-primary-50/[0.04] dark:bg-primary-950/5 shadow-premium shadow-primary-500/5'
                    } p-4 flex gap-4 cursor-pointer hover:shadow-md hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300 relative overflow-hidden`}
                  >
                    {/* Unread dot overlay in left edge */}
                    {!n.read && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary-600 rounded-r-md" />
                    )}

                    {/* Category specific dynamic icon widget */}
                    <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${layoutStyle.wrapperBg}`}>
                      {layoutStyle.icon}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-2.5 mb-1 bg-transparent">
                        <h4 className={`text-sm font-display font-black tracking-tight truncate ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase shrink-0">
                          {getTimeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className={`text-[11px] font-sans leading-relaxed line-clamp-2 pr-4 ${n.read ? 'text-slate-450 dark:text-slate-450 font-light' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                        {n.message}
                      </p>
                    </div>

                    {/* Action Panel icons on slide hover */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-350 dark:text-slate-600 cursor-pointer self-center"
                        title="Dismiss notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
