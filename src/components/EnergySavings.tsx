import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  TrendingDown,
  DollarSign,
  Trees,
  Car,
  Zap,
  Calendar,
  Award,
  Trophy,
  Sparkles,
  Sun,
  Crown,
  CheckCircle2,
  Lock,
  ChevronRight,
  X,
  Info,
} from 'lucide-react';
import { generateHistoricalSavings, evaluateAchievements } from '../data/mockTelemetry';
import { CarbonAchievement } from '../types';
import { playNavSound } from '../utils/audioEffects';

interface EnergySavingsProps {
  focusedId: string;
}

export const EnergySavings: React.FC<EnergySavingsProps> = ({ focusedId }) => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedBadge, setSelectedBadge] = useState<CarbonAchievement | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'in_progress'>('all');

  const savingsData = useMemo(() => {
    return generateHistoricalSavings(timeframe);
  }, [timeframe]);

  const totalPreventedKg = useMemo(() => {
    return savingsData[savingsData.length - 1]?.cumulativePreventedKg || 0;
  }, [savingsData]);

  const totalCostSaved = useMemo(() => {
    return savingsData.reduce((acc, curr) => acc + curr.costSavedDollars, 0).toFixed(2);
  }, [savingsData]);

  const equivalentTrees = useMemo(() => {
    return (totalPreventedKg / 5.2).toFixed(1);
  }, [totalPreventedKg]);

  const equivalentMiles = useMemo(() => {
    return Math.round((totalPreventedKg * 1000) / 400);
  }, [totalPreventedKg]);

  // Dynamic achievement evaluation
  const achievements = useMemo(() => {
    return evaluateAchievements(totalPreventedKg);
  }, [totalPreventedKg]);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.isUnlocked).length;
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    if (badgeFilter === 'unlocked') return achievements.filter((a) => a.isUnlocked);
    if (badgeFilter === 'in_progress') return achievements.filter((a) => !a.isUnlocked);
    return achievements;
  }, [achievements, badgeFilter]);

  const renderBadgeIcon = (icon: string, color: string, isUnlocked: boolean) => {
    const iconClass = `w-7 h-7 ${isUnlocked ? 'text-white' : 'text-slate-500'}`;
    switch (icon) {
      case 'spark':
        return <Sparkles className={iconClass} />;
      case 'sun':
        return <Sun className={iconClass} />;
      case 'shield':
        return <ShieldCheck className={iconClass} />;
      case 'crown':
        return <Crown className={iconClass} />;
      case 'trees':
        return <Trees className={iconClass} />;
      case 'battery':
      default:
        return <Award className={iconClass} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI strip */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Decarbonization Telemetry
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300">Baseline vs. Scheduled Optimization</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                Cumulative Carbon Emissions Prevented
              </h2>
            </div>
          </div>

          {/* Timeframe Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {(['24h', '7d', '30d'] as const).map((tf) => {
              const label = tf === '24h' ? '24 Hours' : tf === '7d' ? 'Past 7 Days' : '30-Day Projected';
              const isSelected = timeframe === tf;
              return (
                <button
                  key={tf}
                  id={`tf-${tf}`}
                  onClick={() => {
                    playNavSound('focus');
                    setTimeframe(tf);
                  }}
                  className={`tv-focusable px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  } ${focusedId === `tf-${tf}` ? 'tv-focused' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Impact Stat Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>CO₂ Prevented</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums mt-1">
              +{totalPreventedKg}{' '}
              <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Direct peaker offset</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Tariff Savings</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums mt-1">
              ${totalCostSaved}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Time-of-use reduction</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tree Equivalent</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums mt-1">
              {equivalentTrees}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Trees planted equivalency</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-sky-400" />
              <span>Gas Miles Avoided</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-sky-400 tabular-nums mt-1">
              {equivalentMiles}{' '}
              <span className="text-xs font-normal text-slate-400">mi</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Passenger vehicle offset</div>
          </div>
        </div>
      </div>

      {/* Achievement & Carbon Milestones Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0c1220] via-slate-900 to-[#080d19] border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Achievement System
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-emerald-400 font-semibold">
                  {unlockedCount} of {achievements.length} Badges Unlocked ({Math.round((unlockedCount / achievements.length) * 100)}%)
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                Carbon Decarbonization Milestones
              </h3>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {(['all', 'unlocked', 'in_progress'] as const).map((filter) => {
              const label =
                filter === 'all'
                  ? `All (${achievements.length})`
                  : filter === 'unlocked'
                  ? `Unlocked (${unlockedCount})`
                  : `In Progress (${achievements.length - unlockedCount})`;
              const isSelected = badgeFilter === filter;
              return (
                <button
                  key={filter}
                  id={`badge-filter-${filter}`}
                  onClick={() => {
                    playNavSound('focus');
                    setBadgeFilter(filter);
                  }}
                  className={`tv-focusable px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  } ${focusedId === `badge-filter-${filter}` ? 'tv-focused' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6 Visual Medallion Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((ach) => {
            const pct = Math.min(100, Math.round((ach.currentValue / ach.targetValue) * 100));
            const isUnlocked = ach.isUnlocked;

            return (
              <div
                key={ach.id}
                id={`badge-${ach.id}`}
                tabIndex={0}
                role="button"
                onClick={() => {
                  playNavSound('select');
                  setSelectedBadge(ach);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    playNavSound('select');
                    setSelectedBadge(ach);
                  }
                }}
                className={`tv-focusable group relative p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                  isUnlocked
                    ? 'bg-slate-950/80 border-slate-700/80 hover:border-amber-400/60 shadow-lg shadow-black/40'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-80 hover:opacity-100 hover:border-slate-600'
                } ${focusedId === `badge-${ach.id}` ? 'tv-focused' : ''}`}
              >
                {/* Subtle Medallion Glow */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20"
                  style={{ backgroundColor: ach.accentColor }}
                />

                <div className="relative z-10 flex items-start gap-3.5">
                  {/* Glowing Medallion Icon Shield */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                      isUnlocked
                        ? 'border-amber-400/50 shadow-md shadow-amber-500/20'
                        : 'border-slate-800 bg-slate-900/60 text-slate-500'
                    }`}
                    style={{
                      backgroundColor: isUnlocked ? `${ach.accentColor}25` : undefined,
                    }}
                  >
                    {renderBadgeIcon(ach.badgeIcon, ach.accentColor, isUnlocked)}
                  </div>

                  {/* Badge Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          ach.rarity === 'Legendary'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : ach.rarity === 'Epic'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : ach.rarity === 'Rare'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {ach.rarity}
                      </span>

                      {isUnlocked ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Lock className="w-3 h-3" />
                          <span>{pct}%</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white truncate">{ach.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {ach.description}
                    </p>

                    {/* Progress Bar or Unlocked Timestamp */}
                    <div className="mt-3">
                      {isUnlocked ? (
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Milestone Achieved</span>
                          <span className="text-emerald-400 font-mono font-medium">
                            {ach.unlockedDate || 'Active'}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>
                              {ach.currentValue} / {ach.targetValue} {ach.unit}
                            </span>
                            <span className="text-amber-400 font-bold">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: ach.accentColor,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone Detail Inspector Modal */}
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl bg-[#0e1424] border border-amber-500/40 p-6 shadow-2xl space-y-4 text-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border border-amber-500/40"
                    style={{ backgroundColor: `${selectedBadge.accentColor}25` }}
                  >
                    {renderBadgeIcon(selectedBadge.badgeIcon, selectedBadge.accentColor, true)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {selectedBadge.rarity} Milestone
                    </span>
                    <h3 className="text-lg font-extrabold text-white">{selectedBadge.title}</h3>
                  </div>
                </div>
                <button
                  id="btn-close-badge-modal"
                  onClick={() => setSelectedBadge(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedBadge.description}
              </p>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Decarbonization:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedBadge.targetValue} {selectedBadge.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Progress:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedBadge.currentValue} {selectedBadge.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-white">
                    {selectedBadge.isUnlocked ? '✅ Unlocked' : '⏳ In Progress'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>How to Earn Faster with Alexa+:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {selectedBadge.howToEarn}
                </p>
              </div>

              <button
                id="btn-confirm-badge"
                onClick={() => setSelectedBadge(null)}
                className="tv-focusable w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition"
              >
                Close Milestone Inspector
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Recharts Cumulative Area Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Baseline vs. EcoPulse Clean Load Shift
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing cumulative carbon emissions (kg CO₂) saved by postponing flexible loads to solar peak windows.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400" />
              <span>Unoptimized Baseline (Peak Fossil Grid)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400" />
              <span>EcoPulse Optimized (Clean Solar Shift)</span>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart Container */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={savingsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradOptimized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                unit=" kg"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-xl text-xs space-y-1.5">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">
                          {label}
                        </div>
                        <div className="text-amber-400 flex justify-between gap-4">
                          <span>Baseline Emissions:</span>
                          <span className="font-mono font-bold">{data.baselineCarbonKg} kg</span>
                        </div>
                        <div className="text-emerald-400 flex justify-between gap-4">
                          <span>Optimized Emissions:</span>
                          <span className="font-mono font-bold">{data.optimizedCarbonKg} kg</span>
                        </div>
                        <div className="text-sky-300 font-bold border-t border-slate-800 pt-1 flex justify-between gap-4">
                          <span>Prevented Interval:</span>
                          <span className="font-mono">+{data.emissionsPreventedKg} kg</span>
                        </div>
                        <div className="text-emerald-300 font-bold flex justify-between gap-4">
                          <span>Total Cumulative:</span>
                          <span className="font-mono">+{data.cumulativePreventedKg} kg</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="baselineCarbonKg"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradBaseline)"
                name="Baseline Model"
              />
              <Area
                type="monotone"
                dataKey="optimizedCarbonKg"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradOptimized)"
                name="EcoPulse Optimized"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Chart: Emissions Prevented Per Period */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Periodic Carbon Offset Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Kilograms of CO₂ directly averted per interval through smart load shifting.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            Average: {(totalPreventedKg / savingsData.length).toFixed(1)} kg / period
          </span>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={savingsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" kg" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs">
                        <span className="font-bold text-white">{data.timeLabel}:</span>{' '}
                        <span className="text-emerald-400 font-mono font-bold">
                          +{data.emissionsPreventedKg} kg avoided
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="emissionsPreventedKg" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
