import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Sun,
  Wind,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Target,
  Plus,
  Minus,
  Cloud,
  CloudSun,
  CloudRain,
  Thermometer,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Smile,
} from 'lucide-react';
import { GridRegion, HourlyForecast, WeatherData } from '../types';
import { REGION_DETAILS } from '../data/mockTelemetry';
import { playNavSound } from '../utils/audioEffects';
import { speakMessage, stopSpeaking } from '../utils/speechVoice';

interface AmbientBiosphereProps {
  currentHour: number;
  setCurrentHour: (hour: number | ((prev: number) => number)) => void;
  forecast: HourlyForecast[];
  selectedRegion: GridRegion;
  setSelectedRegion: (region: GridRegion) => void;
  homeDrawKw: number;
  solarKw: number;
  dailyCarbonBudgetKg?: number;
  onUpdateDailyBudget?: (val: number) => void;
  onOpenApplianceHub: () => void;
  onOptimize: () => void;
  isSimpleMode?: boolean;
  focusedId: string;
}

export const AmbientBiosphere: React.FC<AmbientBiosphereProps> = ({
  currentHour,
  setCurrentHour,
  forecast,
  selectedRegion,
  setSelectedRegion,
  homeDrawKw,
  solarKw,
  dailyCarbonBudgetKg = 6.0,
  onUpdateDailyBudget,
  onOpenApplianceHub,
  onOptimize,
  isSimpleMode = false,
  focusedId,
}) => {
  const [budgetKg, setBudgetKg] = useState<number>(dailyCarbonBudgetKg);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F');
  const [isSpeakingStatus, setIsSpeakingStatus] = useState<boolean>(false);

  const handleSpeakStatus = () => {
    playNavSound('select');
    if (isSpeakingStatus) {
      stopSpeaking();
      setIsSpeakingStatus(false);
    } else {
      let msg = '';
      if (isSuperClean) {
        msg = `Good news! Right now at ${currentSlot.timeLabel}, electricity is clean and cheap because of strong solar power. It is a wonderful time to wash clothes, run your dishwasher, or charge your car.`;
      } else if (isPeakCarbon) {
        msg = `Notice: Right now at ${currentSlot.timeLabel}, electricity is expensive and dirty. Hold off on running heavy machines like the dryer or car charger until later to save money!`;
      } else {
        msg = `Electricity is currently normal at ${currentSlot.timeLabel}. Peak clean solar sunshine will arrive between 11 AM and 3 PM.`;
      }

      setIsSpeakingStatus(true);
      speakMessage(msg, {
        onEnd: () => setIsSpeakingStatus(false),
        onError: () => setIsSpeakingStatus(false),
      });
    }
  };

  useEffect(() => {
    setBudgetKg(dailyCarbonBudgetKg);
  }, [dailyCarbonBudgetKg]);

  const fetchWeather = useCallback(async (region: GridRegion) => {
    setIsWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?region=${region}`);
      const json = await res.json();
      if (json.data) {
        setWeatherData(json.data);
      }
    } catch (err) {
      console.warn('Weather fetch warning:', err);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(selectedRegion);
  }, [selectedRegion, fetchWeather]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-4 h-4 text-amber-400" />;
    if (code <= 2) return <CloudSun className="w-4 h-4 text-amber-300" />;
    if (code <= 48) return <Cloud className="w-4 h-4 text-slate-300" />;
    if (code <= 82) return <CloudRain className="w-4 h-4 text-cyan-400" />;
    return <Sun className="w-4 h-4 text-amber-400" />;
  };

  const currentSlot = forecast[currentHour] || forecast[12];
  const carbon = currentSlot.carbonIntensity;
  const renewablePct = currentSlot.renewablePct;
  const netGridKw = parseFloat((homeDrawKw - solarKw).toFixed(2));
  const isExporting = netGridKw < 0;

  // Determine state tier
  const isSuperClean = renewablePct >= 65 || carbon <= 120;
  const isPeakCarbon = currentSlot.isPeak || carbon >= 320;

  // Next clean window detection
  const nextCleanWindow = useMemo(() => {
    const upcoming = forecast.slice(currentHour).concat(forecast.slice(0, currentHour));
    const cleanSlot = upcoming.find((s) => s.isCleanWindow);
    if (!cleanSlot) return 'Tomorrow morning at 10:00 AM';
    if (cleanSlot.hour === currentHour) return 'Active Right Now (Peak Renewable Surplus)';
    return `Today at ${cleanSlot.timeLabel} (${cleanSlot.renewablePct}% Clean)`;
  }, [forecast, currentHour]);

  // Color theme variables based on cleanliness
  const canopyColor = isSuperClean
    ? '#10b981' // emerald
    : isPeakCarbon
    ? '#f59e0b' // amber
    : '#06b6d4'; // cyan

  const ringGlow = isSuperClean
    ? 'rgba(16, 185, 129, 0.4)'
    : isPeakCarbon
    ? 'rgba(245, 158, 11, 0.35)'
    : 'rgba(6, 182, 212, 0.35)';

  // Sustainability Budget calculations
  const { accumulatedCarbonKg, projectedDayTotalKg } = useMemo(() => {
    let accumulatedGrams = 0;
    let projectedRemainingGrams = 0;

    forecast.forEach((slot) => {
      const netHourlyDrawKw = Math.max(0.4, homeDrawKw - slot.solarKw);
      const emissionsGrams = netHourlyDrawKw * slot.carbonIntensity;

      if (slot.hour <= currentHour) {
        accumulatedGrams += emissionsGrams;
      } else {
        projectedRemainingGrams += emissionsGrams;
      }
    });

    return {
      accumulatedCarbonKg: parseFloat((accumulatedGrams / 1000).toFixed(1)),
      projectedDayTotalKg: parseFloat(((accumulatedGrams + projectedRemainingGrams) / 1000).toFixed(1)),
    };
  }, [forecast, currentHour, homeDrawKw]);

  const budgetPercent = Math.min(100, Math.round((accumulatedCarbonKg / budgetKg) * 100));
  const remainingHeadroomKg = parseFloat((budgetKg - accumulatedCarbonKg).toFixed(1));

  // Circular progress ring parameters
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius; // ~251.33
  const ringStrokeDashoffset = ringCircumference - (ringCircumference * budgetPercent) / 100;

  const budgetStatusColor =
    budgetPercent > 95
      ? '#ef4444' // red: exceeded
      : budgetPercent >= 75
      ? '#f59e0b' // amber: warning
      : '#10b981'; // emerald: on track

  const handleAdjustBudget = (newVal: number) => {
    const clamped = Math.max(2.0, Math.min(15.0, parseFloat(newVal.toFixed(1))));
    setBudgetKg(clamped);
    if (onUpdateDailyBudget) onUpdateDailyBudget(clamped);
  };

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900/90 via-[#0a0f1d] to-[#070b14] border border-slate-800 p-6 md:p-8 overflow-hidden shadow-2xl">
      {/* Ambient background glow ring */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: ringGlow }}
      />

      {/* Top Banner: Grid Region selector & Simulated Time Scrubber */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Regional Grid:
          </span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-lg border border-slate-800">
            {(['CAISO', 'ERCOT', 'PJM', 'UK_GRID'] as GridRegion[]).map((reg) => (
              <button
                key={reg}
                id={`region-${reg}`}
                onClick={() => {
                  playNavSound('select');
                  setSelectedRegion(reg);
                }}
                className={`tv-focusable px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedRegion === reg
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                } ${focusedId === `region-${reg}` ? 'tv-focused' : ''}`}
              >
                {reg === 'UK_GRID' ? 'UK Grid' : reg}
              </button>
            ))}
          </div>
        </div>

        {/* Live Weather Integration Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            {weatherData ? getWeatherIcon(weatherData.weatherCode) : <Sun className="w-4 h-4 text-amber-400 animate-pulse" />}
            <span className="font-bold text-white font-mono tabular-nums">
              {weatherData
                ? tempUnit === 'F'
                  ? `${weatherData.temperatureF}°F`
                  : `${weatherData.temperatureC}°C`
                : '72°F'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-sky-300 font-medium">
              {weatherData ? `${weatherData.cloudCoverPct}% Cloud Deck` : '18% Cloud Deck'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {weatherData?.weatherCondition || 'Clear Sky'}
            </span>
          </div>

          <button
            id="btn-refresh-weather"
            onClick={() => {
              playNavSound('select');
              fetchWeather(selectedRegion);
            }}
            disabled={isWeatherLoading}
            title="Refresh weather from Open-Meteo"
            className={`tv-focusable p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-emerald-400 ${
              focusedId === 'btn-refresh-weather' ? 'tv-focused' : ''
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isWeatherLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* Time Scrubber control */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300 font-mono text-sm bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="tabular-nums font-bold text-white text-base">
              {currentSlot.timeLabel}
            </span>
            <span className="text-xs text-slate-400">Simulated Clock</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-time-prev"
              onClick={() => {
                playNavSound('focus');
                setCurrentHour((prev) => (prev - 1 + 24) % 24);
              }}
              className={`tv-focusable px-2.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md border border-slate-700 ${
                focusedId === 'btn-time-prev' ? 'tv-focused' : ''
              }`}
              title="Step 1 hour back"
            >
              -1h
            </button>
            <button
              id="btn-time-next"
              onClick={() => {
                playNavSound('focus');
                setCurrentHour((prev) => (prev + 1) % 24);
              }}
              className={`tv-focusable px-2.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-md border border-slate-700 ${
                focusedId === 'btn-time-next' ? 'tv-focused' : ''
              }`}
              title="Step 1 hour forward"
            >
              +1h
            </button>
          </div>
        </div>
      </div>

      {/* Super Simple Accessible Status Light (For Everyone / Easy Glance) */}
      <div
        className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg ${
          isSuperClean
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-900/20'
            : isPeakCarbon
            ? 'bg-amber-950/40 border-amber-500/50 shadow-amber-900/20'
            : 'bg-slate-900/90 border-slate-700/80'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 font-bold text-2xl shadow-inner ${
              isSuperClean
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : isPeakCarbon
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
            }`}
          >
            {isSuperClean ? '☀️' : isPeakCarbon ? '⚠️' : '⚡'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isSuperClean
                    ? 'bg-emerald-400 text-slate-950'
                    : isPeakCarbon
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-sky-400 text-slate-950'
                }`}
              >
                {isSuperClean ? 'Clean & Cheap' : isPeakCarbon ? 'Expensive Peak' : 'Standard Grid'}
              </span>
              <span className="text-xs text-slate-400">Right Now ({currentSlot.timeLabel})</span>
            </div>
            <h2 className="text-base md:text-lg font-extrabold text-white">
              {isSuperClean
                ? 'Great time to wash clothes or charge your car!'
                : isPeakCarbon
                ? 'Wait to run washers or chargers to save money.'
                : 'Power is normal. Clean solar peaks around 12 PM - 3 PM.'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {isSuperClean
                ? 'Free sunshine is powering the grid. You are using clean green energy!'
                : isPeakCarbon
                ? 'Expensive coal and gas peaker plants are active. Delaying heavy loads will lower your bill.'
                : 'You can run regular home appliances comfortably.'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Voice read-out & One-tap Save Energy */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <button
            id="btn-easy-speak-status"
            onClick={handleSpeakStatus}
            className={`tv-focusable px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
              isSpeakingStatus
                ? 'bg-amber-400 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
            } ${focusedId === 'btn-easy-speak-status' ? 'tv-focused' : ''}`}
            title="Read energy status out loud"
          >
            {isSpeakingStatus ? (
              <VolumeX className="w-4 h-4 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{isSpeakingStatus ? 'Stop Voice' : 'Read to Me'}</span>
          </button>

          <button
            id="btn-easy-shift-load"
            onClick={() => {
              playNavSound('optimize');
              onOptimize();
            }}
            className={`tv-focusable px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 ${
              focusedId === 'btn-easy-shift-load' ? 'tv-focused' : ''
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Save Energy Now</span>
          </button>
        </div>
      </div>

      {/* Main 10-Foot Split: Living Biosphere Canvas + Glanceable Energy Telemetry */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        {/* Left Column: Visual Living Biosphere Canopy (SVG Animation) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Ambient Pulse Rings */}
            <div
              className="absolute inset-0 rounded-full border border-dashed opacity-30 animate-spin"
              style={{
                borderColor: canopyColor,
                animationDuration: isSuperClean ? '28s' : '48s',
              }}
            />
            <div
              className="absolute inset-4 rounded-full border opacity-20"
              style={{ borderColor: canopyColor }}
            />

            {/* Dynamic Biosphere SVG Tree & Solar Radiance */}
            <svg
              viewBox="0 0 240 240"
              className="w-56 h-56 md:w-72 md:h-72 transition-all duration-700"
            >
              <defs>
                <linearGradient id="canopyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={canopyColor} stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.3" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Central Energy Core Node */}
              <circle
                cx="120"
                cy="120"
                r={isSuperClean ? 48 : 40}
                fill="url(#canopyGrad)"
                filter="url(#glow)"
                className="transition-all duration-700"
              />

              {/* Organic branches radiating outward */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const r1 = 44;
                const r2 = isSuperClean ? 88 + (i % 2) * 14 : 72 + (i % 2) * 8;
                const x1 = 120 + r1 * Math.cos(rad);
                const y1 = 120 + r1 * Math.sin(rad);
                const x2 = 120 + r2 * Math.cos(rad);
                const y2 = 120 + r2 * Math.sin(rad);

                return (
                  <g key={angle} className="transition-all duration-700">
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={canopyColor}
                      strokeWidth={isSuperClean ? '2.5' : '1.5'}
                      strokeLinecap="round"
                      opacity={0.85}
                    />
                    {/* Leaf bloom nodes */}
                    <circle
                      cx={x2}
                      cy={y2}
                      r={isSuperClean ? (i % 2 === 0 ? 7 : 5) : 4}
                      fill={canopyColor}
                      filter="url(#glow)"
                      className="animate-pulse"
                      style={{ animationDuration: `${2 + (i % 3)}s` }}
                    />
                  </g>
                );
              })}

              {/* Center Icon */}
              <g transform="translate(108, 108)">
                {isSuperClean ? (
                  <path
                    d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z"
                    fill="#ffffff"
                    opacity={0.9}
                  />
                ) : isPeakCarbon ? (
                  <path
                    d="M12 4L2 20H22L12 4ZM12 8L18 18H6L12 8Z"
                    fill="#ffffff"
                    opacity={0.9}
                  />
                ) : (
                  <path
                    d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                    fill="#ffffff"
                    opacity={0.9}
                  />
                )}
              </g>
            </svg>

            {/* Float badge under biosphere */}
            <div className="absolute -bottom-2 bg-slate-950/90 border border-slate-700/80 px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
              <span
                style={{ color: canopyColor }}
                className="tabular-nums font-bold mr-1"
              >
                {renewablePct}%
              </span>
              <span className="text-slate-300">Renewable Grid Mix</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400 max-w-xs leading-relaxed">
            {isSuperClean
              ? 'EcoPulse Biosphere is flourishing. Solar & wind generation are covering regional loads.'
              : isPeakCarbon
              ? 'Grid peaker plants active. Non-essential appliances have been deferred to clean hours.'
              : 'Moderate grid efficiency. Autonomous scheduler monitoring for solar surplus.'}
          </p>
        </div>

        {/* Right Column: 10-Foot Glanceable Energy Metrics */}
        <div className="lg:col-span-7 space-y-5">
          {/* Optimal Window Highlight Banner */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isSuperClean
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : isPeakCarbon
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : 'bg-slate-900/60 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSuperClean
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : isPeakCarbon
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {isSuperClean ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : isPeakCarbon ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
                    Recommended Clean Energy Window
                  </div>
                  <div className="text-base sm:text-lg font-bold tracking-tight text-white">
                    {nextCleanWindow}
                  </div>
                </div>
              </div>

              <button
                id="btn-quick-optimize"
                onClick={() => {
                  playNavSound('optimize');
                  onOptimize();
                }}
                className={`tv-focusable hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-400 text-slate-950 hover:bg-emerald-300 shrink-0 ${
                  focusedId === 'btn-quick-optimize' ? 'tv-focused' : ''
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Rebalance Loads</span>
              </button>
            </div>
          </div>

          {/* 3 Large Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Metric 1: Grid Carbon Intensity */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Carbon Intensity</span>
                <span className="font-mono text-[10px]">gCO₂/kWh</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white flex items-baseline gap-1">
                <span style={{ color: canopyColor }}>{carbon}</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: canopyColor }}
                />
                <span>
                  {carbon <= 100
                    ? 'Ultra Clean'
                    : carbon <= 220
                    ? 'Moderate'
                    : 'High Peaker Mix'}
                </span>
              </div>
            </div>

            {/* Metric 2: Solar Generation vs Home Draw */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Rooftop Solar</span>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
                +{solarKw} <span className="text-sm font-normal text-slate-400">kW</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                <span>Home draw:</span>
                <span className="font-mono text-white tabular-nums">{homeDrawKw} kW</span>
              </div>
            </div>

            {/* Metric 3: Real-Time Grid Net & Tariff */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Net Grid Flow</span>
                {isExporting ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div
                className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                  isExporting ? 'text-emerald-400' : 'text-slate-200'
                }`}
              >
                {isExporting ? `${Math.abs(netGridKw)}` : `${netGridKw}`}{' '}
                <span className="text-sm font-normal text-slate-400">kW</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{isExporting ? 'Exporting to grid' : 'Importing from grid'}</span>
                <span className="font-mono text-emerald-400 tabular-nums">
                  ${currentSlot.tariffRate}/kWh
                </span>
              </div>
            </div>
          </div>

          {/* Atmospheric Solar Generation & Cloud Influence Engine */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-amber-950/20 border border-slate-800/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  {weatherData ? getWeatherIcon(weatherData.weatherCode) : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      Atmospheric Solar Forecast & Cloud Influence
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                      Open-Meteo Live API
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {weatherData?.locationName || 'Regional Weather Station'} · Updated {weatherData?.lastUpdated || 'Live'}
                  </span>
                </div>
              </div>

              {/* Controls: Unit Toggle */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-temp-unit"
                  onClick={() => {
                    playNavSound('focus');
                    setTempUnit((prev) => (prev === 'F' ? 'C' : 'F'));
                  }}
                  className={`tv-focusable px-2.5 py-1 text-[11px] font-mono font-semibold bg-slate-950 text-slate-300 hover:text-white rounded-md border border-slate-800 transition ${
                    focusedId === 'btn-temp-unit' ? 'tv-focused' : ''
                  }`}
                  title="Toggle Temperature Unit"
                >
                  Unit: °{tempUnit} (Click to toggle)
                </button>
              </div>
            </div>

            {/* 3-Part Weather Telemetry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stat 1: Local Temperature */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Local Temperature</span>
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
                    {weatherData
                      ? tempUnit === 'F'
                        ? `${weatherData.temperatureF}°F`
                        : `${weatherData.temperatureC}°C`
                      : '72°F'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {weatherData ? weatherData.weatherCondition : 'Clear Sky'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Apparent: {weatherData ? (tempUnit === 'F' ? `${weatherData.apparentTempF}°F` : `${Math.round(((weatherData.apparentTempF - 32) * 5) / 9)}°C`) : '71°F'} · {weatherData?.windSpeedMph || 8.5} mph wind
                </div>
              </div>

              {/* Stat 2: Cloud Cover & Attenuation */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Cloud Cover Deck</span>
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-sky-400 tabular-nums">
                    {weatherData ? `${weatherData.cloudCoverPct}%` : '18%'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {weatherData && weatherData.cloudCoverPct <= 20
                      ? 'Clear / Low Deck'
                      : weatherData && weatherData.cloudCoverPct <= 50
                      ? 'Scattered Cover'
                      : 'Heavy Overcast'}
                  </span>
                </div>
                {/* Visual Cloud Deck Meter */}
                <div className="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-700"
                    style={{ width: `${weatherData?.cloudCoverPct || 18}%` }}
                  />
                </div>
              </div>

              {/* Stat 3: Photovoltaic Solar Yield Influence */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Direct Solar Irradiance</span>
                  <Sun className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {weatherData?.directNormalIrradianceWm2 || 780}{' '}
                    <span className="text-xs font-normal text-slate-400">W/m²</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    (weatherData?.solarYieldLevel || 'Optimal') === 'Optimal'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : (weatherData?.solarYieldLevel || 'Optimal') === 'Nominal'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {weatherData?.solarYieldLevel || 'Optimal'} Yield
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  PV Attenuation: -{weatherData?.solarAttenuationPct || 6}% from clouds
                </div>
              </div>
            </div>

            {/* Impact Narrative on Solar Forecast */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Solar Generation Forecast Influence: </span>
                <span className="text-slate-300">
                  {weatherData?.solarImpactSummary ||
                    'High direct solar irradiance with minimal cloud deck is driving peak rooftop generation up to +6.5 kW. Optimal conditions for scheduling EV charging.'}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Carbon Goal Progress Ring Widget */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/75 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Left: Circular SVG Progress Ring */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Animated Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    stroke={budgetStatusColor}
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringStrokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Inner Percentage & Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    style={{ color: budgetStatusColor }}
                    className="text-base font-bold font-mono tabular-nums leading-none"
                  >
                    {budgetPercent}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                    Budget
                  </span>
                </div>
              </div>

              {/* Goal Telemetry Metrics */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Daily Carbon Goal</span>
                </div>
                <div className="text-xl font-extrabold font-mono text-white tabular-nums mt-0.5">
                  {accumulatedCarbonKg}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {budgetKg.toFixed(1)} kg CO₂
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: budgetStatusColor }}
                  />
                  <span>
                    {remainingHeadroomKg >= 0
                      ? `${remainingHeadroomKg} kg headroom remaining`
                      : `Exceeded by ${Math.abs(remainingHeadroomKg)} kg`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: End of Day Projection & Interactive Budget Controls */}
            <div className="flex flex-col sm:items-end gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Projected Total:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {projectedDayTotalKg} kg
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    projectedDayTotalKg <= budgetKg
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {projectedDayTotalKg <= budgetKg ? 'Within Cap' : 'At Risk'}
                </span>
              </div>

              {/* Budget Presets & Steppers */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 mr-1 hidden lg:inline">Budget:</span>

                {[
                  { label: 'Strict 4kg', val: 4.0 },
                  { label: 'Balanced 6kg', val: 6.0 },
                  { label: 'Eco 8.5kg', val: 8.5 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    id={`budget-preset-${preset.val}`}
                    onClick={() => {
                      playNavSound('focus');
                      handleAdjustBudget(preset.val);
                    }}
                    className={`tv-focusable px-2.5 py-1 text-xs rounded-lg transition-all ${
                      budgetKg === preset.val
                        ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    } ${focusedId === `budget-preset-${preset.val}` ? 'tv-focused' : ''}`}
                  >
                    {preset.label}
                  </button>
                ))}

                <div className="flex items-center gap-1 ml-1">
                  <button
                    id="btn-budget-minus"
                    onClick={() => {
                      playNavSound('focus');
                      handleAdjustBudget(budgetKg - 0.5);
                    }}
                    className={`tv-focusable p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 ${
                      focusedId === 'btn-budget-minus' ? 'tv-focused' : ''
                    }`}
                    title="Decrease daily carbon budget by 0.5 kg"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="btn-budget-plus"
                    onClick={() => {
                      playNavSound('focus');
                      handleAdjustBudget(budgetKg + 0.5);
                    }}
                    className={`tv-focusable p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 ${
                      focusedId === 'btn-budget-plus' ? 'tv-focused' : ''
                    }`}
                    title="Increase daily carbon budget by 0.5 kg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">Fire TV Tip:</span>
              <span>Use the D-Pad Remote or Arrow keys to navigate cards</span>
            </div>

            <button
              id="btn-goto-appliances"
              onClick={() => {
                playNavSound('select');
                onOpenApplianceHub();
              }}
              className={`tv-focusable px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all ${
                focusedId === 'btn-goto-appliances' ? 'tv-focused' : ''
              }`}
            >
              Open Appliance Load Shifter →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
