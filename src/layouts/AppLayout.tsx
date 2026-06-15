import React, { useState, useEffect, lazy, Suspense } from "react";
import { Home as HomeIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from "../components/BottomNav";
import MobileDrawer from "../components/MobileDrawer";
import DesktopSidebar from "../components/DesktopSidebar";

const HomePage = lazy(() => import("../pages/Home"));
const ChatPage = lazy(() => import("../pages/Chat"));
const ProfilePage = lazy(() => import("../pages/Profile"));
const FavoritesPage = lazy(() => import("../pages/Favorites"));
const ListingDetails = lazy(() => import("../pages/ListingDetails"));
const AgentProfile = lazy(() => import("../pages/AgentProfile"));
const CreateListing = lazy(() => import("../pages/CreateListing"));
const MyListings = lazy(() => import("../pages/MyListings"));
const NotificationsPage = lazy(() => import("../pages/Notifications"));
const FAQPage = lazy(() => import("../pages/FAQ"));
const WalletPage = lazy(() => import("../pages/Wallet"));
const TermsOfUsePage = lazy(() => import("../pages/TermsOfUse"));

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { AppTab } from "../types";

const PageLoader = () => (
  <div className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-800 rounded-full animate-spin border-t-primary-600" />
    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Loading section...</span>
  </div>
);

const AppLayout = () => {
  const {
    user,
    currentListing,
    setCurrentListing,
    selectedAgentId,
    setSelectedAgentId,
    activeTab,
    setActiveTab,
    publishingProgress,
    publishingStatus,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = useAuth();

  const isCollapsed = isSidebarCollapsed;
  const { theme } = useTheme();
  const [logoFailed, setLogoFailed] = useState(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    const path = window.location.pathname;
    const isListingPath = path.startsWith('/property/') || path.startsWith('/listings/');
    if (isListingPath && !currentListing && !selectedAgentId) {
      const parts = path.split('/');
      const listingId = parts[2] || parts[1];
      if (listingId) {
        getDoc(doc(db, "listings", listingId)).then((docSnap) => {
          if (docSnap.exists()) {
            const listing = { id: docSnap.id, ...docSnap.data() } as any;
            if (user?.role === 'agent' && listing.agentId !== user.id) {
                toast.error("You do not have access to view this listing as it belongs to another agent.");
                window.history.replaceState(null, "", "/home");
                setActiveTab('home');
            } else {
                setCurrentListing(listing);
            }
          }
        }).catch(err => {
          console.error("Failed to fetch shared listing:", err);
        });
      }
    }
  }, [user, currentListing, setCurrentListing, setActiveTab]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  }, [activeTab, currentListing, selectedAgentId]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      
      {/* 1. Global Unified Master Header for Desktop */}
      <header className="hidden lg:flex sticky top-0 z-[110] bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 w-full shrink-0 transition-all duration-300 select-none">
        <div className="flex w-full items-stretch min-h-16">
          
          {/* Brand/Logo Area (exactly matches active Sidebar width) */}
          <div className={`shrink-0 border-r border-slate-200 dark:border-slate-800/80 ${isCollapsed ? 'w-20' : 'w-72'} flex items-center justify-between px-5 transition-all duration-300 bg-white/50 dark:bg-slate-950/50`}>
            {!isCollapsed ? (
              <>
                <div 
                  onClick={() => {
                    setCurrentListing(null);
                    setSelectedAgentId(null);
                    setActiveTab('home');
                  }}
                  className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
                >
                  {!logoFailed ? (
                    <img 
                      src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} 
                      onError={() => setLogoFailed(true)}
                      className="h-11 w-auto object-contain max-w-[150px]"
                      alt="DirectRent"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <HomeIcon className="text-white w-4 h-4" />
                      </div>
                      <span className="text-lg font-display font-black tracking-tight leading-none text-slate-900 dark:text-white">
                        Direct<span className="text-primary-600 dark:text-primary-400">Rent</span>
                      </span>
                    </>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={handleToggleCollapse} 
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                type="button"
                onClick={handleToggleCollapse}
                className="w-10 h-10 bg-primary-600/10 hover:bg-primary-600 hover:text-white rounded-xl flex items-center justify-center text-primary-600 transition-all shadow-sm mx-auto"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Master Portal Element to receive page headers */}
          <div id="desktop-header-portal" className="flex-1 flex items-stretch min-h-[4rem]" />

        </div>
      </header>

      {/* 2. Main content flow area below unified navigation */}
      <div className="flex flex-col lg:flex-row flex-1 relative w-full">
        {/* Persistent left sidebar on desktop view ports */}
        <DesktopSidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />

        <main className={`w-full max-w-full px-0 ${user?.role === 'agent' ? 'pb-5' : 'pb-24'} lg:pb-12 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-72'} flex-1 relative transition-all duration-300 min-w-0`}>
          {publishingProgress !== null && (
            <div className="sticky top-0 lg:top-0 z-[120] w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-primary-500/10 p-4 transition-all duration-300 shadow-sm">
              <div className="max-w-4xl mx-auto space-y-2 px-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-600"></span>
                    </span>
                    <span className="text-slate-900 dark:text-white font-semibold">{publishingStatus}</span>
                  </span>
                  <span className="font-extrabold text-primary-600 dark:text-primary-400 font-mono text-xs">{publishingProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out shadow-lg shadow-primary-500/20"
                    style={{ width: `${publishingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
            {(currentListing && activeTab !== "create") ? (
              <motion.div
                key={`listing-${currentListing.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ListingDetails
                  listing={currentListing}
                  onBack={() => setCurrentListing(null)}
                />
              </motion.div>
            ) : selectedAgentId ? (
              <motion.div
                key={`agent-${selectedAgentId}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AgentProfile
                  agentId={selectedAgentId}
                  onBack={() => setSelectedAgentId(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={`dashboard-${user.role}-${activeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "home" && <HomePage key={`home-${user.role}`} />}
                {activeTab === "chat" && <ChatPage key={`chat-${user.role}`} />}
                {activeTab === "profile" && <ProfilePage key={`profile-${user.role}`} />}
                {activeTab === "favorites" && <FavoritesPage key={`favorites-${user.role}`} />}
                {activeTab === "create" && <CreateListing key={`create-${user.role}`} />}
                {activeTab === "mylistings" && <MyListings key={`mylistings-${user.role}`} />}
                {activeTab === "notifications" && <NotificationsPage key={`notifications-${user.role}`} />}
                {activeTab === "terms" && <TermsOfUsePage key={`terms-${user.role}`} />}
                {activeTab === "faq" && <FAQPage key={`faq-${user.role}`} />}
                {activeTab === "wallet" && <WalletPage key={`wallet-${user.role}`} />}
              </motion.div>
            )}
            </AnimatePresence>
          </Suspense>
      </main>
      </div>

      {/* Mobile Navigation */}
      <div className="relative z-[100] lg:hidden">
        {user?.role === 'agent' && (
          <MobileDrawer
            activeTab={activeTab}
            user={user}
            setActiveTab={(tab: any) => {
              setCurrentListing(null);
              setSelectedAgentId(null);
              setActiveTab(tab);
            }}
          />
        )}
        {user?.role !== 'agent' && (
          <BottomNav 
            activeTab={activeTab} 
            user={user} 
            setActiveTab={(tab: any) => {
              setCurrentListing(null);
              setSelectedAgentId(null);
              setActiveTab(tab);
            }} 
          />
        )}
      </div>
    </div>
  );
};

export default AppLayout;
