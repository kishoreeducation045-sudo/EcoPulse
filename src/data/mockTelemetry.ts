import {
  GridRegion,
  HourlyForecast,
  SmartAppliance,
  AlexaRoutineResult,
  CarbonAchievement,
  WeeklyReportData,
  WeeklyDaySummary,
} from '../types';

export const DEFAULT_ALEXA_ROUTINE: AlexaRoutineResult = {
  skillName: 'EcoPulse Smart Grid Orchestrator',
  alexaUtterances: [
    'Alexa, ask EcoPulse when energy is cleanest today',
    'Alexa, optimize my home appliances for low carbon',
    'Alexa, show EcoPulse living room energy view',
  ],
  agentRoutineSummary: 'Autonomously listens to grid carbon threshold triggers and reschedules smart plugs, EV chargers, and HVAC via Alexa Connected Device API and MCP.',
  mcpToolDefinition: {
    name: 'reschedule_smart_appliance',
    description: 'Adjusts appliance run times based on real-time grid carbon intensity',
    parameters: {
      type: 'object',
      properties: {
        appliance_id: { type: 'string' },
        start_time_iso: { type: 'string' },
        carbon_threshold_gco2: { type: 'number' },
      },
      required: ['appliance_id', 'start_time_iso'],
    },
  },
  voiceDialogSample: [
    { speaker: 'User', text: 'Alexa, is it a good time to charge my car?' },
    { speaker: 'Alexa+', text: "Right now grid carbon is high at 285 gCO2/kWh. Solar generation begins ramping at 11:30 AM. I have scheduled charging for 1:00 PM to maximize renewable energy and save $4.20." },
  ],
};

export const REGION_DETAILS: Record<
  GridRegion,
  { name: string; description: string; baseCarbon: number; peakHours: [number, number] }
> = {
  CAISO: {
    name: 'California (CAISO)',
    description: 'High solar penetration with classic afternoon duck curve and evening peaker ramp',
    baseCarbon: 180,
    peakHours: [17, 21], // 5 PM - 9 PM peak
  },
  ERCOT: {
    name: 'Texas (ERCOT)',
    description: 'High wind and utility-scale solar with sharp afternoon thermal AC spikes',
    baseCarbon: 340,
    peakHours: [16, 20],
  },
  PJM: {
    name: 'PJM Mid-Atlantic',
    description: 'Nuclear baseline with mixed gas and coal load tracking peakers',
    baseCarbon: 390,
    peakHours: [7, 9],
  },
  UK_GRID: {
    name: 'UK National Grid ESO',
    description: 'Variable North Sea offshore wind surge and low daytime carbon spikes',
    baseCarbon: 130,
    peakHours: [17, 20],
  },
};

