import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { VerificationLevel } from '../types';

interface VerificationBadgeProps {
  level?: VerificationLevel;
  showText?: boolean;
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ level = 'Unverified', showText = true, className = '' }) => {
  const getConfig = () => {
    switch (level) {
      case 'Fully Verified':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          text: 'Fully Verified',
          dot: 'bg-amber-500'
        };
      case 'Trusted':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          text: 'Trusted',
          dot: 'bg-emerald-500'
        };
      case 'Verified':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          text: 'Verified',
          dot: 'bg-blue-500'
        };
      default:
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          color: 'bg-slate-100 text-slate-500 border-slate-200',
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
