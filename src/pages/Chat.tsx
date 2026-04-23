import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Search,
  Clock,
  ChevronRight,
  User,
  Home,
  Loader2,
} from "lucide-react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ChatModal from "../components/ChatModal";
import { Listing } from "../types";

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
  status:
    | "inquiry"
    | "negotiating"
    | "contract_requested"
    | "contract_sent"
    | "paid"
    | "completed";
}

const Inbox = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "contract_requested":
        return {
          label: "Contract Requested",
          color: "text-primary-600 bg-primary-50",
        };
      case "contract_sent":
        return {
          label: "Review Contract",
          color: "text-amber-600 bg-amber-50",
        };
      case "paid":
        return {
          label: "Deposit Paid",
          color: "text-emerald-600 bg-emerald-50",
        };
      case "completed":
        return { label: "Completed", color: "text-slate-400 bg-slate-50" };
      default:
        return { label: "Inquiry", color: "text-slate-500 bg-slate-50" };
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-50 rounded-full animate-pulse" />
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin absolute inset-0 m-auto" />
        </div>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Syncing Messages
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="w-full max-w-full px-3 md:px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Messages
          </h1>
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
      </header>

      <main className="pt-[72px] px-3 md:px-4" style={{ paddingTop: "20px" }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-full"
        >
          {/* Search Section */}
          <div className="mb-6">
            <div className="relative group max-w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-white border border-slate-100 shadow-sm rounded-lg py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/20 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="space-y-2.5 sm:space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredConversations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col items-center justify-center py-20 sm:py-32 px-8 text-center"
                >
                  <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 text-primary-200 scale-110">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Your inbox is clear
                  </h3>
                  <p className="text-sm text-slate-400 max-w-[260px] leading-relaxed font-medium">
                    When you inquire about a property, your chats will appear
                    here instantly.
                  </p>
                </motion.div>
              ) : (
                filteredConversations.map((conv, idx) => (
                  <motion.div
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedConv(conv)}
                    className="group bg-white flex items-start gap-4 p-3.5 sm:p-5 rounded-lg sm:rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-100 transition-all cursor-pointer active:scale-[0.99] w-full max-w-full overflow-hidden"
                  >
                    {/* User Avatar / Property Hybrid */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={conv.listingImage}
                          className="w-full h-full object-cover opacity-90"
                          referrerPolicy="no-referrer"
                          alt=""
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-full bg-primary-600 border-[3px] sm:border-4 border-white shadow-lg flex items-center justify-center text-[10px] sm:text-xs font-black text-white">
                        {(user?.role === "tenant"
                          ? conv.agentName
                          : conv.tenantName
                        ).charAt(0)}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      {/* TOP ROW: Agent Name & Timestamp */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <h4 className="font-bold text-slate-900 text-base sm:text-lg truncate tracking-tight min-w-0 group-hover:text-primary-600 transition-colors">
                          {user?.role === "tenant"
                            ? conv.agentName
                            : conv.tenantName}
                        </h4>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 whitespace-nowrap shrink-0 group-hover:text-slate-500 transition-colors">
                          {getTimeAgo(conv.updatedAt)}
                        </span>
                      </div>

                      {/* SECOND ROW: Status badge */}
                      <div className="flex min-w-0">
                        <span
                          className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg shrink-0 shadow-sm ${
                            getStatusConfig(conv.status || "inquiry").color
                          }`}
                        >
                          {getStatusConfig(conv.status || "inquiry").label}
                        </span>
                      </div>

                      {/* THIRD ROW: Property name */}
                      <div className="flex items-center gap-1 min-w-0">
                        <Home className="w-3 h-3 text-slate-300 shrink-0" />
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 truncate uppercase tracking-tighter min-w-0">
                          {conv.listingTitle}
                        </p>
                      </div>

                      {/* FOURTH ROW: Message preview */}
                      <p className="text-sm text-slate-500 leading-snug font-medium line-clamp-2 break-words min-w-0 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                        {conv.lastMessage.length > 70
                          ? conv.lastMessage.substring(0, 70) + "..."
                          : conv.lastMessage}
                      </p>
                    </div>

                    <div className="shrink-0 text-slate-200 group-hover:text-primary-400 transition-all hidden sm:block translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </motion.div>
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
