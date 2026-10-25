import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  CloudSun,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
  FileCheck,
  Server,
  Key,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { apiClient } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';

export const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [testingAI, setTestingAI] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestAI = async () => {
    setTestingAI(true);
    setTestResult(null);
    try {
      const res = await apiClient.testAI();
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Could not connect to AI test endpoint.'
      });
    } finally {
      setTestingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Settings & System Architecture Configuration
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Provider telemetry, secret status, database connection, and AWS cloud deployment readiness.
            </p>
          </div>
        </div>
      </div>

      <DisclaimerBanner text="TRANSPARENT CONFIGURATION NOTICE: The platform automatically uses deterministic engineering heuristics when external API credentials are not provided. It never simulates live model calls." />

      {/* Main Settings Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Multimodal Configuration Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" /> Multimodal AI Engine
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                settings?.ai_configured
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              {settings?.ai_configured ? 'API Key Active' : 'Baseline Demo Mode'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Configured AI Provider</span>
              <span className="font-bold text-slate-200 capitalize">{settings?.ai_provider || 'Gemini'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Model Name</span>
              <span className="font-mono text-amber-400 font-semibold">{settings?.ai_model || 'gemini-2.5-flash'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">API Key Status</span>
              <span className="font-mono text-slate-300">{settings?.ai_key_masked}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Multimodal (Image + Text)</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Supported
              </span>
            </div>
          </div>

          {/* Test Button & Diagnostics */}
          <div className="pt-2">
            <button
              onClick={handleTestAI}
              disabled={testingAI}
              className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {testingAI ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Testing AI Endpoint Response...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  Run AI Provider Connectivity Diagnostic
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs ${
                  testResult.success
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                    : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
                }`}
              >
                <div className="font-bold">{testResult.message}</div>
                {testResult.mode && (
                  <div className="text-[11px] text-slate-400 mt-1">Operating Mode: {testResult.mode}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Database & Storage Architecture */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" /> Database & Storage Subsystem
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Active Database Engine</span>
              <span className="font-bold text-slate-200">{settings?.database_type}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Production DB Target</span>
              <span className="font-semibold text-slate-300">Amazon RDS PostgreSQL</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Local Uploads Directory</span>
              <span className="font-mono text-slate-300">{settings?.upload_dir}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Max Upload Size Limit</span>
              <span className="font-bold text-slate-200">{settings?.max_upload_size_mb} MB</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Weather Provider</span>
              <span className="font-semibold text-emerald-400">Open-Meteo (Live Global Forecasts)</span>
            </div>
          </div>
        </div>
      </div>

      {/* AWS Cloud Deployment Readiness Guide */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-amber-500" /> AWS Enterprise Deployment Readiness
        </h2>
        <p className="text-xs text-slate-400">
          The platform follows cloud-native Twelve-Factor principles and is architected for zero-code refactoring when deploying to AWS:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="font-bold text-amber-400 block">Frontend Tier</span>
            <p className="text-slate-300">AWS Amplify or S3 Static Website Hosting with Amazon CloudFront CDN distribution.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="font-bold text-sky-400 block">Backend Container</span>
            <p className="text-slate-300">AWS App Runner or Amazon ECS (Fargate) for scalable FastAPI container microservices.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="font-bold text-emerald-400 block">Relational Database</span>
            <p className="text-slate-300">Amazon RDS PostgreSQL Multi-AZ with automated backups and encrypted storage.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="font-bold text-purple-400 block">Object Storage & Secrets</span>
            <p className="text-slate-300">Amazon S3 private bucket for high-res construction photos & AWS Secrets Manager for LLM keys.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
