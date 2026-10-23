import React from 'react';
import { HourlyForecast, SmartAppliance } from '../types';
import { Sun, AlertTriangle, ShieldCheck, Clock, Zap } from 'lucide-react';
import { playNavSound } from '../utils/audioEffects';

interface CarbonTimelineProps {
  forecast: HourlyForecast[];
  currentHour: number;
  setCurrentHour: (hour: number) => void;
  appliances: SmartAppliance[];
  focusedId: string;
}

export const CarbonTimeline: React.FC<CarbonTimelineProps> = ({
  forecast,
  currentHour,
  setCurrentHour,
  appliances,
  focusedId,
}) => {
  const maxCarbon = Math.max(...forecast.map((f) => f.carbonIntensity), 450);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              24-Hour Grid Carbon & Duck Curve
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any hour to inspect regional carbon intensity, tariff rates, and appliance schedule blocks.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60" />
              <span>Clean Window (&gt;65% Renewable)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/60" />
              <span>Peak Carbon / Peaker Plants</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="w-3 h-3 rounded bg-sky-500/40" />
              <span>Scheduled Appliance Block</span>
            </div>
          </div>
        </div>

        {/* The 24-Hour Visual Chart Bar Grid */}
        <div className="mt-8 space-y-2">
          <div className="h-48 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800">
            {forecast.map((slot) => {
              const isCurrent = slot.hour === currentHour;
              const heightPct = Math.max(12, Math.round((slot.carbonIntensity / maxCarbon) * 100));
              const isClean = slot.isCleanWindow;
              const isPeak = slot.isPeak;

              // Check if appliances are scheduled for this hour
              const activeAppliances = appliances.filter(
                (a) =>
                  slot.hour >= a.scheduledStartHour &&
                  slot.hour < a.scheduledStartHour + a.durationHours
              );

              return (
                <div
                  key={slot.hour}
                  id={`timeline-hour-${slot.hour}`}
                  onClick={() => {
                    playNavSound('focus');
                    setCurrentHour(slot.hour);
                  }}
                  className={`group relative flex-1 flex flex-col justify-end items-center cursor-pointer transition-all ${
                    isCurrent ? 'opacity-100 scale-105 z-20' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-24 hidden group-hover:flex flex-col items-center bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] whitespace-nowrap shadow-xl z-30 pointer-events-none">
                    <span className="font-bold text-white">{slot.timeLabel}</span>
                    <span className="font-mono text-emerald-400 tabular-nums">
                      {slot.carbonIntensity} gCO₂/kWh
                    </span>
                    <span className="text-slate-300">
                      {slot.renewablePct}% Clean · ${slot.tariffRate}/kWh
                    </span>
                    {activeAppliances.length > 0 && (
                      <span className="text-sky-300 font-semibold mt-0.5">
                        {activeAppliances.length} appliance(s) running
                      </span>
                    )}
                  </div>

                  {/* Appliance dot marker on top of bar */}
                  {activeAppliances.length > 0 && (
                    <div className="mb-1.5 flex gap-0.5">
                      {activeAppliances.map((app) => (
                        <span
                          key={app.id}
                          className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400"
                          title={app.name}
                        />
                      ))}
                    </div>
                  )}

                  {/* The Carbon Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      isClean
                        ? 'bg-gradient-to-t from-emerald-600/40 to-emerald-400 border-t-2 border-emerald-400'
                        : isPeak
                        ? 'bg-gradient-to-t from-amber-600/40 to-amber-400 border-t-2 border-amber-400'
                        : 'bg-gradient-to-t from-slate-700/50 to-slate-500 border-t-2 border-slate-400'
                    } ${isCurrent ? 'ring-2 ring-white' : ''}`}
                  />
                </div>
              );
            })}
          </div>

          {/* Time Labels under bars */}
          <div className="flex gap-1.5 text-center text-[10px] font-mono text-slate-400 pt-1">
            {forecast.map((slot) => (
              <button
                key={slot.hour}
                onClick={() => {
                  playNavSound('focus');
                  setCurrentHour(slot.hour);
                }}
                className={`flex-1 hover:text-white transition-colors py-0.5 rounded ${
                  slot.hour === currentHour ? 'text-emerald-400 font-bold bg-slate-800' : ''
                }`}
              >
                {slot.hour % 3 === 0 ? slot.timeLabel.replace(':00 ', '') : '·'}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Hour Deep Dive Card */}
        {forecast[currentHour] && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div>
              <div className="text-xs text-slate-400">Selected Interval</div>
              <div className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{forecast[currentHour].timeLabel}</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Carbon Intensity</div>
              <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
                {forecast[currentHour].carbonIntensity} gCO₂/kWh
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Renewable Grid Mix</div>
              <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">
                {forecast[currentHour].renewablePct}% Clean
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Applicable TOU Tariff</div>
              <div className="text-lg font-bold font-mono text-amber-400 tabular-nums mt-0.5">
                ${forecast[currentHour].tariffRate} / kWh
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
