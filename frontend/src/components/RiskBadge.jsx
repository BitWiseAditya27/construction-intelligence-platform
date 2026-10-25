import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, Info } from 'lucide-react';

export const RiskBadge = ({ level = 'Medium', size = 'sm' }) => {
  const norm = (level || 'medium').toLowerCase();

  let styles = 'bg-slate-700/60 text-slate-300 border-slate-600';
  let Icon = Info;

  if (norm.includes('critical') || norm.includes('immediate')) {
    styles = 'bg-red-500/15 text-red-400 border-red-500/40 shadow-sm shadow-red-950/50';
    Icon = AlertOctagon;
  } else if (norm.includes('high') || norm.includes('adverse')) {
    styles = 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-950/50';
    Icon = AlertTriangle;
  } else if (norm.includes('medium') || norm.includes('prompt') || norm.includes('caution')) {
    styles = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40';
    Icon = AlertTriangle;
  } else if (norm.includes('low') || norm.includes('optimal') || norm.includes('monitor') || norm.includes('completed')) {
    styles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    Icon = CheckCircle2;
  }

  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${styles} ${sizeClasses}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span className="capitalize">{level}</span>
    </span>
  );
};

export default RiskBadge;
