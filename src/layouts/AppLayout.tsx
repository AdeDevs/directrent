import React, { useState, useEffect } from "react";
import { Home as HomeIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import BottomNav from "../components/BottomNav";
import HomePage from "../pages/Home";
import ChatPage from "../pages/Chat";
import ProfilePage from "../pages/Profile";
import FavoritesPage from "../pages/Favorites";
import ListingDetails from "../pages/ListingDetails";
import AgentProfile from "../pages/AgentProfile";
import CreateListing from "../pages/CreateListing";
import MyListings from "../pages/MyListings";
import NotificationsPage from "../pages/Notifications";
import FAQPage from "../pages/FAQ";
import TermsOfUsePage from "../pages/TermsOfUse";
import { useAuth } from "../context/AuthContext";
import { AppTab } from "../types";

const AppLayout = () => {
  const {
    user,
    currentListing,
    setCurrentListing,
    selectedAgentId,
    setSelectedAgentId,
    activeTab,
    setActiveTab,
  } = useAuth();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  }, [activeTab, currentListing, selectedAgentId]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <main
        className={
          !currentListing && !selectedAgentId && activeTab !== "favorites"
            ? "w-full max-w-full px-0 pb-28 md:pb-40"
            : "flex-1"
        }
        style={{ paddingBottom: "115px" }}
      >
        <AnimatePresence mode="wait">
          {selectedAgentId ? (
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
          ) : (currentListing && activeTab !== "create") ? (
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
          ) : (
            <motion.div
              key={`dashboard-${activeTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "home" && <HomePage key="home" />}
              {activeTab === "chat" && <ChatPage key="chat" />}
              {activeTab === "profile" && <ProfilePage key="profile" />}
              {activeTab === "favorites" && <FavoritesPage key="favorites" />}
              {activeTab === "create" && <CreateListing key="create" />}
              {activeTab === "mylistings" && <MyListings key="mylistings" />}
              {activeTab === "notifications" && <NotificationsPage key="notifications" />}
              {activeTab === "terms" && <TermsOfUsePage key="terms" />}
              {activeTab === "faq" && <FAQPage key="faq" />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="relative z-50">
        <BottomNav
          activeTab={activeTab}
          user={user}
          setActiveTab={(tab) => {
            setCurrentListing(null);
            setSelectedAgentId(null);
            setActiveTab(tab);
          }}
        />
      </div>
    </div>
  );
};

export default AppLayout;
