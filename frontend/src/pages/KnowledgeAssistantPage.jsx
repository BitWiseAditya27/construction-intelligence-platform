import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Send,
  Loader2,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Bot
} from 'lucide-react';
import { apiClient } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';

const KNOWLEDGE_TOPICS = [
  {
    category: 'Concrete & Mix Design',
    queries: [
      'What causes plastic shrinkage cracking in concrete slabs and how is it prevented?',
      'Explain the difference between 7-day and 28-day compressive cube strength.',
      'When should water-reducing superplasticizers be dosed in ready-mix concrete?'
    ]
  },
  {
    category: 'Structural Steel & Rebar',
    queries: [
      'What are the rebar lap length rules for tension zones vs compression zones?',
      'Why is site tack-welding of high-yield TMT bars prohibited by structural codes?',
      'What minimum concrete clear cover is required for coastal marine environments?'
    ]
  },
  {
    category: 'Geotech & Foundations',
    queries: [
      'How is safe soil bearing capacity (SBC) calculated from Standard Penetration Test (SPT) N-values?',
      'What are the primary causes of differential settlement in isolated footings?',
      'Explain the dewatering requirements during deep basement pit excavation.'
    ]
  },
  {
    category: 'Quality Control & Non-Destructive Testing',
    queries: [
      'How does Ultrasonic Pulse Velocity (UPV) verify concrete uniformity and cracks?',
      'What is the acceptable rebound number range for Schmidt hammer calibration?'
    ]
  }
];

export const KnowledgeAssistantPage = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (queryText) => {
    const textToSearch = queryText || query;
    if (!textToSearch.trim() || loading) return;

    setLoading(true);
    setError(null);
    setQuery(textToSearch);

    try {
      const res = await apiClient.sendChat({
        message: textToSearch,
        context_type: 'knowledge'
      });
      setResponse(res);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch engineering knowledge answer. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Construction & Civil Engineering Knowledge Engine
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Verified technical repository for concrete chemistry, material specifications, NDT testing, and codes.
            </p>
          </div>
        </div>
      </div>

      <DisclaimerBanner text="STANDARDS DISCLAIMER: Technical answers provide established engineering guidelines (ACI, IS, Eurocodes). Local municipal building regulations and project-specific structural drawings always take legal precedence." />

      {/* Query Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any civil engineering, concrete chemistry, or QA/QC question..."
              className="w-full pl-10 pr-4 py-3 text-xs md:text-sm rounded-xl border border-slate-700 bg-slate-800/90 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 transition-all flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ask Engine</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Knowledge Result Card */}
      {response && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5 backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> Technical Engineering Synthesis
            </span>
            <span className="text-[11px] text-slate-400">
              {response.is_demo_mode ? 'Deterministic Baseline' : 'Multimodal LLM'}
            </span>
          </div>

          {/* Answer Headline */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-slate-100 text-sm font-semibold leading-relaxed">
            {response.answer}
          </div>

          {/* Technical Detailed Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Detailed Engineering Exposition
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800 whitespace-pre-line">
              {response.explanation}
            </p>
          </div>

          {/* Recommended Next Steps / Testing Protocol */}
          {response.recommended_next_steps && response.recommended_next_steps.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recommended Verification & Testing Protocols
              </h3>
              <div className="space-y-1.5 text-xs text-slate-300">
                {response.recommended_next_steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Caveats */}
          {response.caveats && response.caveats.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Critical Engineering & Code Caveats
              </h3>
              <div className="space-y-1.5">
                {response.caveats.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verified Source Citations */}
          {response.citations && response.citations.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Referenced Engineering Codes & Standard Manuals
              </span>
              <div className="flex flex-wrap gap-2">
                {response.citations.map((cite, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 font-medium"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    {cite}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggested Knowledge Categories Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" /> Explore Curated Engineering Topics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {KNOWLEDGE_TOPICS.map((topic, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5 backdrop-blur-sm"
            >
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {topic.category}
              </h3>
              <div className="space-y-1.5">
                {topic.queries.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleSearch(q)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/60 hover:border-amber-500/30 text-xs text-slate-300 transition-all flex items-center justify-between group"
                  >
                    <span className="group-hover:text-amber-300 transition-colors">{q}</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 shrink-0 ml-2 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeAssistantPage;
