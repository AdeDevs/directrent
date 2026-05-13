import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const InboxBadge = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    
    // We want the count of conversations where user has unread messages
    const fieldToFilter = user.role === 'tenant' ? 'unreadCount_tenant' : 'unreadCount_agent';
    const q = query(
      collection(db, "conversations"),
      where(user.role === 'tenant' ? "tenantId" : "agentId", "==", user.id),
      where(fieldToFilter, ">", 0)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.size);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "conversations");
    });

    return () => unsubscribe();
  }, [user?.id, user?.role]);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-primary-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
};

export default InboxBadge;
