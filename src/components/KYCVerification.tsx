import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Camera, FileText, CheckCircle2, Loader2, AlertCircle, Upload, ChevronRight, Fingerprint, Clock } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const KYCVerification = () => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading_id' | 'uploading_selfie'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [idType, setIdType] = useState<'NIN Slip' | 'National ID Card' | 'Drivers License' | 'Passport' | ''>(user?.govtIdType || '');

  // Sync idType with user record (important for resets/dismissals)
  React.useEffect(() => {
    if (user?.govtIdType && user.verificationStatus !== 'none') {
      setIdType(user.govtIdType as any);
    } else if (user?.verificationStatus === 'none' && !user.govtIdUrl) {
      // If reset by admin, clear the local selection
      setIdType('');
    }
  }, [user?.govtIdType, user?.verificationStatus, user?.govtIdUrl]);

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  if (!user || user.role !== 'agent') return null;

  const isVerified = user.verificationStatus === 'verified';
  const isPending = user.verificationStatus === 'pending';
  const hasRejection = user.agent?.verificationReason && user.verificationStatus === 'none';

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
        // Clear rejection reason when user starts re-uploading
        'agent.verificationReason': null
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

  const steps = [
    { title: 'Identity', icon: <Fingerprint className="w-4 h-4" /> },
    { title: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { title: 'Selfie', icon: <Camera className="w-4 h-4" /> },
    { title: 'Review', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  const currentStep = !idType ? 0 : !user.govtIdUrl ? 1 : !user.selfieUrl ? 2 : 3;

  return (
    <div className="transition-all bg-white dark:bg-slate-900">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group ${
          hasRejection ? 'ring-2 ring-rose-500/20 bg-rose-50/10 dark:bg-rose-900/5' : ''
        }`}
      >
        <div className={`w-10 h-10 ${
          isVerified ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 
          hasRejection ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' :
          isPending ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
          'bg-orange-50 dark:bg-orange-900/20 text-orange-500'
        } rounded-xl flex items-center justify-center group-active:scale-95 transition-transform`}>
          {isVerified ? <ShieldCheck className="w-5 h-5" /> : hasRejection ? <AlertCircle className="w-5 h-5" /> : isPending ? <Clock className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Agent Verification
            {hasRejection && <span className="ml-2 text-[10px] text-rose-500 font-bold uppercase tracking-widest">Update Needed</span>}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight">
            {isVerified ? 'Verified Professional' : isPending ? 'Reviewing your credentials' : hasRejection ? 'Submission was declined' : 'Secure your account & build trust'}
          </p>
        </div>
        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border transition-colors ${
            isVerified ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200' :
            isPending ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200' :
            hasRejection ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-200' :
            'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 border-orange-200'
        }`}>
            {isVerified ? 'Verified' : isPending ? 'Pending' : hasRejection ? 'Declined' : 'Required'}
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
            className="border-t border-slate-50 dark:border-slate-800 p-4 pb-6 space-y-6 bg-slate-50/30 dark:bg-slate-800/20"
          >
            {/* Rejection UI (Already there) */}
            {hasRejection && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                   <AlertCircle className="w-12 h-12 text-rose-500" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 rounded-md">ADMIN FEEDBACK</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  "{user.agent?.verificationReason}"
                </p>
                <p className="mt-3 text-[10px] text-rose-500/60 font-bold uppercase tracking-wider">Please fix the issues above and resubmit.</p>
              </div>
            )}

            {/* Verification Stepper */}
            {!isVerified && !isPending && (
              <div className="flex items-center justify-between px-2 mb-2">
                {steps.map((step, idx) => (
                  <React.Fragment key={`kyc-step-${idx}-${step.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex flex-col items-center gap-1.5 flex-1 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        idx < currentStep ? 'bg-emerald-500 text-white' : 
                        idx === currentStep ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 
                        'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                      }`}>
                        {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${
                        idx <= currentStep ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-[1px] w-8 translate-y-[-10px] transition-colors duration-500 ${
                        idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="space-y-6">
              {!isVerified && !isPending && (
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em] pl-1">1. Select Identity document</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {idTypes.map((type) => (
                      <button
                        key={type}
                        disabled={isLoading}
                        onClick={() => setIdType(type as any)}
                        className={`px-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter border-2 transition-all text-center ${
                          idType === type 
                            ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20 scale-[1.02]' 
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isVerified ? (
                 <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
                       <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Verified Successfully</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                       Your identity has been verified. You now have full access to all agent features.
                    </p>
                 </div>
              ) : isPending ? (
                 <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/20">
                       <Clock className="w-8 h-8 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Review in Progress</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                       We're manually verifying your documents. This usually takes 24-48 hours.
                    </p>
                 </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em] pl-1">2. Upload clear photos</label>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Govt ID */}
                      <div className="space-y-2">
                        <button 
                          disabled={isLoading || !idType}
                          onClick={() => idInputRef.current?.click()}
                          className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group/upload ${
                              !idType ? 'opacity-40 cursor-not-allowed bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800' :
                              user.govtIdUrl ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-300 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50/5'
                          }`}
                        >
                          {uploadStatus === 'uploading_id' ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                                <span className="text-[8px] font-black text-primary-500 uppercase">Uploading...</span>
                              </div>
                          ) : user.govtIdUrl ? (
                              <>
                                  <img src={user.govtIdUrl} className="w-full h-full object-cover" alt="ID Preview" />
                                  <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                      <Upload className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                  </div>
                              </>
                          ) : (
                              <>
                                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover/upload:scale-110 transition-transform">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400">ID Document</p>
                                    <p className="text-[8px] text-slate-400 font-medium tracking-tight">Front View</p>
                                  </div>
                              </>
                          )}
                          <input type="file" ref={idInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'govtId')} />
                        </button>
                      </div>

                      {/* Selfie */}
                      <div className="space-y-2">
                        <button 
                          disabled={isLoading}
                          onClick={() => selfieInputRef.current?.click()}
                          className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group/upload ${
                              user.selfieUrl ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-300 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50/5'
                          }`}
                        >
                          {uploadStatus === 'uploading_selfie' ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                                <span className="text-[8px] font-black text-primary-500 uppercase">Uploading...</span>
                              </div>
                          ) : user.selfieUrl ? (
                              <>
                                  <img src={user.selfieUrl} className="w-full h-full object-cover" alt="Selfie Preview" />
                                  <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                      <Camera className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                  </div>
                              </>
                          ) : (
                              <>
                                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover/upload:scale-110 transition-transform">
                                    <Camera className="w-5 h-5" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-400">Live Selfie</p>
                                    <p className="text-[8px] text-slate-400 font-medium tracking-tight">Face Match</p>
                                  </div>
                              </>
                          )}
                          <input type="file" ref={selfieInputRef} className="hidden" accept="image/*" capture="user" onChange={(e) => handleFileUpload(e, 'selfie')} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl flex items-start gap-4 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mt-1 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">Privacy & Encryption</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                        Your identity documents are encrypted and only accessible by authorized compliance officers for verification purposes.
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={!user.govtIdUrl || !user.selfieUrl || isLoading}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        await updateProfile({ verificationStatus: 'pending' });
                        // Scroll top or show a nice state change
                        alert("Verification submitted! Our team will review it within 24-48 hours.");
                      } catch (err) {
                        alert("Failed to submit. Please try again.");
                      } finally {
                        setIsLoading(true); // Keep in loading state while waiting for firestore update to reflect
                        setTimeout(() => setIsLoading(false), 1000);
                      }
                    }}
                    className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group shadow-xl ${
                      (!user.govtIdUrl || !user.selfieUrl || isLoading)
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-primary-600 text-white shadow-primary-500/25 active:scale-95'
                    }`}
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting Application...
                      </div>
                    ) : (
                      'Finish Verification'
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
