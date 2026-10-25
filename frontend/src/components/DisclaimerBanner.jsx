import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Cpu } from 'lucide-react';

export const DisclaimerBanner = ({ isDemoMode = false, text, type = 'general' }) => {
  const [expanded, setExpanded] = useState(false);

  const defaultDisclaimer =
    text ||
    'AI-generated insights are decision-support tools and cannot replace on-site certified engineering or safety inspections. Physical verification is mandatory.';

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 mb-6 text-sm text-amber-200/90 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 font-medium text-amber-300">
              <span>Professional Advisory Disclaimer</span>
              {isDemoMode && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                  <Cpu className="w-3 h-3" /> Demo Baseline Mode
                </span>
              )}
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">{defaultDisclaimer}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-amber-400 hover:text-amber-300 transition-colors p-1"
          title="Toggle compliance details"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-amber-200/70 space-y-1.5 pl-7">
          <p>
            • <strong>Safety Compliance:</strong> Visual AI analysis cannot measure air quality, harness certification validity, or electrical continuity.
          </p>
          <p>
            • <strong>Structural Integrity:</strong> Surface photograph screening cannot diagnose subsurface rebar corrosion, tensile strength, or foundation depth.
          </p>
          <p>
            • <strong>Market Valuations:</strong> Algorithmic estimates do not constitute official bank valuations or certified appraiser deeds.
          </p>
        </div>
      )}
    </div>
  );
};

export default DisclaimerBanner;
