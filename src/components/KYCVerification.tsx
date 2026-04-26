import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Camera, FileText, CheckCircle2, Loader2, AlertCircle, Upload, ChevronRight, Fingerprint } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const KYCVerification = () => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading_id' | 'uploading_selfie'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [idType, setIdType] = useState<'NIN Slip' | 'National ID Card' | 'Drivers License' | 'Passport' | ''>(user?.govtIdType || '');

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  if (!user || user.role !== 'agent') return null;

  const isVerified = user.verificationStatus === 'verified';
  const isPending = user.verificationStatus === 'pending';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'govtId' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPG, PNG).');
        return;
    }

    if (type === 'govtId' && !idType) {
      alert('Please select an ID type first.');
      return;
    }

    try {
      setIsLoading(true);
      setUploadStatus(type === 'govtId' ? 'uploading_id' : 'uploading_selfie');
      
      const fileName = `kyc/${type}/${user.id}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const updateData: any = {
        [`${type}Url`]: downloadURL,
      };

      if (type === 'govtId') {
        updateData.govtIdType = idType;
      }

      await updateProfile(updateData);
    } catch (error) {
      console.error("KYC Upload Error:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadStatus('idle');
    }
  };

  const idTypes = ['NIN Slip', 'National ID Card', 'Drivers License', 'Passport'];

  return (
    <div className="transition-all bg-white dark:bg-slate-900">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
      >
        <div className={`w-10 h-10 ${isVerified ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'} rounded-xl flex items-center justify-center group-active:scale-95 transition-transform`}>
          {isVerified ? <ShieldCheck className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Agent Verification</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">
            {isVerified ? 'You are a Verified Agent' : isPending ? 'Verification in review' : 'Get verified to build trust with tenants'}
          </p>
        </div>
        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border transition-colors ${
            isVerified ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200' :
            isPending ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200' :
            'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 border-orange-200'
        }`}>
            {isVerified ? 'Verified' : isPending ? 'Pending' : 'Required'}
        </div>
        <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-50 dark:border-slate-800 p-4 space-y-6 bg-slate-50/30 dark:bg-slate-800/20"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">Select ID Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {idTypes.map((type) => (
                    <button
                      key={type}
                      disabled={isVerified || isPending || isLoading}
                      onClick={() => setIdType(type as any)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all text-center ${
                        idType === type 
                          ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/20' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Govt ID */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">ID Front View</label>
                  <button 
                    disabled={isVerified || isPending || isLoading || !idType}
                    onClick={() => idInputRef.current?.click()}
                    className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden ${
                        !idType ? 'opacity-50 cursor-not-allowed bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800' :
                        user.govtIdUrl ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {uploadStatus === 'uploading_id' ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    ) : user.govtIdUrl ? (
                        <>
                            <img src={user.govtIdUrl} className="w-full h-full object-cover opacity-60" alt="ID Preview" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                              <FileText className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400">Upload ID</span>
                        </>
                    )}
                    <input type="file" ref={idInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'govtId')} />
                  </button>
                </div>

                {/* Selfie */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">Live Selfie</label>
                  <button 
                    disabled={isVerified || isPending || isLoading}
                    onClick={() => selfieInputRef.current?.click()}
                    className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden ${
                        user.selfieUrl ? 'border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {uploadStatus === 'uploading_selfie' ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    ) : user.selfieUrl ? (
                        <>
                            <img src={user.selfieUrl} className="w-full h-full object-cover opacity-60" alt="Selfie Preview" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors">
                              <Camera className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400">Take Selfie</span>
                        </>
                    )}
                    <input type="file" ref={selfieInputRef} className="hidden" accept="image/*" capture="user" onChange={(e) => handleFileUpload(e, 'selfie')} />
                  </button>
                </div>
              </div>

              {!isVerified && !isPending && (
                <>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-primary-500 mt-0.5" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                      Our verification team will manually review your documents. Ensure both photos are clear and well-lit.
                    </p>
                  </div>

                  <button
                    disabled={!user.govtIdUrl || !user.selfieUrl || isLoading || isPending || isVerified}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        await updateProfile({ verificationStatus: 'pending' });
                        alert("Verification submitted! Our team will review it within 24-48 hours.");
                      } catch (err) {
                        alert("Failed to submit. Please try again.");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      (!user.govtIdUrl || !user.selfieUrl || isLoading || isPending || isVerified)
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 active:scale-95'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </div>
                    ) : (
                      'Submit for Review'
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KYCVerification;
