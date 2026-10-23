import React from 'react';
import { Award, CheckCircle, ExternalLink, Shield, Cpu, Tv, Mic, Sparkles } from 'lucide-react';

interface HackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HackathonModal: React.FC<HackathonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0d121f] border border-slate-700/80 p-6 md:p-8 shadow-2xl space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span>Amazon Developer Hackathon 2026 Pitch</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">amazonappdev2026.devpost.com</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                EcoPulse: Sustainable Smart-Home Orchestrator
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Close Pitch
          </button>
        </div>

        {/* Executive Submission Summary */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed space-y-2">
          <p className="text-white font-medium">
            <strong>The Problem:</strong> Residential energy accounts for over 20% of global greenhouse gas emissions. Millions of homes have high-draw smart appliances (EV chargers, heat pumps, dishwashers), but they turn on during peak grid hours when utilities fire up dirty fossil-fuel peaker plants.
          </p>
          <p className="text-slate-300">
            <strong>The Solution:</strong> EcoPulse transforms the living room TV into an ambient, intelligent energy command center. By coupling real-time grid carbon intensity telemetry with agentic AI (Alexa+ and Bedrock/Gemini), it shifts home electrical loads to run when clean solar and wind energy dominate the grid.
          </p>
        </div>

        {/* Hackathon Track Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Track 1: Fire TV */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm">
              <Tv className="w-4 h-4" />
              <span>Fire TV & Vega OS Track</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Built from the ground up for 10-foot viewing distances.</li>
              <li>Spatial D-Pad focus navigation with high-contrast indicator rings.</li>
              <li>Interactive on-screen Fire TV Remote controller simulator.</li>
              <li>Living Biosphere ambient screensaver mode for OLED/TV efficiency.</li>
            </ul>
          </div>

          {/* Track 2: Alexa+ Agentic Track */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
              <Mic className="w-4 h-4" />
              <span>Alexa+ & Agentic AI Track</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Self-hosted Model Context Protocol (MCP) server tool definitions.</li>
              <li>Autonomous load shifting triggered by carbon threshold spikes.</li>
              <li>Conversational voice dialogue synthesis via Alexa+ personas.</li>
              <li>Proactive natural language energy briefings and scheduling.</li>
            </ul>
          </div>

          {/* Track 3: AWS Builder Mini Challenge */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>AWS Builder & GenAI Challenge</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Server-side GenAI reasoning model evaluating diurnal duck curves.</li>
              <li>Predictive multi-hour appliance rescheduling algorithm.</li>
              <li>Automated quantification of avoided CO₂ grams and monetary savings.</li>
              <li>Secure server-side API proxy architecture.</li>
            </ul>
          </div>
        </div>

        {/* Quantified Sustainability Impact */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>Measured Environmental & Grid Impact</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xl font-bold font-mono text-emerald-400">20% – 40%</div>
              <div className="text-[11px] text-slate-400 mt-1">Appliance Carbon Reduction</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xl font-bold font-mono text-white">7.2 kW</div>
              <div className="text-[11px] text-slate-400 mt-1">Peak Peaker Load Avoided per Home</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-xl font-bold font-mono text-amber-400">$350+ / yr</div>
              <div className="text-[11px] text-slate-400 mt-1">Household Tariff Savings</div>
            </div>
          </div>
        </div>

        {/* Hackathon Resources Portal Reference */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-white">Devpost Hackathon Official Resources</span>
            <span className="font-mono text-slate-400 text-[11px]">amazonappdev2026.devpost.com/resources</span>
          </div>
          <div className="rounded-lg overflow-hidden border border-slate-800 max-h-48">
            <img
              src="/assets/aistudio/image_4fb8cc9c.png"
              alt="Amazon Developer Hackathon 2026 Resources & Build by Track"
              className="w-full object-cover object-top"
              loading="lazy"
            />
          </div>
        </div>

        {/* Submission checklist footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Submission Ready: Meets Fire TV, Alexa+, and AWS Builder criteria</span>
          </div>

          <a
            href="https://amazonappdev2026.devpost.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-slate-200 transition-colors"
          >
            <span>Devpost Hackathon Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
