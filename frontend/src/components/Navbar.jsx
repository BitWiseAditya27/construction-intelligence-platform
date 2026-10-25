import React from 'react';
import { HardHat, Bell, Menu, Cpu, CheckCircle2, ChevronDown, Building2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { projects, activeProject, setActiveProject, systemHealth } = useProject();

  const isDemo = systemHealth?.demo_mode_active ?? true;
  const aiProvider = systemHealth?.ai_provider || 'Gemini';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950/30">
            <HardHat className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-slate-100 text-base md:text-lg">
              Build<span className="text-amber-500">Mind</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border border-slate-700/60 rounded px-1.5 py-0.5">
              Intelligence Platform
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Project Selector */}
        <div className="relative hidden md:flex items-center">
          <Building2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={activeProject?.id || ''}
            onChange={(e) => {
              const selected = projects.find((p) => p.id === parseInt(e.target.value));
              if (selected) setActiveProject(selected);
            }}
            className="pl-9 pr-8 py-1.5 text-xs font-medium rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer"
          >
            {projects.length > 0 ? (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name}
                </option>
              ))
            ) : (
              <option value="">Default Site Workspace</option>
            )}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* AI Mode Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isDemo
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          }`}
          title={isDemo ? 'Running in deterministic fallback mode without external API key' : `Connected to live ${aiProvider}`}
        >
          {isDemo ? (
            <>
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Demo Mode</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{aiProvider} Live</span>
            </>
          )}
        </div>

        {/* Notifications & Profile */}
        <button
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-slate-200 border border-slate-600">
            CE
          </div>
          <div className="hidden xl:block text-left text-xs">
            <p className="font-semibold text-slate-200 leading-none">Chief Engineer</p>
            <p className="text-[10px] text-slate-400 leading-none mt-1">Superintendent</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
