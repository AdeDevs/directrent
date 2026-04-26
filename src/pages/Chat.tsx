import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Search,
  Clock,
  ChevronRight,
  User as UserIcon,
  Home,
  Loader2,
  Bell,
} from "lucide-react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ChatModal from "../components/ChatModal";
import { Listing, VerificationLevel } from "../types";
import NotificationBadge from "../components/NotificationBadge";
import VerificationBadge from "../components/VerificationBadge";

import { calculateVerificationLevel } from "../lib/verification";

// Custom hook for live participant info
const useParticipant = (userId: string | undefined) => {
  const [participant, setParticipant] = useState<{
    name: string;
    avatarUrl?: string;
    verificationLevel?: VerificationLevel;
  } | null>(null);

  useEffect(() => {
    if (!userId || userId === 'unknown') return;

    return onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setParticipant({
          name: data.firstName || data.lastName ? `${data.firstName || ''} ${data.lastName || ''}`.trim() : (data.name || "User"),
          avatarUrl: data.avatarUrl,
          verificationLevel: data.verificationLevel === 'verified' ? 'verified' : calculateVerificationLevel(data as any)
        });
      }
    });
  }, [userId]);

  return participant;
};

// Helper component to handle avatar logic
const ConversationAvatar = ({ 
  userId, 
  initialImage, 
  initialName, 
  listingImage 
}: { 
  userId: string; 
  initialImage?: string; 
  initialName: string;
  listingImage: string;
}) => {
  const participant = useParticipant(userId);
  const avatarUrl = participant?.avatarUrl || initialImage;

  return (
    <div className="relative shrink-0 mt-0.5">
      <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-primary-50 dark:bg-primary-900/10 overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            alt=""
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-lg">
            {(participant?.name || initialName).charAt(0)}
          </div>
        )}
      </div>
      {/* Property Image - Small Overlay */}
      <div className="absolute -bottom-1 -right-1 w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-slate-900 border-[3px] sm:border-4 border-white dark:border-slate-900 shadow-lg overflow-hidden">
        <img 
          src={listingImage} 
          className="w-full h-full object-cover opacity-80"
          alt="" 
        />
      </div>
    </div>
  );
};

