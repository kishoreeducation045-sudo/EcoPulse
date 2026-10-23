import {
  Zap,
  Clock,
  Leaf,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BatteryCharging,
  Flame,
  Waves,
  Wind,
} from 'lucide-react';
import { SmartAppliance } from '../types';
import { REGIONAL_BENCHMARKS } from '../data/mockTelemetry';
import { playNavSound } from '../utils/audioEffects';

interface ApplianceCardProps {
  appliance: SmartAppliance;
  onUpdateSchedule: (id: string, newStartHour: number) => void;
  onToggleStatus: (id: string) => void;
  onAlignToOptimal: (id: string) => void;
  onOpenEfficiencyAlert?: (id: string) => void;
  focusedId: string;
}

export const ApplianceCard: React.FC<ApplianceCardProps> = ({
  appliance,
  onUpdateSchedule,
  onToggleStatus,
  onAlignToOptimal,
  onOpenEfficiencyAlert,
  focusedId,
}) => {
  const benchmark = REGIONAL_BENCHMARKS[appliance.category]?.averageKw || appliance.powerDrawKw;
  const excessPct = Math.round(((appliance.powerDrawKw - benchmark) / benchmark) * 100);
  const hasEfficiencyWarning = excessPct >= 15;
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ev_charger':
        return <Zap className="w-5 h-5 text-sky-400" />;
      case 'hvac':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'dishwasher':
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case 'laundry':
        return <Wind className="w-5 h-5 text-indigo-400" />;
      case 'battery':
        return <BatteryCharging className="w-5 h-5 text-emerald-400" />;
      default:
        return <Zap className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'optimized':
        return (
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AI Clean Shifted</span>
          </span>
        );
      case 'running':
        return (
          <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>Active Drawing</span>
          </span>
        );
      case 'scheduled':
        return (
          <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled</span>
          </span>
        );
      default:
        return <span className="text-[11px] text-slate-400">Standby</span>;
    }
  };

  const formatHour = (h: number) => {
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  const isCardFocused = focusedId === `appliance-${appliance.id}`;

  return (
    <div
      id={`appliance-${appliance.id}`}
      className={`tv-focusable p-5 rounded-2xl bg-slate-900/80 border transition-all ${
        appliance.status === 'optimized'
          ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-900/90 to-emerald-950/20'
          : 'border-slate-800'
      } ${isCardFocused ? 'tv-focused' : ''}`}
    >
      {/* Top row: Icon, Name & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center shrink-0">
            {getCategoryIcon(appliance.category)}
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight leading-snug">
              {appliance.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{appliance.brandModel}</span>
              <span aria-hidden="true">·</span>
              <span>{appliance.room}</span>
            </div>
          </div>
        </div>

        <div>{getStatusBadge(appliance.status)}</div>
      </div>

      {/* Power Draw & Savings Strip */}
      <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Power Draw</div>
          <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
            {appliance.powerDrawKw} <span className="text-[11px] font-normal text-slate-400">kW</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</div>
          <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
            {appliance.durationHours} <span className="text-[11px] font-normal text-slate-400">hrs</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">CO₂ Saved</div>
          <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
            +{appliance.carbonSavedGrams} <span className="text-[11px] font-normal text-slate-400">g</span>
          </div>
        </div>
      </div>

      {/* Regional Efficiency Benchmark Alert */}
      {hasEfficiencyWarning && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-950/35 border border-amber-500/40 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold truncate">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">+{excessPct}% vs Regional Avg ({benchmark} kW)</span>
          </div>
          {onOpenEfficiencyAlert && (
            <button
              id={`btn-${appliance.id}-diagnose`}
              onClick={() => {
                playNavSound('focus');
                onOpenEfficiencyAlert(appliance.id);
              }}
              className={`tv-focusable shrink-0 text-[11px] font-bold text-amber-400 hover:text-white px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 ${
                focusedId === `btn-${appliance.id}-diagnose` ? 'tv-focused' : ''
              }`}
            >
              AI Alert
            </button>
          )}
        </div>
      )}

      {/* Schedule Adjustment Bar */}
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Scheduled Window:</span>
          <span className="font-mono font-bold text-white tabular-nums">
            {formatHour(appliance.scheduledStartHour)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id={`btn-${appliance.id}-minus`}
            onClick={() => {
              playNavSound('focus');
              onUpdateSchedule(appliance.id, (appliance.scheduledStartHour - 1 + 24) % 24);
            }}
            className={`tv-focusable px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs border border-slate-700 ${
              focusedId === `btn-${appliance.id}-minus` ? 'tv-focused' : ''
            }`}
            title="Shift 1 hour earlier"
          >
            -1h
          </button>
          <button
            id={`btn-${appliance.id}-plus`}
            onClick={() => {
              playNavSound('focus');
              onUpdateSchedule(appliance.id, (appliance.scheduledStartHour + 1) % 24);
            }}
            className={`tv-focusable px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs border border-slate-700 ${
              focusedId === `btn-${appliance.id}-plus` ? 'tv-focused' : ''
            }`}
            title="Shift 1 hour later"
          >
            +1h
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          id={`btn-${appliance.id}-toggle`}
          onClick={() => {
            playNavSound('select');
            onToggleStatus(appliance.id);
          }}
          className={`tv-focusable px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            appliance.status === 'running'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-700'
          } ${focusedId === `btn-${appliance.id}-toggle` ? 'tv-focused' : ''}`}
        >
          {appliance.status === 'running' ? 'Pause Draw' : 'Run Now'}
        </button>

        <button
          id={`btn-${appliance.id}-align`}
          onClick={() => {
            playNavSound('optimize');
            onAlignToOptimal(appliance.id);
          }}
          className={`tv-focusable px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center gap-1.5 transition-colors ${
            focusedId === `btn-${appliance.id}-align` ? 'tv-focused' : ''
          }`}
          title="Align to peak renewable solar hours"
        >
          <Leaf className="w-3.5 h-3.5" />
          <span>Auto-Clean Window</span>
        </button>
      </div>
    </div>
  );
};
