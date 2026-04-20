import React, { useState } from 'react';
import { Home as HomeIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import BottomNav from '../components/BottomNav';
import HomePage from '../pages/Home';
import ChatPage from '../pages/Chat';
import ProfilePage from '../pages/Profile';
import ListingDetails from '../pages/ListingDetails';
import AgentProfile from '../pages/AgentProfile';
import { useAuth } from '../context/AuthContext';
import { AppTab } from '../types';

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const { user, currentListing, setCurrentListing, selectedAgentId, setSelectedAgentId } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col">
      {!currentListing && !selectedAgentId && (
        <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <HomeIcon className="text-white w-5 h-5" />
              </div>
              <span className="font-semibold text-slate-900 tracking-tight">Direct<span className="text-primary-600">Rent</span></span>
            </div>
          </div>
        </header>
      )}

      <main className={(!currentListing && !selectedAgentId) ? "max-w-[1600px] mx-auto px-4 md:px-8 py-6 pb-28 md:pb-40" : "flex-1"}>
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
              {activeTab === 'home' && <HomePage key="home" />}
              {activeTab === 'chat' && <ChatPage key="chat" />}
              {activeTab === 'profile' && <ProfilePage key="profile" />}
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