export function generate24HourForecast(region: GridRegion): HourlyForecast[] {
  const hours: HourlyForecast[] = [];
  const base = REGION_DETAILS[region].baseCarbon;

  for (let h = 0; h < 24; h++) {
    // Diurnal solar curve peaking between 11 AM (11) and 3 PM (15)
    let solarStrength = 0;
    if (h >= 7 && h <= 18) {
      solarStrength = Math.sin(((h - 7) / 11) * Math.PI);
    }
    const solarKw = parseFloat((solarStrength * 6.5).toFixed(1)); // Up to 6.5 kW rooftop solar

    // Carbon intensity calculation
    let carbon = base;
    let renewablePct = 25;
    let tariffRate = 0.16;

    if (region === 'CAISO') {
      // California Duck Curve: super clean in solar midday (11-16), dirty evening (17-21)
      if (h >= 10 && h <= 16) {
        carbon = Math.round(75 + Math.random() * 25); // Extremely clean: 75-100 gCO2
        renewablePct = Math.round(78 + Math.random() * 15);
        tariffRate = 0.09; // Super off-peak
      } else if (h >= 17 && h <= 21) {
        carbon = Math.round(360 + Math.random() * 50); // High gas peaker: 360-410 gCO2
        renewablePct = Math.round(18 + Math.random() * 8);
        tariffRate = 0.42; // Extreme peak
      } else {
        carbon = Math.round(190 + Math.random() * 30);
        renewablePct = Math.round(35 + Math.random() * 10);
        tariffRate = 0.18;
      }
    } else if (region === 'ERCOT') {
      if (h >= 11 && h <= 15) {
        carbon = Math.round(190 + Math.random() * 35);
        renewablePct = Math.round(55 + Math.random() * 12);
        tariffRate = 0.11;
      } else if (h >= 16 && h <= 20) {
        carbon = Math.round(440 + Math.random() * 60);
        renewablePct = Math.round(22 + Math.random() * 6);
        tariffRate = 0.38;
      } else {
        carbon = Math.round(270 + Math.random() * 30);
        renewablePct = Math.round(40 + Math.random() * 10);
        tariffRate = 0.14;
      }
    } else if (region === 'UK_GRID') {
      if (h >= 10 && h <= 15) {
        carbon = Math.round(65 + Math.random() * 25);
        renewablePct = Math.round(82 + Math.random() * 10);
        tariffRate = 0.12;
      } else if (h >= 17 && h <= 20) {
        carbon = Math.round(240 + Math.random() * 35);
        renewablePct = Math.round(35 + Math.random() * 8);
        tariffRate = 0.35;
      } else {
        carbon = Math.round(110 + Math.random() * 25);
        renewablePct = Math.round(62 + Math.random() * 10);
        tariffRate = 0.15;
      }
    } else {
      // PJM
      if (h >= 11 && h <= 15) {
        carbon = Math.round(290 + Math.random() * 40);
        renewablePct = Math.round(38 + Math.random() * 8);
        tariffRate = 0.14;
      } else if ((h >= 7 && h <= 9) || (h >= 17 && h <= 20)) {
        carbon = Math.round(460 + Math.random() * 50);
        renewablePct = Math.round(18 + Math.random() * 5);
        tariffRate = 0.32;
      } else {
        carbon = Math.round(340 + Math.random() * 30);
        renewablePct = Math.round(26 + Math.random() * 6);
        tariffRate = 0.17;
      }
    }

    const timeLabel =
      h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

    hours.push({
      hour: h,
      timeLabel,
      carbonIntensity: carbon,
      renewablePct,
      tariffRate: parseFloat(tariffRate.toFixed(2)),
      solarKw,
      isPeak: tariffRate >= 0.30,
      isCleanWindow: renewablePct >= 65 || carbon <= 120,
    });
  }

  return hours;
}

export const INITIAL_APPLIANCES: SmartAppliance[] = [
  {
    id: 'ev_charger',
    name: 'EV Home Charger',
    brandModel: 'Tesla Wall Connector 48A',
    category: 'ev_charger',
    powerDrawKw: 7.2,
    durationHours: 3,
    status: 'scheduled',
    originalStartHour: 18, // initially scheduled at 6 PM peak!
    scheduledStartHour: 13, // optimal at 1 PM solar peak
    carbonSavedGrams: 2850,
    costSavedDollars: 4.86,
    priority: 'flexible',
    room: 'Garage',
  },
  {
    id: 'heat_pump',
    name: 'Heat Pump Water Heater',
    brandModel: 'Rheem ProTerra Hybrid 65 Gal',
    category: 'hvac',
    powerDrawKw: 3.5,
    durationHours: 2,
    status: 'scheduled',
    originalStartHour: 19, // 7 PM peak
    scheduledStartHour: 14, // 2 PM solar surplus
    carbonSavedGrams: 1120,
    costSavedDollars: 1.82,
    priority: 'essential',
    room: 'Utility Room',
  },
  {
    id: 'dishwasher',
    name: 'Smart Dishwasher',
    brandModel: 'Bosch 800 Series Home Connect',
    category: 'dishwasher',
    powerDrawKw: 1.4,
    durationHours: 2,
    status: 'idle',
    originalStartHour: 20, // 8 PM
    scheduledStartHour: 13, // 1 PM
    carbonSavedGrams: 460,
    costSavedDollars: 0.76,
    priority: 'flexible',
    room: 'Kitchen',
  },
  {
    id: 'laundry_dryer',
    name: 'Heat Pump Smart Dryer',
    brandModel: 'LG Studio EcoHybrid Dual Inverter',
    category: 'laundry',
    powerDrawKw: 2.8,
    durationHours: 1,
    status: 'idle',
    originalStartHour: 17, // 5 PM
    scheduledStartHour: 15, // 3 PM
    carbonSavedGrams: 580,
    costSavedDollars: 0.95,
    priority: 'flexible',
    room: 'Laundry',
  },
  {
    id: 'home_battery',
    name: 'Home Battery Storage',
    brandModel: 'Enphase IQ Battery 10T (10.5 kWh)',
    category: 'battery',
    powerDrawKw: 3.8,
    durationHours: 3,
    status: 'running',
    originalStartHour: 11,
    scheduledStartHour: 11, // Absorbing solar surplus 11 AM - 2 PM, discharging at 6 PM
    carbonSavedGrams: 1950,
    costSavedDollars: 3.20,
    priority: 'essential',
    room: 'Garage Storage',
  },
];

