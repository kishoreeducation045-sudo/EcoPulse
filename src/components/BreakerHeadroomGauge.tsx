/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Breaker Headroom Gauge & Overload Safety Monitor
 * 
 * Displays household electrical panel capacity, continuous planning budget,
 * real-time draw, and 24h schedule concurrency. Offers 1-click auto-staggering.
 */

import React from 'react';
import { AlertTriangle, ShieldCheck, Zap, Sliders, CheckCircle2 } from 'lucide-react';
import { ServicePanelConfig, BreakerAnalysisResult } from '../utils/breakerSafety';
import { playNavSound } from '../utils/audioEffects';

interface BreakerHeadroomGaugeProps {
  panelConfig: ServicePanelConfig;
  breakerAnalysis: BreakerAnalysisResult;
  currentDrawKw: number;
  baselineDrawKw: number;
  onChangePanelAmps: (amps: 100 | 125 | 150 | 200) => void;
  onAutoStaggerSchedule: () => void;
  focusedId: string;
}

export const BreakerHeadroomGauge: React.FC<BreakerHeadroomGaugeProps> = ({
  panelConfig,
  breakerAnalysis,
  currentDrawKw,
  baselineDrawKw,
  onChangePanelAmps,
  onAutoStaggerSchedule,
  focusedId,
}) => {
  const currentUtilizationPct = Math.min(
    100,
    Math.round((currentDrawKw / panelConfig.planningBudgetKw) * 100)
  );
  const peakUtilizationPct = Math.min(
    150,
    Math.round((breakerAnalysis.peakTotalKw / panelConfig.planningBudgetKw) * 100)
  );

  const isCurrentNearLimit = currentDrawKw >= panelConfig.planningBudgetKw * 0.85;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
      {/* Header with Panel Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              breakerAnalysis.isOverloaded
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Electrical Service Panel &amp; Breaker Safety Governor
              </h3>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-emerald-400">
                {panelConfig.serviceAmps}A Service ({panelConfig.planningBudgetKw} kW Budget)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              80% NEC continuous planning budget at 240V · Simulating total house load to prevent nuisance breaker trips
            </p>
          </div>
        </div>

        {/* Panel Amperage Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800 shrink-0">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Rating:</span>
          {([100, 125, 150, 200] as const).map((amps) => (
            <button
              key={amps}
              id={`panel-select-${amps}`}
              onClick={() => {
                playNavSound('focus');
                onChangePanelAmps(amps);
              }}
              className={`tv-focusable px-2.5 py-1 text-xs font-mono rounded transition-all ${
                panelConfig.serviceAmps === amps
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              } ${focusedId === `panel-select-${amps}` ? 'tv-focused' : ''}`}
            >
              {amps}A
            </button>
          ))}
        </div>
      </div>

      {/* Main Gauges Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Real-time Draw Meter */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Real-Time Total House Draw (Estimated)</span>
            <span className="font-mono text-white font-bold tabular-nums">
              {currentDrawKw.toFixed(1)} / {panelConfig.planningBudgetKw} kW ({currentUtilizationPct}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCurrentNearLimit
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, currentUtilizationPct)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>
              Uncontrollable Baseline: <strong className="text-slate-300 font-mono">{baselineDrawKw} kW</strong>
            </span>
            <span>
              Available Headroom:{' '}
              <strong className="text-emerald-400 font-mono">
                {Math.max(0, panelConfig.planningBudgetKw - currentDrawKw).toFixed(1)} kW
              </strong>
            </span>
          </div>
        </div>

        {/* 24-Hour Peak Concurrency Forecast */}
        <div
          className={`p-4 rounded-xl border space-y-2 ${
            breakerAnalysis.isOverloaded
              ? 'bg-rose-950/20 border-rose-500/40'
              : 'bg-slate-950/60 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">24h Schedule Peak Concurrency</span>
              {breakerAnalysis.isOverloaded ? (
                <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                  Overload Risk
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Safe Margin
                </span>
              )}
            </div>
            <span
              className={`font-mono font-bold tabular-nums ${
                breakerAnalysis.isOverloaded ? 'text-rose-400' : 'text-white'
              }`}
            >
              Peak: {breakerAnalysis.peakTotalKw.toFixed(1)} kW @ {breakerAnalysis.worstTimeSlot}
            </span>
          </div>

          {/* Peak Concurrency Progress Bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                breakerAnalysis.isOverloaded
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, (breakerAnalysis.peakTotalKw / panelConfig.planningBudgetKw) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>
              {breakerAnalysis.isOverloaded
                ? `Exceeds budget by +${breakerAnalysis.maxOverloadKw} kW`
                : `Peak uses ${peakUtilizationPct}% of planning budget`}
            </span>
            <span className="text-slate-400">
              {breakerAnalysis.overloadedSlicesCount > 0
                ? `${breakerAnalysis.overloadedSlicesCount} half-hour slices conflicted`
                : 'All intervals verified compliant'}
            </span>
          </div>
        </div>
      </div>

      {/* Overload Alert & Staggering Banner */}
      {breakerAnalysis.isOverloaded && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300">
                Breaker Concurrency Warning: Peak draw exceeds {panelConfig.planningBudgetKw} kW budget
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Simultaneously running multiple heavy loads (EV charger, heat pump, or dryer) risks tripping main/branch breakers.
              </div>
            </div>
          </div>

          <button
            id="btn-auto-stagger-loads"
            onClick={() => {
              playNavSound('optimize');
              onAutoStaggerSchedule();
            }}
            className={`tv-focusable px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-400 transition-all shrink-0 shadow-md shadow-rose-500/20 flex items-center gap-1.5 ${
              focusedId === 'btn-auto-stagger-loads' ? 'tv-focused' : ''
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Auto-Stagger Schedule Into Clean Windows</span>
          </button>
        </div>
      )}

      {/* Safe Affirmation Banner */}
      {!breakerAnalysis.isOverloaded && (
        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Deterministic Breaker Governor active: Peak concurrency ({breakerAnalysis.peakTotalKw} kW) verified within the {panelConfig.planningBudgetKw} kW panel planning budget.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            NEC 80% continuous factor satisfied
          </span>
        </div>
      )}
    </div>
  );
};
