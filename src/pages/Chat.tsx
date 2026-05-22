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
  Mic,
} from "lucide-react";
import SafeImage from "../components/SafeImage";
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
import { ChatModal } from "../components/ChatModal";
import { Listing, VerificationLevel, UserRole } from "../types";
import NotificationBadge from "../components/NotificationBadge";
import VerificationBadge from "../components/VerificationBadge";

import { calculateVerificationLevel } from "../lib/verification";

// Custom hook for live participant info
const useParticipant = (userId: string | undefined) => {
  const [participant, setParticipant] = useState<{
    name: string;
    avatarUrl?: string;
    verificationLevel?: VerificationLevel;
    role: UserRole;
  } | null>(null);

  useEffect(() => {
    if (!userId || userId === 'unknown') return;

    return onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setParticipant({
          name: data.firstName || data.lastName ? `${data.firstName || ''} ${data.lastName || ''}`.trim() : (data.name || "User"),
          avatarUrl: data.avatarUrl,
          verificationLevel: data.verificationLevel === 'verified' ? 'verified' : calculateVerificationLevel(data as any),
          role: data.role as UserRole || 'tenant'
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
    <div className="relative shrink-0 flex items-center">
      <div className="w-12 h-12 sm:w-15 sm:h-15 rounded-full bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-inner group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            alt=""
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-450 font-extrabold text-lg font-sans">
            {(participant?.name || initialName || "?").charAt(0)}
          </div>
        )}
      </div>
      {/* Property Image - Small Overlay */}
      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-xl bg-white dark:bg-slate-900 border-[2.5px] border-white dark:border-slate-900 shadow-md overflow-hidden flex-shrink-0">
        {listingImage ? (
          <SafeImage 
            src={listingImage} 
            className="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-500"
            alt="" 
          />
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800" />
        )}
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group relative bg-white dark:bg-slate-900 flex items-center gap-4 p-4 rounded-3xl border border-slate-150/70 dark:border-slate-800/80 shadow-sm hover:shadow-2xl hover:shadow-slate-200/30 dark:hover:shadow-black/30 hover:border-primary-150 dark:hover:border-primary-900/40 transition-all duration-300 cursor-pointer active:scale-[0.98] w-full max-w-full overflow-hidden"
    >
      <ConversationAvatar 
        userId={participantId}
        initialImage={user?.role === "tenant" ? conv.agentImage : conv.tenantImage}
        initialName={displayName}
        listingImage={conv.listingImage}
      />

      <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-4 sm:pr-8">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="font-display font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight truncate tracking-tight min-w-0 group-hover:text-primary-600 dark:group-hover:text-primary-450 transition-colors">
              {displayName}
            </h4>
            {participant?.verificationLevel && (
              <VerificationBadge level={participant.verificationLevel} role={participant.role} showText={false} className="scale-90" />
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 group-hover:text-slate-500 transition-colors">
            {getTimeAgo(conv.updatedAt)}
          </span>
        </div>

        {unreadCount ? (
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center pointer-events-none">
            <div className="min-w-[20px] h-[20px] px-1.5 flex items-center justify-center bg-primary-600 text-white text-[10px] font-black rounded-full shadow-sm animate-pulse">
               {unreadCount}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 border ${
              getStatusConfig(conv.status || "inquiry").color
            }`}
          >
            {getStatusConfig(conv.status || "inquiry").label}
          </span>
          
          <div className="flex items-center gap-1 min-w-0 opacity-80">
            <Home className="w-3 h-3 text-slate-400 dark:text-slate-550 shrink-0" />
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase tracking-wider min-w-0">
              {conv.listingTitle}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal line-clamp-1 break-words min-w-0 overflow-hidden pr-2">
          {conv.lastMessage.includes("Audio message") ? (
            <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-450 font-extrabold text-xs">
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Note</span>
            </span>
          ) : (
            conv.lastMessage
          )}
        </p>
      </div>

      <div className="hidden sm:flex shrink-0 items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 group-hover:translate-x-0.5 transition-all">
        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-550 group-hover:text-primary-500 dark:group-hover:text-primary-450 transition-colors" />
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
          color: "text-primary-705 bg-primary-50/50 dark:bg-primary-950/20 border-primary-100/60 dark:border-primary-900/40 text-primary-700 dark:text-primary-400",
        };
      case "contract_sent":
        return {
          label: "Review Contract",
          color: "text-amber-705 bg-amber-50/50 dark:bg-amber-955/20 border-amber-100/60 dark:border-amber-950/40 text-amber-700 dark:text-amber-450",
        };
      case "paid":
        return {
          label: "Deposit Paid",
          color: "text-emerald-705 bg-emerald-50/50 dark:bg-emerald-955/20 border-emerald-100/60 dark:border-emerald-905/30 text-emerald-700 dark:text-emerald-400",
        };
      case "completed":
        return { 
          label: "Completed", 
          color: "text-slate-500 dark:text-slate-450 bg-slate-55/80 dark:bg-slate-800/60 border-slate-150 dark:border-slate-700/60" 
        };
      default:
        return { 
          label: "Inquiry", 
          color: "text-slate-600 dark:text-slate-400 bg-slate-55/80 dark:bg-slate-850/60 border-slate-150 dark:border-slate-700/60" 
        };
    }
  };

  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

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

    return () => {
      unsubscribe();
      setConversations([]);
    };
  }, [user]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300">
        <div className="w-10 h-10 border-3 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
          Fetching messages...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
        <div className="w-full max-w-none px-4 h-18 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-450 leading-none">Your Chats</span>
            <h1 className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Messages
            </h1>
          </div>
          
          <button 
            onClick={() => setActiveTab('notifications')}
            className="p-2.5 relative hover:bg-slate-100/85 dark:hover:bg-slate-800/80 rounded-full transition-colors group border border-slate-150/40 dark:border-slate-800"
          >
            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors" />
            <NotificationBadge />
          </button>
        </div>
      </header>

      <main className="w-full max-w-none px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full space-y-6"
        >
          {/* Search Section */}
          <div className="relative group max-w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sender, property name or keyword..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 shadow-sm rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 dark:focus:border-primary-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>

          {/* Chat List */}
          <div className="space-y-3.5 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredConversations.length === 0 ? (
                <motion.div
                  key="empty-inbox"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150/80 dark:border-slate-800 shadow-md flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto"
                >
                  <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/20 rounded-2xl flex items-center justify-center mb-6 text-primary-550 dark:text-primary-450 border border-primary-100 dark:border-primary-900/40 shadow-inner">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white mb-2">
                    Your inbox is clear
                  </h3>
                  <p className="text-sm text-slate-450 dark:text-slate-400 leading-relaxed font-light mb-6">
                    Inquire on verified rentals or start a dialogue with any vetted owner, and your messages will land here instantenously.
                  </p>
                  <button
                    onClick={() => setActiveTab("home")}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >
                    Find Listings
                  </button>
                </motion.div>
              ) : (
                filteredConversations.map((conv) => (
                  <ConversationRow
                    key={`conv-${conv.id}`}
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
