import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface NotificationBadgeProps {
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.id),
      where("read", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error: any) => {
        if (error?.code === 'permission-denied' || error?.message?.includes('permission')) return;
        if (user?.id) handleFirestoreError(error, OperationType.LIST, "notifications");
    });
    return () => unsubscribe();
  }, [user?.id]);

  if (unreadCount === 0) return null;

  return (
    <span className={className || "absolute top-1 right-1 w-4 h-4 bg-primary-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 group-hover:scale-110 transition-transform"}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
};

export default NotificationBadge;
