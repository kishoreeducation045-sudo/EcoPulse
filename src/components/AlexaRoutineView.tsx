import React, { useState } from 'react';
import { Mic, Terminal, Volume2, Sparkles, Check, Copy, MessageSquare } from 'lucide-react';
import { AlexaRoutineResult, GridRegion } from '../types';
import { playNavSound } from '../utils/audioEffects';

interface AlexaRoutineViewProps {
  routineData: AlexaRoutineResult | null;
  onGenerateRoutine: (goal: string) => void;
  isGenerating: boolean;
  selectedRegion: GridRegion;
  focusedId: string;
}

export const AlexaRoutineView: React.FC<AlexaRoutineViewProps> = ({
  routineData,
  onGenerateRoutine,
  isGenerating,
  selectedRegion,
  focusedId,
}) => {
  const [customGoal, setCustomGoal] = useState('');
  const [copiedMcp, setCopiedMcp] = useState(false);
  const [simulatedVoicePlaying, setSimulatedVoicePlaying] = useState(false);

  const sampleGoals = [
    'Schedule EV charging strictly during regional solar surplus (>70% clean)',
    'Pre-cool home with heat pump HVAC before evening 5 PM peaker peak',
    'Defer dishwasher and dryer whenever grid carbon spikes above 300 gCO2',
  ];

  const handleCopyMcp = () => {
    if (!routineData?.mcpToolDefinition) return;
    navigator.clipboard.writeText(JSON.stringify(routineData.mcpToolDefinition, null, 2));
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const playVoiceSample = (text: string) => {
    playNavSound('alexa');
    setSimulatedVoicePlaying(true);
    // Use Web Speech API if supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setSimulatedVoicePlaying(false);
      utterance.onerror = () => setSimulatedVoicePlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSimulatedVoicePlaying(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Track Description Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 border border-sky-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Amazon Hackathon Track
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300">Alexa+ & Agentic AI / MCP</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Alexa+ Smart Agent Routine & MCP Server
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-slate-300 font-mono">
            <span>Model Context Protocol (MCP)</span>
            <span className="text-emerald-400">Ready</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300 leading-relaxed max-w-3xl">
          EcoPulse integrates with Alexa+ via a Model Context Protocol (MCP) server. When a household member interacts with Alexa or when grid carbon thresholds cross limits, the agent autonomously calls the <code className="text-sky-300 font-mono">reschedule_smart_appliance</code> tool to execute load shifting.
        </p>
      </div>

      {/* Goal Selector & Generator */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Synthesize Custom Alexa+ Routine with Gemini 3.8 Flash
        </label>

        <div className="flex flex-wrap gap-2">
          {sampleGoals.map((goal, idx) => (
            <button
              key={idx}
              id={`sample-goal-${idx}`}
              onClick={() => {
                playNavSound('focus');
                setCustomGoal(goal);
                onGenerateRoutine(goal);
              }}
              className={`tv-focusable text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700 text-left transition-colors ${
                focusedId === `sample-goal-${idx}` ? 'tv-focused' : ''
              }`}
            >
              {goal}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="Or type a custom home energy goal (e.g., Run pool pump only when solar > 4 kW)..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
          />
          <button
            id="btn-gen-routine"
            onClick={() => {
              playNavSound('optimize');
              onGenerateRoutine(customGoal);
            }}
            disabled={isGenerating}
            className={`tv-focusable px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 active:bg-sky-600 transition-all flex items-center gap-2 shrink-0 disabled:opacity-60 ${
              focusedId === 'btn-gen-routine' ? 'tv-focused' : ''
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate Agent Routine'}</span>
          </button>
        </div>
      </div>

      {/* Routine Result Split */}
      {routineData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Simulated Alexa+ Dialogue */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Voice Dialogue Simulation</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Alexa+ Persona</span>
            </div>

            <div className="space-y-3">
              {routineData.voiceDialogSample.map((dialog, i) => {
                const isUser = dialog.speaker.toLowerCase().includes('user');
                return (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-slate-800/80 text-slate-200 border border-slate-700/80 ml-4'
                        : 'bg-sky-950/40 text-sky-200 border border-sky-500/30 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px] mb-1 opacity-75">
                      <span>{dialog.speaker}</span>
                      {!isUser && (
                        <button
                          onClick={() => playVoiceSample(dialog.text)}
                          className="flex items-center gap-1 text-sky-400 hover:text-white transition-colors"
                          title="Play simulated voice output"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Speak</span>
                        </button>
                      )}
                    </div>
                    <p>{dialog.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Alexa Utterances */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Supported Voice Utterances
              </div>
              <div className="space-y-1.5">
                {routineData.alexaUtterances.map((utt, i) => (
                  <div
                    key={i}
                    className="text-xs text-slate-300 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"
                  >
                    "{utt}"
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Model Context Protocol (MCP) Tool Definition */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Model Context Protocol (MCP) Schema
                </h3>
              </div>
              <button
                onClick={handleCopyMcp}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors"
              >
                {copiedMcp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMcp ? 'Copied' : 'Copy Schema'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {routineData.agentRoutineSummary}
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-80 leading-relaxed">
              {JSON.stringify(routineData.mcpToolDefinition, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
