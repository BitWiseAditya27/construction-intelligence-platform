import React, { useState, useRef, useEffect } from 'react';
import {
  MessagesSquare,
  Send,
  Loader2,
  HardHat,
  Bot,
  User,
  ListChecks,
  AlertTriangle,
  Building,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { useProject } from '../context/ProjectContext';

const QUICK_PROMPTS = [
  'Generate morning toolbox safety talk points for edge work',
  'What is the standard pour card pre-requisite checklist for a raft?',
  'Draft a Daily Progress Report (DPR) entry for 45m3 slab concreting',
  'How should we handle delayed transit mix trucks beyond 90 minutes?',
  'What are the key inspection hold points for rebar lap staggering?'
];

export const SiteAssistantPage = () => {
  const { activeProject } = useProject();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello Superintendent! I am your AI Daily Site Assistant. Ask me about concrete slump tolerances, pre-pour sign-offs, site logistics, daily checklists, or schedule coordination.',
      metadata: {
        recommended_next_steps: [
          'Verify today’s pour cards and slump testing equipment',
          'Check weather advisory before staging external coatings',
          'Review subcontractor PPE adherence at morning briefing'
        ],
        caveats: [
          'All verbal recommendations must align with project specification drawings and engineer sign-offs.'
        ]
      },
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`site_${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.sendChat({
        message: textToSend,
        session_id: sessionId,
        project_id: activeProject?.id || null,
        context_type: 'daily_site'
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.answer,
        explanation: res.explanation,
        metadata: {
          recommended_next_steps: res.recommended_next_steps,
          caveats: res.caveats,
          citations: res.citations
        },
        is_demo_mode: res.is_demo_mode,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach site assistant service. Please check connection and retry.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight">
              Daily Site Assistant
            </h1>
            <p className="text-xs text-slate-400">
              Interactive site engineering copilot for materials, QA/QC hold points, DPR reporting, and coordination.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSessionId(`site_${Date.now()}`);
            setMessages([]);
          }}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 p-2 rounded-xl border border-slate-800 bg-slate-900/60"
        >
          <RefreshCw className="w-3.5 h-3.5" /> New Session
        </button>
      </div>

      <DisclaimerBanner text="ADVISORY NOTE: Daily site assistant responses provide field best-practice guidance. Project structural specifications and resident engineer instructions strictly take precedence." />

      {/* Chat Area Container */}
      <div className="flex-1 min-h-0 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm flex flex-col overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs space-y-2.5 ${
                  msg.role === 'user'
                    ? 'bg-amber-600 text-slate-950 font-medium rounded-br-xs'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-amber-950' : 'text-amber-400'}`}>
                    {msg.role === 'user' ? 'Site Superintendent' : 'BuildMind Field Copilot'}
                  </span>
                  <span className={`text-[10px] ${msg.role === 'user' ? 'text-amber-900' : 'text-slate-500'}`}>
                    {msg.time}
                  </span>
                </div>

                <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>

                {/* Explanation */}
                {msg.explanation && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                    <strong className="text-slate-100 block mb-1">Technical Method Statement:</strong>
                    <p className="leading-relaxed">{msg.explanation}</p>
                  </div>
                )}

                {/* Recommended Next Steps */}
                {msg.metadata?.recommended_next_steps && msg.metadata.recommended_next_steps.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Actionable Checklist
                    </span>
                    <ul className="space-y-1">
                      {msg.metadata.recommended_next_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Caveats */}
                {msg.metadata?.caveats && msg.metadata.caveats.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-amber-300/80 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{msg.metadata.caveats.join(' ')}</span>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="p-2 rounded-xl bg-slate-700 text-slate-200 shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Formulating engineering method statement & checklists...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <span className="text-slate-500 shrink-0 font-medium">Quick Prompts:</span>
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about slump testing, formwork stripping times, rebar covers, safety checklists..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-amber-600 text-slate-950 font-bold text-xs hover:bg-amber-500 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SiteAssistantPage;