export const REGIONAL_BENCHMARKS: Record<
  string,
  { averageKw: number; label: string; normalOperatingRange: string }
> = {
  ev_charger: { averageKw: 6.0, label: 'Standard Level 2 EVSE', normalOperatingRange: '5.8 - 6.6 kW' },
  hvac: { averageKw: 2.2, label: 'Heat Pump Hybrid Water Heater', normalOperatingRange: '1.8 - 2.4 kW' },
  dishwasher: { averageKw: 1.1, label: 'Smart Dishwasher Eco-Cycle', normalOperatingRange: '1.0 - 1.2 kW' },
  laundry: { averageKw: 1.8, label: 'Heat Pump Hybrid Dryer', normalOperatingRange: '1.6 - 2.0 kW' },
  battery: { averageKw: 3.3, label: 'AC Coupled Home Storage', normalOperatingRange: '3.0 - 3.4 kW' },
};

export function generateHistoricalSavings(timeframe: '24h' | '7d' | '30d') {
  if (timeframe === '24h') {
    // Hourly breakdown across 24 hours
    let runningCumulativeKg = 0;
    return Array.from({ length: 24 }, (_, h) => {
      const timeLabel = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      // During midday clean window (11 - 16), heavy load shifting creates significant savings
      let preventedKg = 0;
      let baselineKg = 0.45;
      let optimizedKg = 0.45;

      if (h >= 12 && h <= 15) {
        baselineKg = 2.8; // would have run at 6 PM peaker
        optimizedKg = 0.6; // ran under 80% solar
        preventedKg = parseFloat((baselineKg - optimizedKg).toFixed(2));
      } else if (h >= 17 && h <= 20) {
        // Evening avoided draw
        baselineKg = 3.2;
        optimizedKg = 0.9;
        preventedKg = parseFloat((baselineKg - optimizedKg).toFixed(2));
      }

      runningCumulativeKg = parseFloat((runningCumulativeKg + preventedKg).toFixed(2));

      return {
        timeLabel,
        baselineCarbonKg: baselineKg,
        optimizedCarbonKg: optimizedKg,
        emissionsPreventedKg: preventedKg,
        cumulativePreventedKg: runningCumulativeKg,
        costSavedDollars: parseFloat((preventedKg * 0.85).toFixed(2)),
      };
    });
  }

  if (timeframe === '7d') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let runningCumulativeKg = 0;
    return days.map((day) => {
      const baselineKg = parseFloat((12.5 + Math.random() * 3).toFixed(1));
      const optimizedKg = parseFloat((4.2 + Math.random() * 1.5).toFixed(1));
      const preventedKg = parseFloat((baselineKg - optimizedKg).toFixed(1));
      runningCumulativeKg = parseFloat((runningCumulativeKg + preventedKg).toFixed(1));

      return {
        timeLabel: day,
        baselineCarbonKg: baselineKg,
        optimizedCarbonKg: optimizedKg,
        emissionsPreventedKg: preventedKg,
        cumulativePreventedKg: runningCumulativeKg,
        costSavedDollars: parseFloat((preventedKg * 0.92).toFixed(2)),
      };
    });
  }

  // 30 days projection
  let runningCumulativeKg = 0;
  return Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const baselineKg = parseFloat((11.8 + Math.sin(i / 3) * 2.2).toFixed(1));
    const optimizedKg = parseFloat((3.9 + Math.cos(i / 4) * 0.9).toFixed(1));
    const preventedKg = parseFloat((baselineKg - optimizedKg).toFixed(1));
    runningCumulativeKg = parseFloat((runningCumulativeKg + preventedKg).toFixed(1));

    return {
      timeLabel: `Day ${dayNum}`,
      baselineCarbonKg: baselineKg,
      optimizedCarbonKg: optimizedKg,
      emissionsPreventedKg: preventedKg,
      cumulativePreventedKg: runningCumulativeKg,
      costSavedDollars: parseFloat((preventedKg * 0.88).toFixed(2)),
    };
  });
}

