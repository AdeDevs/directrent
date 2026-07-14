import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/Chat.tsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=feb49a48"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=feb49a48"; const React = __vite__cjsImport1_react.__esModule ? __vite__cjsImport1_react.default : __vite__cjsImport1_react; const useState = __vite__cjsImport1_react["useState"]; const useEffect = __vite__cjsImport1_react["useEffect"];
import HamburgerButton from "/src/components/HamburgerButton.tsx";
import { motion, AnimatePresence } from "/node_modules/.vite/deps/motion_react.js?v=c440f934";
import {
  MessageSquare,
  Search,
  ChevronRight,
  Home,
  Bell,
  Mic
} from "/node_modules/.vite/deps/lucide-react.js?v=4221e70f";
import SafeImage from "/src/components/SafeImage.tsx";
import { db } from "/src/lib/firebase.ts";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "/node_modules/.vite/deps/firebase_firestore.js?v=90980246";
import { useAuth } from "/src/context/AuthContext.tsx";
import { ChatModal } from "/src/components/ChatModal.tsx";
import NotificationBadge from "/src/components/NotificationBadge.tsx";
import VerificationBadge from "/src/components/VerificationBadge.tsx";
import HeaderPortal from "/src/components/HeaderPortal.tsx";
import { calculateVerificationLevel } from "/src/lib/verification.ts";
const useParticipant = (userId) => {
  _s();
  const [participant, setParticipant] = useState(null);
  useEffect(() => {
    if (!userId || userId === "unknown") return;
    let isMounted = true;
    fetch("/api/public/users/" + userId).then((res) => res.json()).then((json) => {
      if (!isMounted || !json.data) return;
      const data = json.data;
      setParticipant({
        name: data.firstName || data.lastName ? `${data.firstName || ""} ${data.lastName || ""}`.trim() : data.name || "User",
        avatarUrl: data.avatarUrl,
        verificationLevel: data.verificationLevel === "verified" ? "verified" : calculateVerificationLevel(data),
        role: data.role || "tenant"
      });
    }).catch((err) => {
      console.warn("Chat participant fetch error:", err);
    });
    return () => {
      isMounted = false;
    };
  }, [userId]);
  return participant;
};
_s(useParticipant, "894/cfX3/lLLQC4dwrRiX4TPh1c=");
const ConversationAvatar = ({
  userId,
  initialImage,
  initialName,
  listingImage
}) => {
  _s2();
  const participant = useParticipant(userId);
  const avatarUrl = participant?.avatarUrl || initialImage;
  return /* @__PURE__ */ jsxDEV("div", { className: "relative shrink-0 flex items-center", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "w-12 h-12 sm:w-15 sm:h-15 rounded-full bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-inner group-hover:scale-105 transition-transform duration-500 flex items-center justify-center", children: avatarUrl ? /* @__PURE__ */ jsxDEV(
      "img",
      {
        src: avatarUrl,
        className: "w-full h-full object-cover",
        referrerPolicy: "no-referrer",
        alt: ""
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/pages/Chat.tsx",
        lineNumber: 89,
        columnNumber: 9
      },
      this
    ) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full flex items-center justify-center bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-450 font-extrabold text-lg font-sans", children: (participant?.name || initialName || "?").charAt(0) }, void 0, false, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 96,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 87,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "absolute -bottom-1 -right-1 w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-xl bg-white dark:bg-slate-900 border-[2.5px] border-white dark:border-slate-900 shadow-md overflow-hidden flex-shrink-0", children: listingImage ? /* @__PURE__ */ jsxDEV(
      SafeImage,
      {
        src: listingImage,
        className: "w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-500",
        alt: ""
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/pages/Chat.tsx",
        lineNumber: 104,
        columnNumber: 9
      },
      this
    ) : /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full bg-slate-100 dark:bg-slate-800" }, void 0, false, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 110,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 102,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/app/applet/src/pages/Chat.tsx",
    lineNumber: 86,
    columnNumber: 5
  }, this);
};
_s2(ConversationAvatar, "eDnMCDzFt9/9eoT+PFLktHW3o1g=", false, function() {
  return [useParticipant];
});
_c = ConversationAvatar;
const ConversationRow = _s3(React.memo(_c2 = _s3(({
  conv,
  user,
  onClick,
  getTimeAgo,
  getStatusConfig
}) => {
  _s3();
  const participantId = user?.role === "tenant" ? conv.agentId : conv.tenantId;
  const participant = useParticipant(participantId);
  const displayName = participant?.name || (user?.role === "tenant" ? conv.agentName : conv.tenantName);
  const unreadCount = user?.role === "tenant" ? conv.unreadCount_tenant : conv.unreadCount_agent;
  return /* @__PURE__ */ jsxDEV(
    motion.div,
    {
      layout: true,
      initial: { opacity: 0, y: 15 },
      animate: { opacity: 1, y: 0 },
      onClick,
      className: "group relative bg-white dark:bg-slate-900 flex items-center gap-4 p-4 rounded-3xl border border-slate-150/70 dark:border-slate-800/80 shadow-sm hover:shadow-2xl hover:shadow-slate-200/30 dark:hover:shadow-black/30 hover:border-primary-150 dark:hover:border-primary-900/40 transition-all duration-300 cursor-pointer active:scale-[0.98] w-full max-w-full overflow-hidden",
      children: [
        /* @__PURE__ */ jsxDEV(
          ConversationAvatar,
          {
            userId: participantId,
            initialImage: user?.role === "tenant" ? conv.agentImage : conv.tenantImage,
            initialName: displayName,
            listingImage: conv.listingImage
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 145,
            columnNumber: 7
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-0 flex flex-col gap-1.5 pr-4 sm:pr-8", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between gap-2 min-w-0", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 min-w-0", children: [
              /* @__PURE__ */ jsxDEV("h4", { className: "font-display font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight truncate tracking-tight min-w-0 group-hover:text-primary-600 dark:group-hover:text-primary-450 transition-colors", children: displayName }, void 0, false, {
                fileName: "/app/applet/src/pages/Chat.tsx",
                lineNumber: 155,
                columnNumber: 13
              }, this),
              participant?.verificationLevel && /* @__PURE__ */ jsxDEV(VerificationBadge, { level: participant.verificationLevel, role: participant.role, showText: false, className: "scale-90" }, void 0, false, {
                fileName: "/app/applet/src/pages/Chat.tsx",
                lineNumber: 159,
                columnNumber: 13
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 154,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 group-hover:text-slate-500 transition-colors", children: getTimeAgo(conv.updatedAt) }, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 162,
              columnNumber: 11
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 153,
            columnNumber: 9
          }, this),
          unreadCount ? /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center pointer-events-none", children: /* @__PURE__ */ jsxDEV("span", { className: "relative flex h-2 w-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-450 opacity-75" }, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 170,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-primary-600" }, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 171,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 169,
            columnNumber: 13
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 168,
            columnNumber: 9
          }, this) : null,
          /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center gap-2 min-w-0", children: [
            /* @__PURE__ */ jsxDEV(
              "span",
              {
                className: `text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 border ${getStatusConfig(conv.status || "inquiry").color}`,
                children: getStatusConfig(conv.status || "inquiry").label
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/pages/Chat.tsx",
                lineNumber: 177,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 min-w-0 opacity-80", children: [
              /* @__PURE__ */ jsxDEV(Home, { className: "w-3 h-3 text-slate-400 dark:text-slate-550 shrink-0" }, void 0, false, {
                fileName: "/app/applet/src/pages/Chat.tsx",
                lineNumber: 186,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase tracking-wider min-w-0", children: conv.listingTitle }, void 0, false, {
                fileName: "/app/applet/src/pages/Chat.tsx",
                lineNumber: 187,
                columnNumber: 13
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 185,
              columnNumber: 11
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 176,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal line-clamp-1 break-words min-w-0 overflow-hidden pr-2", children: conv.lastMessage.includes("Audio message") ? /* @__PURE__ */ jsxDEV("span", { className: "flex items-center gap-1.5 text-primary-600 dark:text-primary-450 font-extrabold text-xs", children: [
            /* @__PURE__ */ jsxDEV(Mic, { className: "w-3.5 h-3.5" }, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 196,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { children: "Voice Note" }, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 197,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 195,
            columnNumber: 11
          }, this) : conv.lastMessage }, void 0, false, {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 193,
            columnNumber: 9
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/pages/Chat.tsx",
          lineNumber: 152,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "hidden sm:flex shrink-0 items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 group-hover:translate-x-0.5 transition-all", children: /* @__PURE__ */ jsxDEV(ChevronRight, { className: "w-4 h-4 text-slate-400 dark:text-slate-550 group-hover:text-primary-500 dark:group-hover:text-primary-450 transition-colors" }, void 0, false, {
          fileName: "/app/applet/src/pages/Chat.tsx",
          lineNumber: 206,
          columnNumber: 9
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/pages/Chat.tsx",
          lineNumber: 205,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    true,
    {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 138,
      columnNumber: 5
    },
    this
  );
}, "eDnMCDzFt9/9eoT+PFLktHW3o1g=", false, function() {
  return [useParticipant];
})), "eDnMCDzFt9/9eoT+PFLktHW3o1g=", false, function() {
  return [useParticipant];
});
_c3 = ConversationRow;
const Inbox = () => {
  _s4();
  const { user, setActiveTab } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const getStatusConfig = (status) => {
    switch (status) {
      case "tour_requested":
        return {
          label: "Tour Requested",
          color: "text-blue-705 bg-blue-50/50 dark:bg-blue-900/20 border-blue-100/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-400"
        };
      case "tour_confirmed":
        return {
          label: "Tour Confirmed",
          color: "text-indigo-705 bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-400"
        };
      case "contract_sent":
        return {
          label: "Contract Sent",
          color: "text-amber-705 bg-amber-50/50 dark:bg-amber-955/20 border-amber-100/60 dark:border-amber-950/40 text-amber-700 dark:text-amber-450"
        };
      case "escrow_locked":
        return {
          label: "Escrow Locked",
          color: "text-emerald-705 bg-emerald-50/50 dark:bg-emerald-955/20 border-emerald-100/60 dark:border-emerald-905/30 text-emerald-700 dark:text-emerald-400"
        };
      case "disputed":
        return {
          label: "Disputed",
          color: "text-red-705 bg-red-50/50 dark:bg-red-955/20 border-red-100/60 dark:border-red-905/30 text-red-700 dark:text-red-400"
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
        const convs = snapshot.docs.map((doc2) => ({
          id: doc2.id,
          ...doc2.data()
        }));
        setConversations(convs);
        setLoading(false);
      },
      (err) => {
        if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
          return;
        }
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
    (conv) => conv.agentName.toLowerCase().includes(searchQuery.toLowerCase()) || conv.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) || conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = /* @__PURE__ */ new Date();
    const diff = Math.abs(now.getTime() - date.getTime());
    const minutes = Math.floor(diff / (1e3 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };
  if (loading) {
    return /* @__PURE__ */ jsxDEV("div", { className: "min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-slate-950 transition-colors duration-300", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "w-10 h-10 border-3 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" }, void 0, false, {
        fileName: "/app/applet/src/pages/Chat.tsx",
        lineNumber: 349,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse", children: "Fetching messages..." }, void 0, false, {
        fileName: "/app/applet/src/pages/Chat.tsx",
        lineNumber: 350,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 348,
      columnNumber: 7
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "min-h-screen bg-slate-50/30 dark:bg-slate-950 transition-colors duration-300", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 lg:hidden", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full max-w-none px-4 h-16 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDEV(HamburgerButton, {}, void 0, false, {
          fileName: "/app/applet/src/pages/Chat.tsx",
          lineNumber: 362,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-450 leading-none", children: "Your Chats" }, void 0, false, {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 364,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: "text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5", children: "Messages" }, void 0, false, {
            fileName: "/app/applet/src/pages/Chat.tsx",
            lineNumber: 365,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/pages/Chat.tsx",
          lineNumber: 363,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/pages/Chat.tsx",
        lineNumber: 361,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => setActiveTab("notifications"),
          className: "p-2.5 relative hover:bg-slate-100/85 dark:hover:bg-slate-800/80 rounded-full transition-colors group lg:hidden",
          children: [
            /* @__PURE__ */ jsxDEV(Bell, { className: "w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors" }, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 375,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV(NotificationBadge, {}, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 376,
              columnNumber: 13
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/pages/Chat.tsx",
          lineNumber: 371,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 360,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 359,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(HeaderPortal, { children: /* @__PURE__ */ jsxDEV("div", { className: "hidden lg:flex flex-1 items-center justify-between px-6 h-full", children: /* @__PURE__ */ jsxDEV("div", { children: [
      /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-450 leading-none", children: "Your Chats" }, void 0, false, {
        fileName: "/app/applet/src/pages/Chat.tsx",
        lineNumber: 384,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("h1", { className: "text-lg font-display font-black text-slate-900 dark:text-white tracking-tight mt-0.5", children: "Messages" }, void 0, false, {
        fileName: "/app/applet/src/pages/Chat.tsx",
        lineNumber: 385,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 383,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 382,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 381,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("main", { className: "w-full max-w-none px-[15px] pt-[15px] pb-[15px] mb-0", children: [
      /* @__PURE__ */ jsxDEV(
        motion.div,
        {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          className: "w-full space-y-6",
          children: [
            /* @__PURE__ */ jsxDEV("div", { className: "relative group max-w-full", children: [
              /* @__PURE__ */ jsxDEV(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary-600 transition-colors" }, void 0, false, {
                fileName: "/app/applet/src/pages/Chat.tsx",
                lineNumber: 400,
                columnNumber: 13
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  placeholder: "Search by sender, property name or keyword...",
                  className: "w-full bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800 shadow-sm rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/30 dark:focus:border-primary-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/pages/Chat.tsx",
                  lineNumber: 401,
                  columnNumber: 13
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 399,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-3.5 pb-8", children: /* @__PURE__ */ jsxDEV(AnimatePresence, { mode: "popLayout", children: filteredConversations.length === 0 ? /* @__PURE__ */ jsxDEV(
              motion.div,
              {
                initial: { opacity: 0, scale: 0.98 },
                animate: { opacity: 1, scale: 1 },
                className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-150/80 dark:border-slate-800 shadow-md flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto",
                children: [
                  /* @__PURE__ */ jsxDEV("div", { className: "w-16 h-16 bg-primary-50 dark:bg-primary-950/20 rounded-2xl flex items-center justify-center mb-6 text-primary-550 dark:text-primary-450 border border-primary-100 dark:border-primary-900/40 shadow-inner", children: /* @__PURE__ */ jsxDEV(MessageSquare, { className: "w-7 h-7" }, void 0, false, {
                    fileName: "/app/applet/src/pages/Chat.tsx",
                    lineNumber: 421,
                    columnNumber: 21
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/pages/Chat.tsx",
                    lineNumber: 420,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("h3", { className: "text-lg font-display font-extrabold text-slate-900 dark:text-white mb-2", children: "Your inbox is clear" }, void 0, false, {
                    fileName: "/app/applet/src/pages/Chat.tsx",
                    lineNumber: 423,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-450 dark:text-slate-400 leading-relaxed font-light mb-6", children: "Inquire on verified rentals or start a dialogue with any vetted owner, and your messages will land here instantenously." }, void 0, false, {
                    fileName: "/app/applet/src/pages/Chat.tsx",
                    lineNumber: 426,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => setActiveTab("home"),
                      className: "bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer",
                      children: "Find Listings"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/pages/Chat.tsx",
                      lineNumber: 429,
                      columnNumber: 19
                    },
                    this
                  )
                ]
              },
              "empty-inbox",
              true,
              {
                fileName: "/app/applet/src/pages/Chat.tsx",
                lineNumber: 414,
                columnNumber: 15
              },
              this
            ) : filteredConversations.map(
              (conv) => /* @__PURE__ */ jsxDEV(
                ConversationRow,
                {
                  conv,
                  user,
                  onClick: () => setSelectedConv(conv),
                  getTimeAgo,
                  getStatusConfig
                },
                `conv-${conv.id}`,
                false,
                {
                  fileName: "/app/applet/src/pages/Chat.tsx",
                  lineNumber: 438,
                  columnNumber: 15
                },
                this
              )
            ) }, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 412,
              columnNumber: 13
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/pages/Chat.tsx",
              lineNumber: 411,
              columnNumber: 11
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/pages/Chat.tsx",
          lineNumber: 393,
          columnNumber: 9
        },
        this
      ),
      selectedConv && /* @__PURE__ */ jsxDEV(
        ChatModal,
        {
          isOpen: !!selectedConv,
          onClose: () => setSelectedConv(null),
          overrideConversationId: selectedConv.id,
          listing: {
            id: isNaN(Number(selectedConv.listingId)) ? selectedConv.listingId : parseInt(selectedConv.listingId),
            title: selectedConv.listingTitle,
            price: selectedConv.listingPrice,
            priceValue: (() => {
              if (selectedConv.listingPriceValue) return Number(selectedConv.listingPriceValue);
              if (!selectedConv.listingPrice) return 0;
              const cleaned = String(selectedConv.listingPrice).replace(/[₦,$/a-zA-Z\s\-]/g, "");
              const parsed = parseInt(cleaned, 10);
              return isNaN(parsed) ? 0 : parsed;
            })(),
            image: selectedConv.listingImage,
            agent: {
              id: selectedConv.agentId,
              name: selectedConv.agentName,
              rating: 5,
              isVerified: true
            },
            location: "",
            type: "",
            amenities: [],
            landmark: "",
            area: "",
            verified: true,
            noFee: true,
            isFavorite: false
          },
          currentUser: user
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/pages/Chat.tsx",
          lineNumber: 454,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/pages/Chat.tsx",
      lineNumber: 392,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/app/applet/src/pages/Chat.tsx",
    lineNumber: 358,
    columnNumber: 5
  }, this);
};
_s4(Inbox, "UGOvZryqd3QRje9bKtLHrK8JYIs=", false, function() {
  return [useAuth];
});
_c4 = Inbox;
export default Inbox;
var _c, _c2, _c3, _c4;
$RefreshReg$(_c, "ConversationAvatar");
$RefreshReg$(_c2, "ConversationRow$React.memo");
$RefreshReg$(_c3, "ConversationRow");
$RefreshReg$(_c4, "Inbox");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/app/applet/src/pages/Chat.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/app/applet/src/pages/Chat.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "/app/applet/src/pages/Chat.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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T25ELGFBQWF4QztBQUFBQSxZQUNwQjRGLE9BQU87QUFBQSxjQUNMN0MsSUFBSVAsYUFBYTNCO0FBQUFBLGNBQ2pCM0IsTUFBTXNELGFBQWF4QjtBQUFBQSxjQUNuQjZFLFFBQVE7QUFBQSxjQUNSQyxZQUFZO0FBQUEsWUFDZDtBQUFBLFlBQ0FDLFVBQVU7QUFBQSxZQUNWQyxNQUFNO0FBQUEsWUFDTkMsV0FBVztBQUFBLFlBQ1hDLFVBQVU7QUFBQSxZQUNWQyxNQUFNO0FBQUEsWUFDTkMsVUFBVTtBQUFBLFlBQ1ZDLE9BQU87QUFBQSxZQUNQQyxZQUFZO0FBQUEsVUFDZDtBQUFBLFVBRUYsYUFBYTlGO0FBQUFBO0FBQUFBLFFBakNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQWlDcUI7QUFBQSxTQS9GekI7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQWtHQTtBQUFBLE9BcElGO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FxSUE7QUFFSjtBQUFFMEIsSUE5UElELE9BQUs7QUFBQSxVQUNzQmhFLE9BQU87QUFBQTtBQUFBLE1BRGxDZ0U7QUFnUU4sZUFBZUE7QUFBTSxJQUFBc0UsSUFBQWpHLEtBQUEwQixLQUFBd0U7QUFBQSxhQUFBRCxJQUFBO0FBQUEsYUFBQWpHLEtBQUE7QUFBQSxhQUFBMEIsS0FBQTtBQUFBLGFBQUF3RSxLQUFBIiwibmFtZXMiOlsiUmVhY3QiLCJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsIkhhbWJ1cmdlckJ1dHRvbiIsIm1vdGlvbiIsIkFuaW1hdGVQcmVzZW5jZSIsIk1lc3NhZ2VTcXVhcmUiLCJTZWFyY2giLCJDaGV2cm9uUmlnaHQiLCJIb21lIiwiQmVsbCIsIk1pYyIsIlNhZmVJbWFnZSIsImRiIiwiY29sbGVjdGlvbiIsInF1ZXJ5Iiwid2hlcmUiLCJvcmRlckJ5Iiwib25TbmFwc2hvdCIsInVzZUF1dGgiLCJDaGF0TW9kYWwiLCJOb3RpZmljYXRpb25CYWRnZSIsIlZlcmlmaWNhdGlvbkJhZGdlIiwiSGVhZGVyUG9ydGFsIiwiY2FsY3VsYXRlVmVyaWZpY2F0aW9uTGV2ZWwiLCJ1c2VQYXJ0aWNpcGFudCIsInVzZXJJZCIsIl9zIiwicGFydGljaXBhbnQiLCJzZXRQYXJ0aWNpcGFudCIsImlzTW91bnRlZCIsImZldGNoIiwidGhlbiIsInJlcyIsImpzb24iLCJkYXRhIiwibmFtZSIsImZpcnN0TmFtZSIsImxhc3ROYW1lIiwidHJpbSIsImF2YXRhclVybCIsInZlcmlmaWNhdGlvbkxldmVsIiwicm9sZSIsImNhdGNoIiwiZXJyIiwiY29uc29sZSIsIndhcm4iLCJDb252ZXJzYXRpb25BdmF0YXIiLCJpbml0aWFsSW1hZ2UiLCJpbml0aWFsTmFtZSIsImxpc3RpbmdJbWFnZSIsIl9zMiIsImNoYXJBdCIsIkNvbnZlcnNhdGlvblJvdyIsIl9zMyIsIm1lbW8iLCJfYzIiLCJjb252IiwidXNlciIsIm9uQ2xpY2siLCJnZXRUaW1lQWdvIiwiZ2V0U3RhdHVzQ29uZmlnIiwicGFydGljaXBhbnRJZCIsImFnZW50SWQiLCJ0ZW5hbnRJZCIsImRpc3BsYXlOYW1lIiwiYWdlbnROYW1lIiwidGVuYW50TmFtZSIsInVucmVhZENvdW50IiwidW5yZWFkQ291bnRfdGVuYW50IiwidW5yZWFkQ291bnRfYWdlbnQiLCJvcGFjaXR5IiwieSIsImFnZW50SW1hZ2UiLCJ0ZW5hbnRJbWFnZSIsInVwZGF0ZWRBdCIsInN0YXR1cyIsImNvbG9yIiwibGFiZWwiLCJsaXN0aW5nVGl0bGUiLCJsYXN0TWVzc2FnZSIsImluY2x1ZGVzIiwiX2MzIiwiSW5ib3giLCJfczQiLCJzZXRBY3RpdmVUYWIiLCJjb252ZXJzYXRpb25zIiwic2V0Q29udmVyc2F0aW9ucyIsImxvYWRpbmciLCJzZXRMb2FkaW5nIiwic2VsZWN0ZWRDb252Iiwic2V0U2VsZWN0ZWRDb252Iiwic2VhcmNoUXVlcnkiLCJzZXRTZWFyY2hRdWVyeSIsImNvbnZlcnNhdGlvbnNSZWYiLCJmaWVsZFRvRmlsdGVyIiwicSIsImlkIiwidW5zdWJzY3JpYmUiLCJzbmFwc2hvdCIsImNvbnZzIiwiZG9jcyIsIm1hcCIsImRvYyIsImNvZGUiLCJtZXNzYWdlIiwiZXJyb3IiLCJmaWx0ZXJlZENvbnZlcnNhdGlvbnMiLCJmaWx0ZXIiLCJ0b0xvd2VyQ2FzZSIsInRpbWVzdGFtcCIsImRhdGUiLCJ0b0RhdGUiLCJEYXRlIiwibm93IiwiZGlmZiIsIk1hdGgiLCJhYnMiLCJnZXRUaW1lIiwibWludXRlcyIsImZsb29yIiwiaG91cnMiLCJkYXlzIiwiZSIsInRhcmdldCIsInZhbHVlIiwibGVuZ3RoIiwic2NhbGUiLCJpc05hTiIsIk51bWJlciIsImxpc3RpbmdJZCIsInBhcnNlSW50IiwidGl0bGUiLCJwcmljZSIsImxpc3RpbmdQcmljZSIsInByaWNlVmFsdWUiLCJsaXN0aW5nUHJpY2VWYWx1ZSIsImNsZWFuZWQiLCJTdHJpbmciLCJyZXBsYWNlIiwicGFyc2VkIiwiaW1hZ2UiLCJhZ2VudCIsInJhdGluZyIsImlzVmVyaWZpZWQiLCJsb2NhdGlvbiIsInR5cGUiLCJhbWVuaXRpZXMiLCJsYW5kbWFyayIsImFyZWEiLCJ2ZXJpZmllZCIsIm5vRmVlIiwiaXNGYXZvcml0ZSIsIl9jIiwiX2M0Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNoYXQudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VNZW1vIH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgSGFtYnVyZ2VyQnV0dG9uIGZyb20gJy4uL2NvbXBvbmVudHMvSGFtYnVyZ2VyQnV0dG9uJztcbmltcG9ydCB7IG1vdGlvbiwgQW5pbWF0ZVByZXNlbmNlIH0gZnJvbSBcIm1vdGlvbi9yZWFjdFwiO1xuaW1wb3J0IHtcbiAgTWVzc2FnZVNxdWFyZSxcbiAgU2VhcmNoLFxuICBDbG9jayxcbiAgQ2hldnJvblJpZ2h0LFxuICBVc2VyIGFzIFVzZXJJY29uLFxuICBIb21lLFxuICBMb2FkZXIyLFxuICBCZWxsLFxuICBNaWMsXG59IGZyb20gXCJsdWNpZGUtcmVhY3RcIjtcbmltcG9ydCBTYWZlSW1hZ2UgZnJvbSBcIi4uL2NvbXBvbmVudHMvU2FmZUltYWdlXCI7XG5pbXBvcnQgeyBkYiB9IGZyb20gXCIuLi9saWIvZmlyZWJhc2VcIjtcbmltcG9ydCB7XG4gIGNvbGxlY3Rpb24sXG4gIHF1ZXJ5LFxuICB3aGVyZSxcbiAgb3JkZXJCeSxcbiAgb25TbmFwc2hvdCxcbiAgZ2V0RG9jLFxuICBkb2MsXG59IGZyb20gXCJmaXJlYmFzZS9maXJlc3RvcmVcIjtcbmltcG9ydCB7IHVzZUF1dGggfSBmcm9tIFwiLi4vY29udGV4dC9BdXRoQ29udGV4dFwiO1xuaW1wb3J0IHsgQ2hhdE1vZGFsIH0gZnJvbSBcIi4uL2NvbXBvbmVudHMvQ2hhdE1vZGFsXCI7XG5pbXBvcnQgeyBMaXN0aW5nLCBWZXJpZmljYXRpb25MZXZlbCwgVXNlclJvbGUgfSBmcm9tIFwiLi4vdHlwZXNcIjtcbmltcG9ydCBOb3RpZmljYXRpb25CYWRnZSBmcm9tIFwiLi4vY29tcG9uZW50cy9Ob3RpZmljYXRpb25CYWRnZVwiO1xuaW1wb3J0IFZlcmlmaWNhdGlvbkJhZGdlIGZyb20gXCIuLi9jb21wb25lbnRzL1ZlcmlmaWNhdGlvbkJhZGdlXCI7XG5pbXBvcnQgSGVhZGVyUG9ydGFsIGZyb20gXCIuLi9jb21wb25lbnRzL0hlYWRlclBvcnRhbFwiO1xuXG5pbXBvcnQgeyBjYWxjdWxhdGVWZXJpZmljYXRpb25MZXZlbCB9IGZyb20gXCIuLi9saWIvdmVyaWZpY2F0aW9uXCI7XG5cbi8vIEN1c3RvbSBob29rIGZvciBsaXZlIHBhcnRpY2lwYW50IGluZm9cbmNvbnN0IHVzZVBhcnRpY2lwYW50ID0gKHVzZXJJZDogc3RyaW5nIHwgdW5kZWZpbmVkKSA9PiB7XG4gIGNvbnN0IFtwYXJ0aWNpcGFudCwgc2V0UGFydGljaXBhbnRdID0gdXNlU3RhdGU8e1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBhdmF0YXJVcmw/OiBzdHJpbmc7XG4gICAgdmVyaWZpY2F0aW9uTGV2ZWw/OiBWZXJpZmljYXRpb25MZXZlbDtcbiAgICByb2xlOiBVc2VyUm9sZTtcbiAgfSB8IG51bGw+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgaWYgKCF1c2VySWQgfHwgdXNlcklkID09PSAndW5rbm93bicpIHJldHVybjtcblxuICAgIGxldCBpc01vdW50ZWQgPSB0cnVlO1xuICAgIGZldGNoKCcvYXBpL3B1YmxpYy91c2Vycy8nICsgdXNlcklkKVxuICAgICAgLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpXG4gICAgICAudGhlbihqc29uID0+IHtcbiAgICAgICAgaWYgKCFpc01vdW50ZWQgfHwgIWpzb24uZGF0YSkgcmV0dXJuO1xuICAgICAgICBjb25zdCBkYXRhID0ganNvbi5kYXRhO1xuICAgICAgICBzZXRQYXJ0aWNpcGFudCh7XG4gICAgICAgICAgbmFtZTogZGF0YS5maXJzdE5hbWUgfHwgZGF0YS5sYXN0TmFtZSA/IGAke2RhdGEuZmlyc3ROYW1lIHx8ICcnfSAke2RhdGEubGFzdE5hbWUgfHwgJyd9YC50cmltKCkgOiAoZGF0YS5uYW1lIHx8IFwiVXNlclwiKSxcbiAgICAgICAgICBhdmF0YXJVcmw6IGRhdGEuYXZhdGFyVXJsLFxuICAgICAgICAgIHZlcmlmaWNhdGlvbkxldmVsOiBkYXRhLnZlcmlmaWNhdGlvbkxldmVsID09PSAndmVyaWZpZWQnID8gJ3ZlcmlmaWVkJyA6IGNhbGN1bGF0ZVZlcmlmaWNhdGlvbkxldmVsKGRhdGEgYXMgYW55KSxcbiAgICAgICAgICByb2xlOiBkYXRhLnJvbGUgYXMgVXNlclJvbGUgfHwgJ3RlbmFudCdcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIkNoYXQgcGFydGljaXBhbnQgZmV0Y2ggZXJyb3I6XCIsIGVycik7XG4gICAgICB9KTtcblxuICAgIHJldHVybiAoKSA9PiB7IGlzTW91bnRlZCA9IGZhbHNlOyB9O1xuICB9LCBbdXNlcklkXSk7XG5cbiAgcmV0dXJuIHBhcnRpY2lwYW50O1xufTtcblxuLy8gSGVscGVyIGNvbXBvbmVudCB0byBoYW5kbGUgYXZhdGFyIGxvZ2ljXG5jb25zdCBDb252ZXJzYXRpb25BdmF0YXIgPSAoeyBcbiAgdXNlcklkLCBcbiAgaW5pdGlhbEltYWdlLCBcbiAgaW5pdGlhbE5hbWUsIFxuICBsaXN0aW5nSW1hZ2UgXG59OiB7IFxuICB1c2VySWQ6IHN0cmluZzsgXG4gIGluaXRpYWxJbWFnZT86IHN0cmluZzsgXG4gIGluaXRpYWxOYW1lOiBzdHJpbmc7XG4gIGxpc3RpbmdJbWFnZTogc3RyaW5nO1xufSkgPT4ge1xuICBjb25zdCBwYXJ0aWNpcGFudCA9IHVzZVBhcnRpY2lwYW50KHVzZXJJZCk7XG4gIGNvbnN0IGF2YXRhclVybCA9IHBhcnRpY2lwYW50Py5hdmF0YXJVcmwgfHwgaW5pdGlhbEltYWdlO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBzaHJpbmstMCBmbGV4IGl0ZW1zLWNlbnRlclwiPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTEyIGgtMTIgc206dy0xNSBzbTpoLTE1IHJvdW5kZWQtZnVsbCBiZy1zbGF0ZS01MCBkYXJrOmJnLXNsYXRlLTgwMCBvdmVyZmxvdy1oaWRkZW4gYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAvODAgZGFyazpib3JkZXItc2xhdGUtNzAwLzgwIHNoYWRvdy1pbm5lciBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tNTAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgIHthdmF0YXJVcmwgPyAoXG4gICAgICAgICAgPGltZ1xuICAgICAgICAgICAgc3JjPXthdmF0YXJVcmx9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlclwiXG4gICAgICAgICAgICByZWZlcnJlclBvbGljeT1cIm5vLXJlZmVycmVyXCJcbiAgICAgICAgICAgIGFsdD1cIlwiXG4gICAgICAgICAgLz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBoLWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctcHJpbWFyeS01MCBkYXJrOmJnLXByaW1hcnktOTUwLzIwIHRleHQtcHJpbWFyeS02MDAgZGFyazp0ZXh0LXByaW1hcnktNDUwIGZvbnQtZXh0cmFib2xkIHRleHQtbGcgZm9udC1zYW5zXCI+XG4gICAgICAgICAgICB7KHBhcnRpY2lwYW50Py5uYW1lIHx8IGluaXRpYWxOYW1lIHx8IFwiP1wiKS5jaGFyQXQoMCl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICAgIHsvKiBQcm9wZXJ0eSBJbWFnZSAtIFNtYWxsIE92ZXJsYXkgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIC1ib3R0b20tMSAtcmlnaHQtMSB3LTYgaC02IHNtOnctNy41IHNtOmgtNy41IHJvdW5kZWQteGwgYmctd2hpdGUgZGFyazpiZy1zbGF0ZS05MDAgYm9yZGVyLVsyLjVweF0gYm9yZGVyLXdoaXRlIGRhcms6Ym9yZGVyLXNsYXRlLTkwMCBzaGFkb3ctbWQgb3ZlcmZsb3ctaGlkZGVuIGZsZXgtc2hyaW5rLTBcIj5cbiAgICAgICAge2xpc3RpbmdJbWFnZSA/IChcbiAgICAgICAgICA8U2FmZUltYWdlIFxuICAgICAgICAgICAgc3JjPXtsaXN0aW5nSW1hZ2V9IFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBvYmplY3QtY292ZXIgb3BhY2l0eS05NSBncm91cC1ob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tNTAwXCJcbiAgICAgICAgICAgIGFsdD1cIlwiIFxuICAgICAgICAgIC8+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgaC1mdWxsIGJnLXNsYXRlLTEwMCBkYXJrOmJnLXNsYXRlLTgwMFwiIC8+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmNvbnN0IENvbnZlcnNhdGlvblJvdyA9IFJlYWN0Lm1lbW8oKHsgXG4gIGNvbnYsIFxuICB1c2VyLCBcbiAgb25DbGljaywgXG4gIGdldFRpbWVBZ28sIFxuICBnZXRTdGF0dXNDb25maWcgXG59OiB7IFxuICBjb252OiBDb252ZXJzYXRpb247IFxuICB1c2VyOiBhbnk7IFxuICBvbkNsaWNrOiAoKSA9PiB2b2lkO1xuICBnZXRUaW1lQWdvOiAodDogYW55KSA9PiBzdHJpbmc7XG4gIGdldFN0YXR1c0NvbmZpZzogKHM6IHN0cmluZykgPT4gYW55O1xuICBrZXk/OiBSZWFjdC5LZXk7XG59KSA9PiB7XG4gIGNvbnN0IHBhcnRpY2lwYW50SWQgPSB1c2VyPy5yb2xlID09PSBcInRlbmFudFwiID8gY29udi5hZ2VudElkIDogY29udi50ZW5hbnRJZDtcbiAgY29uc3QgcGFydGljaXBhbnQgPSB1c2VQYXJ0aWNpcGFudChwYXJ0aWNpcGFudElkKTtcbiAgXG4gIGNvbnN0IGRpc3BsYXlOYW1lID0gcGFydGljaXBhbnQ/Lm5hbWUgfHwgKHVzZXI/LnJvbGUgPT09IFwidGVuYW50XCIgPyBjb252LmFnZW50TmFtZSA6IGNvbnYudGVuYW50TmFtZSk7XG4gIGNvbnN0IHVucmVhZENvdW50ID0gdXNlcj8ucm9sZSA9PT0gJ3RlbmFudCcgPyBjb252LnVucmVhZENvdW50X3RlbmFudCA6IGNvbnYudW5yZWFkQ291bnRfYWdlbnQ7XG5cbiAgcmV0dXJuIChcbiAgICA8bW90aW9uLmRpdlxuICAgICAgbGF5b3V0XG4gICAgICBpbml0aWFsPXt7IG9wYWNpdHk6IDAsIHk6IDE1IH19XG4gICAgICBhbmltYXRlPXt7IG9wYWNpdHk6IDEsIHk6IDAgfX1cbiAgICAgIG9uQ2xpY2s9e29uQ2xpY2t9XG4gICAgICBjbGFzc05hbWU9XCJncm91cCByZWxhdGl2ZSBiZy13aGl0ZSBkYXJrOmJnLXNsYXRlLTkwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNCBwLTQgcm91bmRlZC0zeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTAvNzAgZGFyazpib3JkZXItc2xhdGUtODAwLzgwIHNoYWRvdy1zbSBob3ZlcjpzaGFkb3ctMnhsIGhvdmVyOnNoYWRvdy1zbGF0ZS0yMDAvMzAgZGFyazpob3ZlcjpzaGFkb3ctYmxhY2svMzAgaG92ZXI6Ym9yZGVyLXByaW1hcnktMTUwIGRhcms6aG92ZXI6Ym9yZGVyLXByaW1hcnktOTAwLzQwIHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTMwMCBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtWzAuOThdIHctZnVsbCBtYXgtdy1mdWxsIG92ZXJmbG93LWhpZGRlblwiXG4gICAgPlxuICAgICAgPENvbnZlcnNhdGlvbkF2YXRhciBcbiAgICAgICAgdXNlcklkPXtwYXJ0aWNpcGFudElkfVxuICAgICAgICBpbml0aWFsSW1hZ2U9e3VzZXI/LnJvbGUgPT09IFwidGVuYW50XCIgPyBjb252LmFnZW50SW1hZ2UgOiBjb252LnRlbmFudEltYWdlfVxuICAgICAgICBpbml0aWFsTmFtZT17ZGlzcGxheU5hbWV9XG4gICAgICAgIGxpc3RpbmdJbWFnZT17Y29udi5saXN0aW5nSW1hZ2V9XG4gICAgICAvPlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBtaW4tdy0wIGZsZXggZmxleC1jb2wgZ2FwLTEuNSBwci00IHNtOnByLThcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgbWluLXctMFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBtaW4tdy0wXCI+XG4gICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1kaXNwbGF5IGZvbnQtZXh0cmFib2xkIHRleHQtc2xhdGUtOTAwIGRhcms6dGV4dC13aGl0ZSB0ZXh0LXNtIHNtOnRleHQtYmFzZSBsZWFkaW5nLXRpZ2h0IHRydW5jYXRlIHRyYWNraW5nLXRpZ2h0IG1pbi13LTAgZ3JvdXAtaG92ZXI6dGV4dC1wcmltYXJ5LTYwMCBkYXJrOmdyb3VwLWhvdmVyOnRleHQtcHJpbWFyeS00NTAgdHJhbnNpdGlvbi1jb2xvcnNcIj5cbiAgICAgICAgICAgICAge2Rpc3BsYXlOYW1lfVxuICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgIHtwYXJ0aWNpcGFudD8udmVyaWZpY2F0aW9uTGV2ZWwgJiYgKFxuICAgICAgICAgICAgICA8VmVyaWZpY2F0aW9uQmFkZ2UgbGV2ZWw9e3BhcnRpY2lwYW50LnZlcmlmaWNhdGlvbkxldmVsfSByb2xlPXtwYXJ0aWNpcGFudC5yb2xlfSBzaG93VGV4dD17ZmFsc2V9IGNsYXNzTmFtZT1cInNjYWxlLTkwXCIgLz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwIGRhcms6dGV4dC1zbGF0ZS01MDAgd2hpdGVzcGFjZS1ub3dyYXAgc2hyaW5rLTAgZ3JvdXAtaG92ZXI6dGV4dC1zbGF0ZS01MDAgdHJhbnNpdGlvbi1jb2xvcnNcIj5cbiAgICAgICAgICAgIHtnZXRUaW1lQWdvKGNvbnYudXBkYXRlZEF0KX1cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHt1bnJlYWRDb3VudCA/IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFic29sdXRlIHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiByaWdodC00IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHBvaW50ZXItZXZlbnRzLW5vbmVcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInJlbGF0aXZlIGZsZXggaC0yIHctMlwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhbmltYXRlLXBpbmcgYWJzb2x1dGUgaW5saW5lLWZsZXggaC1mdWxsIHctZnVsbCByb3VuZGVkLWZ1bGwgYmctcHJpbWFyeS00NTAgb3BhY2l0eS03NVwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicmVsYXRpdmUgaW5saW5lLWZsZXggcm91bmRlZC1mdWxsIGgtMiB3LTIgYmctcHJpbWFyeS02MDBcIj48L3NwYW4+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiBudWxsfVxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0yIG1pbi13LTBcIj5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgdGV4dC1bOC41cHhdIGZvbnQtYmxhY2sgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHB4LTIuNSBweS0xIHJvdW5kZWQtZnVsbCBzaHJpbmstMCBib3JkZXIgJHtcbiAgICAgICAgICAgICAgZ2V0U3RhdHVzQ29uZmlnKGNvbnYuc3RhdHVzIHx8IFwiaW5xdWlyeVwiKS5jb2xvclxuICAgICAgICAgICAgfWB9XG4gICAgICAgICAgPlxuICAgICAgICAgICAge2dldFN0YXR1c0NvbmZpZyhjb252LnN0YXR1cyB8fCBcImlucXVpcnlcIikubGFiZWx9XG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgbWluLXctMCBvcGFjaXR5LTgwXCI+XG4gICAgICAgICAgICA8SG9tZSBjbGFzc05hbWU9XCJ3LTMgaC0zIHRleHQtc2xhdGUtNDAwIGRhcms6dGV4dC1zbGF0ZS01NTAgc2hyaW5rLTBcIiAvPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtc2xhdGUtNDAwIGRhcms6dGV4dC1zbGF0ZS01MDAgdHJ1bmNhdGUgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIG1pbi13LTBcIj5cbiAgICAgICAgICAgICAge2NvbnYubGlzdGluZ1RpdGxlfVxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHNtOnRleHQtc20gdGV4dC1zbGF0ZS01MDAgZGFyazp0ZXh0LXNsYXRlLTQwMCBsZWFkaW5nLXJlbGF4ZWQgZm9udC1ub3JtYWwgbGluZS1jbGFtcC0xIGJyZWFrLXdvcmRzIG1pbi13LTAgb3ZlcmZsb3ctaGlkZGVuIHByLTJcIj5cbiAgICAgICAgICB7Y29udi5sYXN0TWVzc2FnZS5pbmNsdWRlcyhcIkF1ZGlvIG1lc3NhZ2VcIikgPyAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQtcHJpbWFyeS02MDAgZGFyazp0ZXh0LXByaW1hcnktNDUwIGZvbnQtZXh0cmFib2xkIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgPE1pYyBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICAgIDxzcGFuPlZvaWNlIE5vdGU8L3NwYW4+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIGNvbnYubGFzdE1lc3NhZ2VcbiAgICAgICAgICApfVxuICAgICAgICA8L3A+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJoaWRkZW4gc206ZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdy04IGgtOCByb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZGFyazpib3JkZXItc2xhdGUtODAwIGdyb3VwLWhvdmVyOmJnLXNsYXRlLTUwIGRhcms6Z3JvdXAtaG92ZXI6Ymctc2xhdGUtODAwIGdyb3VwLWhvdmVyOnRyYW5zbGF0ZS14LTAuNSB0cmFuc2l0aW9uLWFsbFwiPlxuICAgICAgICA8Q2hldnJvblJpZ2h0IGNsYXNzTmFtZT1cInctNCBoLTQgdGV4dC1zbGF0ZS00MDAgZGFyazp0ZXh0LXNsYXRlLTU1MCBncm91cC1ob3Zlcjp0ZXh0LXByaW1hcnktNTAwIGRhcms6Z3JvdXAtaG92ZXI6dGV4dC1wcmltYXJ5LTQ1MCB0cmFuc2l0aW9uLWNvbG9yc1wiIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L21vdGlvbi5kaXY+XG4gICk7XG59KTtcblxuaW50ZXJmYWNlIENvbnZlcnNhdGlvbiB7XG4gIGlkOiBzdHJpbmc7XG4gIHRlbmFudElkOiBzdHJpbmc7XG4gIGFnZW50SWQ6IHN0cmluZztcbiAgbGlzdGluZ0lkOiBzdHJpbmc7XG4gIGxhc3RNZXNzYWdlOiBzdHJpbmc7XG4gIHVwZGF0ZWRBdDogYW55O1xuICB0ZW5hbnROYW1lOiBzdHJpbmc7XG4gIGFnZW50TmFtZTogc3RyaW5nO1xuICBsaXN0aW5nVGl0bGU6IHN0cmluZztcbiAgbGlzdGluZ0ltYWdlOiBzdHJpbmc7XG4gIHRlbmFudEltYWdlPzogc3RyaW5nO1xuICBhZ2VudEltYWdlPzogc3RyaW5nO1xuICBsaXN0aW5nUHJpY2U6IHN0cmluZztcbiAgbGlzdGluZ1ByaWNlVmFsdWU/OiBudW1iZXI7XG4gIHVucmVhZENvdW50X3RlbmFudD86IG51bWJlcjtcbiAgdW5yZWFkQ291bnRfYWdlbnQ/OiBudW1iZXI7XG4gIHN0YXR1czpcbiAgICB8IFwiaW5xdWlyeVwiXG4gICAgfCBcInRvdXJfcmVxdWVzdGVkXCJcbiAgICB8IFwidG91cl9jb25maXJtZWRcIlxuICAgIHwgXCJjb250cmFjdF9zZW50XCJcbiAgICB8IFwiZXNjcm93X2xvY2tlZFwiXG4gICAgfCBcImRpc3B1dGVkXCJcbiAgICB8IFwiY29tcGxldGVkXCI7XG59XG5cbmNvbnN0IEluYm94ID0gKCkgPT4ge1xuICBjb25zdCB7IHVzZXIsIHNldEFjdGl2ZVRhYiB9ID0gdXNlQXV0aCgpO1xuICBjb25zdCBbY29udmVyc2F0aW9ucywgc2V0Q29udmVyc2F0aW9uc10gPSB1c2VTdGF0ZTxDb252ZXJzYXRpb25bXT4oW10pO1xuICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW3NlbGVjdGVkQ29udiwgc2V0U2VsZWN0ZWRDb252XSA9IHVzZVN0YXRlPENvbnZlcnNhdGlvbiB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbc2VhcmNoUXVlcnksIHNldFNlYXJjaFF1ZXJ5XSA9IHVzZVN0YXRlKFwiXCIpO1xuXG4gIGNvbnN0IGdldFN0YXR1c0NvbmZpZyA9IChzdGF0dXM6IHN0cmluZykgPT4ge1xuICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgICBjYXNlIFwidG91cl9yZXF1ZXN0ZWRcIjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYWJlbDogXCJUb3VyIFJlcXVlc3RlZFwiLFxuICAgICAgICAgIGNvbG9yOiBcInRleHQtYmx1ZS03MDUgYmctYmx1ZS01MC81MCBkYXJrOmJnLWJsdWUtOTAwLzIwIGJvcmRlci1ibHVlLTEwMC82MCBkYXJrOmJvcmRlci1ibHVlLTgwMC80MCB0ZXh0LWJsdWUtNzAwIGRhcms6dGV4dC1ibHVlLTQwMFwiLFxuICAgICAgICB9O1xuICAgICAgY2FzZSBcInRvdXJfY29uZmlybWVkXCI6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbGFiZWw6IFwiVG91ciBDb25maXJtZWRcIixcbiAgICAgICAgICBjb2xvcjogXCJ0ZXh0LWluZGlnby03MDUgYmctaW5kaWdvLTUwLzUwIGRhcms6YmctaW5kaWdvLTkwMC8yMCBib3JkZXItaW5kaWdvLTEwMC82MCBkYXJrOmJvcmRlci1pbmRpZ28tODAwLzQwIHRleHQtaW5kaWdvLTcwMCBkYXJrOnRleHQtaW5kaWdvLTQwMFwiLFxuICAgICAgICB9O1xuICAgICAgY2FzZSBcImNvbnRyYWN0X3NlbnRcIjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYWJlbDogXCJDb250cmFjdCBTZW50XCIsXG4gICAgICAgICAgY29sb3I6IFwidGV4dC1hbWJlci03MDUgYmctYW1iZXItNTAvNTAgZGFyazpiZy1hbWJlci05NTUvMjAgYm9yZGVyLWFtYmVyLTEwMC82MCBkYXJrOmJvcmRlci1hbWJlci05NTAvNDAgdGV4dC1hbWJlci03MDAgZGFyazp0ZXh0LWFtYmVyLTQ1MFwiLFxuICAgICAgICB9O1xuICAgICAgY2FzZSBcImVzY3Jvd19sb2NrZWRcIjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYWJlbDogXCJFc2Nyb3cgTG9ja2VkXCIsXG4gICAgICAgICAgY29sb3I6IFwidGV4dC1lbWVyYWxkLTcwNSBiZy1lbWVyYWxkLTUwLzUwIGRhcms6YmctZW1lcmFsZC05NTUvMjAgYm9yZGVyLWVtZXJhbGQtMTAwLzYwIGRhcms6Ym9yZGVyLWVtZXJhbGQtOTA1LzMwIHRleHQtZW1lcmFsZC03MDAgZGFyazp0ZXh0LWVtZXJhbGQtNDAwXCIsXG4gICAgICAgIH07XG4gICAgICBjYXNlIFwiZGlzcHV0ZWRcIjpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYWJlbDogXCJEaXNwdXRlZFwiLFxuICAgICAgICAgIGNvbG9yOiBcInRleHQtcmVkLTcwNSBiZy1yZWQtNTAvNTAgZGFyazpiZy1yZWQtOTU1LzIwIGJvcmRlci1yZWQtMTAwLzYwIGRhcms6Ym9yZGVyLXJlZC05MDUvMzAgdGV4dC1yZWQtNzAwIGRhcms6dGV4dC1yZWQtNDAwXCIsXG4gICAgICAgIH07XG4gICAgICBjYXNlIFwiY29tcGxldGVkXCI6XG4gICAgICAgIHJldHVybiB7IFxuICAgICAgICAgIGxhYmVsOiBcIkNvbXBsZXRlZFwiLCBcbiAgICAgICAgICBjb2xvcjogXCJ0ZXh0LXNsYXRlLTUwMCBkYXJrOnRleHQtc2xhdGUtNDUwIGJnLXNsYXRlLTU1LzgwIGRhcms6Ymctc2xhdGUtODAwLzYwIGJvcmRlci1zbGF0ZS0xNTAgZGFyazpib3JkZXItc2xhdGUtNzAwLzYwXCIgXG4gICAgICAgIH07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geyBcbiAgICAgICAgICBsYWJlbDogXCJJbnF1aXJ5XCIsIFxuICAgICAgICAgIGNvbG9yOiBcInRleHQtc2xhdGUtNjAwIGRhcms6dGV4dC1zbGF0ZS00MDAgYmctc2xhdGUtNTUvODAgZGFyazpiZy1zbGF0ZS04NTAvNjAgYm9yZGVyLXNsYXRlLTE1MCBkYXJrOmJvcmRlci1zbGF0ZS03MDAvNjBcIiBcbiAgICAgICAgfTtcbiAgICB9XG4gIH07XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHNldENvbnZlcnNhdGlvbnMoW10pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnZlcnNhdGlvbnNSZWYgPSBjb2xsZWN0aW9uKGRiLCBcImNvbnZlcnNhdGlvbnNcIik7XG4gICAgY29uc3QgZmllbGRUb0ZpbHRlciA9IHVzZXIucm9sZSA9PT0gXCJ0ZW5hbnRcIiA/IFwidGVuYW50SWRcIiA6IFwiYWdlbnRJZFwiO1xuICAgIGNvbnN0IHEgPSBxdWVyeShcbiAgICAgIGNvbnZlcnNhdGlvbnNSZWYsXG4gICAgICB3aGVyZShmaWVsZFRvRmlsdGVyLCBcIj09XCIsIHVzZXIuaWQpLFxuICAgICAgb3JkZXJCeShcInVwZGF0ZWRBdFwiLCBcImRlc2NcIilcbiAgICApO1xuXG4gICAgY29uc3QgdW5zdWJzY3JpYmUgPSBvblNuYXBzaG90KFxuICAgICAgcSxcbiAgICAgIChzbmFwc2hvdCkgPT4ge1xuICAgICAgICBjb25zdCBjb252cyA9IHNuYXBzaG90LmRvY3MubWFwKChkb2MpID0+ICh7XG4gICAgICAgICAgaWQ6IGRvYy5pZCxcbiAgICAgICAgICAuLi5kb2MuZGF0YSgpLFxuICAgICAgICB9KSkgYXMgQ29udmVyc2F0aW9uW107XG4gICAgICAgIHNldENvbnZlcnNhdGlvbnMoY29udnMpO1xuICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgIH0sXG4gICAgICAoZXJyOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGVycj8uY29kZSA9PT0gJ3Blcm1pc3Npb24tZGVuaWVkJyB8fCBlcnI/Lm1lc3NhZ2U/LmluY2x1ZGVzKCdwZXJtaXNzaW9uJykpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcihcIkluYm94IGxpc3RlbmVyIGVycm9yOlwiLCBlcnIpO1xuICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHVuc3Vic2NyaWJlKCk7XG4gICAgICBzZXRDb252ZXJzYXRpb25zKFtdKTtcbiAgICB9O1xuICB9LCBbdXNlcl0pO1xuXG4gIGNvbnN0IGZpbHRlcmVkQ29udmVyc2F0aW9ucyA9IGNvbnZlcnNhdGlvbnMuZmlsdGVyKFxuICAgIChjb252KSA9PlxuICAgICAgY29udi5hZ2VudE5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpKSB8fFxuICAgICAgY29udi5saXN0aW5nVGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpKSB8fFxuICAgICAgY29udi5sYXN0TWVzc2FnZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHNlYXJjaFF1ZXJ5LnRvTG93ZXJDYXNlKCkpXG4gICk7XG5cbiAgY29uc3QgZ2V0VGltZUFnbyA9ICh0aW1lc3RhbXA6IGFueSkgPT4ge1xuICAgIGlmICghdGltZXN0YW1wKSByZXR1cm4gXCJcIjtcbiAgICBjb25zdCBkYXRlID0gdGltZXN0YW1wLnRvRGF0ZSA/IHRpbWVzdGFtcC50b0RhdGUoKSA6IG5ldyBEYXRlKHRpbWVzdGFtcCk7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBkaWZmID0gTWF0aC5hYnMobm93LmdldFRpbWUoKSAtIGRhdGUuZ2V0VGltZSgpKTtcbiAgICBjb25zdCBtaW51dGVzID0gTWF0aC5mbG9vcihkaWZmIC8gKDEwMDAgKiA2MCkpO1xuICAgIGNvbnN0IGhvdXJzID0gTWF0aC5mbG9vcihtaW51dGVzIC8gNjApO1xuICAgIGNvbnN0IGRheXMgPSBNYXRoLmZsb29yKGhvdXJzIC8gMjQpO1xuXG4gICAgaWYgKG1pbnV0ZXMgPCA2MCkgcmV0dXJuIGAke21pbnV0ZXN9bWA7XG4gICAgaWYgKGhvdXJzIDwgMjQpIHJldHVybiBgJHtob3Vyc31oYDtcbiAgICByZXR1cm4gYCR7ZGF5c31kYDtcbiAgfTtcblxuICBpZiAobG9hZGluZykge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLVs3MHZoXSBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtNCBiZy1zbGF0ZS01MC81MCBkYXJrOmJnLXNsYXRlLTk1MCB0cmFuc2l0aW9uLWNvbG9ycyBkdXJhdGlvbi0zMDBcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTEwIGgtMTAgYm9yZGVyLTMgYm9yZGVyLXNsYXRlLTIwMCBkYXJrOmJvcmRlci1zbGF0ZS04MDAgYm9yZGVyLXQtcHJpbWFyeS02MDAgZGFyazpib3JkZXItdC1wcmltYXJ5LTUwMCByb3VuZGVkLWZ1bGwgYW5pbWF0ZS1zcGluXCIgLz5cbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTQwMCBkYXJrOnRleHQtc2xhdGUtNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgYW5pbWF0ZS1wdWxzZVwiPlxuICAgICAgICAgIEZldGNoaW5nIG1lc3NhZ2VzLi4uXG4gICAgICAgIDwvcD5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwibWluLWgtc2NyZWVuIGJnLXNsYXRlLTUwLzMwIGRhcms6Ymctc2xhdGUtOTUwIHRyYW5zaXRpb24tY29sb3JzIGR1cmF0aW9uLTMwMFwiPlxuICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJzdGlja3kgdG9wLTAgei01MCBiZy13aGl0ZS84MCBkYXJrOmJnLXNsYXRlLTkwMC84MCBiYWNrZHJvcC1ibHVyLW1kIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0yMDAgZGFyazpib3JkZXItc2xhdGUtODAwLzgwIGxnOmhpZGRlblwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctZnVsbCBtYXgtdy1ub25lIHB4LTQgaC0xNiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICA8SGFtYnVyZ2VyQnV0dG9uIC8+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgdGV4dC1wcmltYXJ5LTYwMCBkYXJrOnRleHQtcHJpbWFyeS00NTAgbGVhZGluZy1ub25lXCI+WW91ciBDaGF0czwvc3Bhbj5cbiAgICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1kaXNwbGF5IGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS05MDAgZGFyazp0ZXh0LXdoaXRlIHRyYWNraW5nLXRpZ2h0IG10LTAuNVwiPlxuICAgICAgICAgICAgICAgIE1lc3NhZ2VzXG4gICAgICAgICAgICAgIDwvaDE+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBcbiAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlVGFiKCdub3RpZmljYXRpb25zJyl9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJwLTIuNSByZWxhdGl2ZSBob3ZlcjpiZy1zbGF0ZS0xMDAvODUgZGFyazpob3ZlcjpiZy1zbGF0ZS04MDAvODAgcm91bmRlZC1mdWxsIHRyYW5zaXRpb24tY29sb3JzIGdyb3VwIGxnOmhpZGRlblwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPEJlbGwgY2xhc3NOYW1lPVwidy01IGgtNSB0ZXh0LXNsYXRlLTcwMCBkYXJrOnRleHQtc2xhdGUtMzAwIGdyb3VwLWhvdmVyOnRleHQtcHJpbWFyeS02MDAgdHJhbnNpdGlvbi1jb2xvcnNcIiAvPlxuICAgICAgICAgICAgPE5vdGlmaWNhdGlvbkJhZGdlIC8+XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9oZWFkZXI+XG5cbiAgICAgIDxIZWFkZXJQb3J0YWw+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaGlkZGVuIGxnOmZsZXggZmxleC0xIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcHgtNiBoLWZ1bGxcIj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ibGFjayB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IHRleHQtcHJpbWFyeS02MDAgZGFyazp0ZXh0LXByaW1hcnktNDUwIGxlYWRpbmctbm9uZVwiPllvdXIgQ2hhdHM8L3NwYW4+XG4gICAgICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWRpc3BsYXkgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTkwMCBkYXJrOnRleHQtd2hpdGUgdHJhY2tpbmctdGlnaHQgbXQtMC41XCI+XG4gICAgICAgICAgICAgIE1lc3NhZ2VzXG4gICAgICAgICAgICA8L2gxPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvSGVhZGVyUG9ydGFsPlxuXG4gICAgICA8bWFpbiBjbGFzc05hbWU9XCJ3LWZ1bGwgbWF4LXctbm9uZSBweC1bMTVweF0gcHQtWzE1cHhdIHBiLVsxNXB4XSBtYi0wXCI+XG4gICAgICAgIDxtb3Rpb24uZGl2XG4gICAgICAgICAgaW5pdGlhbD17eyBvcGFjaXR5OiAwIH19XG4gICAgICAgICAgYW5pbWF0ZT17eyBvcGFjaXR5OiAxIH19XG4gICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHNwYWNlLXktNlwiXG4gICAgICAgID5cbiAgICAgICAgICB7LyogU2VhcmNoIFNlY3Rpb24gKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBncm91cCBtYXgtdy1mdWxsXCI+XG4gICAgICAgICAgICA8U2VhcmNoIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtNCB0b3AtMS8yIC10cmFuc2xhdGUteS0xLzIgdy00LjUgaC00LjUgdGV4dC1zbGF0ZS00MDAgZ3JvdXAtZm9jdXMtd2l0aGluOnRleHQtcHJpbWFyeS02MDAgdHJhbnNpdGlvbi1jb2xvcnNcIiAvPlxuICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgdmFsdWU9e3NlYXJjaFF1ZXJ5fVxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFNlYXJjaFF1ZXJ5KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggYnkgc2VuZGVyLCBwcm9wZXJ0eSBuYW1lIG9yIGtleXdvcmQuLi5cIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctd2hpdGUgZGFyazpiZy1zbGF0ZS05MDAgYm9yZGVyIGJvcmRlci1zbGF0ZS0xNTAvODAgZGFyazpib3JkZXItc2xhdGUtODAwIHNoYWRvdy1zbSByb3VuZGVkLTJ4bCBweS00IHBsLTEyIHByLTQgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXNsYXRlLTgwMCBkYXJrOnRleHQtd2hpdGUgb3V0bGluZS1ub25lIGZvY3VzOnJpbmctNCBmb2N1czpyaW5nLXByaW1hcnktNTAwLzUgZm9jdXM6Ym9yZGVyLXByaW1hcnktNTAwLzMwIGRhcms6Zm9jdXM6Ym9yZGVyLXByaW1hcnktNTAwLzMwIHRyYW5zaXRpb24tYWxsIHBsYWNlaG9sZGVyOnRleHQtc2xhdGUtNDAwIGRhcms6cGxhY2Vob2xkZXI6dGV4dC1zbGF0ZS02MDBcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBDaGF0IExpc3QgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTMuNSBwYi04XCI+XG4gICAgICAgICAgICA8QW5pbWF0ZVByZXNlbmNlIG1vZGU9XCJwb3BMYXlvdXRcIj5cbiAgICAgICAgICAgICAge2ZpbHRlcmVkQ29udmVyc2F0aW9ucy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPG1vdGlvbi5kaXZcbiAgICAgICAgICAgICAgICAgIGtleT1cImVtcHR5LWluYm94XCJcbiAgICAgICAgICAgICAgICAgIGluaXRpYWw9e3sgb3BhY2l0eTogMCwgc2NhbGU6IDAuOTggfX1cbiAgICAgICAgICAgICAgICAgIGFuaW1hdGU9e3sgb3BhY2l0eTogMSwgc2NhbGU6IDEgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLXdoaXRlIGRhcms6Ymctc2xhdGUtOTAwIHJvdW5kZWQtM3hsIGJvcmRlciBib3JkZXItc2xhdGUtMTUwLzgwIGRhcms6Ym9yZGVyLXNsYXRlLTgwMCBzaGFkb3ctbWQgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcHktMjAgcHgtNiB0ZXh0LWNlbnRlciBtYXgtdy1tZCBteC1hdXRvXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiBiZy1wcmltYXJ5LTUwIGRhcms6YmctcHJpbWFyeS05NTAvMjAgcm91bmRlZC0yeGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgbWItNiB0ZXh0LXByaW1hcnktNTUwIGRhcms6dGV4dC1wcmltYXJ5LTQ1MCBib3JkZXIgYm9yZGVyLXByaW1hcnktMTAwIGRhcms6Ym9yZGVyLXByaW1hcnktOTAwLzQwIHNoYWRvdy1pbm5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8TWVzc2FnZVNxdWFyZSBjbGFzc05hbWU9XCJ3LTcgaC03XCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1kaXNwbGF5IGZvbnQtZXh0cmFib2xkIHRleHQtc2xhdGUtOTAwIGRhcms6dGV4dC13aGl0ZSBtYi0yXCI+XG4gICAgICAgICAgICAgICAgICAgIFlvdXIgaW5ib3ggaXMgY2xlYXJcbiAgICAgICAgICAgICAgICAgIDwvaDM+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtc2xhdGUtNDUwIGRhcms6dGV4dC1zbGF0ZS00MDAgbGVhZGluZy1yZWxheGVkIGZvbnQtbGlnaHQgbWItNlwiPlxuICAgICAgICAgICAgICAgICAgICBJbnF1aXJlIG9uIHZlcmlmaWVkIHJlbnRhbHMgb3Igc3RhcnQgYSBkaWFsb2d1ZSB3aXRoIGFueSB2ZXR0ZWQgb3duZXIsIGFuZCB5b3VyIG1lc3NhZ2VzIHdpbGwgbGFuZCBoZXJlIGluc3RhbnRlbm91c2x5LlxuICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVUYWIoXCJob21lXCIpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1wcmltYXJ5LTYwMCBob3ZlcjpiZy1wcmltYXJ5LTcwMCB0ZXh0LXdoaXRlIHB4LTYgcHktMi41IHJvdW5kZWQteGwgZm9udC1ib2xkIHRleHQtWzExcHhdIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciB0cmFuc2l0aW9uLWFsbCBhY3RpdmU6c2NhbGUtOTUgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICBGaW5kIExpc3RpbmdzXG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+XG4gICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgZmlsdGVyZWRDb252ZXJzYXRpb25zLm1hcCgoY29udikgPT4gKFxuICAgICAgICAgICAgICAgICAgPENvbnZlcnNhdGlvblJvd1xuICAgICAgICAgICAgICAgICAgICBrZXk9e2Bjb252LSR7Y29udi5pZH1gfVxuICAgICAgICAgICAgICAgICAgICBjb252PXtjb252fVxuICAgICAgICAgICAgICAgICAgICB1c2VyPXt1c2VyfVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTZWxlY3RlZENvbnYoY29udil9XG4gICAgICAgICAgICAgICAgICAgIGdldFRpbWVBZ289e2dldFRpbWVBZ299XG4gICAgICAgICAgICAgICAgICAgIGdldFN0YXR1c0NvbmZpZz17Z2V0U3RhdHVzQ29uZmlnfVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9BbmltYXRlUHJlc2VuY2U+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbW90aW9uLmRpdj5cblxuICAgICAgICB7LyogU2VsZWN0ZWQgQ29udmVyc2F0aW9uIE1vZGFsICovfVxuICAgICAgICB7c2VsZWN0ZWRDb252ICYmIChcbiAgICAgICAgICA8Q2hhdE1vZGFsXG4gICAgICAgICAgICBpc09wZW49eyEhc2VsZWN0ZWRDb252fVxuICAgICAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2VsZWN0ZWRDb252KG51bGwpfVxuICAgICAgICAgICAgb3ZlcnJpZGVDb252ZXJzYXRpb25JZD17c2VsZWN0ZWRDb252LmlkfVxuICAgICAgICAgICAgbGlzdGluZz17XG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpZDogaXNOYU4oTnVtYmVyKHNlbGVjdGVkQ29udi5saXN0aW5nSWQpKSA/IHNlbGVjdGVkQ29udi5saXN0aW5nSWQgOiBwYXJzZUludChzZWxlY3RlZENvbnYubGlzdGluZ0lkKSxcbiAgICAgICAgICAgICAgICB0aXRsZTogc2VsZWN0ZWRDb252Lmxpc3RpbmdUaXRsZSxcbiAgICAgICAgICAgICAgICBwcmljZTogc2VsZWN0ZWRDb252Lmxpc3RpbmdQcmljZSxcbiAgICAgICAgICAgICAgICBwcmljZVZhbHVlOiAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkQ29udi5saXN0aW5nUHJpY2VWYWx1ZSkgcmV0dXJuIE51bWJlcihzZWxlY3RlZENvbnYubGlzdGluZ1ByaWNlVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgaWYgKCFzZWxlY3RlZENvbnYubGlzdGluZ1ByaWNlKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNsZWFuZWQgPSBTdHJpbmcoc2VsZWN0ZWRDb252Lmxpc3RpbmdQcmljZSkucmVwbGFjZSgvW+KCpiwkL2EtekEtWlxcc1xcLV0vZywgJycpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VJbnQoY2xlYW5lZCwgMTApO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzTmFOKHBhcnNlZCkgPyAwIDogcGFyc2VkO1xuICAgICAgICAgICAgICAgIH0pKCksXG4gICAgICAgICAgICAgICAgaW1hZ2U6IHNlbGVjdGVkQ29udi5saXN0aW5nSW1hZ2UsXG4gICAgICAgICAgICAgICAgYWdlbnQ6IHtcbiAgICAgICAgICAgICAgICAgIGlkOiBzZWxlY3RlZENvbnYuYWdlbnRJZCxcbiAgICAgICAgICAgICAgICAgIG5hbWU6IHNlbGVjdGVkQ29udi5hZ2VudE5hbWUsXG4gICAgICAgICAgICAgICAgICByYXRpbmc6IDUuMCxcbiAgICAgICAgICAgICAgICAgIGlzVmVyaWZpZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogXCJcIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcIlwiLFxuICAgICAgICAgICAgICAgIGFtZW5pdGllczogW10sXG4gICAgICAgICAgICAgICAgbGFuZG1hcms6IFwiXCIsXG4gICAgICAgICAgICAgICAgYXJlYTogXCJcIixcbiAgICAgICAgICAgICAgICB2ZXJpZmllZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBub0ZlZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBpc0Zhdm9yaXRlOiBmYWxzZSxcbiAgICAgICAgICAgICAgfSBhcyBMaXN0aW5nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50VXNlcj17dXNlciF9XG4gICAgICAgICAgLz5cbiAgICAgICAgKX1cbiAgICAgIDwvbWFpbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEluYm94O1xuIl0sImZpbGUiOiIvYXBwL2FwcGxldC9zcmMvcGFnZXMvQ2hhdC50c3gifQ==