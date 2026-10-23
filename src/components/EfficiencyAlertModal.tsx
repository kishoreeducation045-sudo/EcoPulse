import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Wrench,
  DollarSign,
  Leaf,
  Volume2,
  X,
  CheckCircle2,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { SmartAppliance, EfficiencyDiagnosis, GridRegion } from '../types';
import { REGIONAL_BENCHMARKS } from '../data/mockTelemetry';
import { playNavSound } from '../utils/audioEffects';

interface EfficiencyAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  appliances: SmartAppliance[];
  selectedApplianceId: string | null;
  onSelectAppliance: (id: string) => void;
  selectedRegion: GridRegion;
  onRemediateAppliance: (id: string, targetKw: number) => void;
  focusedId: string;
}

export const EfficiencyAlertModal: React.FC<EfficiencyAlertModalProps> = ({
  isOpen,
  onClose,
  appliances,
  selectedApplianceId,
  onSelectAppliance,
  selectedRegion,
  onRemediateAppliance,
  focusedId,
}) => {
  const [diagnosis, setDiagnosis] = useState<EfficiencyDiagnosis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [applied, setApplied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter appliances that exceed regional benchmark by >= 15%
  const anomalousAppliances = appliances.map((app) => {
    const benchmark = REGIONAL_BENCHMARKS[app.category]?.averageKw || app.powerDrawKw;
    const excessPct = Math.round(((app.powerDrawKw - benchmark) / benchmark) * 100);
    return {
      ...app,
      benchmarkKw: benchmark,
      excessPct,
      isAnomalous: excessPct >= 15,
    };
  });

  const activeAppliance =
    anomalousAppliances.find((a) => a.id === selectedApplianceId) ||
    anomalousAppliances.find((a) => a.isAnomalous) ||
    anomalousAppliances[0];

  const handleDiagnose = async (applianceToDiagnose = activeAppliance) => {
    if (!applianceToDiagnose) return;
    setIsLoading(true);
    setApplied(false);
    try {
      const response = await fetch('/api/gemini/efficiency-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applianceName: applianceToDiagnose.name,
          brandModel: applianceToDiagnose.brandModel,
          category: applianceToDiagnose.category,
          powerDrawKw: applianceToDiagnose.powerDrawKw,
          durationHours: applianceToDiagnose.durationHours,
          regionalBenchmarkKw: applianceToDiagnose.benchmarkKw,
          excessPercentage: applianceToDiagnose.excessPct,
          gridRegion: selectedRegion,
          tariffRate: 0.24,
        }),
      });

      const resJson = await response.json();
      if (resJson.data) {
        setDiagnosis(resJson.data);
      } else if (resJson.fallbackData) {
        setDiagnosis(resJson.fallbackData);
      }
    } catch (err) {
      console.warn('Failed to fetch efficiency diagnosis, using fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const playVoiceAnnouncement = () => {
    if (!diagnosis?.alexaVoiceRecommendation) return;
    playNavSound('alexa');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(diagnosis.alexaVoiceRecommendation);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleApplyFix = () => {
    if (!activeAppliance) return;
    playNavSound('optimize');
    onRemediateAppliance(activeAppliance.id, activeAppliance.benchmarkKw);
    setApplied(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0d1220] border-2 border-amber-500/40 p-6 md:p-8 shadow-2xl space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span>Efficiency Anomaly Detected</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">Gemini Diagnostic Engine</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                Appliance Energy Efficiency Alert
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

        {/* Appliance Selector Strip */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Flagged Appliance:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {anomalousAppliances.map((app) => {
              const isSelected = activeAppliance?.id === app.id;
              return (
                <button
                  key={app.id}
                  id={`alert-select-${app.id}`}
                  onClick={() => {
                    playNavSound('focus');
                    onSelectAppliance(app.id);
                    setDiagnosis(null);
                    setApplied(false);
                  }}
                  className={`tv-focusable p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/60 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  } ${focusedId === `alert-select-${app.id}` ? 'tv-focused' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="truncate">{app.name}</span>
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        app.excessPct > 30 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      +{app.excessPct}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Draw: {app.powerDrawKw} kW</span>
                    <span>Avg: {app.benchmarkKw} kW</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Appliance Anomaly Banner */}
        {activeAppliance && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">{activeAppliance.name}</h3>
                <div className="text-xs text-slate-400">
                  {activeAppliance.brandModel} · Benchmark Standard:{' '}
                  <span className="text-slate-300 font-mono">{activeAppliance.benchmarkKw} kW</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold">
                  Excess: +{(activeAppliance.powerDrawKw - activeAppliance.benchmarkKw).toFixed(1)} kW (+
                  {activeAppliance.excessPct}%)
                </span>
                <button
                  id="btn-run-diagnosis"
                  onClick={() => {
                    playNavSound('optimize');
                    handleDiagnose();
                  }}
                  disabled={isLoading}
                  className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-60 ${
                    focusedId === 'btn-run-diagnosis' ? 'tv-focused' : ''
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Analyzing Telemetry...' : 'Diagnose with Gemini'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Diagnosis Output (Gemini 3.8 Flash) */}
        {diagnosis && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Alert Title Banner */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs font-semibold leading-relaxed">
              {diagnosis.alertTitle}
            </div>

            {/* Waste KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400">Annual Cost Waste</div>
                <div className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-0.5">
                  ${diagnosis.financialImpactYearly.toFixed(2)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-xs text-slate-400">Annual CO₂ Waste</div>
                <div className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-0.5">
                  {diagnosis.carbonWasteKgYearly.toFixed(1)} kg
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-xs text-slate-400">Severity Rating</div>
                <div className="text-sm font-bold uppercase font-mono text-amber-300 mt-1">
                  {diagnosis.severity} Priority
                </div>
              </div>
            </div>

            {/* Root Causes */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Identified Root Causes</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                {diagnosis.rootCauses.map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </div>

            {/* Actionable Suggestions */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Actionable Remediation Steps
              </div>
              <div className="space-y-2">
                {diagnosis.actionableSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.step}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {suggestion.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>{suggestion.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800">
                          {suggestion.difficulty}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 leading-relaxed">{suggestion.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alexa Voice Suggestion */}
            <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  <span>Alexa+ Voice Remediation</span>
                </div>
                <p className="text-slate-200 italic">"{diagnosis.alexaVoiceRecommendation}"</p>
              </div>

              <button
                onClick={playVoiceAnnouncement}
                className="shrink-0 text-sky-400 hover:text-white underline text-[11px]"
              >
                Hear Voice
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Dismiss Alert
          </button>

          {activeAppliance && (
            <button
              id="btn-remediate-now"
              onClick={handleApplyFix}
              disabled={applied}
              className={`tv-focusable px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                applied
                  ? 'bg-emerald-500 text-slate-950 cursor-default'
                  : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20'
              } ${focusedId === 'btn-remediate-now' ? 'tv-focused' : ''}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {applied
                  ? `Throttled to Benchmark (${activeAppliance.benchmarkKw} kW)`
                  : `Apply Eco-Throttle to Benchmark (${activeAppliance.benchmarkKw} kW)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
