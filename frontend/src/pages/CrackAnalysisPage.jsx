import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileCheck,
  Search,
  CheckCircle2,
  Stethoscope,
  Info,
  Layers,
  Clock,
  Ruler,
  FileText,
  Loader2,
  Save
} from 'lucide-react';
import { apiClient } from '../api/client';
import ImageDropzone from '../components/ImageDropzone';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useProject } from '../context/ProjectContext';

export const CrackAnalysisPage = () => {
  const { activeProject } = useProject();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [structureType, setStructureType] = useState('Beam');
  const [ageYears, setAgeYears] = useState('2.5');
  const [measurements, setMeasurements] = useState('Width approx 1.2 mm across center span');
  const [notes, setNotes] = useState('Appeared after recent adjacent basement excavation work.');

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
      setError('Please upload a concrete or wall crack image to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('structure_type', structureType);
      formData.append('age_years', ageYears);
      formData.append('measurements', measurements);
      formData.append('notes', notes);
      if (activeProject?.id) {
        formData.append('project_id', activeProject.id);
      }

      const res = await apiClient.analyzeCracks(formData);
      setResult(res);
      setSavedSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Crack inspection analysis failed. Please try again.');
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
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Concrete & Wall Crack Forensic Analysis
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Structural crack pattern diagnosis, failure hypotheses, monitoring protocols, and urgency triage.
            </p>
          </div>
        </div>
      </div>

      <DisclaimerBanner
        isDemoMode={result?.is_demo_mode}
        text="CRITICAL STRUCTURAL SAFETY DISCLAIMER: 2D photograph analysis cannot verify concrete compressive strength, internal steel rebar yield, or foundation load paths. Visual screening CANNOT establish whether a structure is safe. Physical inspection by a licensed Professional Structural Engineer (PE/SE) is required."
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
        {/* Left Form */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleAnalyze} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-amber-400" /> Crack Image & Member Context
            </h2>

            {/* Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Crack Close-Up Photograph <span className="text-amber-400">*</span>
              </label>
              <ImageDropzone
                onFileSelected={handleFileSelected}
                previewUrl={previewUrl}
                onClear={handleClearFile}
                sampleType="crack"
              />
            </div>

            {/* Structure Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Structural Component Typology
              </label>
              <div className="relative">
                <Layers className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <select
                  value={structureType}
                  onChange={(e) => setStructureType(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Beam">RC Transfer / Spandrel Beam</option>
                  <option value="Column">Load-Bearing Reinforced Column</option>
                  <option value="Slab">Suspended Floor / Roof Slab</option>
                  <option value="Wall">Masonry Infill / Shear Wall</option>
                  <option value="Foundation">Foundation Raft / Retaining Wall</option>
                </select>
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Approximate Structure Age (Years)
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={ageYears}
                  onChange={(e) => setAgeYears(e.target.value)}
                  placeholder="e.g. 3 years or under construction"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Measurements */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                User Crack Measurements / Length / Aperture
              </label>
              <div className="relative">
                <Ruler className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={measurements}
                  onChange={(e) => setMeasurements(e.target.value)}
                  placeholder="e.g. Width ~1.5mm, length ~900mm"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Additional Observations */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Visual Context / Prior Loading Observations
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Discoloration, dampness, vibrations, recent weather events..."
                className="w-full p-3 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Diagnosing Crack Morphology & Hypotheses...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Analyze Crack Image
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5 backdrop-blur-sm animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">
                      {result.structure_type} Fracture Diagnosis
                    </h2>
                    {savedSuccess && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <Save className="w-3 h-3" /> Saved to History
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pattern: <span className="text-slate-200 font-semibold">{result.crack_pattern}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Engineering Urgency:</span>
                  <RiskBadge level={result.urgency} size="lg" />
                </div>
              </div>

              {/* Warrant professional inspection badge */}
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
                  result.professional_inspection_warranted
                    ? 'border-red-500/40 bg-red-950/20 text-red-300'
                    : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {result.professional_inspection_warranted
                    ? 'ATTENTION: On-site physical examination by a licensed structural engineer is warranted.'
                    : 'Routine baseline monitoring advised; no acute emergency indicators observed in image.'}
                </span>
              </div>

              {/* Crack Pattern & Visual Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">
                    Morphological Pattern
                  </span>
                  <span className="text-slate-100 font-bold mt-1 block">{result.crack_pattern}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">
                    Observed Image Region
                  </span>
                  <span className="text-slate-200 mt-1 block">{result.location_in_image}</span>
                </div>
              </div>

              {/* Possible Causes (Hypotheses) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Engineering Hypotheses (Non-Definitive)
                </h3>
                <div className="space-y-2">
                  {result.possible_causes?.map((cause, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200/90 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{cause}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Surface Observations */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Forensic Surface Observations
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.observations?.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Remediation Steps */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Suggested Actionable Remediation Protocols
                </h3>
                <div className="space-y-1.5 text-xs text-slate-200">
                  {result.suggested_next_steps?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
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
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">No Crack Analysis Loaded</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Upload a concrete, wall, beam, or foundation crack photograph on the left to evaluate fracture pattern and risk.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrackAnalysisPage;
