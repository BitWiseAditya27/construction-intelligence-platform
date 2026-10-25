import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Activity,
  Calculator,
  CalendarRange,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Eye
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { apiClient } from '../api/client';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import Modal from '../components/Modal';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard data from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Construction Intelligence Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Multimodal site monitoring, hazard detection, structural health, and predictive project analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link
            to="/safety"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-950/40 hover:from-amber-500 hover:to-amber-400 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            New Inspection
          </Link>
        </div>
      </div>

      <DisclaimerBanner />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="underline font-semibold ml-4">
            Retry
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          title="Total Projects"
          value={stats?.total_projects ?? 0}
          subtitle="Active job sites"
          icon={Building}
          color="blue"
        />
        <StatCard
          title="Site Inspections"
          value={stats?.site_inspections ?? 0}
          subtitle="AI scans performed"
          icon={ShieldAlert}
          color="amber"
        />
        <StatCard
          title="Safety Hazards"
          value={stats?.safety_issues ?? 0}
          subtitle="Logged across sites"
          icon={Activity}
          color="red"
        />
        <StatCard
          title="Valuations"
          value={stats?.properties_analyzed ?? 0}
          subtitle="Evaluations completed"
          icon={Calculator}
          color="emerald"
        />
        <StatCard
          title="Active Plans"
          value={stats?.active_plans ?? 0}
          subtitle="WBS construction schedules"
          icon={CalendarRange}
          color="purple"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Project Milestone Progress</h2>
              <p className="text-xs text-slate-400">Task completion percentage across construction phases</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.progress_chart || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="project" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val) => [`${val}%`, 'Completion']}
                />
                <Bar dataKey="completion" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Safety Risk Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-100">Hazard Severity Distribution</h2>
            <p className="text-xs text-slate-400">Risk classification of inspected sites</p>
          </div>
          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.safety_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(stats?.safety_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Section: Recent Analyses & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analysis Cards */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-100">Recent Multimodal Intelligence Scans</h2>
            <Link to="/history" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View All History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recent_analyses && stats.recent_analyses.length > 0 ? (
              stats.recent_analyses.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedAnalysis(item)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{item.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <RiskBadge level={item.badge} />
                    <span className="text-[11px] text-slate-400 hidden sm:inline">{item.date}</span>
                    <Eye className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No analyses recorded yet. Start by uploading a site photo or crack inspection.
              </div>
            )}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-bold text-slate-100 mb-4">Site Intelligence Activity</h2>
          <div className="space-y-4">
            {stats?.recent_activities?.map((act, index) => (
              <div key={index} className="flex items-start gap-3 text-xs">
                <div className="mt-0.5 p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">{act.action}</p>
                  <p className="text-slate-400">{act.project}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{act.time}</span>
              </div>
            ))}
          </div>

          {/* Quick Launcher shortcuts */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Launch Intelligence Modules
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/cracks"
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-medium flex items-center gap-2 transition-all"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Crack Inspector
              </Link>
              <Link
                to="/weather"
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-medium flex items-center gap-2 transition-all"
              >
                <Building className="w-3.5 h-3.5 text-sky-400" />
                Weather Window
              </Link>
              <Link
                to="/assistant"
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-medium flex items-center gap-2 transition-all"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Daily Assistant
              </Link>
              <Link
                to="/valuation"
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-medium flex items-center gap-2 transition-all"
              >
                <Calculator className="w-3.5 h-3.5 text-purple-400" />
                Valuation Engine
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Details Quick View Modal */}
      {selectedAnalysis && (
        <Modal
          isOpen={!!selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
          title={selectedAnalysis.title}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {selectedAnalysis.type}
              </span>
              <RiskBadge level={selectedAnalysis.badge} />
            </div>

            {selectedAnalysis.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-800 max-h-60 bg-black flex items-center justify-center">
                <img
                  src={selectedAnalysis.image_url}
                  alt="Analysis inspection"
                  className="max-h-60 object-contain"
                />
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">Summary Findings</h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                {selectedAnalysis.summary}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DashboardPage;
