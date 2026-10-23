import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Volume2,
  VolumeX,
  TrendingDown,
  Sun,
  Trees,
  Award,
  Zap,
  ArrowRight,
  CheckCircle2,
  Info,
  Car,
  Wind,
  WashingMachine,
  Sparkles,
  Printer,
} from 'lucide-react';
import { GridRegion, WeeklyReportData, WeeklyDaySummary } from '../types';
import { generateWeeklyReport } from '../data/mockTelemetry';
import { playNavSound } from '../utils/audioEffects';
import { speakMessage, stopSpeaking } from '../utils/speechVoice';

interface WeeklyReportsProps {
  selectedRegion: GridRegion;
  isSimpleMode: boolean;
  onOpenApplianceHub: () => void;
  onOptimize: () => void;
  focusedId: string;
}

export const WeeklyReports: React.FC<WeeklyReportsProps> = ({
  selectedRegion,
  isSimpleMode,
  onOpenApplianceHub,
  onOptimize,
  focusedId,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(2); // Default to Wednesday (best day)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Generate 7-day report data for the selected region
  const report = useMemo<WeeklyReportData>(() => {
    return generateWeeklyReport(selectedRegion);
  }, [selectedRegion]);

  const activeDay = report.dailySummaries[selectedDayIdx] || report.dailySummaries[0];

  const handleToggleVoice = () => {
    playNavSound('select');
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const textToRead = isSimpleMode
        ? `Here is your weekly energy report. ${report.simpleSummaryText}`
        : `EcoPulse 7-Day Performance Report for ${report.weekLabel}. Overall efficiency grade is ${report.overallGrade}. You used ${report.totalKwhConsumed} kilowatt-hours with an average clean energy share of ${report.averageCleanEnergyPct} percent. Total savings achieved: $${report.totalCostSavedDollars} and ${report.totalCarbonAvoidedKg} kilograms of carbon averted. Top saving came from ${report.topApplianceSavings[0]?.name}.`;

      setIsSpeaking(true);
      speakMessage(textToRead, {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const getApplianceIcon = (category: string) => {
    switch (category) {
      case 'ev_charger':
        return <Car className="w-4 h-4 text-emerald-400" />;
      case 'hvac':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'laundry':
      case 'dishwasher':
        return <WashingMachine className="w-4 h-4 text-indigo-400" />;
      default:
        return <Zap className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                7-Day Household Energy Audit
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{report.weekLabel}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Weekly Energy & Savings Report
              <span className="text-sm px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Grade {report.overallGrade}
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isSimpleMode
                ? 'A simple look at how much money and clean sun power your house used this past week.'
                : 'Aggregated telemetry of appliance load shifting, avoided peaker emissions, and net financial savings.'}
            </p>
          </div>

          {/* Action Buttons: Voice read-out & Print */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="weekly-voice-btn"
              onClick={handleToggleVoice}
              className={`tv-focusable px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-md ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 border border-amber-400'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
              } ${focusedId === 'weekly-voice-btn' ? 'tv-focused' : ''}`}
              title="Read report out loud"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 animate-pulse" />
                  <span>Stop Voice</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Listen to Report</span>
                </>
              )}
            </button>

            <button
              id="weekly-print-btn"
              onClick={() => {
                playNavSound('select');
                window.print();
              }}
              className={`tv-focusable px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all ${
                focusedId === 'weekly-print-btn' ? 'tv-focused' : ''
              }`}
              title="Print or save PDF of weekly report"
            >
              <Printer className="w-4 h-4" />
              <span>Save / Print</span>
            </button>
          </div>
        </div>

        {/* Plain Language Box (Radically Easy for Everyone) */}
        <div className="mt-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <Sun className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Plain English Takeaway
            </div>
            <p className="text-sm text-slate-100 font-medium leading-relaxed">
              {report.simpleSummaryText}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Dollars Saved */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Money Saved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            ${report.totalCostSavedDollars}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Saved by shifting heavy loads to solar hours
          </p>
        </div>

        {/* Metric 2: Clean Energy % */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Clean Energy Used</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
            {report.averageCleanEnergyPct}%
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Weekly average renewable energy share
          </p>
        </div>

        {/* Metric 3: Carbon Avoided */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Carbon Prevented</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Trees className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-teal-400 tracking-tight">
            {report.totalCarbonAvoidedKg} <span className="text-base font-normal text-slate-400">kg</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Equal to {report.treeEquivalents} grown trees absorbing smoke
          </p>
        </div>

        {/* Metric 4: Total Electricity */}
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Power</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 tracking-tight">
            {report.totalKwhConsumed} <span className="text-base font-normal text-slate-400">kWh</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total household electricity consumption
          </p>
        </div>
      </div>

      {/* 7-Day Interactive Visual Bar Chart & Selector */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Day-by-Day Performance (7 Days)</span>
              <span className="text-xs text-slate-400 font-normal">
                Click any day to see its story
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Higher green bars indicate cleaner energy and higher savings.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
              <span className="text-slate-300">80%+ Clean (A+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
              <span className="text-slate-300">70-79% Clean (A)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
              <span className="text-slate-300">Under 70% (B)</span>
            </div>
          </div>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {report.dailySummaries.map((day, idx) => {
            const isSelected = selectedDayIdx === idx;
            const isDayFocused = focusedId === `weekly-day-${day.dayName.toLowerCase()}`;
            const barHeight = Math.max(30, Math.round((day.solarSharePct / 100) * 120));

            return (
              <button
                key={day.dayName}
                id={`weekly-day-${day.dayName.toLowerCase()}`}
                onClick={() => {
                  playNavSound('select');
                  setSelectedDayIdx(idx);
                }}
                className={`tv-focusable flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                } ${isDayFocused ? 'tv-focused' : ''}`}
              >
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {day.dayName}
                </span>
                <span className="text-[11px] text-slate-500 mb-3">{day.fullDate}</span>

                {/* Vertical Bar Visual */}
                <div className="w-full flex justify-center items-end h-32 mb-3 bg-slate-950/60 rounded-lg p-1">
                  <div
                    style={{ height: `${barHeight}px` }}
                    className={`w-full max-w-[28px] rounded-md transition-all flex flex-col justify-end items-center pb-1 text-[10px] font-bold ${
                      day.solarSharePct >= 80
                        ? 'bg-emerald-400 text-slate-950'
                        : day.solarSharePct >= 70
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    <span>{day.solarSharePct}%</span>
                  </div>
                </div>

                {/* Grade & Savings */}
                <span className="text-xs font-bold text-white mb-0.5">
                  ${day.costSavedDollars}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    day.cleanGrade === 'A+'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : day.cleanGrade === 'A'
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {day.cleanGrade}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Details Panel */}
        <div className="mt-6 p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
              {activeDay.cleanGrade}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  {activeDay.dayName}, {activeDay.fullDate}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-emerald-400 font-medium">
                  {activeDay.highlight}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total power draw: {activeDay.kwhConsumed} kWh • Avoided {activeDay.carbonAvoidedKg} kg carbon • Saved ${activeDay.costSavedDollars}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="weekly-optimize-btn"
              onClick={() => {
                playNavSound('optimize');
                onOptimize();
              }}
              className={`tv-focusable px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md ${
                focusedId === 'weekly-optimize-btn' ? 'tv-focused' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimize Next Week</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Appliance Savings of the Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Top Appliance Savers This Week</span>
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            How individual devices shifted load to save money and clean up emissions.
          </p>

          <div className="space-y-3">
            {report.topApplianceSavings.map((item, idx) => (
              <div
                key={item.name}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5 hover:border-slate-700 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getApplianceIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 shrink-0">
                      +${item.savedDollars.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.tip}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                    <span>{item.kwhShifted} kWh shifted</span>
                    <span>·</span>
                    <span className="text-emerald-400">Zero Peak Grid Overdraw</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Friendly Advice for Next Week */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Easy Tips to Save Even More Next Week</span>
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Simple actions anyone in the family can take with one tap.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-300">
                    1. Run Laundry During Lunchtime (12 PM – 2 PM)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Rooftop solar is highest at midday. Running the washer and dryer then uses free clean sunshine.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-sky-300">
                    2. Let EcoPulse Pre-Cool Your House at 3 PM
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Cooling your home right before 5 PM means your air conditioner can stay off when electricity is most expensive.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-300">
                    3. Turn On Alexa Voice Routine
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Say &quot;Alexa, ask EcoPulse when to run the car&quot; anytime from your couch!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Want to see appliance schedules?
            </span>
            <button
              id="weekly-go-hub-btn"
              onClick={() => {
                playNavSound('select');
                onOpenApplianceHub();
              }}
              className={`tv-focusable px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-1.5 border border-slate-700 ${
                focusedId === 'weekly-go-hub-btn' ? 'tv-focused' : ''
              }`}
            >
              <span>Go to Appliance Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
