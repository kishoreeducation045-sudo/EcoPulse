import React, { useState } from 'react';
import { SmartAppliance } from '../types';
import { ApplianceCard } from './ApplianceCard';
import { BreakerHeadroomGauge } from './BreakerHeadroomGauge';
import { ServicePanelConfig, BreakerAnalysisResult } from '../utils/breakerSafety';
import { Zap, ShieldCheck, Sparkles, Filter, AlertTriangle } from 'lucide-react';
import { REGIONAL_BENCHMARKS } from '../data/mockTelemetry';
import { playNavSound } from '../utils/audioEffects';

interface ApplianceHubProps {
  appliances: SmartAppliance[];
  panelConfig: ServicePanelConfig;
  breakerAnalysis: BreakerAnalysisResult;
  currentDrawKw: number;
  baselineDrawKw: number;
  onChangePanelAmps: (amps: 100 | 125 | 150 | 200) => void;
  onAutoStaggerSchedule: () => void;
  onUpdateSchedule: (id: string, newStartHour: number) => void;
  onToggleStatus: (id: string) => void;
  onAlignToOptimal: (id: string) => void;
  onOptimizeAll: () => void;
  onOpenEfficiencyAlert: (id?: string) => void;
  isOptimizing: boolean;
  focusedId: string;
}

export const ApplianceHub: React.FC<ApplianceHubProps> = ({
  appliances,
  panelConfig,
  breakerAnalysis,
  currentDrawKw,
  baselineDrawKw,
  onChangePanelAmps,
  onAutoStaggerSchedule,
  onUpdateSchedule,
  onToggleStatus,
  onAlignToOptimal,
  onOptimizeAll,
  onOpenEfficiencyAlert,
  isOptimizing,
  focusedId,
}) => {
  const [filter, setFilter] = useState<'all' | 'flexible' | 'running' | 'high_draw'>('all');

  const filteredAppliances = appliances.filter((a) => {
    if (filter === 'flexible') return a.priority === 'flexible';
    if (filter === 'running') return a.status === 'running';
    if (filter === 'high_draw') return a.powerDrawKw >= 3.0;
    return true;
  });

  const totalFlexibleKw = appliances
    .filter((a) => a.priority === 'flexible')
    .reduce((sum, a) => sum + a.powerDrawKw, 0);

  const totalCarbonSavedKg = (
    appliances.reduce((sum, a) => sum + a.carbonSavedGrams, 0) / 1000
  ).toFixed(1);

  const totalCostSaved = appliances
    .reduce((sum, a) => sum + a.costSavedDollars, 0)
    .toFixed(2);

  return (
    <div className="space-y-6">
      {/* Real-World Breaker Headroom & Concurrency Governor */}
      <BreakerHeadroomGauge
        panelConfig={panelConfig}
        breakerAnalysis={breakerAnalysis}
        currentDrawKw={currentDrawKw}
        baselineDrawKw={baselineDrawKw}
        onChangePanelAmps={onChangePanelAmps}
        onAutoStaggerSchedule={onAutoStaggerSchedule}
        focusedId={focusedId}
      />

      {/* Top Banner KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Flexible Load Capacity</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
            {totalFlexibleKw.toFixed(1)} <span className="text-sm font-normal text-slate-400">kW</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Available to absorb solar spikes & grid surplus
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cumulative Carbon Saved</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
            {totalCarbonSavedKg} <span className="text-sm font-normal text-slate-400">kg CO₂</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Across 5 scheduled smart appliances
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Tariff Savings</span>
            <span className="font-mono text-xs text-amber-400">Time-of-Use</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
            ${totalCostSaved}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            By shifting high loads out of peak tariff hours
          </div>
        </div>
      </div>

      {/* Top Efficiency Anomaly Alert Banner */}
      {(() => {
        const anomalousCount = appliances.filter((a) => {
          const benchmark = REGIONAL_BENCHMARKS[a.category]?.averageKw || a.powerDrawKw;
          return (a.powerDrawKw - benchmark) / benchmark >= 0.15;
        }).length;

        if (anomalousCount === 0) return null;

        return (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/30 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Efficiency Alert · {anomalousCount} Appliance(s) Flagged
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  High draw detected above regional baseline. Gemini AI diagnosis & remediation ready.
                </div>
              </div>
            </div>

            <button
              id="btn-open-efficiency-overlay"
              onClick={() => {
                playNavSound('focus');
                onOpenEfficiencyAlert();
              }}
              className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shrink-0 shadow-md shadow-amber-500/20 ${
                focusedId === 'btn-open-efficiency-overlay' ? 'tv-focused' : ''
              }`}
            >
              Inspect Efficiency Alerts →
            </button>
          </div>
        );
      })()}

      {/* Control bar: Filter Tabs & AI Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
          <button
            id="filter-all"
            onClick={() => {
              playNavSound('focus');
              setFilter('all');
            }}
            className={`tv-focusable px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            } ${focusedId === 'filter-all' ? 'tv-focused' : ''}`}
          >
            All Appliances ({appliances.length})
          </button>
          <button
            id="filter-flexible"
            onClick={() => {
              playNavSound('focus');
              setFilter('flexible');
            }}
            className={`tv-focusable px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'flexible'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            } ${focusedId === 'filter-flexible' ? 'tv-focused' : ''}`}
          >
            Flexible Loads
          </button>
          <button
            id="filter-high"
            onClick={() => {
              playNavSound('focus');
              setFilter('high_draw');
            }}
            className={`tv-focusable px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'high_draw'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            } ${focusedId === 'filter-high' ? 'tv-focused' : ''}`}
          >
            Heavy (&gt;3 kW)
          </button>
        </div>

        <button
          id="btn-rebalance-all"
          onClick={() => {
            playNavSound('optimize');
            onOptimizeAll();
          }}
          disabled={isOptimizing}
          className={`tv-focusable flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-60 ${
            focusedId === 'btn-rebalance-all' ? 'tv-focused' : ''
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
          <span>{isOptimizing ? 'Analyzing Grid Ducks...' : 'Auto-Shift All to Clean Hours'}</span>
        </button>
      </div>

      {/* Grid of Appliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAppliances.map((appliance) => (
          <ApplianceCard
            key={appliance.id}
            appliance={appliance}
            onUpdateSchedule={onUpdateSchedule}
            onToggleStatus={onToggleStatus}
            onAlignToOptimal={onAlignToOptimal}
            onOpenEfficiencyAlert={onOpenEfficiencyAlert}
            focusedId={focusedId}
          />
        ))}
      </div>
    </div>
  );
};
