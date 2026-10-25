import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Activity,
  Calculator,
  CalendarRange,
  MessagesSquare,
  CloudSun,
  BookOpen,
  History,
  Settings,
  X,
  Hammer
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Site Safety', path: '/safety', icon: ShieldAlert },
  { name: 'Crack Analysis', path: '/cracks', icon: Activity },
  { name: 'Real Estate Valuation', path: '/valuation', icon: Calculator },
  { name: 'Project Planner', path: '/planning', icon: CalendarRange },
  { name: 'Daily Site Assistant', path: '/assistant', icon: MessagesSquare },
  { name: 'Weather Advisory', path: '/weather', icon: CloudSun },
  { name: 'Knowledge Assistant', path: '/knowledge', icon: BookOpen },
  { name: 'Project History', path: '/history', icon: History },
  { name: 'Settings & API', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900/95 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile header close button */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-100">BuildMind Nav</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Intelligence Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer info card */}
        <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-950/40 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Construction AI OS</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Multimodal v1.0 • Enterprise Ready</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
