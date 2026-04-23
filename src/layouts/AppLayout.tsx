import React, { useState } from "react";
import { Home as HomeIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import BottomNav from "../components/BottomNav";
import HomePage from "../pages/Home";
import ChatPage from "../pages/Chat";
import ProfilePage from "../pages/Profile";
import FavoritesPage from "../pages/Favorites";
import ListingDetails from "../pages/ListingDetails";
import AgentProfile from "../pages/AgentProfile";
import { useAuth } from "../context/AuthContext";
import { AppTab } from "../types";
import { style } from "motion/react-client";

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
            <AgentProfile
              key="agent-profile"
              agentId={selectedAgentId}
              onBack={() => setSelectedAgentId(null)}
            />
          ) : currentListing ? (
            <ListingDetails
              key="listing-details"
              listing={currentListing}
              onBack={() => setCurrentListing(null)}
            />
          ) : (
            <motion.div
              key="dashboard-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {activeTab === "home" && <HomePage key="home" />}
              {activeTab === "chat" && <ChatPage key="chat" />}
              {activeTab === "profile" && <ProfilePage key="profile" />}
              {activeTab === "favorites" && <FavoritesPage key="favorites" />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="relative z-50">
        <BottomNav
          activeTab={activeTab}
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
