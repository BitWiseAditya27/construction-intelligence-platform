import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Eye,
  ShieldAlert,
  Activity,
  Calculator,
  CalendarRange,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import Modal from '../components/Modal';

export const HistoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for view modal
  const [selectedItem, setSelectedItem] = useState(null);

  // Selected for delete confirmation
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getHistory({
        module_type: moduleFilter || undefined,
        search: searchQuery.trim() || undefined,
      });
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch project intelligence history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [moduleFilter]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteHistoryItem(itemToDelete.id, itemToDelete.module_type);
      setItems(items.filter((it) => !(it.id === itemToDelete.id && it.module_type === itemToDelete.module_type)));
      setItemToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete history record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getModuleIcon = (type) => {
    switch (type) {
      case 'safety':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'crack':
        return <Activity className="w-4 h-4 text-rose-400" />;
      case 'valuation':
        return <Calculator className="w-4 h-4 text-blue-400" />;
      case 'planning':
        return <CalendarRange className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Project Intelligence Audit History
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Complete historical ledger of safety audits, crack diagnoses, valuations, and construction plans.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col md:flex-row items-center gap-3">
        {/* Module Type Selector */}
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setModuleFilter('')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              moduleFilter === ''
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Modules
          </button>
          <button
            onClick={() => setModuleFilter('safety')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              moduleFilter === 'safety'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Site Safety
          </button>
          <button
            onClick={() => setModuleFilter('crack')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              moduleFilter === 'crack'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Crack Analysis
          </button>
          <button
            onClick={() => setModuleFilter('valuation')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              moduleFilter === 'valuation'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Valuation
          </button>
          <button
            onClick={() => setModuleFilter('planning')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              moduleFilter === 'planning'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Planning
          </button>
        </div>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchHistory();
          }}
          className="relative flex-1 w-full"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records by project name, location, or structure..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* History Items Table / List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No history records found for the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {items.map((it) => (
              <div
                key={`${it.module_type}-${it.id}`}
                className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-xl bg-slate-800 shrink-0 mt-0.5">
                    {getModuleIcon(it.module_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{it.title}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {it.module_type}
                      </span>
                      {it.is_demo_mode && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Demo Baseline
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{it.subtitle}</p>
                    <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">{it.details_summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <RiskBadge level={it.badge_text} />
                  <span className="text-[11px] text-slate-400">
                    {it.created_at ? new Date(it.created_at).toLocaleDateString() : ''}
                  </span>

                  {/* Actions */}
                  <button
                    onClick={() => setSelectedItem(it)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="View Full Findings"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setItemToDelete(it)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`${selectedItem.title} (${selectedItem.module_type.toUpperCase()})`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs text-slate-400">{selectedItem.subtitle}</span>
              <RiskBadge level={selectedItem.badge_text} />
            </div>

            {selectedItem.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-800 max-h-72 bg-black flex items-center justify-center">
                <img
                  src={selectedItem.image_url}
                  alt="Record Inspection"
                  className="max-h-72 object-contain"
                />
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Stored Payload & Findings
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 overflow-x-auto max-h-60">
                <pre className="whitespace-pre-wrap font-mono text-[11px]">
                  {JSON.stringify(selectedItem.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <Modal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          title="Confirm Record Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Are you sure you want to permanently delete this record?</p>
                <p className="mt-1 text-red-300/80">
                  Record #{itemToDelete.id}: "{itemToDelete.title}" ({itemToDelete.module_type})
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HistoryPage;