export const DEFAULT_ACHIEVEMENTS: CarbonAchievement[] = [
  {
    id: 'first_spark',
    title: 'First Decarbonizer',
    category: 'carbon',
    description: 'Prevent your first 1.0 kg of grid carbon emissions through smart shifting.',
    badgeIcon: 'spark',
    targetValue: 1.0,
    currentValue: 1.0,
    unit: 'kg CO₂',
    isUnlocked: true,
    unlockedDate: 'Oct 18, 2026',
    rarity: 'Common',
    accentColor: '#10b981',
    howToEarn: 'Shift any heavy appliance like your dishwasher or EV into midday solar hours.',
  },
  {
    id: 'solar_synchronizer',
    title: 'Solar Synchronizer',
    category: 'solar',
    description: 'Directly schedule appliances into peak solar generation windows (>= 75% renewable).',
    badgeIcon: 'sun',
    targetValue: 10.0,
    currentValue: 10.0,
    unit: 'kg CO₂',
    isUnlocked: true,
    unlockedDate: 'Oct 20, 2026',
    rarity: 'Rare',
    accentColor: '#f59e0b',
    howToEarn: 'Let EcoPulse autonomous scheduler automatically move load into 12 PM - 3 PM sunny intervals.',
  },
  {
    id: 'grid_guardian',
    title: 'Peaker Plant Buster',
    category: 'grid',
    description: 'Avoid 25 kg of carbon emissions during high-tariff evening peaker plant ramp hours.',
    badgeIcon: 'shield',
    targetValue: 25.0,
    currentValue: 25.0,
    unit: 'kg CO₂',
    isUnlocked: true,
    unlockedDate: 'Oct 21, 2026',
    rarity: 'Rare',
    accentColor: '#06b6d4',
    howToEarn: 'Ensure HVAC and EV charging stay idle during 5 PM – 9 PM fossil peaker surge.',
  },
  {
    id: 'clean_streak',
    title: 'Carbon Budget Master',
    category: 'streak',
    description: 'Keep total daily household emissions under your user-defined budget.',
    badgeIcon: 'crown',
    targetValue: 40.0,
    currentValue: 32.4,
    unit: 'kg CO₂',
    isUnlocked: false,
    rarity: 'Epic',
    accentColor: '#8b5cf6',
    howToEarn: 'Set a daily carbon target in Ambient Dashboard and maintain headroom.',
  },
  {
    id: 'century_saver',
    title: 'Half-Quintal Pioneer',
    category: 'carbon',
    description: 'Accumulate 50.0 kg of total CO₂ emissions averted with EcoPulse.',
    badgeIcon: 'trees',
    targetValue: 50.0,
    currentValue: 36.8,
    unit: 'kg CO₂',
    isUnlocked: false,
    rarity: 'Epic',
    accentColor: '#ec4899',
    howToEarn: 'Keep automated smart appliance optimization active across consecutive weeks.',
  },
  {
    id: 'biosphere_paragon',
    title: 'Biosphere Paragon',
    category: 'carbon',
    description: 'Reach 100 kg of cumulative grid decarbonization — equivalent to a mature micro-grove.',
    badgeIcon: 'battery',
    targetValue: 100.0,
    currentValue: 36.8,
    unit: 'kg CO₂',
    isUnlocked: false,
    rarity: 'Legendary',
    accentColor: '#eab308',
    howToEarn: 'Achieve long-term grid symbiosis with automated Alexa+ voice routines.',
  },
];

export function evaluateAchievements(
  preventedKg: number,
  baseAchievements: CarbonAchievement[] = DEFAULT_ACHIEVEMENTS
): CarbonAchievement[] {
  return baseAchievements.map((ach) => {
    // Dynamic progress based on user's current cumulative emissions prevented
    let current = ach.currentValue;

    if (ach.category === 'carbon' || ach.category === 'solar' || ach.category === 'grid') {
      current = parseFloat(Math.max(current, preventedKg).toFixed(1));
    }

    const isUnlocked = current >= ach.targetValue;
    return {
      ...ach,
      currentValue: current,
      isUnlocked,
      unlockedDate: isUnlocked ? ach.unlockedDate || 'Today' : undefined,
    };
  });
}

