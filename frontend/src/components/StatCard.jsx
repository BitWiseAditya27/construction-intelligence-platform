import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'amber' }) => {
  const colorMap = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    red: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  const activeColor = colorMap[color] || colorMap.amber;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-md hover:border-slate-700 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${activeColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-100">{value}</span>
        {trend && (
          <span className={`inline-flex items-center text-xs font-medium ${trend.isUp ? 'text-emerald-400' : 'text-slate-400'}`}>
            {trend.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.text}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
