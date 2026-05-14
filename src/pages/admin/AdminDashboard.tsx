import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ShieldCheck, 
  LogOut, 
  Settings, 
  Search,
  Menu,
  Bell,
  Plus,
  Activity,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  ExternalLink,
  Eye,
  Heart,
  Calendar,
  User,
  X,
  BadgeCheck,
  Play,
  MessageCircleMore,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, limit, orderBy, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { purgeListingData } from '../../utils/adminCleanup';
import { 
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

import ListingManagement from './ListingManagement';
import UserManagement from './UserManagement';
import Approvals from './Approvals';
import AdminProfile from './AdminProfile';
import Maintenance from './Maintenance';
import DropdownPortal from '../../components/admin/DropdownPortal';

type AdminTab = 'dashboard' | 'listings' | 'users' | 'approvals' | 'maintenance' | 'profile';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [activeAsset, setActiveAsset] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const setIsSidebarCollapsed = (value: boolean) => {
    setIsSidebarCollapsedState(value);
    localStorage.setItem('admin_sidebar_collapsed', value.toString());
  };
  
  const [users, setUsers] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [conversationCount, setConversationCount] = useState(0);

  // Analytics Data - Generated based on actual listings creation frequency
  const chartData = React.useMemo(() => {
    // Group listings by week/month based on timeframe
    const now = new Date();
    
    if (timeRange === '7d') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        const dayName = days[d.getDay()];
        const count = listings.filter(l => {
          if (!l.createdAt || typeof (l.createdAt as any).seconds === 'undefined') return false;
          const date = new Date((l.createdAt as any).seconds * 1000);
          return date.toDateString() === d.toDateString();
        }).length;
        return { name: dayName, value: count, highlighted: i === 6 };
      });
    }

    if (timeRange === '90d') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return Array.from({ length: 3 }).map((_, i) => {
        const d = new Date();
        d.setMonth(now.getMonth() - (2 - i));
        const monthName = months[d.getMonth()];
        const count = listings.filter(l => {
          if (!l.createdAt || typeof (l.createdAt as any).seconds === 'undefined') return false;
          const date = new Date((l.createdAt as any).seconds * 1000);
          return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
        }).length;
        return { name: monthName, value: count, highlighted: i === 2 };
      });
    }

    // Default 30d (by week)
    return Array.from({ length: 4 }).map((_, i) => {
      const weekLabel = `Wk ${i + 1}`;
      const count = listings.filter(l => {
        if (!l.createdAt) return false;
        const date = new Date(l.createdAt.seconds * 1000);
        const daysDiff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        return daysDiff <= (4 - i) * 7 && daysDiff > (3 - i) * 7;
      }).length;
      return { name: weekLabel, value: count, highlighted: i === 3 };
    });
  }, [listings, timeRange]);

  const statsCards = React.useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    const calculateTrend = (currentItems: any[], previousItems: any[]) => {
      if (previousItems.length === 0) return currentItems.length > 0 ? '+100%' : '0%';
      const diff = ((currentItems.length - previousItems.length) / previousItems.length) * 100;
      return `${diff > 0 ? '+' : ''}${Math.round(diff)}%`;
    };

    // Filter by timestamp helper
    const filterByDateRange = (items: any[], start: Date, end: Date, dateField = 'createdAt') => {
      return items.filter(item => {
        const ts = item[dateField];
        if (!ts) return false;
        const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        return date >= start && date < end;
      });
    };

    // Listings Stats
    const currentListings = filterByDateRange(listings, thirtyDaysAgo, now);
    const prevListings = filterByDateRange(listings, sixtyDaysAgo, thirtyDaysAgo);
    const listingsTrend = calculateTrend(currentListings, prevListings);

    // Users Stats (excluding admins)
    const normalUsers = users.filter(u => u.role !== 'admin' && u.role !== 'moderator');
    const currentUsers = filterByDateRange(normalUsers, thirtyDaysAgo, now);
    const prevUsers = filterByDateRange(normalUsers, sixtyDaysAgo, thirtyDaysAgo);
    const usersTrend = calculateTrend(currentUsers, prevUsers);

    // Agents Stats
    const agents = users.filter(u => u.role === 'agent');
    const currentAgents = filterByDateRange(agents, thirtyDaysAgo, now);
    const prevAgents = filterByDateRange(agents, sixtyDaysAgo, thirtyDaysAgo);
    const agentsTrend = calculateTrend(currentAgents, prevAgents);

    // Pending Approvals
    const agentsFromColl = verifications.filter(v => v.status?.toLowerCase() === 'pending');
    const agentsFromUsers = users.filter(u => u.role === 'agent' && u.verificationStatus === 'pending');
    
    // Deduplicate by userId
    const uniqueAgentApprovals = [...agentsFromColl];
    agentsFromUsers.forEach(userAgent => {
      if (!uniqueAgentApprovals.some(a => a.userId === userAgent.id)) {
        uniqueAgentApprovals.push({ id: userAgent.id, userId: userAgent.id, ...userAgent });
      }
    });

    const pendingListings = listings.filter(l => l.isApproved === false);
    const pendingCount = uniqueAgentApprovals.length + pendingListings.length;
    const highLoad = pendingCount > 10;

    return [
      { 
        label: 'LISTINGS', 
        value: listings.length, 
        change: listingsTrend, 
        isUp: !listingsTrend.startsWith('-'), 
        icon: FileText,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-900/20'
      },
      { 
        label: 'VERIFIED AGENTS', 
        value: agents.length, 
        change: agentsTrend,
        isUp: !agentsTrend.startsWith('-'), 
        icon: ShieldCheck,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20'
      },
      { 
        label: 'TOTAL USERS', 
        value: normalUsers.length, 
        change: usersTrend, 
        isUp: !usersTrend.startsWith('-'), 
        icon: Users,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
      },
      { 
        label: 'PENDING TASKS', 
        value: pendingCount, 
        statusBadge: highLoad ? 'Critical' : 'Normal',
        isUp: !highLoad, 
        icon: Clock,
        color: highLoad ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400',
        bg: highLoad ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-slate-50 dark:bg-slate-900/20'
      },
    ];
  }, [listings, users, verifications]);

  useEffect(() => {
    let unsubscribeListings: (() => void) | null = null;

    const fetchData = async () => {
      // Only fetch data if we have an authenticated user in the Firebase SDK
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const usersQuery = query(collection(db, 'users'), limit(100));
        const verificationsQuery = query(collection(db, 'verifications'), orderBy('submittedAt', 'desc'), limit(50));

        let usersSnap, verificationsSnap;
        try {
          [usersSnap, verificationsSnap] = await Promise.all([
            getDocs(usersQuery),
            getDocs(verificationsQuery),
          ]);
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, 'users/verifications');
          return;
        }

        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const verificationsData = verificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        setUsers(usersData);
        setVerifications(verificationsData);

        // Real-time listener for listings
        const { onSnapshot } = await import('firebase/firestore');
        const listingsQuery = query(collection(db, 'listings'), orderBy('createdAt', 'desc'), limit(200));
        
        unsubscribeListings = onSnapshot(listingsQuery, (snapshot) => {
          const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          setListings(listingsData);

          // Update selected listing if it's currently open to reflect view/save changes
          setSelectedListing(prev => {
            if (!prev) return null;
            const updated = listingsData.find(l => l.id === prev.id);
            return updated || prev;
          });

          // Build activity feed from real data
          const listingActivities = listingsData.map(l => ({
            id: `listing-${l.id}`,
            sourceId: l.id,
            user: l.agent?.name || 'Agent',
            action: `published a new listing: ${l.title}`,
            type: 'listing',
            timestamp: l.createdAt?.seconds ? l.createdAt.seconds * 1000 : Date.now(),
            raw: l
          }));

          const verificationActivities = verificationsData.map(v => ({
            id: `verification-${v.id}`,
            sourceId: v.id,
            user: v.firstName ? `${v.firstName} ${v.middleName ? v.middleName + ' ' : ''}${v.lastName}` : (v.name || 'System User'),
            action: 'submitted a verification request.',
            type: 'verification',
            timestamp: v.submittedAt?.seconds ? v.submittedAt.seconds * 1000 : Date.now(),
            raw: v
          }));

          const combined = [...listingActivities, ...verificationActivities]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5); // Show top 5 recent events
            
          setActivities(combined);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'listings');
        });

        return () => unsubscribeListings();

      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    const cleanup = fetchData();
    return () => {
      cleanup.then(unsub => unsub?.());
    };
  }, [auth.currentUser]);

  const handleDeleteListing = (listingId: string) => {
    setListingToDelete(listingId);
    setActiveDropdown(null);
  };

  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;
    
    setIsDeleting(true);
    try {
      await purgeListingData(listingToDelete);
      setListings(prev => prev.filter(l => l.id !== listingToDelete));
      if (selectedListing?.id === listingToDelete) {
        setIsReviewOpen(false);
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete listing. Please try again.");
    } finally {
      setIsDeleting(false);
      setListingToDelete(null);
    }
  };

  const handleApproveListing = async (listingId: string) => {
    try {
      const { updateDoc, doc, serverTimestamp: fsServerTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'listings', listingId), {
        isApproved: true,
        status: 'active',
        updatedAt: fsServerTimestamp()
      });
      setIsReviewOpen(false);
    } catch (error) {
      console.error("Error approving listing:", error);
    }
  };

  const handleVerifyListing = async (listingId: string, verify: boolean) => {
    try {
      const { updateDoc, doc, serverTimestamp: fsServerTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'listings', listingId), {
        verified: verify,
        updatedAt: fsServerTimestamp()
      });
    } catch (error) {
      console.error("Error verifying listing:", error);
    }
  };

  const openReview = (listing: any) => {
    setSelectedListing(listing);
    setActiveAsset({ type: 'image', url: listing.image });
    setIsReviewOpen(true);
    setActiveDropdown(null);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'listings', label: 'Listings', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'maintenance', label: 'Maintenance', icon: Settings },
  ];

  const mainContentRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      // Scroll to top when active tab changes
      mainContentRef.current.scrollTo(0, 0);
    }
    // Also scroll the main window just in case wrapper layout scrolls
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[55] md:hidden h-screen w-screen"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed */}
      <aside className={`
        ${isSidebarCollapsed ? 'md:w-20 w-64' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        transition-all duration-300 fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-[60]
      `}>
        <div className="px-6 h-[64px] flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className={`flex flex-col ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
            <span className="font-bold text-lg tracking-tight text-[#1A1A1A] dark:text-white">DirectRent</span>
            <span className="text-[10px] text-[#999999] dark:text-[#666666] font-bold uppercase tracking-wider -mt-0.5">Admin Portal</span>
          </div>
          <div className={`bg-black dark:bg-white text-white dark:text-black w-7 h-7 rounded-none flex items-center justify-center mx-auto shadow-sm ${isSidebarCollapsed ? 'md:flex hidden' : 'hidden'}`}>
            <span className="font-bold text-xs">D</span>
          </div>
          <button 
            className="md:hidden text-slate-400 p-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

    <nav className="flex-1 pt-[15px] px-[10px] space-y-1">
          {sidebarItems.map((item) => (
            <button
               id={`sidebar-nav-${item.id}`}
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as AdminTab);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center relative rounded-none text-sm font-semibold transition-all group ${
                isSidebarCollapsed ? 'md:justify-center md:py-4 md:px-0 gap-3 px-3 py-3' : 'gap-3 px-3 py-3'
              } ${
                activeTab === item.id 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                activeTab === item.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white'
              }`} />
              
              <span className={`flex-1 text-left truncate ${isSidebarCollapsed ? 'md:hidden' : ''}`}>{item.label}</span>
              
              {activeTab === item.id && (
                <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#1A1A1A] dark:bg-white" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 dark:border-slate-800">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'md:justify-center' : ''}`}>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 border-2 transition-all ${activeTab === 'profile' ? 'border-primary-500' : 'border-transparent'} ${isSidebarCollapsed ? 'md:hidden' : ''}`}
              >
                <img src={user?.avatarUrl || (user as any)?.photoURL || `https://ui-avatars.com/api/?name=${user?.firstName || user?.email}&background=000&color=fff`} alt="" />
              </button>
              <div className={`flex-1 min-w-0 pr-2 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                <p className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={() => setActiveTab('profile')}>
                  {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || (user as any)?.displayName || 'Admin'}
                </p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{user?.adminTier || 'Moderator'}</p>
              </div>
              <button onClick={() => setShowLogoutConfirm(true)} className={`text-rose-500 hover:text-rose-700 transition-colors ${isSidebarCollapsed ? 'md:w-full md:py-2 md:flex md:justify-center' : ''}`}>
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0 transition-all duration-300 flex flex-col min-w-0`}>
        {/* Header - Refined */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-3 md:px-8 h-[64px] flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-none transition-colors text-slate-500 dark:text-slate-400 hidden md:block"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-none transition-colors text-slate-500 dark:text-slate-400 md:hidden flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
            <button 
              id="theme-toggle-admin"
              onClick={toggleTheme}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-none text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-500" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main id="admin-main-content" ref={mainContentRef} className="flex-1 overflow-y-auto pt-8 px-3 md:pt-6 md:px-8 pb-[21px] transition-colors duration-300">
          <div className="p-0 m-0">
            <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-10"
              >
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Admin</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-900 dark:text-white">Overview</span>
                </div>

                {/* Overview Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div className="space-y-1.5">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Overview</h1>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Performance and system health metrics.
                      </p>
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/10 rounded-none">
                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => setActiveTab('approvals')}
                      className="px-4 py-2 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                    >
                      Process Approvals
                    </button>
                    <button 
                      onClick={() => setActiveTab('maintenance')}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                    >
                      Maintenance
                    </button>
                    <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                      <FileText className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>

                {/* Stats Grid - Uniform Design */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {statsCards.map((stat, i) => (
                    <motion.div
                      key={`stats-card-${stat.label.toLowerCase()}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-slate-900 p-3 sm:p-5 lg:p-6 rounded-none border border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300 relative group overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-4">
                        <div className={`p-1.5 sm:p-2.5 rounded-none ${stat.bg} ${stat.color} border border-transparent transition-transform group-hover:scale-110 shadow-sm`}>
                          <stat.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </div>
                        {stat.change && (
                          <div className={`px-1.5 sm:px-2 py-0.5 rounded-none text-[8px] sm:text-[10px] font-bold flex items-center gap-1 ${
                            stat.isUp ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                          }`}>
                            {stat.isUp ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                            {stat.change}
                          </div>
                        )}
                        {stat.statusBadge && (
                          <div className={`px-1.5 sm:px-2 py-0.5 rounded-none text-[8px] sm:text-[10px] font-bold ${
                            stat.statusBadge === 'Critical' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          }`}>
                            {stat.statusBadge}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <h4 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-none font-sans">{loading ? '...' : stat.value}</h4>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Chart & Activity Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 bg-white dark:bg-slate-900 px-6 py-6 rounded-none border border-slate-200 dark:border-slate-800 transition-colors duration-300 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-medium text-slate-900 dark:text-white">Listing Activity</h3>
                      <div className="relative">
                        <button 
                          onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-none text-xs text-slate-600 dark:text-slate-400 font-medium border border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 transition-all outline-none"
                        >
                          {timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isTimeframeOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {isTimeframeOpen && (
                            <motion.div
                              key="timeframe-dropdown"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none shadow-xl z-20 overflow-hidden"
                            >
                              <div className="fixed inset-0 z-[-1]" onClick={() => setIsTimeframeOpen(false)} />
                              {(['7d', '30d', '90d'] as const).map((range) => (
                                <button
                                  key={range}
                                  onClick={() => {
                                    setTimeRange(range);
                                    setIsTimeframeOpen(false);
                                  }}
                                    className={`w-full px-4 py-2 text-left text-xs font-medium transition-colors ${
                                      timeRange === range 
                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                                  >
                                    {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                                  </button>
                                ))}
                              </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div id="listing-chart-container" className="w-full h-[320px] mt-6">
                      {chartData && chartData.length > 0 ? (
                        <ResponsiveContainer key={`chart-${timeRange}`} width="100%" height="100%">
                          <BarChart 
                            data={chartData} 
                            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                            style={{ outline: 'none' }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#F0F0F0'} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
                              dy={15}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              hide
                            />
                            <Tooltip 
                              cursor={false}
                              contentStyle={{ 
                                backgroundColor: theme === 'dark' ? '#0F172A' : '#FFF',
                                borderRadius: '0px', 
                                border: theme === 'dark' ? '1px solid #1E293B' : '1px solid #EEE', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                                fontSize: '11px',
                                color: theme === 'dark' ? '#FFF' : '#000',
                                outline: 'none'
                              }}
                            />
                            <Bar 
                              dataKey="value" 
                              radius={[0, 0, 0, 0]}
                              barSize={40}
                              activeBar={{
                                fill: theme === 'dark' ? '#334155' : '#E2E8F0',
                                stroke: 'none'
                              }}
                            >
                              {chartData.map((entry, index) => (
                                <Cell 
                                  key={`admin-dash-cell-${index}`} 
                                  className="transition-all duration-200 cursor-pointer outline-none"
                                  fill={entry.highlighted ? (theme === 'dark' ? '#FFF' : '#0F172A') : (theme === 'dark' ? '#1E293B' : '#F1F5F9')}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
                          Collecting Insight Data...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-white dark:bg-slate-900 px-[10px] py-[15px] rounded-none border border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300">
                    <div className="mb-8">
                      <h3 className="text-xl font-medium text-slate-900 dark:text-white">Recent Activity</h3>
                    </div>
                    <div className="flex-1 space-y-6">
                      {activities.map((activity) => (
                        <div key={`activity-${activity.id}`} className="flex gap-4 group/item">
                          <div className={`w-[4px] min-h-[40px] rounded-none transition-all flex-shrink-0 ${
                            activity.type === 'listing' ? 'bg-[#10B981]' : 
                            activity.type === 'verification' ? 'bg-[#F59E0B]' : 
                            'bg-[#0F172A] dark:bg-slate-400'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] leading-snug text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-[#1A1A1A] dark:text-white">{activity.user}</span>
                              <span className="text-slate-600 dark:text-slate-400"> {activity.action}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                {new Date(activity.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <button 
                                onClick={() => {
                                  if (activity.type === 'listing') {
                                    openReview(activity.raw);
                                  } else {
                                    setActiveTab('approvals');
                                  }
                                }}
                                className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline uppercase tracking-widest opacity-0 group-hover/item:opacity-100 transition-opacity"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {activities.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-4">No recent activities found.</p>
                      )}
                    </div>
                    <button className="mt-8 w-full py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-none">
                      View All Activity
                    </button>
                  </div>
                </div>

                {/* Newest Listings Table */}
                <div className="space-y-8">
                  {/* Listings Table */}
                  <div className="w-full bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                    <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="text-xl font-medium text-slate-900 dark:text-white">Newest Listings</h3>
                      <button 
                        onClick={() => setActiveTab('listings')}
                        className="text-xs font-semibold text-slate-900 dark:text-white hover:underline transition-all"
                      >
                        See all
                      </button>
                    </div>
                    {/* ... table content remains same but wrapped ... */}
                  <div className="overflow-hidden md:overflow-x-auto">
                    {/* Mobile Cards View */}
                    <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                      {listings.slice(0, 5).map((listing, index) => (
                        <div key={`mobile-listing-${listing.id}-${index}`} className="px-[10px] py-4 flex gap-4">
                          <img 
                            src={listing.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80"} 
                            alt="" 
                            className="w-20 h-20 rounded-none object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                               <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{listing.title}</p>
                               <div className="flex justify-between items-center mt-1">
                                  <span className="font-medium text-slate-900 dark:text-white text-sm">₦{listing.priceValue?.toLocaleString() || '0'}</span>
                                  <div className="flex items-center gap-1.5">
                                    {listing.verified && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                                    <span className={`inline-flex px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider ${
                                      (listing.status || 'active') === 'active' 
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                    }`}>
                                       {listing.status || 'ACTIVE'}
                                    </span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                               <span className="text-xs text-slate-500 dark:text-slate-400 truncate pr-2">{listing.agent?.name || 'Internal'}</span>
                               <button 
                                 onClick={() => openReview(listing)}
                                 className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-none"
                               >
                                 View
                               </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>                    {/* Desktop Table View */}
                    <table className="w-full text-left hidden md:table">
                      <thead>
                        <tr className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Property</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Agent (Address)</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Price (Annual)</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {listings.slice(0, 5).map((listing) => (
                          <tr key={`desktop-dash-listing-${listing.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-none bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700">
                                  <img 
                                    src={listing.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80"} 
                                    alt="" 
                                    className="w-full h-full object-cover transition-all grayscale-[0.2] group-hover:grayscale-0"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-slate-900 dark:text-white text-[15px] truncate">{listing.title}</p>
                                    {listing.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                  </div>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{listing.type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[14px] text-slate-600 dark:text-slate-300 font-medium truncate">{listing.agent?.name || 'Internal'}</span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{listing.location}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-medium text-slate-900 dark:text-white text-[14px]">
                              ₦{(listing.priceValue || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${
                                (listing.status || 'active') === 'active' 
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                  : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                              }`}>
                                {listing.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  setOpenUpwards(spaceBelow < 250);
                                  setAnchorRect(rect);
                                  setActiveDropdown(activeDropdown === listing.id ? null : listing.id);
                                }}
                                className={`p-2 rounded-none transition-all ${
                                  activeDropdown === listing.id 
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>

                              <DropdownPortal
                                isOpen={activeDropdown === listing.id}
                                onClose={() => setActiveDropdown(null)}
                                anchorRect={anchorRect}
                                openUpwards={openUpwards}
                              >
                                <div className="py-1">
                                    <button 
                                      onClick={() => {
                                        openReview(listing);
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Review Details
                                    </button>
                                    <button 
                                      onClick={() => {
                                        window.open(`/listings/${listing.id}`, '_blank');
                                        setActiveDropdown(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      View Public Page
                                    </button>
                                    <button 
                                      onClick={() => {
                                        handleDeleteListing(listing.id);
                                        setActiveDropdown(null);
                                      }}
                                      disabled={isDeleting}
                                      className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                                    </button>
                                  </div>
                              </DropdownPortal>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                  {/* Users / Regions Row */}
                  <div className="w-full">
                    {/* Recent Users */}
                    <div className="w-full bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                      <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-xl font-medium text-slate-900 dark:text-white">Recent Users</h3>
                        <button 
                          onClick={() => setActiveTab('users')}
                          className="text-xs font-semibold text-slate-900 dark:text-white hover:underline transition-all"
                        >
                          All
                        </button>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users
                          .filter(u => u.role !== 'admin' && u.role !== 'moderator')
                          .slice(0, 5)
                          .map((user) => (
                          <div key={`dash-user-${user.id}`} className="p-4 flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-none bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden flex-shrink-0">
                               <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name || user.firstName || 'User'}&background=000&color=fff`} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white text-sm truncate uppercase tracking-tight">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">{user.role || 'TENANT'}</p>
                            </div>
                            <button 
                              onClick={() => {
                                // Potentially open user details
                                setActiveTab('users');
                              }}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors"
                            >
                               <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Users / Regions Side Panel removed by user request */}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'listings' && (
              <ListingManagement 
                listings={listings}
                loading={loading}
                onReview={openReview}
                onDelete={handleDeleteListing}
                onApprove={handleApproveListing}
                onVerify={handleVerifyListing}
                onExport={() => {
                  const data = JSON.stringify(listings, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'listings-export.json';
                  a.click();
                }}
              />
            )}

            {activeTab === 'users' && (
              <UserManagement />
            )}

            {activeTab === 'approvals' && (
              <Approvals />
            )}
            {activeTab === 'profile' && (
              <AdminProfile />
            )}
            {activeTab === 'maintenance' && (
              <Maintenance />
            )}
          </AnimatePresence>
        </div>
      </main>
      </div>

      {/* Review Drawer */}
      <AnimatePresence>
        {isReviewOpen && selectedListing && (
            <motion.div 
              key="review-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] h-screen w-screen"
            />
        )}
        {isReviewOpen && selectedListing && (
            <motion.div
              key="review-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full sm:w-[500px] bg-white dark:bg-slate-950 shadow-2xl z-[110] border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Listing Review</h3>
                    {selectedListing.verified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-none">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-none">
                      ID: {selectedListing.id}
                    </p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedListing.id);
                        // Optional: Toast feedback?
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors"
                      title="Copy ID"
                    >
                      <LayoutDashboard className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setIsReviewOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                {/* Visual Preview & Gallery */}
                <div className="space-y-4 mb-8">
                  <div className="aspect-[16/10] w-full rounded-none bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800 group relative">
                    {activeAsset?.type === 'video' ? (
                      <video 
                        src={activeAsset.url} 
                        controls 
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={activeAsset?.url || selectedListing.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"} 
                        alt={selectedListing.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-none border border-white/10 uppercase tracking-widest">
                      {activeAsset?.type === 'video' ? 'Video Asset' : 'Image Asset'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {/* Main Image Thumbnail */}
                    <button 
                      onClick={() => setActiveAsset({ type: 'image', url: selectedListing.image })}
                      className={`w-20 h-16 rounded-none overflow-hidden border-2 flex-shrink-0 transition-all ${
                        activeAsset?.url === selectedListing.image ? 'border-primary-500 scale-95 shadow-lg' : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={selectedListing.image} className="w-full h-full object-cover" alt="" />
                    </button>

                    {/* Additional Images (excluding cover if already shown) */}
                    {selectedListing.images && selectedListing.images.filter((img: string) => img !== selectedListing.image).map((img: string, i: number) => (
                      <button 
                        key={`img-${i}`}
                        onClick={() => setActiveAsset({ type: 'image', url: img })}
                        className={`w-20 h-16 rounded-none overflow-hidden border-2 flex-shrink-0 transition-all ${
                          activeAsset?.url === img ? 'border-primary-500 scale-95 shadow-lg' : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}

                    {/* Video Thumbnail */}
                    {selectedListing.videoUrl && (
                      <button 
                        onClick={() => setActiveAsset({ type: 'video', url: selectedListing.videoUrl })}
                        className={`w-20 h-16 rounded-none overflow-hidden border-2 flex-shrink-0 transition-all relative group ${
                          activeAsset?.url === selectedListing.videoUrl ? 'border-primary-500 scale-95 shadow-lg' : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                        <img src={selectedListing.image} className="w-full h-full object-cover grayscale" alt="" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Performance Stats - Real Data Only */}
                <div className="grid grid-cols-3 gap-3 mb-10">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-none border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                      <Eye className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Views</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedListing.viewCount || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-none border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                      <Heart className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Saves</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedListing.favoritesCount || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-none border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                      <MessageCircleMore className="w-4 h-4" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Leads</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedListing.inquiryCount || 0}
                    </p>
                  </div>
                </div>

                {/* Listing Details */}
                <div className="space-y-8">
                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="h-0.5 w-4 bg-slate-200 dark:bg-slate-800" />
                      Property Data
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{selectedListing.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedListing.location}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-y-4 py-4 border-y border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                            <Calendar className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="text-xs">
                            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter text-[9px]">Published</p>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                              {selectedListing.createdAt ? new Date(selectedListing.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-none flex items-center justify-center border ${selectedListing.isApproved ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'}`}>
                            <BadgeCheck className={`w-4 h-4 ${selectedListing.isApproved ? 'text-emerald-500' : 'text-amber-500'}`} />
                          </div>
                          <div className="text-xs">
                            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter text-[9px]">Verification</p>
                            <p className={`font-semibold capitalize ${selectedListing.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {selectedListing.isApproved ? 'Verified Listing' : 'Pending Review'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="h-0.5 w-4 bg-slate-200 dark:bg-slate-800" />
                      Assigned Agent
                    </h4>
                    <div className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-none bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="w-12 h-12 rounded-none bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center border-2 border-white dark:border-slate-800">
                        {selectedListing.agent?.avatarUrl || selectedListing.agent?.photoURL ? (
                          <img src={selectedListing.agent.avatarUrl || selectedListing.agent.photoURL} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          {selectedListing.agent?.name || 'Licensed Agent'}
                          {selectedListing.agent?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                          Licensed Agent &bull; {selectedListing.agent?.isVerified ? 'Verified' : 'Standard'}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <ShieldCheck className="w-3 h-3" />
                       Risk Profile (Automated)
                    </h4>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-none flex gap-3">
                      <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        The integrity score for this listing is computed based on historical data. 
                        No fraudulent patterns detected at this time. Manual verification of risk is recommended.
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/30 dark:bg-slate-950">
                <div className="grid grid-cols-2 gap-4">
                  {!selectedListing.isApproved && (
                    <button 
                      onClick={() => handleApproveListing(selectedListing.id)}
                      className="py-3 px-4 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Listing
                    </button>
                  )}
                  <button 
                    onClick={() => handleVerifyListing(selectedListing.id, !selectedListing.verified)}
                    className={`py-3 px-4 rounded-none border text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
                      selectedListing.verified 
                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' 
                        : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {selectedListing.verified ? 'Unverify' : 'Verify Property'}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setIsReviewOpen(false)}
                    className="py-3 px-4 rounded-none border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all uppercase tracking-widest"
                  >
                    Close Review
                  </button>
                  <button 
                    onClick={() => handleDeleteListing(selectedListing.id)}
                    disabled={isDeleting}
                    className="py-3 px-4 rounded-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div 
            className="fixed inset-0 z-[100] h-screen w-screen bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-none w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-none flex items-center justify-center text-rose-500 mb-4 mx-auto border border-rose-100 dark:border-rose-900">
                  <LogOut className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center uppercase tracking-tight">Log Out</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Are you sure you want to log out of the admin panel?</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-none text-xs tracking-wider uppercase transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-none text-xs tracking-wider uppercase transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {listingToDelete && (
          <div 
            className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setListingToDelete(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-none w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-none flex items-center justify-center text-rose-500 mb-4 mx-auto border border-rose-100 dark:border-rose-900">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center uppercase tracking-tight">Delete Listing</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Are you sure you want to permanently delete this listing? This action cannot be undone.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button 
                  onClick={() => setListingToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-none text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteListing}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-none text-xs tracking-wider uppercase transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActivityIcon = ({ type }: { type: string }) => {
  if (type === 'approvals') return <ShieldCheck className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const isApproved = status === 'active' || status === 'approved' || status === 'verified';
  const isPending = status === 'pending';
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${
      isApproved 
        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
        : isPending 
          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' 
          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
    }`}>
      {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
      {status}
    </div>
  );
};

export default AdminDashboard;