export function generateWeeklyReport(region: GridRegion): WeeklyReportData {
  const isSolarRich = region === 'CAISO' || region === 'ERCOT';
  
  const dailySummaries: WeeklyDaySummary[] = [
    {
      dayName: 'Mon',
      fullDate: 'Oct 14',
      kwhConsumed: 22.4,
      solarSharePct: isSolarRich ? 82 : 64,
      carbonAvoidedKg: 5.6,
      costSavedDollars: 3.8,
      cleanGrade: 'A+',
      highlight: 'EV Charged at 1 PM Peak Solar',
    },
    {
      dayName: 'Tue',
      fullDate: 'Oct 15',
      kwhConsumed: 26.1,
      solarSharePct: isSolarRich ? 74 : 58,
      carbonAvoidedKg: 4.9,
      costSavedDollars: 3.2,
      cleanGrade: 'A',
      highlight: 'Dryer delayed to 2 PM',
    },
    {
      dayName: 'Wed',
      fullDate: 'Oct 16',
      kwhConsumed: 21.0,
      solarSharePct: isSolarRich ? 89 : 72,
      carbonAvoidedKg: 6.8,
      costSavedDollars: 4.6,
      cleanGrade: 'A+',
      highlight: 'Best Solar Day: 89% Clean',
    },
    {
      dayName: 'Thu',
      fullDate: 'Oct 17',
      kwhConsumed: 28.5,
      solarSharePct: isSolarRich ? 68 : 52,
      carbonAvoidedKg: 4.1,
      costSavedDollars: 2.9,
      cleanGrade: 'B',
      highlight: 'High evening AC load avoided peak',
    },
    {
      dayName: 'Fri',
      fullDate: 'Oct 18',
      kwhConsumed: 24.2,
      solarSharePct: isSolarRich ? 79 : 61,
      carbonAvoidedKg: 5.3,
      costSavedDollars: 3.5,
      cleanGrade: 'A',
      highlight: 'Dishwasher delayed until midday',
    },
    {
      dayName: 'Sat',
      fullDate: 'Oct 19',
      kwhConsumed: 31.0,
      solarSharePct: isSolarRich ? 84 : 68,
      carbonAvoidedKg: 6.2,
      costSavedDollars: 4.1,
      cleanGrade: 'A+',
      highlight: 'Full weekend laundry solar cycle',
    },
    {
      dayName: 'Sun',
      fullDate: 'Oct 20',
      kwhConsumed: 25.8,
      solarSharePct: isSolarRich ? 76 : 60,
      carbonAvoidedKg: 5.1,
      costSavedDollars: 3.4,
      cleanGrade: 'A',
      highlight: 'Pre-cooled living room before 4 PM',
    },
  ];

  const totalKwh = parseFloat(dailySummaries.reduce((acc, d) => acc + d.kwhConsumed, 0).toFixed(1));
  const totalCost = parseFloat(dailySummaries.reduce((acc, d) => acc + d.costSavedDollars, 0).toFixed(2));
  const totalCarbon = parseFloat(dailySummaries.reduce((acc, d) => acc + d.carbonAvoidedKg, 0).toFixed(1));
  const avgCleanPct = Math.round(dailySummaries.reduce((acc, d) => acc + d.solarSharePct, 0) / dailySummaries.length);

  return {
    weekLabel: 'Current Week (Oct 14 – Oct 20)',
    startDate: 'Oct 14, 2026',
    endDate: 'Oct 20, 2026',
    overallGrade: avgCleanPct >= 75 ? 'A+' : 'A',
    totalKwhConsumed: totalKwh,
    totalCostSavedDollars: totalCost,
    totalCarbonAvoidedKg: totalCarbon,
    averageCleanEnergyPct: avgCleanPct,
    bestDay: 'Wednesday (89% Clean Solar)',
    treeEquivalents: Math.max(1, Math.round(totalCarbon / 18)),
    dailySummaries,
    topApplianceSavings: [
      {
        name: 'Tesla Model Y Level 2',
        category: 'ev_charger',
        kwhShifted: 48.0,
        savedDollars: 12.8,
        tip: 'Shifted charging from expensive 6 PM peak to free 1 PM rooftop solar.',
      },
      {
        name: 'Carrier Heat Pump HVAC',
        category: 'hvac',
        kwhShifted: 32.5,
        savedDollars: 6.4,
        tip: 'Pre-cooled house between 1 PM – 3 PM; stayed idle through dirty peaker hours.',
      },
      {
        name: 'Whirlpool Smart Washer/Dryer',
        category: 'laundry',
        kwhShifted: 18.2,
        savedDollars: 3.7,
        tip: 'Scheduled laundry for midday sun, avoiding high grid tariff.',
      },
      {
        name: 'Bosch Smart Dishwasher',
        category: 'dishwasher',
        kwhShifted: 9.6,
        savedDollars: 1.9,
        tip: 'Cleaned dishes automatically while solar surplus was highest.',
      },
    ],
    simpleSummaryText: `Great news! This week your home ran on ${avgCleanPct}% clean, green energy. You saved a total of $${totalCost} on electricity and prevented ${totalCarbon} kilograms of carbon emissions. That is like planting ${Math.max(1, Math.round(totalCarbon / 18))} trees! Your best day was Wednesday.`,
  };
}

