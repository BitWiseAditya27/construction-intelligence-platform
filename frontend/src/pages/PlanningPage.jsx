import React, { useState, useEffect } from 'react';
import {
  CalendarRange,
  Clock,
  DollarSign,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ShieldCheck,
  Building,
  Loader2,
  Save,
  Check,
  Play,
  Hourglass,
  PieChart as PieIcon
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
  Cell
} from 'recharts';
import { apiClient } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useProject } from '../context/ProjectContext';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

export const PlanningPage = () => {
  const { activeProject } = useProject();

  const [projectName, setProjectName] = useState(activeProject?.name || 'Skyline Phase 2 Expansion');
  const [projectType, setProjectType] = useState('Commercial');
  const [siteArea, setSiteArea] = useState('35000');
  const [estimatedBudget, setEstimatedBudget] = useState('180000000');
  const [startDate, setStartDate] = useState('2026-03-01');
  const [targetDate, setTargetDate] = useState('2027-09-30');
  const [floors, setFloors] = useState('18');
  const [materials, setMaterials] = useState('Ready-Mix M35, Fe500D TMT rebar, AAC blocks');
  const [workforce, setWorkforce] = useState('3 shifts, 120 skilled civil tradesmen');
  const [constraints, setConstraints] = useState('Strict municipal noise limits after 8 PM, monsoon flood mitigation');

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch initial active plan if available
  useEffect(() => {
    const fetchExistingPlans = async () => {
      try {
        const plans = await apiClient.getPlans();
        if (plans && plans.length > 0) {
          setPlan(plans[0]);
        }
      } catch (e) {
        console.warn('Could not fetch existing plans:', e);
      }
    };
    fetchExistingPlans();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const payload = {
        project_name: projectName,
        project_type: projectType,
        site_area: parseFloat(siteArea) || 10000,
        estimated_budget: parseFloat(estimatedBudget) || 1000000,
        start_date: startDate,
        target_completion_date: targetDate,
        floors: parseInt(floors) || 1,
        material_preferences: materials,
        workforce_notes: workforce,
        constraints: constraints,
        project_id: activeProject?.id || null,
      };

      const res = await apiClient.generatePlan(payload);
      setPlan(res);
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Plan generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (!plan?.plan_id) return;
    setUpdatingTaskId(taskId);
    try {
      await apiClient.updateTaskStatus(plan.plan_id, taskId, newStatus);
      // update local task status
      setPlan((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      }));
    } catch (err) {
      console.error('Failed to update task status:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const phaseChartData =
    plan?.phases?.map((p) => ({
      name: p.name.split(':')[1] || p.name,
      cost: p.estimated_cost,
      percent: p.budget_share_percent,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Construction Project Planner & WBS Engine
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Critical path scheduling, phase-wise budget allocation, milestone tracking, and task dependency management.
            </p>
          </div>
        </div>
      </div>

      <DisclaimerBanner
        isDemoMode={plan?.is_demo_mode}
        text="PLANNING ESTIMATE NOTICE: Construction timelines, phase budgets, and task allocations are baseline scheduling models. A certified Project Management Professional (PMP) or Chartered Quantity Surveyor must review procurement and structural constraints."
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Input Parameters Form (Collapsible or Top Grid) */}
      <form onSubmit={handleGenerate} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" /> Project Scope & Parameters
          </h2>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Synthesizing Critical Path Plan...
              </>
            ) : (
              <>
                <CalendarRange className="w-3.5 h-3.5" />
                Generate Construction Plan
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project Typology</label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="Residential">Residential High-Rise</option>
              <option value="Commercial">Commercial Office & Retail</option>
              <option value="Industrial">Industrial Warehouse / Facility</option>
              <option value="Infrastructure">Infrastructure / Civil Works</option>
              <option value="Renovation">Structural Renovation / Retrofit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Site Area (sq ft)</label>
            <input
              type="number"
              value={siteArea}
              onChange={(e) => setSiteArea(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Total Budget</label>
            <input
              type="number"
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Completion</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Number of Storeys / Floors</label>
            <input
              type="number"
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Material Preferences</label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Site & Regulatory Constraints</label>
            <input
              type="text"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </form>

      {/* Plan Details Display */}
      {plan && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Estimated Duration</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{plan.total_duration_weeks} Weeks</p>
              <span className="text-[10px] text-slate-500">Critical path timeline</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Budget</span>
              <p className="text-xl font-extrabold text-slate-100 mt-1">
                ₹ {plan.estimated_budget?.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500">Allocated across {plan.phases?.length} phases</span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">WBS Tasks</span>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{plan.tasks?.length} Tasks</p>
              <span className="text-[10px] text-slate-500">
                {plan.tasks?.filter((t) => t.status === 'completed').length} completed
              </span>
            </div>
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Milestones & Risks</span>
              <p className="text-xl font-extrabold text-purple-400 mt-1">
                {plan.milestones?.length} / {plan.risks?.length}
              </p>
              <span className="text-[10px] text-slate-500">Hold points & mitigations</span>
            </div>
          </div>

          {/* Phase Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {plan.phases?.map((phase, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 flex flex-col justify-between"
              >
                <div>
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center justify-center mb-2">
                    {idx + 1}
                  </span>
                  <h3 className="text-xs font-bold text-slate-200 leading-snug">{phase.name}</h3>
                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <p>
                      <strong>Duration:</strong> {phase.duration_days} days
                    </p>
                    <p>
                      <strong>Budget Share:</strong> {phase.budget_share_percent}%
                    </p>
                    <p className="text-amber-400 font-semibold">
                      ₹ {phase.estimated_cost?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="font-semibold block text-slate-300">Deliverables:</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                    {phase.key_deliverables?.map((d, i) => (
                      <li key={i} className="truncate" title={d}>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Phase Budget Chart & Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-bold text-slate-100 mb-3">Phase Budget Share Allocation</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phaseChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(val) => [`₹ ${val.toLocaleString()}`, 'Estimated Cost']}
                    />
                    <Bar dataKey="cost" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Milestones Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col">
              <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4 text-purple-400" /> Key Engineering Milestones
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
                {plan.milestones?.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span>{m.title}</span>
                      <span className="text-[10px] text-slate-400">Day {m.day}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive WBS Task Management Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Work Breakdown Structure (WBS) & Task Execution</h3>
                <p className="text-xs text-slate-400">
                  Click task status buttons to update live progress in the database.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Task Details</th>
                    <th className="py-2.5 px-3">Phase</th>
                    <th className="py-2.5 px-3">Timeline</th>
                    <th className="py-2.5 px-3">Dependencies</th>
                    <th className="py-2.5 px-3">Resources</th>
                    <th className="py-2.5 px-3 text-right">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {plan.tasks?.map((task) => (
                    <tr key={task.id || task.title} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 max-w-xs">
                        <p className="font-bold text-slate-200">{task.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{task.description}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {task.phase_name.split(':')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {task.duration_days}d (Day {task.start_day}-{task.end_day})
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {task.dependencies && task.dependencies.length > 0
                          ? task.dependencies.join(', ')
                          : 'None (Root)'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                        {task.resources_needed || 'Standard crew'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1 rounded-xl p-1 bg-slate-950 border border-slate-800">
                          <button
                            type="button"
                            disabled={updatingTaskId === task.id}
                            onClick={() => handleStatusChange(task.id, 'pending')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                              task.status === 'pending'
                                ? 'bg-slate-700 text-slate-200'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Pending
                          </button>
                          <button
                            type="button"
                            disabled={updatingTaskId === task.id}
                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                              task.status === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'text-slate-500 hover:text-amber-400'
                            }`}
                          >
                            In Progress
                          </button>
                          <button
                            type="button"
                            disabled={updatingTaskId === task.id}
                            onClick={() => handleStatusChange(task.id, 'completed')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                              task.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'text-slate-500 hover:text-emerald-400'
                            }`}
                          >
                            Completed
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk & Mitigation Matrix */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Potential Project Risks & Mitigation Protocols
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {plan.risks?.map((r, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{r.risk}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Mitigation:</strong> {r.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningPage;
