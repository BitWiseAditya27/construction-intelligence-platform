import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Camera,
  Loader2,
  FileCheck,
  AlertOctagon,
  Info,
  MapPin,
  Building2,
  Save
} from 'lucide-react';
import { apiClient } from '../api/client';
import ImageDropzone from '../components/ImageDropzone';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useProject } from '../context/ProjectContext';

export const SafetyPage = () => {
  const { activeProject } = useProject();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [projectName, setProjectName] = useState(activeProject?.name || 'Skyline Commercial Project');
  const [location, setLocation] = useState(activeProject?.location || 'Level 14 Perimeter Deck');
  const [notes, setNotes] = useState('Observed active formwork and leading edge crew work.');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const handleClearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setResult(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a construction site photograph for analysis.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_name', projectName);
      formData.append('location', location);
      formData.append('notes', notes);
      if (activeProject?.id) {
        formData.append('project_id', activeProject.id);
      }

      const res = await apiClient.analyzeSafety(formData);
      setResult(res);
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Safety analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Construction Site Safety Monitoring
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Multimodal computer vision audit for OSHA/PPE compliance, fall hazards, and jobsite risks.
            </p>
          </div>
        </div>
      </div>

      <DisclaimerBanner
        isDemoMode={result?.is_demo_mode}
        text="MANDATORY SAFETY NOTICE: Visual AI screening assists safety auditors but cannot verify load testing, electrical wiring integrity, or certified harness inspection dates. Certified safety officer verification is required."
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input & Upload Form */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleAnalyze} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" /> Site Photo & Inspection Metadata
            </h2>

            {/* Image Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Site Photograph <span className="text-amber-400">*</span>
              </label>
              <ImageDropzone
                onFileSelected={handleFileSelected}
                previewUrl={previewUrl}
                onClear={handleClearFile}
                sampleType="safety"
              />
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project Name
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Apex Tower Phase 2"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Site Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Site Zone / Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. East Wing Scaffolding, Level 4"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Field Observations & Context Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention weather, active trade crews, equipment status..."
                className="w-full p-3 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Multimodal Safety Vision Audit...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Audit Site Safety Photograph
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5 backdrop-blur-sm animate-fadeIn">
              {/* Header with Risk Level */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">AI Safety Audit Findings</h2>
                    {savedSuccess && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <Save className="w-3 h-3" /> Saved to History
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {result.project_name} • {result.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Overall Jobsite Risk:</span>
                  <RiskBadge level={result.overall_risk} size="lg" />
                </div>
              </div>

              {/* Severity summary banner */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs font-medium flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{result.severity}</span>
              </div>

              {/* Executive Summary */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Executive Assessment
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                  {result.summary}
                </p>
              </div>

              {/* Specific Hazards Identified */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Identified Potential Hazards ({result.hazards?.length || 0})
                </h3>
                <div className="space-y-2.5">
                  {result.hazards?.map((h, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                          {h.hazard}
                        </span>
                        <RiskBadge level={h.severity} />
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        <strong>Location in scene:</strong> {h.location}
                      </div>
                      <div className="text-amber-200/90 text-[11px] bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                        <strong>Corrective Action:</strong> {h.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Observations */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Visual Site Observations
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                  {result.observations?.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Immediate Actions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Priority Corrective Action Checklist
                </h3>
                <div className="space-y-1.5 text-xs text-slate-200">
                  {result.recommended_actions?.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                      <ListChecks className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limitations Notice */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{result.limitations}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-500 mb-3">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">No Safety Inspection Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Upload a site photograph on the left and submit to initiate computer vision hazard detection and PPE audit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyPage;