const ConversationRow = ({ 
  conv, 
  user, 
  onClick, 
  getTimeAgo, 
  getStatusConfig 
}: { 
  conv: Conversation; 
  user: any; 
  onClick: () => void;
  getTimeAgo: (t: any) => string;
  getStatusConfig: (s: string) => any;
  key?: React.Key;
}) => {
  const participantId = user?.role === "tenant" ? conv.agentId : conv.tenantId;
  const participant = useParticipant(participantId);
  
  const displayName = participant?.name || (user?.role === "tenant" ? conv.agentName : conv.tenantName);
  const unreadCount = user?.role === 'tenant' ? conv.unreadCount_tenant : conv.unreadCount_agent;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group relative bg-white dark:bg-slate-900 flex items-start gap-4 p-3.5 sm:p-5 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-black/30 hover:border-primary-100 dark:hover:border-primary-900 transition-all cursor-pointer active:scale-[0.99] w-full max-w-full overflow-hidden"
    >
      <ConversationAvatar 
        userId={participantId}
        initialImage={user?.role === "tenant" ? conv.agentImage : conv.tenantImage}
        initialName={displayName}
        listingImage={conv.listingImage}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate tracking-tight min-w-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {displayName}
            </h4>
            {participant?.verificationLevel && (
              <VerificationBadge level={participant.verificationLevel} showText={false} className="scale-90" />
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors">
            {getTimeAgo(conv.updatedAt)}
          </span>
        </div>

        {unreadCount ? (
          <div className="absolute top-2 right-2 flex flex-col items-center gap-1.5">
            <div className="bg-primary-600 text-white text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-full shadow-lg shadow-primary-500/20 ring-2 ring-white dark:ring-slate-900 animate-in fade-in zoom-in duration-300">
               {unreadCount}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0">
          <span
            className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shrink-0 shadow-sm ${
              getStatusConfig(conv.status || "inquiry").color
            }`}
          >
            {getStatusConfig(conv.status || "inquiry").label}
          </span>
        </div>

        <div className="flex items-center gap-1 min-w-0">
          <Home className="w-3 h-3 text-slate-300 dark:text-slate-700 shrink-0" />
          <p className="text-[10px] sm:text-xs font-display font-black text-slate-400 dark:text-slate-500 truncate uppercase tracking-widest min-w-0 opacity-70">
            {conv.listingTitle}
          </p>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug font-medium line-clamp-2 break-words min-w-0 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
          {conv.lastMessage.length > 70
            ? conv.lastMessage.substring(0, 70) + "..."
            : conv.lastMessage}
        </p>
      </div>

      <div className="shrink-0 text-slate-200 dark:text-slate-800 group-hover:text-primary-400 dark:group-hover:text-primary-500 transition-all hidden sm:block translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100">
        <ChevronRight className="w-6 h-6" />
      </div>
    </motion.div>
  );
};

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
  tenantImage?: string;
  agentImage?: string;
  listingPrice: string;
  unreadCount_tenant?: number;
  unreadCount_agent?: number;
  status:
    | "inquiry"
    | "negotiating"
    | "contract_requested"
    | "contract_sent"
    | "paid"
    | "completed";
}

const Inbox = () => {
  const { user, setActiveTab } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "contract_requested":
        return {
          label: "Contract Requested",
          color: "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30",
        };
      case "contract_sent":
        return {
          label: "Review Contract",
          color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
        };
      case "paid":
        return {
          label: "Deposit Paid",
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
        };
      case "completed":
        return { label: "Completed", color: "text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800" };
      default:
        return { label: "Inquiry", color: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800" };
    }
  };

  useEffect(() => {
    if (!user) return;

    const conversationsRef = collection(db, "conversations");
    const fieldToFilter = user.role === "tenant" ? "tenantId" : "agentId";
    const q = query(
      conversationsRef,
      where(fieldToFilter, "==", user.id),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const convs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Conversation[];
        setConversations(convs);
        setLoading(false);
      },
      (err) => {
        console.error("Inbox listener error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-50 dark:border-primary-900/20 rounded-full animate-pulse" />
          <Loader2 className="w-6 h-6 text-primary-600 dark:text-primary-400 animate-spin absolute inset-0 m-auto" />
        </div>
        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">
          Syncing Messages
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="w-full max-w-full px-2 h-16 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight ml-2">
            Messages
          </h1>
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors group mr-1"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 transition-colors" />
            <NotificationBadge />
          </button>
        </div>
      </header>

      <main className="pt-[72px] px-[15px] pb-[110px]" style={{ paddingTop: "20px" }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full"
        >
          {/* Search Section */}
          <div className="mb-6">
            <div className="relative group max-w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-lg py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/20 dark:focus:ring-primary-900/20 dark:focus:border-primary-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-sans tracking-tight dark:text-white"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="space-y-2.5 sm:space-y-4 pb-[110px]">
            <AnimatePresence mode="popLayout">
              {filteredConversations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/40 flex flex-col items-center justify-center py-20 sm:py-32 px-8 text-center"
                >
                  <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-6 text-primary-200 dark:text-primary-800 scale-110">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Your inbox is clear
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 max-w-[260px] leading-relaxed font-medium">
                    When you inquire about a property, your chats will appear
                    here instantly.
                  </p>
                </motion.div>
              ) : (
                filteredConversations.map((conv, idx) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    user={user}
                    onClick={() => setSelectedConv(conv)}
                    getTimeAgo={getTimeAgo}
                    getStatusConfig={getStatusConfig}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Selected Conversation Modal */}
        {selectedConv && (
          <ChatModal
            isOpen={!!selectedConv}
            onClose={() => setSelectedConv(null)}
            overrideConversationId={selectedConv.id}
            listing={
              {
                id: parseInt(selectedConv.listingId),
                title: selectedConv.listingTitle,
                price: selectedConv.listingPrice,
                image: selectedConv.listingImage,
                agent: {
                  id: selectedConv.agentId,
                  name: selectedConv.agentName,
                  rating: 5.0,
                  isVerified: true,
                },
                location: "",
                type: "",
                amenities: [],
                landmark: "",
                beds: 0,
                baths: 0,
                area: "",
                verified: true,
                noFee: true,
                isFavorite: false,
              } as Listing
            }
            currentUser={user!}
          />
        )}
      </main>
    </div>
  );
};

export default Inbox;
