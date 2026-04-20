import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    gender: user?.gender || '',
    age: user?.age || ''
  });

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
      
      // Auto hide success message
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const menuItems = [
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', color: 'text-blue-500' },
    { icon: <Shield className="w-5 h-5" />, label: 'Privacy & Security', color: 'text-purple-500' },
    { icon: <HelpCircle className="w-5 h-5" />, label: 'Help Support', color: 'text-primary-500' },
  ];

  const isProfileComplete = !!(user.gender && user.age);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-12"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <button className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400 hover:text-slate-600 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-100 p-3 rounded-xl flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-green-500 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-green-800">Profile updated successfully!</p>
        </motion.div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md">
            {user.role}
          </span>
        </div>
        <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
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
        <h2 className="text-xl font-semibold text-slate-900 mb-1">{user.name}</h2>
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
          <MapPin className="w-3 h-3" />
          <span>{user.city}, Nigeria</span>
        </div>
      </div>

      {!isProfileComplete && !isEditing && (
        <div className="bg-primary-50 border border-primary-100 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-900">Complete your profile</p>
              <p className="text-xs text-primary-700">Add gender and age to get better results.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-700 transition-all"
          >
            Complete
          </button>
        </div>
      )}

      {(isEditing || isProfileComplete) && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Profile Details</h3>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
              <input 
                disabled={!isEditing}
                value={profileData.name}
                onChange={handleNameChange}
                className="w-full bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl outline-none focus:border-primary-300 disabled:opacity-60 text-sm text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Gender</label>
                {isEditing ? (
                  <select 
                    value={profileData.gender}
                    onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl outline-none focus:border-primary-300 text-sm text-slate-900"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input disabled value={user.gender || 'Not set'} className="w-full bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl outline-none text-sm text-slate-900" />
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Age</label>
                <input 
                  disabled={!isEditing}
                  type="number"
                  value={profileData.age}
                  onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="e.g. 21"
                  className="w-full bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl outline-none focus:border-primary-300 disabled:opacity-60 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
                  <p className="text-sm text-slate-600 font-medium">{user.email}</p>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">NIN Number</label>
                  <p className="text-sm text-slate-600 font-medium">{user.nin}</p>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Country</label>
                  <p className="text-sm text-slate-600 font-medium">{user.country}</p>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {menuItems.map((item, id) => (
          <button key={id} className="w-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl bg-slate-50 ${item.color}`}>
                {item.icon}
              </div>
              <span className="font-semibold text-slate-700">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
        ))}
      </div>

      <button 
        onClick={logout}
        className="w-full py-4 text-red-500 font-bold text-sm bg-red-50 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors mt-4"
      >
        <LogOut className="w-5 h-5" /> Logout from Account
      </button>
    </motion.div>
  );
};

export default Profile;
