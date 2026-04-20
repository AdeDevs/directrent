import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Search, Clock, ChevronRight, User, Home, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ChatModal from '../components/ChatModal';
import { Listing } from '../types';

interface Conversation {
  id: string;
  tenantId: string;
  agentId: string;
  listingId: string;
  lastMessage: string;
  updatedAt: any;
  tenantName: string;
  agentName: string;
  listingTitle: string;
  listingImage: string;
  listingPrice: string;
  status: 'inquiry' | 'negotiating' | 'contract_requested' | 'contract_sent' | 'paid' | 'completed';
}

const Inbox = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'contract_requested':
        return { label: 'Contract Requested', color: 'bg-primary-50 text-primary-700 border-primary-100' };
      case 'contract_sent':
        return { label: 'Review Contract', color: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'paid':
        return { label: 'Deposit Paid', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'completed':
        return { label: 'Completed', color: 'bg-slate-100 text-slate-600 border-slate-200' };
      default:
        return { label: 'Inquiry', color: 'bg-slate-50 text-slate-500 border-slate-100' };
    }
  };

  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, 'conversations');
    const fieldToFilter = user.role === 'tenant' ? 'tenantId' : 'agentId';
    const q = query(
      conversationsRef,
      where(fieldToFilter, '==', user.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      setConversations(convs);
      setLoading(false);
    }, (err) => {
      console.error("Inbox listener error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredConversations = conversations.filter(conv => 
    conv.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching your conversations...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Messages</h1>
          <p className="text-slate-500 text-sm mt-1">Track your property inquiries and chats with agents</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredConversations.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-12 lg:p-20 border border-slate-100 flex flex-col items-center text-center shadow-xl shadow-slate-200/50"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 border border-slate-100">
              <MessageSquare className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No active chats</h3>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              When you message an agent about a property, your conversation will appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedConv(conv)}
                className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-primary-100 hover:shadow-lg hover:shadow-primary-500/5 transition-all cursor-pointer flex items-center gap-4"
              >
                {/* Property Thumbnail */}
                <div className="relative shrink-0">
                  <img 
                    src={conv.listingImage} 
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100 group-hover:scale-105 transition-transform" 
                    referrerPolicy="no-referrer"
                    alt={conv.listingTitle}
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-primary-600">
                    {conv.agentName.charAt(0)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <h4 className="font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                        {user?.role === 'tenant' ? conv.agentName : conv.tenantName}
                      </h4>
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${getStatusConfig(conv.status || 'inquiry').color} shrink-0 whitespace-nowrap`}>
                        {getStatusConfig(conv.status || 'inquiry').label}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {getTimeAgo(conv.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1.5">
                    <Home className="w-3 h-3 text-slate-300 shrink-0" />
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{conv.listingTitle}</p>
                  </div>
                  
                  <p className="text-sm text-slate-600 truncate opacity-80 group-hover:opacity-100 transition-opacity">
                    {conv.lastMessage}
                  </p>
                </div>

                <div className="shrink-0 text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Selected Conversation Modal */}
      {selectedConv && (
        <ChatModal 
          isOpen={!!selectedConv}
          onClose={() => setSelectedConv(null)}
          overrideConversationId={selectedConv.id}
          listing={{
            id: parseInt(selectedConv.listingId),
            title: selectedConv.listingTitle,
            price: selectedConv.listingPrice,
            image: selectedConv.listingImage,
            agent: {
              id: selectedConv.agentId,
              name: selectedConv.agentName,
              rating: 5.0,
              isVerified: true
            },
            location: '',
            type: '',
            amenities: [],
            landmark: '',
            beds: 0,
            baths: 0,
            area: '',
            verified: true,
            noFee: true,
            isFavorite: false
          } as Listing}
          currentUser={user!}
        />
      )}
    </motion.div>
  );
};

export default Inbox;
