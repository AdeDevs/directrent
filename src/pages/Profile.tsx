import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  MapPin, 
  LogOut, 
  Bell, 
  Shield, 
  HelpCircle,
  User as UserIcon,
  CheckCircle2,
  Lock,
  ChevronRight,
  Loader2,
  Heart,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FEATURED_LISTINGS } from '../data';
import { Listing } from '../types';

// Compact card for Interests section to reduce weight and fit viewport better
const Profile = () => {
  const { user, logout, updateProfile, favorites, setActiveTab } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    gender: user?.gender || '',
    age: user?.age || ''
  });

  const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);

  if (!user) return null;

  const capitalize = (str: string) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({ ...prev, name: capitalize(e.target.value) }));
  };

  const handleSave = () => {
    setIsLoading(true);
    
    // Simulate API update
    setTimeout(() => {
      updateProfile(profileData);
      setIsLoading(false);
      setIsEditing(false);
      setShowSuccess(true);
      setIsIdentityExpanded(false); // Collapse after saving
      
      // Auto hide success message
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  interface ProfileMenuItem {
    icon: React.ReactNode;
    label: string;
    color: string;
    action?: () => void;
    badge?: number;
    description?: string;
  }

  const menuItems: ProfileMenuItem[] = [
    { 
      icon: <Heart className="w-5 h-5 fill-current" />, 
      label: 'Saved Properties', 
      color: 'text-rose-500', 
      action: () => setActiveTab('favorites'), 
      badge: favorites.length > 0 ? favorites.length : undefined,
      description: 'Your bookmarked interests'
    },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', color: 'text-blue-500', description: 'Alerts and updates' },
    { icon: <Shield className="w-5 h-5" />, label: 'Privacy & Security', color: 'text-purple-500', description: 'Account safety' },
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Help Support', color: 'text-primary-500', description: 'Get assistance' },
  ];

  const isProfileComplete = !!(user.gender && user.age);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="w-full max-w-full px-3 md:px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profile</h1>
          <button className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400 hover:text-slate-600 transition-colors group">
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          </button>
        </div>
      </header>

      <main className="pt-[72px] px-3 md:px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full max-w-full space-y-4 pb-6 sm:pb-24"
        >
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 shadow-sm mx-1"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-emerald-900 tracking-tight">Profile updated successfully!</p>
            </motion.div>
          )}

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-md shadow-slate-200/30 text-center relative overflow-hidden group w-full">
          <div className="absolute top-0 right-0 p-5">
            <span className="text-[10px] font-bold capitalize text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm">
              {user.role}
            </span>
          </div>
          <div className="w-28 h-28 bg-slate-50 rounded-2xl mx-auto mb-6 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
            {user.id ? (
              <img 
                src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <UserIcon className="w-10 h-10 text-slate-300" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold capitalize opacity-80">
            <MapPin className="w-3.5 h-3.5 text-primary-500" />
            <span>{user.city}, Nigeria</span>
          </div>
        </div>

        {!isProfileComplete && !isEditing && (
          <div className="bg-primary-600 shadow-lg shadow-primary-500/20 p-4 sm:p-6 rounded-2xl flex items-center justify-between text-white w-full mx-auto">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="pr-1 sm:pr-4">
                <p className="text-sm sm:text-base font-bold tracking-tight">Complete your profile</p>
                <p className="text-[10px] sm:text-xs text-white/80 font-medium">Add gender and age to get started.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsEditing(true);
                setIsIdentityExpanded(true);
              }}
              className="bg-white text-primary-600 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold hover:bg-slate-50 transition-all shadow-xl shadow-black/5 active:scale-95 shrink-0"
            >
              Complete
            </button>
          </div>
        )}

        {/* Public Identity Section - Dropdown style when complete */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/30 overflow-hidden w-full">
          <button 
            onClick={() => setIsIdentityExpanded(!isIdentityExpanded)}
            disabled={isEditing}
            className={`w-full flex items-center justify-between p-4 sm:p-6 transition-colors ${!isEditing ? 'hover:bg-slate-50/50' : 'cursor-default'}`}
          >
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-1 h-5 sm:w-1.5 sm:h-6 bg-primary-500 rounded-full" />
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 capitalize tracking-normal">Public Identity</h3>
                {!isIdentityExpanded && isProfileComplete && !isEditing && (
                  <p className="text-[10px] text-slate-400 font-bold capitalize mt-0.5 tracking-wider">{user.gender} • {user.age} Years</p>
                )}
              </div>
            </div>
            {!isEditing && (
              <div className={`p-2 sm:p-2.5 rounded-xl bg-slate-50 text-slate-400 transition-transform ${isIdentityExpanded ? 'rotate-90' : ''}`}>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            )}
          </button>

          <AnimatePresence mode="wait">
            {(isIdentityExpanded || isEditing) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 sm:p-8 pt-0 sm:pt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 capitalize tracking-wide mb-2.5 block">Full Name</label>
                        <input 
                          disabled={!isEditing}
                          value={profileData.name}
                          onChange={handleNameChange}
                          placeholder="Your full legal name"
                          className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl outline-none focus:bg-white focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 disabled:opacity-60 text-sm font-bold text-slate-900 transition-all placeholder:text-slate-300"
                        />
                      </div>
 
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 capitalize tracking-wide mb-2.5 block">Gender</label>
                          {isEditing ? (
                            <select 
                              value={profileData.gender}
                              onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl outline-none focus:bg-white focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 text-sm font-bold text-slate-900 transition-all appearance-none"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <input disabled value={user.gender || 'Not set'} className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-900" />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 capitalize tracking-wide mb-2.5 block">Age</label>
                          <input 
                            disabled={!isEditing}
                            type="number"
                            value={profileData.age}
                            onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                            placeholder="e.g. 21"
                            className="w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-xl outline-none focus:bg-white focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 disabled:opacity-60 text-sm font-bold text-slate-900 transition-all"
                          />
                        </div>
                      </div>
                    </div>
 
                    <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-3 h-3 text-slate-300" />
                        <h4 className="text-[10px] font-bold text-slate-400 capitalize tracking-wide">Private Details</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                          <div>
                            <label className="text-[9px] font-bold text-slate-300 capitalize tracking-tight block">Email Address</label>
                            <p className="text-sm text-slate-900 font-bold tracking-tight">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                          <div>
                            <label className="text-[9px] font-bold text-slate-300 capitalize tracking-tight block">Verified ID (NIN)</label>
                            <p className="text-sm text-slate-900 font-bold tracking-tight">•••• •••• {user.nin.slice(-4)}</p>
                          </div>
                          <Shield className="w-4 h-4 text-emerald-500/30" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => {
                            setIsEditing(false);
                            if (isProfileComplete) setIsIdentityExpanded(false);
                          }}
                          className="flex-1 py-3.5 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 rounded-xl hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSave}
                          disabled={isLoading}
                          className="flex-[2] bg-primary-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 disabled:opacity-70 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          {isLoading ? 'Updating...' : 'Save Changes'}
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl text-sm font-black hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.99]"
                      >
                        Edit Public Identity
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
          {menuItems.map((item, id) => (
            <button 
              key={id} 
              onClick={item.action}
              className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-md shadow-slate-200/30 flex items-center justify-between hover:bg-slate-50/50 transition-all group overflow-hidden"
            >
              <div className="flex items-center gap-4 sm:gap-5">
                <div className={`p-3.5 sm:p-4 rounded-2xl bg-slate-50 ${item.color} group-hover:scale-110 transition-all duration-300 shadow-sm ring-1 ring-slate-100`}>
                  {item.icon}
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-900 text-sm sm:text-base block tracking-tight group-hover:text-primary-600 transition-colors">{item.label}</span>
                  {item.description && (
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold capitalize mt-0.5 block opacity-70 group-hover:opacity-100">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center pr-1 sm:pr-2">
                {item.badge !== undefined && (
                  <span className="bg-[#FF2E50] text-white text-[10px] sm:text-[11px] font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md shadow-md shadow-rose-500/20">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={logout}
          className="w-full py-5 text-rose-500 font-bold text-base bg-white border border-rose-100 rounded-2xl flex items-center justify-center gap-4 hover:bg-rose-50 transition-all hover:border-rose-200 group shadow-md shadow-rose-500/5 active:scale-[0.99] mt-2"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          <span>Sign Out of My Account</span>
        </button>
      </motion.div>
      </main>
    </div>
  );
};

export default Profile;
