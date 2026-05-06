import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  Filter, 
  ChevronDown, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Eye, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Listing } from '../../types';
import DropdownPortal from '../../components/admin/DropdownPortal';

interface ListingManagementProps {
  listings: Listing[];
  loading: boolean;
  onReview: (listing: Listing) => void;
  onDelete: (listingId: string) => void;
  onApprove: (listingId: string) => void;
  onVerify: (listingId: string, verify: boolean) => void;
  onExport?: () => void;
}

const ListingManagement: React.FC<ListingManagementProps> = ({ 
  listings, 
  loading, 
  onReview, 
  onDelete,
  onApprove,
  onVerify,
  onExport
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | number | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 5;

  // Filter states
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [typeFilter, setTypeFilter] = useState('Property Type');
  const [priceFilter, setPriceFilter] = useState('Price Range');

  const propertyTypes = [
    "Self-Contain", 
    "1 Bedroom Flat", 
    "2 Bedroom Flat", 
    "3 Bedroom Flat", 
    "Duplex",
    "Penthouse",
    "Shared Apartment",
    "Office Space",
    "Shop"
  ];

  const stats = useMemo(() => {
    const total = listings.length;
    const active = listings.filter(l => (l.status || 'active') === 'active').length;
    const pending = listings.filter(l => l.status === 'pending' || l.isApproved === false).length;
    const hidden = listings.filter(l => l.status === 'hidden').length;

    return [
      { label: 'TOTAL LISTINGS', value: total, sub: 'Inventory', icon: FileText, color: 'text-primary-600 dark:text-primary-400', variant: 'neutral' },
      { label: 'ACTIVE', value: active, sub: 'Live', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', variant: 'success' },
      { label: 'PENDING APPROVAL', value: pending, sub: 'Review needed', icon: Clock, color: 'text-amber-600 dark:text-amber-400', variant: 'warning' },
      { label: 'HIDDEN', value: hidden, sub: 'Archived', icon: EyeOff, color: 'text-slate-400 dark:text-slate-500', variant: 'neutral' },
    ];
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      // Search Filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        l.title?.toLowerCase().includes(searchLower) || 
        l.location?.toLowerCase().includes(searchLower) ||
        l.id?.toString().includes(searchLower);
      
      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter !== 'All Statuses') {
        const s = (l.status || (l.isApproved === false ? 'pending' : 'active')).toLowerCase();
        if (s !== statusFilter.toLowerCase()) return false;
      }
      
      // Property Type Filter
      if (typeFilter !== 'Property Type' && l.type !== typeFilter) return false;
      
      // Price Filter
      if (priceFilter !== 'Price Range') {
        const price = l.priceValue || 0;
        if (priceFilter === 'Under ₦1M' && price >= 1000000) return false;
        if (priceFilter === '₦1M - ₦2M' && (price < 1000000 || price > 2000000)) return false;
        if (priceFilter === '₦2M - ₦5M' && (price < 2000000 || price > 5000000)) return false;
        if (priceFilter === '₦5M - ₦10M' && (price < 5000000 || price > 10000000)) return false;
        if (priceFilter === 'Above ₦10M' && price < 10000000) return false;
      }
      
      return true;
    });
  }, [listings, statusFilter, typeFilter, priceFilter]);

  React.useEffect(() => {
    const container = document.getElementById('admin-main-content');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredListings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredListings, currentPage]);

  // Reset to first page when filtering
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, priceFilter]);

  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);

  const getStatusStyle = (status: string | undefined, isApproved: boolean | undefined) => {
    const s = status || (isApproved === false ? 'pending' : 'active');
    switch (s.toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'pending':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
      case 'hidden':
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-600 dark:border-t-primary-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Fetching listings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Admin</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 dark:text-white">Listing Management</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Listing Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review, update, and moderate property inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-none text-sm font-semibold transition-all flex items-center gap-2 ${
              showFilters 
                ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/20 dark:border-primary-800' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className={`w-4 h-4 ${showFilters ? 'text-primary-500' : 'text-slate-400'}`} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button 
            onClick={onExport}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 p-3 sm:p-5 lg:p-6 rounded-none border border-slate-200 dark:border-slate-800 relative group overflow-hidden"
          >
            <div className="flex justify-between items-start mb-2 sm:mb-4">
              <div className={`p-1.5 sm:p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${stat.color} transition-transform group-hover:scale-110`}>
                <stat.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-none">{stat.value.toLocaleString()}</h3>
            </div>
            {stat.sub && (
              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex">
                <div className={`flex items-center gap-1 px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${
                  stat.variant === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-800/50 dark:text-emerald-400' :
                  stat.variant === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-600 dark:bg-amber-900/10 dark:border-amber-800/50 dark:text-amber-400' :
                  stat.variant === 'danger' ? 'bg-rose-50/50 border-rose-100 text-rose-600 dark:bg-rose-900/10 dark:border-rose-800/50 dark:text-rose-400' :
                  'bg-slate-50/50 border-slate-100 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-slate-400'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    stat.variant === 'success' ? 'bg-emerald-500' :
                    stat.variant === 'warning' ? 'bg-amber-500 animate-pulse' :
                    stat.variant === 'danger' ? 'bg-rose-500' :
                    'bg-slate-400'
                  }`} />
                  {stat.sub}
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 h-1 bg-primary-500 w-0 group-hover:w-full transition-all duration-500 opacity-20" />
          </motion.div>
        ))}
      </div>

      {/* Search & Filter Bar - RESTYLED TO MATCH USERS PAGE */}
      <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 p-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 w-full lg:w-fit overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setStatusFilter('All Statuses')}
            className={`flex-1 lg:flex-none px-6 py-2 lg:py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'All Statuses' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            All Listings
          </button>
          <button 
            onClick={() => setStatusFilter('Active')}
            className={`flex-1 lg:flex-none px-6 py-2 lg:py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'Active' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Active
          </button>
          <button 
            onClick={() => setStatusFilter('Pending')}
            className={`flex-1 lg:flex-none px-6 py-2 lg:py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'Pending' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Pending
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search listings, locations, or IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none px-10 py-3 lg:py-2 text-xs font-medium focus:ring-1 focus:ring-slate-900 dark:focus:ring-white outline-none rounded-none"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-3 lg:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all ${showFilters ? 'ring-1 ring-primary-500' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar (Expandable) */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Property Type</p>
                  <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full md:w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary-500 appearance-none cursor-pointer"
                  >
                    <option>Property Type</option>
                    {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Price Range</p>
                  <select 
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full md:w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-primary-500 appearance-none cursor-pointer"
                  >
                    <option>Price Range</option>
                    <option>Under ₦1M</option>
                    <option>₦1M - ₦2M</option>
                    <option>₦2M - ₦5M</option>
                    <option>₦5M - ₦10M</option>
                    <option>Above ₦10M</option>
                  </select>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setStatusFilter('All Statuses');
                  setTypeFilter('Property Type');
                  setPriceFilter('Price Range');
                  setSearchQuery('');
                }}
                className="mt-4 md:mt-4 text-xs font-bold text-rose-500 hover:underline px-4"
              >
                Reset All Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800">
        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedListings.map((listing) => (
            <div key={`listing-management-mobile-${listing.id}`} className="p-4 space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-none bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 relative flex-shrink-0">
                  <img 
                    src={listing.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80"} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-none text-[8px] font-bold uppercase tracking-wider ${getStatusStyle(listing.status, listing.isApproved)}`}>
                      {listing.status || (listing.isApproved === false ? 'PENDING' : 'ACTIVE')}
                    </span>
                  </div>
                </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{listing.title}</h3>
                      {listing.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 rounded-none bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                        <img 
                          src={listing.agent?.avatarUrl || (listing.agent as any)?.photoURL || `https://ui-avatars.com/api/?name=${listing.agent?.name}&background=random`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                        {listing.agent?.name || 'Internal'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <Search className="w-2.5 h-2.5" /> {listing.location}
                    </p>
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-2">
                      ₦{(listing.priceValue || 0).toLocaleString()}/yr
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => onReview(listing)}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-none border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> View Detail
                </button>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const spaceBelow = window.innerHeight - rect.bottom;
                      setOpenUpwards(spaceBelow < 250);
                      setAnchorRect(rect);
                      setActiveDropdown(activeDropdown === listing.id ? null : listing.id);
                    }}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-none border border-slate-200 dark:border-slate-700 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <DropdownPortal 
                    isOpen={activeDropdown === listing.id} 
                    onClose={() => setActiveDropdown(null)}
                    anchorRect={anchorRect}
                    openUpwards={openUpwards}
                  >
                    <div className="py-1">
                      {!listing.isApproved && (
                        <button 
                          onClick={() => { onApprove(listing.id.toString()); setActiveDropdown(null); }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve Listing
                        </button>
                      )}
                      <button 
                        onClick={() => { onVerify(listing.id.toString(), !listing.verified); setActiveDropdown(null); }}
                        className={`w-full px-4 py-2 text-left text-xs font-medium flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-700 ${listing.verified ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {listing.verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button 
                        onClick={() => { window.open(`/listings/${listing.id}`, '_blank'); setActiveDropdown(null); }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Public View
                      </button>
                      <button 
                        onClick={() => { onDelete(listing.id.toString()); setActiveDropdown(null); }}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </DropdownPortal>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Property</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agent (Address)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Price (Annual)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedListings.map((listing) => (
                <tr key={`listing-management-desktop-${listing.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 rounded-none bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 relative">
                        <img 
                          src={listing.image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=150&q=80"} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{listing.title}</span>
                          {listing.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" title="Verified Property" />}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{listing.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-none bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                        <img 
                          src={listing.agent?.avatarUrl || (listing.agent as any)?.photoURL || `https://ui-avatars.com/api/?name=${listing.agent?.name}&background=random`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{listing.agent?.name || 'Internal'}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{listing.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">₦{(listing.priceValue || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(listing.status, listing.isApproved)}`}>
                      {listing.status || (listing.isApproved === false ? 'PENDING' : 'ACTIVE')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
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
                          onClick={() => { onReview(listing); setActiveDropdown(null); }}
                          className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        {!listing.isApproved && (
                          <button 
                            onClick={() => { onApprove(listing.id.toString()); setActiveDropdown(null); }}
                            className="w-full px-4 py-2 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve Listing
                          </button>
                        )}
                        <button 
                          onClick={() => { onVerify(listing.id.toString(), !listing.verified); setActiveDropdown(null); }}
                          className={`w-full px-4 py-2 text-left text-xs font-medium flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-700 ${listing.verified ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {listing.verified ? 'Unverify Property' : 'Verify Property'}
                        </button>
                        <button 
                          onClick={() => { window.open(`/listings/${listing.id}`, '_blank'); setActiveDropdown(null); }}
                          className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Public Page
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                        <button 
                          onClick={() => { onDelete(listing.id.toString()); setActiveDropdown(null); }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Listing
                        </button>
                      </div>
                    </DropdownPortal>
                  </td>
                </tr>
              ))}
              {paginatedListings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                    No listings match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
            Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> – <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredListings.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{filteredListings.length}</span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 rounded-none border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-none text-xs sm:text-sm font-bold transition-all flex-shrink-0 ${
                      currentPage === pageNum 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-none border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingManagement;
