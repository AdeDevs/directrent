import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Camera, FileText, CheckCircle2, Loader2, AlertCircle, Upload, ChevronDown, Check, X, RefreshCw, Sparkles } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

interface KYCVerificationProps {
  isOpen: boolean;
  onClose: () => void;
}

const KYCVerification: React.FC<KYCVerificationProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading_id' | 'uploading_selfie'>('idle');
  const [idType, setIdType] = useState<'NIN Slip' | 'National ID Card' | 'Drivers License' | 'Passport' | ''>(user?.govtIdType || '');
  
  // Real active webcam streaming state
  const [livenessActive, setLivenessActive] = useState(false);
  const [livenessStream, setLivenessStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync idType
  useEffect(() => {
    if (user?.govtIdType) {
      setIdType(user.govtIdType as any);
    }
  }, [user?.govtIdType]);

  // Clean stream on unmount or close
  useEffect(() => {
    return () => {
      if (livenessStream) {
        livenessStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [livenessStream]);

  if (!user || !isOpen) return null;

  const isVerified = user.verificationStatus === 'verified';
  const isPending = user.verificationStatus === 'pending';
  const hasRejection = (user.role === 'agent' ? user.agent?.verificationReason : user.userVerificationReason) && user.verificationStatus === 'none';

  const startCamera = async () => {
    try {
      setCameraError("");
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } }
      });
      setLivenessStream(stream);
      setLivenessActive(true);
      
      // Delay briefly to allow video element instantiation
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera open failed:", err);
      setCameraError("Camera access rejected or unsupported. Please use files fallback below instead.");
    }
  };

  const stopCamera = () => {
    if (livenessStream) {
      livenessStream.getTracks().forEach(track => track.stop());
      setLivenessStream(null);
    }
    setLivenessActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 480;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Horizontal flip for a mirror look
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleUploadCapturedSelfie = async () => {
    if (!capturedImage) return;
    try {
      setIsLoading(true);
      setUploadStatus('uploading_selfie');

      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `selfie_${user.id}_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const fileName = `kyc/selfie/${user.id}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const updateData: any = {
        selfieUrl: downloadURL,
        ...(user.role === 'agent' ? { 'agent.verificationReason': null } : { userVerificationReason: null })
      };

      // Auto upgrade status to pending if both documents exist
      if (user.govtIdUrl || user.govtIdType) {
        updateData.verificationStatus = 'pending';
      }

      await updateProfile(updateData);
      setCapturedImage(null);
    } catch (error) {
      console.error("Selfie upload error:", error);
      toast.error("Selfie upload failed. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadStatus('idle');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'govtId' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPG, PNG).');
        return;
    }

    if (type === 'govtId' && !idType) {
      toast.error('Please select an ID type first.');
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
        ...(user.role === 'agent' ? { 'agent.verificationReason': null } : { userVerificationReason: null })
      };

      if (type === 'govtId') {
        updateData.govtIdType = idType;
      }

      // If both now uploaded, switch verificationStatus to pending
      if ((type === 'govtId' && user.selfieUrl) || (type === 'selfie' && (user.govtIdUrl || idType))) {
        updateData.verificationStatus = 'pending';
      }

      await updateProfile(updateData);
    } catch (error) {
      console.error("KYC Upload Error:", error);
      toast.error("Failed to upload document. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadStatus('idle');
    }
  };

  const idTypes = ['NIN Slip', 'National ID Card', 'Drivers License', 'Passport'];

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/20"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-full sm:max-w-md border border-slate-200 dark:border-slate-800 pb-safe sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Top modal header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">KYC Verification</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mod Review Credentials</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-900/20 p-2 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {hasRejection && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[8.5px] font-black text-rose-600 dark:text-rose-455 uppercase tracking-wider">Mod Rejection Feedback</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                "{user.role === 'agent' ? user.agent?.verificationReason : user.userVerificationReason}"
              </p>
            </div>
          )}

          {isVerified ? (
            <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/30 p-5 rounded-2xl text-center py-8">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Documents Verified</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                Your credentials have been successfully approved by the administrator. Full platform features are unlocked!
              </p>
            </div>
          ) : isPending ? (
            <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/30 p-5 rounded-2xl text-center py-8">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">In Review by Moderator</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto leading-relaxed font-sans">
                Our safety team is verifying your submission. Verification complete notification will arrive in 24 - 48 hours.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              
              {/* ID Document Select & Upload Row - Low Profile Height */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">1. Govt ID Document</span>
                  </div>
                  {user.govtIdUrl ? (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider px-2 py-0.5 rounded">Uploaded</span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider px-2 py-0.5 rounded">Required</span>
                  )}
                </div>

                {!user.govtIdUrl ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select 
                        value={idType} 
                        onChange={e => setIdType(e.target.value as any)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2.5 appearance-none outline-none font-bold text-slate-700 dark:text-slate-300"
                      >
                        <option value="" disabled>Select Type...</option>
                        {idTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" ref={idInputRef} onChange={(e) => handleFileUpload(e, 'govtId')} />
                    <button
                      disabled={!idType || isLoading}
                      onClick={() => idInputRef.current?.click()}
                      className="shrink-0 flex items-center justify-center gap-1 px-4 h-[38px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-850 disabled:opacity-50 group active:scale-[0.98] transition-all"
                    >
                      {uploadStatus === 'uploading_id' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <><Upload className="w-3.5 h-3.5" /><span>Upload</span></>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[10px] truncate max-w-[200px]">{user.govtIdType || 'ID'} Uploaded</span>
                    <button 
                      onClick={() => idInputRef.current?.click()}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-bold text-[10px]"
                    >
                      Change File
                    </button>
                  </div>
                )}
              </div>

              {/* Liveness Camera & Upload Row - Low Profile Height */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">2. Selfie Liveness Check</span>
                  </div>
                  {user.selfieUrl ? (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider px-2 py-0.5 rounded">Uploaded</span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider px-2 py-0.5 rounded">Required</span>
                  )}
                </div>

                {/* Stream / Capture Interface */}
                {livenessActive ? (
                  <div className="flex flex-col items-center gap-2 overflow-hidden rounded-xl bg-black p-2 border border-slate-200 dark:border-slate-800">
                    <div className="relative w-full aspect-square max-w-[200px] rounded-full overflow-hidden border-4 border-primary-500/30 mx-auto flex items-center justify-center">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-0 border-[3px] border-dashed border-white/40 rounded-full pointer-events-none scale-95" />
                    </div>
                    <p className="text-[9px] text-white/80 font-bold uppercase tracking-wider">Center face inside oval</p>
                    <div className="flex items-center gap-2 w-full">
                      <button 
                        onClick={capturePhoto}
                        className="flex-1 bg-white text-slate-900 font-black text-xs py-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        Capture Image
                      </button>
                      <button 
                        onClick={stopCamera}
                        className="px-3 bg-rose-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-rose-750"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : capturedImage ? (
                  <div className="flex flex-col items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="w-[110px] h-[110px] rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
                      <img src={capturedImage} alt="Captured Selfie" className="w-full h-full object-cover"  referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={handleUploadCapturedSelfie}
                        disabled={isLoading}
                        className="flex-1 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Confirm & Upload</>}
                      </button>
                      <button
                        onClick={startCamera}
                        className="px-3 py-2.5 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                ) : !user.selfieUrl ? (
                  <div className="space-y-2">
                    {cameraError && (
                      <p className="text-[10px] text-rose-500 font-bold leading-normal pb-1">{cameraError}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={startCamera}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 text-xs font-black transition-all active:scale-98"
                      >
                        <Camera className="w-3.5 h-3.5" /> Start Webcam
                      </button>

                      <button
                        onClick={() => selfieInputRef.current?.click()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 text-xs font-bold"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload File
                      </button>
                    </div>
                    <input type="file" accept="image/*" capture="user" className="hidden" ref={selfieInputRef} onChange={(e) => handleFileUpload(e, 'selfie')} />
                  </div>
                ) : (
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">
                      <Check className="w-3.5 h-3.5" /> Liveness selfie recorded
                    </div>
                    <button 
                      onClick={startCamera}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-bold text-[10px]"
                    >
                      Retake Selfie
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default KYCVerification;
