import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  ChevronRight,
  MoreVertical,
  Circle,
  Loader2
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

const Notifications = () => {
  const { user, setActiveTab, setCurrentListing, setSelectedAgentId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "";
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
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'verification': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'listing': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'system': return <AlertCircle className="w-5 h-5 text-slate-500" />;
      default: return <Bell className="w-5 h-5 text-primary-500" />;
    }
  };

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    if (n.type === 'message') {
      setActiveTab('chat');
    } else if (n.type === 'listing' && n.link) {
      // Logic to navigate to specific listing if needed
      setActiveTab('home');
    } else if (n.type === 'verification') {
      setActiveTab('profile');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 transition-colors">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Fetching notifications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="w-full max-w-full px-2 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight ml-2">Notifications</h1>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-primary-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <button 
            onClick={markAllAsRead}
            className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 px-3 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          >
            Mark all read
          </button>
        </div>
      </header>

      <main className="w-full px-3 py-6 sm:p-6 pb-[14px] mb-0">
        <div className="max-w-2xl mx-auto space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div 
                key="empty-notifications"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm"
              >
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                  <Bell className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No notifications yet</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">We'll notify you when you have new messages, listing updates or verification news.</p>
              </motion.div>
            ) : (
              notifications.map((n, idx) => (
                <motion.div
                  key={`notif-${n.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative group bg-white dark:bg-slate-900 rounded-xl border ${n.read ? 'border-slate-100 dark:border-slate-800' : 'border-primary-100/50 dark:border-primary-900/30 bg-primary-50/10 dark:bg-primary-900/5 shadow-sm shadow-primary-500/5'} p-3.5 sm:p-5 flex gap-3.5 sm:gap-5 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99] overflow-hidden`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${n.read ? 'bg-slate-50 dark:bg-slate-800 text-slate-400' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 shadow-inner'}`}>
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className={`text-sm sm:text-base font-display font-bold tracking-tight truncate ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
                        {n.createdAt?.toDate ? getTimeAgo(n.createdAt) : 'Now'}
                      </span>
                    </div>
                    <p className={`text-[11px] sm:text-xs font-sans leading-relaxed line-clamp-2 ${n.read ? 'text-slate-500 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>
                      {n.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <ChevronRight className={`w-4 h-4 transition-all ${n.read ? 'text-slate-200 dark:text-slate-800' : 'text-primary-300 dark:text-primary-700'} group-hover:translate-x-1 group-hover:text-primary-500`} />
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
