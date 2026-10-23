import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Volume2, X, ArrowRight } from 'lucide-react';
import { OptimizationResult } from '../types';
import { playNavSound } from '../utils/audioEffects';

interface OptimizationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: OptimizationResult | null;
  onApplySchedule: () => void;
}

export const OptimizationResultModal: React.FC<OptimizationResultModalProps> = ({
  isOpen,
  onClose,
  result,
  onApplySchedule,
}) => {
  if (!isOpen || !result) return null;

  const playVoiceAnnouncement = () => {
    playNavSound('alexa');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(result.alexaVoiceBriefing);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatHour = (h: number) => {
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0c111d] border border-emerald-500/30 p-6 md:p-8 shadow-2xl space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                EcoPulse AI Optimizer
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                Load Shift Strategy Generated
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive summary */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs leading-relaxed space-y-2">
          <div className="text-white font-semibold">{result.summary}</div>
          <div className="text-emerald-400 font-medium">
            💡 {result.cleanWindowRecommendation}
          </div>
        </div>

        {/* 3 Savings KPIs */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400">Carbon Avoided</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
              +{result.projectedCo2SavedKg} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400">Tariff Saved</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums mt-0.5">
              ${result.projectedCostSavedDollars}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400">Peak Shaved</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-sky-400 tabular-nums mt-0.5">
              {result.peakGridAvoidedKw} <span className="text-xs font-normal text-slate-400">kW</span>
            </div>
          </div>
        </div>

        {/* Rescheduled Appliances breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recommended Appliance Windows
          </div>

          <div className="space-y-2">
            {result.applianceSchedules.map((schedule, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white capitalize">
                    {schedule.id.replace('_', ' ')}
                  </div>
                  <div className="text-slate-400 mt-0.5">{schedule.rationale}</div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-emerald-300 font-bold">
                    {formatHour(schedule.recommendedStartHour)} – {formatHour(schedule.recommendedEndHour)}
                  </div>
                  <div className="text-emerald-400 font-mono text-[11px]">
                    +{schedule.carbonSavingsGrams}g CO₂
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alexa Voice Briefing Box */}
        <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-sky-300">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>Alexa+ Voice Briefing</span>
            </div>
            <button
              onClick={playVoiceAnnouncement}
              className="text-sky-300 hover:text-white underline text-[11px] font-normal"
            >
              Play Voice
            </button>
          </div>
          <p className="text-xs text-slate-200 italic leading-relaxed">
            "{result.alexaVoiceBriefing}"
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              playNavSound('select');
              onApplySchedule();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Schedule to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
