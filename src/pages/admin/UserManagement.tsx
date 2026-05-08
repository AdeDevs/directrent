import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  Search, 
  MoreHorizontal, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  User as UserIcon,
  Trash2,
  Lock,
  RefreshCw,
  Eye,
  X,
  ShieldAlert,
  ArrowRight,
  Loader2,
  Gauge,
  Activity,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { User } from '../../types';
import DropdownPortal from '../../components/admin/DropdownPortal';
import { purgeUserData } from '../../utils/adminCleanup';

interface UserManagementProps {
  onReview?: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'tenant' | 'agent'>('all');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [openUpwards, setOpenUpwards] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      // Only fetch if we have an authenticated user in the Firebase SDK
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        // Fetch all users without orderBy to ensure we don't miss those without createdAt field
        const snapshot = await getDocs(usersRef);
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        
        // Sort in memory by joined date (recent first)
        const sortedData = [...userData].sort((a, b) => {
          const dateA = (a as any).createdAt?.toDate?.() || new Date(0);
          const dateB = (b as any).createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

        setUsers(sortedData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [auth.currentUser]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    // Only count non-admins/mods for general metrics
    const normalUsers = users.filter(u => u.role !== 'admin' && u.role !== 'moderator');
    const total = normalUsers.length;
    
    // ACTIONABLE: Specifically Agents awaiting verification
    const pendingReviews = normalUsers.filter(u => 
      u.role === 'agent' && u.verificationStatus === 'pending'
    ).length;

    // PLATFORM HEALTH: Percentage of users fully verified
    const verifiedProfiles = normalUsers.filter(u => 
      u.role === 'tenant' ? u.phoneVerified : u.verificationStatus === 'verified'
    ).length;
    
    const trustScore = total > 0 ? Math.round((verifiedProfiles / total) * 100) : 0;
    const suspendedUsers = normalUsers.filter(u => (u as any).isSuspended).length;

    return {
      total,
      pendingReviews,
      trustScore,
      suspendedUsers
    };
  }, [users]);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // REQUIREMENT: Hide admins from this list
      if (u.role === 'admin' || u.role === 'moderator') return false;

      const matchesTab = activeTab === 'all' || u.role === activeTab;
      
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                           u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // REQUIREMENT: Status filtering logic
      // Tenant: Verified if phoneVerified is true
      // Agent: Verified if verificationStatus is 'verified'
      const isVerified = u.role === 'tenant' ? u.phoneVerified : u.verificationStatus === 'verified';
      const isPending = u.role === 'agent' && u.verificationStatus === 'pending';

      const matchesStatus = statusFilter === 'All Statuses' || 
                           (statusFilter === 'Verified' && isVerified) ||
                           (statusFilter === 'Pending' && isPending);

      return matchesTab && matchesSearch && matchesStatus;
    });
  }, [users, activeTab, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, statusFilter]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleDeleteUser = async (user: User) => {
    setActiveDropdown(null);
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await purgeUserData(userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      
      console.log("Database purge complete.");

      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
      }
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error purging user record:", error);
      let errorMessage = "Failed to purge user data. Please try again.";
      
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error.includes('Missing or insufficient permissions')) {
          errorMessage = "Security violation: Insufficient permissions to purge this user record.";
        } else {
          errorMessage = `Transaction Error: ${parsed.error}`;
        }
      } catch (e) {
        if (error.message.includes('permission')) {
          errorMessage = "Governance Restriction: Insufficient administrative privileges to execute data purge.";
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const statsCards = [
    { label: 'TOTAL MEMBERS', value: metrics.total.toLocaleString(), sub: 'Active community', icon: Users, color: 'text-slate-900 dark:text-slate-100', bg: 'bg-slate-50', variant: 'neutral' },
    { label: 'PENDING REVIEW', value: metrics.pendingReviews, sub: 'Needs action', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50', variant: 'warning' },
    { label: 'TRUST SCORE', value: `${metrics.trustScore}%`, sub: 'Verified users', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50', variant: 'success' },
    { label: 'SAFETY MONITOR', value: metrics.suspendedUsers, sub: 'Suspended profiles', icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50', variant: 'danger' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Fetching User Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Admin</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 dark:text-white">User Management</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and audit {metrics.total.toLocaleString()} active members of the DirectRent ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat) => (
          <div key={`stats-card-${stat.label.toLowerCase()}`} className="bg-white dark:bg-slate-900 p-3 sm:p-5 lg:p-6 rounded-none border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <div className={`p-1.5 sm:p-2.5 ${stat.bg} dark:bg-slate-800 transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">{stat.value}</h3>
            </div>
            {stat.sub && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-50 dark:border-slate-800/50 flex">
                <div className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-none border text-[7px] sm:text-[9px] font-bold uppercase tracking-wider ${
                  stat.variant === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-800/50 dark:text-emerald-400' :
                  stat.variant === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-600 dark:bg-amber-900/10 dark:border-amber-800/50 dark:text-amber-400' :
                  stat.variant === 'danger' ? 'bg-rose-50/50 border-rose-100 text-rose-600 dark:bg-rose-900/10 dark:border-rose-800/50 dark:text-rose-400' :
                  'bg-slate-50/50 border-slate-100 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-slate-400'
                }`}>
                  <div className={`w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full ${
                    stat.variant === 'success' ? 'bg-emerald-500' :
                    stat.variant === 'warning' ? 'bg-amber-500 animate-pulse' :
                    stat.variant === 'danger' ? 'bg-rose-500' :
                    'bg-slate-400'
                  }`} />
                  <span className="truncate">{stat.sub}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filters & Search - Mobile First */}
      <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 p-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 w-full lg:w-fit overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 lg:flex-none px-6 py-2 lg:py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'all' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            All Users
          </button>
          <button 
            onClick={() => setActiveTab('tenant')}
            className={`flex-1 lg:flex-none px-6 py-2 lg:py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'tenant' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Tenants
          </button>
          <button 
            onClick={() => setActiveTab('agent')}
            className={`flex-1 lg:flex-none px-6 py-2 lg:py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'agent' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Agents
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search users, emails, or IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none px-10 py-3 lg:py-2 text-xs font-medium focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none rounded-none"
            />
          </div>
          <button className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-3 lg:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5" />
            Filter Status
          </button>
        </div>
      </div>

      {/* Users Container */}
      <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Mobile View (Cards) - Visible on small screens */}
        <div className="block lg:hidden space-y-4 bg-slate-50 dark:bg-slate-950">
          {paginatedUsers.map((user) => (
            <div key={`mobile-user-${user.id}`} className="p-5 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <img 
                      src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=f1f5f9&color=94a3b8`} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {`${user.firstName || ''} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName || ''}`.trim() || user.name || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setAnchorRect(rect);
                      setOpenUpwards(window.innerHeight - rect.bottom < 200);
                      setActiveDropdown(activeDropdown === user.id ? null : user.id);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none text-slate-400"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  <DropdownPortal
                    isOpen={activeDropdown === user.id}
                    onClose={() => setActiveDropdown(null)}
                    anchorRect={anchorRect}
                    openUpwards={openUpwards}
                    width={220}
                  >
                    <div className="py-1">
                      <button 
                        onClick={() => { window.open(`/profile/${user.id}`, '_blank'); setActiveDropdown(null); }}
                        className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Profile
                      </button>
                      <button 
                        onClick={() => { window.location.reload(); setActiveDropdown(null); }}
                        className="w-full px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Manual Refresh
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                      <button 
                        onClick={() => { setActiveDropdown(null); }}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-3"
                      >
                        <Lock className="w-4 h-4" />
                        { (user as any).isSuspended ? 'Unsuspend Account' : 'Suspend Account' }
                      </button>
                    </div>
                  </DropdownPortal>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Role</p>
                  <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none ${
                    user.role === 'agent' 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Joined Date</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {(user as any).createdAt 
                      ? ((user as any).createdAt instanceof Timestamp ? (user as any).createdAt.toDate().toLocaleDateString() : new Date((user as any).createdAt).toLocaleDateString())
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    (user as any).isSuspended ? 'bg-rose-500' :
                    (user.role === 'tenant' ? user.phoneVerified : user.verificationStatus === 'verified') 
                      ? 'bg-emerald-500' 
                      : 'bg-amber-500'
                  }`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    (user as any).isSuspended ? 'text-rose-600' :
                    (user.role === 'tenant' ? user.phoneVerified : user.verificationStatus === 'verified')
                      ? 'text-emerald-600' 
                      : 'text-amber-600'
                  }`}>
                    {(user as any).isSuspended 
                      ? 'SUSPENDED' 
                      : (user.role === 'tenant' 
                          ? (user.phoneVerified ? 'VERIFIED' : 'PENDING OTP') 
                          : (user.verificationStatus === 'verified' ? 'VERIFIED' : 'PENDING REVIEW'))}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedUser(user)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View - Hidden on small screens */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedUsers.map((user) => (
                <tr key={`desktop-user-${user.id}`} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                        <img 
                          src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=f1f5f9&color=94a3b8`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none ${
                      user.role === 'agent' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {/* 
                      BACKEND MISSING: 'createdAt' field is not guaranteed for all users.
                      Implementation: Ensure every user signup saves a 'createdAt: serverTimestamp()' field.
                    */}
                    {(user as any).createdAt 
                      ? ((user as any).createdAt instanceof Timestamp ? (user as any).createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date((user as any).createdAt).toLocaleDateString())
                      : 'N/A' 
                    }
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        (user as any).isSuspended ? 'bg-rose-500' :
                        (user.role === 'tenant' ? user.phoneVerified : user.verificationStatus === 'verified') 
                          ? 'bg-emerald-500' 
                          : 'bg-amber-500'
                      }`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        (user as any).isSuspended ? 'text-rose-600' :
                        (user.role === 'tenant' ? user.phoneVerified : user.verificationStatus === 'verified')
                          ? 'text-emerald-600' 
                          : 'text-amber-600'
                      }`}>
                        {(user as any).isSuspended 
                          ? 'SUSPENDED' 
                          : (user.role === 'tenant' 
                              ? (user.phoneVerified ? 'VERIFIED' : 'PENDING OTP') 
                              : (user.verificationStatus === 'verified' ? 'VERIFIED' : 'PENDING REVIEW'))}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setAnchorRect(rect);
                          setOpenUpwards(window.innerHeight - rect.bottom < 200);
                          setActiveDropdown(activeDropdown === user.id ? null : user.id);
                        }}
                        className="p-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none text-slate-400 hover:text-slate-900 transition-all"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      <DropdownPortal
                        isOpen={activeDropdown === user.id}
                        onClose={() => setActiveDropdown(null)}
                        anchorRect={anchorRect}
                        openUpwards={openUpwards}
                        width={220}
                      >
                        <div className="py-1">
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Full Profile
                          </button>
                          <button 
                            onClick={() => {
                              // Manual refresh is handled by the useEffect on mount or we could re-trigger it
                              window.location.reload(); 
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Manual Refresh
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                          <button 
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to ${ (user as any).isSuspended ? 'unsuspend' : 'suspend' } this user?`)) {
                                alert('Suspension state toggled (Admin only action)');
                              }
                              setActiveDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-3 transition-colors"
                          >
                            <Lock className="w-4 h-4" />
                            { (user as any).isSuspended ? 'Unsuspend Account' : 'Suspend Account' }
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Purge Records
                          </button>
                        </div>
                      </DropdownPortal>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Zero State */}
        {paginatedUsers.length === 0 && (
          <div className="px-6 py-20 text-center">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Users className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No users found matching your filters</p>
              <button 
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                  setStatusFilter('All Statuses');
                }}
                className="mt-4 text-xs font-bold text-primary-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Pagination - Simplified for mobile */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Showing {Math.min((currentPage-1) * itemsPerPage + 1, filteredUsers.length)}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-2 sm:p-1 border border-slate-200 dark:border-slate-700 rounded-none disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2 text-[10px] font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="sm:hidden">PREV</span>
            </button>
            <div className="hidden sm:flex items-center">
              {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={`page-btn-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 text-[10px] font-bold border-y border-r first:border-l border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all ${
                      currentPage === pageNum ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white ring-1 ring-slate-900 dark:ring-white z-10' : 'text-slate-500'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 3 && <span className="px-2 text-slate-400">...</span>}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-2 sm:p-1 border border-slate-200 dark:border-slate-700 rounded-none disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2 text-[10px] font-bold"
            >
              <span className="sm:hidden">NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Side Panel */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] h-screen w-screen"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-xl bg-white dark:bg-slate-950 z-[101] shadow-2xl flex flex-col"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10 px-6 py-5 md:px-8 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <UserIcon className="w-3 h-3" />
                  <span>Member File</span>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Profile Overview */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative group">
                    <div className="w-28 h-28 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
                      <img 
                        src={selectedUser.avatarUrl || `https://ui-avatars.com/api/?name=${selectedUser.firstName}+${selectedUser.lastName}&size=200&background=f8fafc&color=64748b`} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-2 border-white dark:border-slate-950 flex items-center justify-center rounded-none shadow-sm ${
                      selectedUser.role === 'agent' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {selectedUser.role === 'agent' ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-1 w-full">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                        {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Anonymous Member'}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                          {selectedUser.role} 
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="font-mono text-[10px]">@{selectedUser.id.substring(0, 8)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                        (selectedUser as any).isSuspended ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800' :
                        (selectedUser.role === 'tenant' ? selectedUser.phoneVerified : selectedUser.verificationStatus === 'verified')
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800' 
                          : 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          (selectedUser as any).isSuspended ? 'bg-rose-500' :
                          (selectedUser.role === 'tenant' ? selectedUser.phoneVerified : selectedUser.verificationStatus === 'verified')
                            ? 'bg-emerald-500' 
                            : 'bg-amber-500 animate-pulse'
                        }`} />
                        {(selectedUser as any).isSuspended 
                          ? 'Suspended' 
                          : (selectedUser.role === 'tenant' 
                              ? (selectedUser.phoneVerified ? 'Verified Tenant' : 'Awaiting Phone-Verified') 
                              : (selectedUser.verificationStatus === 'verified' ? 'Verified Agent' : 'Awaiting ID Review'))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Information Sections */}
                <div className="space-y-10">
                  {/* Contact & Identity Section */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                      <CreditCard className="w-3 h-3" />
                      Contact & Identity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                      <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-colors">
                          <Mail className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Email Address</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedUser.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-colors">
                          <Phone className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Primary Phone</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {selectedUser.phoneNumber || 'Not provided'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-colors">
                          <MapPin className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Current Station</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                            {selectedUser.city || 'Unknown'}, {selectedUser.country || 'NG'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 transition-colors">
                          <Calendar className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Enrollment Date</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {(selectedUser as any).createdAt 
                              ? ((selectedUser as any).createdAt instanceof Timestamp ? (selectedUser as any).createdAt.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date((selectedUser as any).createdAt).toLocaleDateString())
                              : 'System Record Missing'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role Specific Insights */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                       <Activity className="w-3 h-3" />
                       Behavioral Insights
                    </h4>
                    
                    {selectedUser.role === 'agent' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors hover:border-blue-200">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Inventory Status</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                              {selectedUser.verificationStatus === 'verified' ? 'Active' : 'Locked'}
                            </span>
                            <div className="w-8 h-8 rounded-none bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">
                            {selectedUser.verificationStatus === 'verified' ? 'Authorized to list' : 'Awaiting verification'}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors hover:border-emerald-200">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">KYC Progression</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-2xl font-bold ${
                              selectedUser.verificationStatus === 'verified' ? 'text-emerald-600' :
                              selectedUser.verificationStatus === 'pending' ? 'text-amber-600' :
                              (selectedUser.govtIdUrl || selectedUser.nin) ? 'text-blue-600' : 'text-slate-400'
                            }`}>
                              {selectedUser.verificationStatus === 'verified' ? 'Verified' : 
                               selectedUser.verificationStatus === 'pending' ? 'Reviewing' :
                               (selectedUser.govtIdUrl || selectedUser.nin) ? 'Submitted' : 'Pending'}
                            </span>
                            <div className="w-8 h-8 rounded-none bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                              <ShieldCheck className={`w-4 h-4 ${
                                selectedUser.verificationStatus === 'verified' ? 'text-emerald-500' :
                                selectedUser.verificationStatus === 'pending' ? 'text-amber-500 animate-pulse' :
                                'text-slate-300'
                              }`} />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">Doc: {selectedUser.govtIdType || 'Missing'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group transition-colors hover:border-primary-200">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Account Trust</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-2xl font-bold ${selectedUser.phoneVerified && selectedUser.nin ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                              {selectedUser.phoneVerified && selectedUser.nin ? 'High' : selectedUser.phoneVerified ? 'Medium' : 'Basic'}
                            </span>
                            <div className="w-8 h-8 rounded-none bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                              <ShieldCheck className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">
                            {selectedUser.phoneVerified ? 'Phone verified' : 'Phone pending'}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group transition-colors hover:border-primary-200">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Profile Integrity</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                              {Math.round(
                                ([
                                  !!selectedUser.avatarUrl,
                                  !!selectedUser.phoneNumber,
                                  !!selectedUser.phoneVerified,
                                  !!selectedUser.nin,
                                  !!selectedUser.city,
                                  !!selectedUser.firstName && !!selectedUser.lastName
                                ].filter(Boolean).length / 6) * 100
                              )}%
                            </span>
                            <div className="w-8 h-8 rounded-none bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                              <Activity className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium truncate">Required data fields completed</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Governance Controls</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="flex-1 px-4 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm">
                        Send Incident Notice
                      </button>
                      {(selectedUser as any).isSuspended ? (
                        <button className="flex-1 px-4 py-4 border border-emerald-200 text-emerald-600 bg-emerald-50 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors">
                          Reactivate Member
                        </button>
                      ) : (
                        <button className="flex-1 px-4 py-4 border border-rose-200 text-rose-600 bg-rose-50 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors">
                          Suspend Account
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => selectedUser && handleDeleteUser(selectedUser)}
                      className="w-full px-4 py-4 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Purge Account Record
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div 
            className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 h-screen w-screen"
            onClick={() => setUserToDelete(null)}
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center uppercase tracking-tight">Purge User Data</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                  Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">{userToDelete.name || userToDelete.email}</span>? 
                  This will purge all listings, notifications, chats, and metadata associated with this account. This action is irreversible.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button 
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-none text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-none text-xs tracking-wider uppercase transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Purge'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
