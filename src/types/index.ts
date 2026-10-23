export type GridRegion = 'CAISO' | 'ERCOT' | 'PJM' | 'UK_GRID';

export interface HourlyForecast {
  hour: number; // 0 - 23
  timeLabel: string; // e.g. "1:00 PM"
  carbonIntensity: number; // gCO2eq/kWh (lower is cleaner)
  renewablePct: number; // 0 - 100%
  tariffRate: number; // $/kWh
  solarKw: number; // local solar generation capacity
  isPeak: boolean;
  isCleanWindow: boolean;
}

export type ApplianceCategory = 'ev_charger' | 'hvac' | 'dishwasher' | 'laundry' | 'battery';

export type ApplianceStatus = 'idle' | 'running' | 'scheduled' | 'optimized';

export interface SmartAppliance {
  id: string;
  name: string;
  brandModel: string;
  category: ApplianceCategory;
  powerDrawKw: number;
  durationHours: number;
  status: ApplianceStatus;
  originalStartHour: number;
  scheduledStartHour: number;
  carbonSavedGrams: number;
  costSavedDollars: number;
  priority: 'flexible' | 'essential';
  room: string;
}

export interface OptimizationResult {
  summary: string;
  cleanWindowRecommendation: string;
  projectedCo2SavedKg: number;
  projectedCostSavedDollars: number;
  peakGridAvoidedKw: number;
  applianceSchedules: Array<{
    id: string;
    recommendedStartHour: number;
    recommendedEndHour: number;
    rationale: string;
    carbonSavingsGrams: number;
  }>;
  alexaVoiceBriefing: string;
  livingBiosphereStatus: string;
}

export interface AlexaRoutineResult {
  skillName: string;
  alexaUtterances: string[];
  agentRoutineSummary: string;
  mcpToolDefinition: {
    name: string;
    description: string;
    parameters: any;
  };
  voiceDialogSample: Array<{
    speaker: string;
    text: string;
  }>;
}

export interface EfficiencyDiagnosis {
  alertTitle: string;
  severity: 'moderate' | 'high' | 'critical';
  rootCauses: string[];
  actionableSuggestions: Array<{
    step: number;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Professional';
  }>;
  financialImpactYearly: number;
  carbonWasteKgYearly: number;
  alexaVoiceRecommendation: string;
}

export interface SavingsDataPoint {
  timeLabel: string;
  baselineCarbonKg: number;
  optimizedCarbonKg: number;
  emissionsPreventedKg: number;
  cumulativePreventedKg: number;
  costSavedDollars: number;
}

export interface WeatherData {
  region: GridRegion;
  locationName: string;
  temperatureF: number;
  temperatureC: number;
  apparentTempF: number;
  cloudCoverPct: number;
  weatherCode: number;
  weatherCondition: string;
  directNormalIrradianceWm2: number;
  windSpeedMph: number;
  solarAttenuationPct: number;
  solarImpactSummary: string;
  solarYieldLevel: 'Optimal' | 'Nominal' | 'Subdued' | 'Low';
  lastUpdated: string;
  hourlyForecast?: Array<{
    hour: number;
    timeLabel: string;
    temperatureF: number;
    cloudCoverPct: number;
    directSolarWm2: number;
  }>;
}

export type AchievementRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface CarbonAchievement {
  id: string;
  title: string;
  category: 'carbon' | 'solar' | 'grid' | 'streak';
  description: string;
  badgeIcon: 'spark' | 'sun' | 'battery' | 'shield' | 'trees' | 'crown';
  targetValue: number;
  currentValue: number;
  unit: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  rarity: AchievementRarity;
  accentColor: string;
  howToEarn: string;
}

export interface WeeklyDaySummary {
  dayName: string; // e.g. "Mon", "Tue", "Wed"
  fullDate: string; // e.g. "Oct 16"
  kwhConsumed: number;
  solarSharePct: number;
  carbonAvoidedKg: number;
  costSavedDollars: number;
  cleanGrade: 'A+' | 'A' | 'B' | 'C';
  highlight: string;
}

export interface WeeklyReportData {
  weekLabel: string;
  startDate: string;
  endDate: string;
  overallGrade: 'A+' | 'A' | 'B' | 'C';
  totalKwhConsumed: number;
  totalCostSavedDollars: number;
  totalCarbonAvoidedKg: number;
  averageCleanEnergyPct: number;
  bestDay: string;
  treeEquivalents: number;
  dailySummaries: WeeklyDaySummary[];
  topApplianceSavings: Array<{
    name: string;
    category: ApplianceCategory;
    kwhShifted: number;
    savedDollars: number;
    tip: string;
  }>;
  simpleSummaryText: string;
}
