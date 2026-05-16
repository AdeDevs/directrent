import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { safeDeleteStorageFile } from '../../utils/storageCleanup';
import { 
  Edit3,
  User, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  Loader2, 
  AlertCircle,
  BadgeCheck,
  Building2,
  Calendar
} from 'lucide-react';

const AdminProfile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    middleName: (user as any)?.middleName || '',
    lastName: user?.lastName || '',
    internalPhone: user?.internalPhone || '',
    city: user?.city || 'Lagos',
    country: user?.country || 'Nigeria',
    about: user?.about || '',
    avatarUrl: user?.avatarUrl || ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        middleName: (user as any).middleName || '',
        lastName: user.lastName || '',
        internalPhone: user.internalPhone || '',
        city: user.city || 'Lagos',
        country: user.country || 'Nigeria',
        about: user.about || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setError('');
    setSuccess(false);
    
    try {
      let finalAvatarUrl = formData.avatarUrl;

      // Handle Storage Upload if new file selected
      if (selectedFile) {
        // Cleanup old image if it was a storage URL
        await safeDeleteStorageFile(user.avatarUrl);

        const fileName = `avatars/admin_${user.id}_${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, selectedFile);
        finalAvatarUrl = await getDownloadURL(snapshot.ref);
      } else if (!formData.avatarUrl && user.avatarUrl) {
        // Reset to default/Delete case
        await safeDeleteStorageFile(user.avatarUrl);
      }

      const userRef = doc(db, 'users', user.id);
      const updatedData = {
        ...formData,
        avatarUrl: finalAvatarUrl,
        name: `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim(),
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, updatedData);
      
      // Update local state
      await updateProfile(updatedData);
      setFormData(prev => ({ ...prev, ...updatedData }));
      
      setSuccess(true);
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full p-0 m-0">
      <div className="mb-5 px-0 pt-0 pb-0 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Administrative Profile</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your identity and communication channels within the governance portal.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            title="Edit Profile"
            className="w-full md:w-auto px-6 py-3.5 md:p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all rounded-none border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3 active:scale-95"
          >
            <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em] md:hidden">Edit Profile</span>
          </button>
        )}
      </div>

      <div className="space-y-0 px-0 pb-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm overflow-hidden flex flex-col">
          {/* Unified Profile Header */}
          <div className="px-[10px] pb-[15px] pt-[15px] border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-none bg-white dark:bg-slate-800 p-1 shadow-md border border-slate-200 dark:border-slate-700">
                  <img 
                    src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.firstName || user?.email}&background=0F172A&color=fff&size=256`} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-none"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-4 border-white dark:border-slate-900 w-8 h-8 rounded-full flex items-center justify-center shadow-lg" title="Active Session">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left space-y-3">
                <div>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-1">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {user?.firstName && user?.lastName ? `${user.firstName}${user.middleName ? ' ' + user.middleName : ''} ${user.lastName}` : (user?.name || 'Admin User')}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary-100 dark:border-primary-900/50">
                      <ShieldCheck className="w-3 h-3" />
                      {user?.adminTier || 'Moderator'}
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{user?.email}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Standard Operations</span>
                  </div>
                  <div className="hidden sm:block w-px h-3 bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">SSO Verified</span>
                  </div>
                  <div className="hidden sm:block w-px h-3 bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Historical'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-[15px] pb-[10px] pt-[10px]">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                General Information
              </span>
              {isEditing && (
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest"
                >
                  Cancel
                </button>
              )}
            </h3>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm mb-6 rounded-none flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {success && !isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm mb-6 rounded-none flex items-center gap-3"
              >
                <BadgeCheck className="w-5 h-5" />
                Profile updated successfully.
              </motion.div>
            )}

            <div className="flex-1">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">First Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-none outline-none focus:border-primary-500 text-slate-900 dark:text-white transition-all shadow-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Middle Name (Optional)</label>
                      <input 
                        type="text" 
                        value={formData.middleName}
                        onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-none outline-none focus:border-primary-500 text-slate-900 dark:text-white transition-all shadow-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Last Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-none outline-none focus:border-primary-500 text-slate-900 dark:text-white transition-all shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Profile Photo Override</label>
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-none flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img 
                          src={previewUrl || formData.avatarUrl || `https://ui-avatars.com/api/?name=${formData.firstName || 'A'}&background=0F172A&color=fff`} 
                          className="w-full h-full object-cover"
                          alt="Preview"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center rounded-none">
                          Upload New Document
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFile(file);
                                setPreviewUrl(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                        {(formData.avatarUrl || previewUrl) && (
                          <button 
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, avatarUrl: '' });
                              setPreviewUrl(null);
                              setSelectedFile(null);
                            }}
                            className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-left ml-4"
                          >
                            Reset to Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Official Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="tel" 
                          value={formData.internalPhone}
                          onChange={(e) => setFormData({...formData, internalPhone: e.target.value})}
                          placeholder="+234..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-3 rounded-none outline-none focus:border-primary-500 text-slate-900 dark:text-white transition-all shadow-sm font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Admin Email (Read-Only)</label>
                      <input 
                        type="email" 
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-none text-slate-400 cursor-not-allowed italic font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Operational City</label>
                      <input 
                        type="text" 
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-none outline-none focus:border-primary-500 text-slate-900 dark:text-white transition-all shadow-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Country</label>
                      <input 
                        type="text" 
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-none outline-none focus:border-primary-500 text-slate-900 dark:text-white transition-all shadow-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Professional Bio / Internal Notes</label>
                    <textarea 
                      rows={5}
                      value={formData.about}
                      onChange={(e) => setFormData({...formData, about: e.target.value})}
                      placeholder="System moderator specializing in..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-none outline-none focus:border-primary-500 text-slate-900 dark:text-white transition-all shadow-sm resize-none font-medium"
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-end">
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs uppercase tracking-[0.2em] px-8 py-4 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-primary-500/20 active:scale-[0.98] disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 rounded-none"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Updates
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Official Name</h4>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : (user?.name || 'Not set')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Phone Number</h4>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {user?.internalPhone || 'Unlisted'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Current Location</h4>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {user?.city}, {user?.country}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Moderator Tier</h4>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {user?.adminTier || 'Standard Moderator'}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-slate-200 dark:border-slate-700">
                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Admin Bio / About</h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic text-sm">
                      {user?.about || 'No internal biography has been recorded for this operative.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Footer Section */}
            <div className="mt-8 pt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center md:items-start gap-8">
              <div className="w-full bg-slate-50 dark:bg-slate-800/50 px-4 py-4 border border-slate-200 dark:border-slate-700/50 flex items-start gap-4">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-none shadow-sm flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">Identity Compliance Violation Notice</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                    Profile integrity is essential for system governance. Any unauthorized modification to official documents will trigger an immediate compliance audit.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-start gap-1 shrink-0 pb-8">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Last Profile Sync Event
                  </span>
                </div>
                <p className="text-xs font-mono font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-4 py-2 border border-slate-200 dark:border-slate-700">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'SYSTEM_INIT'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modular Security Statistics Footer */}
        <div className="px-[10px] py-[15px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-[0.4em] text-center text-slate-400 dark:text-slate-600 mb-10">Access & Audit Telemetry</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            <div className="flex items-center justify-between py-0 px-0 sm:py-3 border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-4">
                 <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400">
                   <Calendar className="w-4 h-4" />
                 </div>
                 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Archive Created</span>
               </div>
               <span className="text-xs text-slate-900 dark:text-white font-black font-mono">
                 {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { 
                   year: 'numeric', 
                   month: 'short', 
                   day: '2-digit' 
                 }) : '01 JAN 1970'}
               </span>
            </div>
            <div className="flex items-center justify-between py-0 px-0 sm:py-3 border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-4">
                 <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400">
                   <ShieldCheck className="w-4 h-4" />
                 </div>
                 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Status Indicator</span>
               </div>
               <div className="flex items-center gap-2 text-emerald-500">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                 <span className="text-xs font-black uppercase tracking-widest">Active</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
