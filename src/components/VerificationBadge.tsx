import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { VerificationLevel } from '../types';

interface VerificationBadgeProps {
  level?: VerificationLevel;
  showText?: boolean;
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ level = 'none', showText = true, className = '' }) => {
  const getConfig = () => {
    switch (level) {
      case 'verified':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          text: 'Verified Agent',
          dot: 'bg-emerald-500'
        };
      default:
        return {
          icon: <Shield className="w-3.5 h-3.5" />,
          color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          text: 'Unverified',
          dot: 'bg-slate-400'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-tight shadow-sm ${config.color} ${className}`}>
      {config.icon}
      {showText && <span>{config.text}</span>}
    </div>
  );
};

export default VerificationBadge;
