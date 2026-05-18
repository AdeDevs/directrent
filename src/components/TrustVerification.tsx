import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Smartphone, BadgeCheck, ChevronRight, Fingerprint, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateVerificationLevel } from '../lib/verification';

interface TrustVerificationProps {
  onVerifyPhone?: () => void;
}

const TrustVerification: React.FC<TrustVerificationProps> = ({ onVerifyPhone }) => {
  const { user, updateProfile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [nin, setNin] = useState(user?.nin || '');
  const [isSaving, setIsSaving] = useState(false);
  const [ninError, setNinError] = useState('');

  if (!user || user.role !== 'tenant') return null;

  const currentLevel = calculateVerificationLevel(user);
  const hasPhone = !!user.phoneNumber && user.phoneVerified;
  const hasNin = !!user.nin && user.nin.length === 11;

  const handleSaveNin = async () => {
    if (nin.length !== 11) {
      setNinError('NIN must be 11 digits');
      return;
    }
    setNinError('');
    setIsSaving(true);
    try {
      await updateProfile({ nin });
      setIsExpanded(false);
    } catch (error) {
      console.error("Error saving NIN:", error);
      setNinError('Failed to save NIN. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
      >
        <div className={`w-10 h-10 ${
          currentLevel === 'verified' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
        } rounded-xl flex items-center justify-center group-active:scale-95 transition-transform`}>
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Trust & Verification</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {currentLevel === 'verified' ? 'Your account is highly trusted' : 'Increase your trust level by verifying identity'}
          </p>
        </div>
        {!hasNin && (
          <div className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg text-[9px] font-black uppercase border border-orange-200 dark:border-orange-800">Boost</div>
        )}
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
            className="border-t border-slate-50 dark:border-slate-800 p-5 space-y-6 bg-slate-50/30 dark:bg-slate-800/20"
          >
            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border ${hasPhone ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${hasPhone ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-bold ${hasPhone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {hasPhone ? 'Verified' : 'Unverified'}
                  </p>
                  {!hasPhone && onVerifyPhone && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerifyPhone();
                      }}
                      className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider hover:underline"
                    >
                      Verify Now
                    </button>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${hasNin ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${hasNin ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Fingerprint className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">ID (NIN)</p>
                <p className={`text-xs font-bold ${hasNin ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {hasNin ? 'Added' : 'Optional'}
                </p>
              </div>
            </div>

            {!hasNin && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] pl-1">Add National Identity Number (NIN)</label>
                  <div className="relative group">
                    <input 
                      type="tel"
                      maxLength={11}
                      value={nin}
                      onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="Enter 11-digit NIN"
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                    {nin.length === 11 && !hasNin && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {ninError && (
                    <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1.5 pl-1">
                      <AlertCircle className="w-3 h-3" /> {ninError}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl flex items-start gap-3">
                  <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider">Why add NIN?</p>
                    <p className="text-[9px] text-blue-600/80 dark:text-blue-400/60 leading-normal font-medium">
                      Adding your NIN shows agents you're a serious tenant. It increases your trust score and makes your rental applications stand out.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSaveNin}
                  disabled={nin.length !== 11 || isSaving}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2
                    ${nin.length === 11 && !isSaving
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/20' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'}`}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Boost Trust'}
                </button>
              </div>
            )}

            {hasNin && (
               <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">Identity Linked</p>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-bold">NIN added successfully</p>
                  </div>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrustVerification;
