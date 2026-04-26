import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      icon: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
      button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 dark:shadow-none'
    },
    warning: {
      icon: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 dark:shadow-none'
    },
    info: {
      icon: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
      button: 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200 dark:shadow-none'
    }
  };

  const activeColors = colors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full ${activeColors.icon} mx-auto flex items-center justify-center mb-6`}>
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3">
                {title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 px-4">
                {message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest text-xs"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 h-14 rounded-2xl ${activeColors.button} font-bold shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest text-xs`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
