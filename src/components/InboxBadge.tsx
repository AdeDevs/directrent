import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const InboxBadge = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    // We want the sum of all unreadCount_tenant if user is tenant, or unreadCount_agent if user is agent
    // Since Firestore doesn't support sum aggregation easily in a simple onSnapshot across many docs without reading all of them,
    // we'll just listen to the collection where unread count > 0.
    const fieldToFilter = user.role === 'tenant' ? 'unreadCount_tenant' : 'unreadCount_agent';
    const q = query(
      collection(db, "conversations"),
      where(user.role === 'tenant' ? "tenantId" : "agentId", "==", user.id),
      where(fieldToFilter, ">", 0)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        let total = 0;
        snapshot.docs.forEach(doc => {
            total += (doc.data()[fieldToFilter] || 0);
        });
        setUnreadCount(total);
    }, (error) => {
        console.error("Inbox badge error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-primary-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
};

export default InboxBadge;
