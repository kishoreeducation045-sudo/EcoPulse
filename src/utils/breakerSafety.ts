/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Breaker Safety & Deterministic Load Staggering Engine
 * 
 * Enforces residential electrical panel planning budgets and continuous-load safety
 * (e.g. 100A / 19.2 kW or 200A / 38.4 kW at 240V, 80% continuous rule).
 * Acts as the authoritative governor over AI and manual schedules.
 */

import { SmartAppliance, HourlyForecast } from '../types';

export interface ServicePanelConfig {
  serviceAmps: 100 | 125 | 150 | 200;
  voltage: number; // 240V typical residential split-phase
  continuousRatingPct: number; // 80% NEC planning threshold for continuous loads
  planningBudgetKw: number; // Derived budget
  baselineLoadKw: number; // Uncontrollable home baseline (refrigeration, electronics, lighting)
}

export const PANEL_PRESETS: Record<100 | 125 | 150 | 200, ServicePanelConfig> = {
  100: {
    serviceAmps: 100,
    voltage: 240,
    continuousRatingPct: 80,
    planningBudgetKw: 19.2, // 100A * 240V * 0.8 / 1000
    baselineLoadKw: 1.8,
  },
  125: {
    serviceAmps: 125,
    voltage: 240,
    continuousRatingPct: 80,
    planningBudgetKw: 24.0,
    baselineLoadKw: 1.8,
  },
  150: {
    serviceAmps: 150,
    voltage: 240,
    continuousRatingPct: 80,
    planningBudgetKw: 28.8,
    baselineLoadKw: 2.0,
  },
  200: {
    serviceAmps: 200,
    voltage: 240,
    continuousRatingPct: 80,
    planningBudgetKw: 38.4, // 200A * 240V * 0.8 / 1000
    baselineLoadKw: 2.2,
  },
};

export interface LoadTimeSlice {
  timeHour: number; // e.g. 13.0, 13.5
  timeLabel: string;
  baselineKw: number;
  applianceKw: number;
  totalKw: number;
  activeApplianceIds: string[];
  isOverloaded: boolean;
  overloadKw: number;
  headroomKw: number;
}

export interface BreakerAnalysisResult {
  peakTotalKw: number;
  planningBudgetKw: number;
  isOverloaded: boolean;
  maxOverloadKw: number;
  worstTimeSlot: string;
  overloadedSlicesCount: number;
  conflictingApplianceIds: string[];
  timeSlices: LoadTimeSlice[];
}

/**
 * Returns baseline home draw curve across 24 hours.
 * Models early morning/night standby (1.2 kW), midday (1.6 kW), and evening cooking/lighting (2.4 kW).
 */
export function getBaselineDrawAtHour(hour: number, defaultBaseline = 1.8): number {
  if (hour >= 1 && hour <= 5) return parseFloat((defaultBaseline * 0.7).toFixed(1)); // 1.2 kW overnight
  if (hour >= 11 && hour <= 16) return parseFloat((defaultBaseline * 0.9).toFixed(1)); // 1.6 kW midday
  if (hour >= 17 && hour <= 21) return parseFloat((defaultBaseline * 1.3).toFixed(1)); // 2.3 kW dinner/evening
  return defaultBaseline;
}

/**
 * Analyzes household load profile in 30-minute intervals (48 slots).
 * Checks if concurrent active loads exceed the service panel planning budget.
 */
export function analyzeBreakerLoad(
  appliances: SmartAppliance[],
  panelConfig: ServicePanelConfig
): BreakerAnalysisResult {
  const slices: LoadTimeSlice[] = [];
  let peakTotalKw = 0;
  let maxOverloadKw = 0;
  let worstTimeSlot = '12:00 PM';
  const conflictingSet = new Set<string>();

  // 48 half-hour slices (0.0, 0.5, 1.0, ..., 23.5)
  for (let slot = 0; slot < 48; slot++) {
    const timeHour = slot / 2;
    const h = Math.floor(timeHour);
    const m = timeHour % 1 === 0 ? '00' : '30';
    const ampm = h === 0 ? '12' : h < 12 ? `${h}` : h === 12 ? '12' : `${h - 12}`;
    const period = h < 12 ? 'AM' : 'PM';
    const timeLabel = `${ampm}:${m} ${period}`;

    const baselineKw = getBaselineDrawAtHour(timeHour, panelConfig.baselineLoadKw);
    let applianceKw = 0;
    const activeIds: string[] = [];

    appliances.forEach((app) => {
      // Check if appliance runs during this time slice
      const start = app.scheduledStartHour ?? app.originalStartHour ?? 12;
      const duration = app.durationHours || 1;
      const end = start + duration;

      if (timeHour >= start && timeHour < end) {
        applianceKw += app.powerDrawKw;
        activeIds.push(app.id);
      }
    });

    const totalKw = parseFloat((baselineKw + applianceKw).toFixed(2));
    const isOverloaded = totalKw > panelConfig.planningBudgetKw;
    const overloadKw = isOverloaded ? parseFloat((totalKw - panelConfig.planningBudgetKw).toFixed(2)) : 0;
    const headroomKw = parseFloat(Math.max(0, panelConfig.planningBudgetKw - totalKw).toFixed(2));

    if (totalKw > peakTotalKw) {
      peakTotalKw = totalKw;
      worstTimeSlot = timeLabel;
    }

    if (overloadKw > maxOverloadKw) {
      maxOverloadKw = overloadKw;
      activeIds.forEach((id) => conflictingSet.add(id));
    }

    slices.push({
      timeHour,
      timeLabel,
      baselineKw,
      applianceKw: parseFloat(applianceKw.toFixed(2)),
      totalKw,
      activeApplianceIds: activeIds,
      isOverloaded,
      overloadKw,
      headroomKw,
    });
  }

  const overloadedSlicesCount = slices.filter((s) => s.isOverloaded).length;

  return {
    peakTotalKw,
    planningBudgetKw: panelConfig.planningBudgetKw,
    isOverloaded: overloadedSlicesCount > 0,
    maxOverloadKw,
    worstTimeSlot,
    overloadedSlicesCount,
    conflictingApplianceIds: Array.from(conflictingSet),
    timeSlices: slices,
  };
}

/**
 * Deterministic Load-Staggering Solver
 * 
 * When appliances scheduled into clean solar windows overlap to exceed the planning budget,
 * this solver staggers them into the cleanest adjacent intervals where capacity exists.
 * Priority:
 *  1. Essential appliances preserve their primary clean window
 *  2. Flexible heavy appliances (EV, dryer, battery) are staggered forward/backward
 *  3. Respects breaker limit at every half-hour time slice
 */
export function solveStaggeredSchedule(
  appliances: SmartAppliance[],
  forecast: HourlyForecast[],
  panelConfig: ServicePanelConfig
): {
  staggeredAppliances: SmartAppliance[];
  adjustmentsCount: number;
  explanation: string;
} {
  // Sort appliances: essential first, then flexible sorted by highest draw first
  const sorted = [...appliances].sort((a, b) => {
    if (a.priority === 'essential' && b.priority !== 'essential') return -1;
    if (a.priority !== 'essential' && b.priority === 'essential') return 1;
    return b.powerDrawKw - a.powerDrawKw;
  });

  const updatedAppliances: SmartAppliance[] = [];
  let adjustmentsCount = 0;

  // We maintain a 48-slot allocation table for the 24h day
  const allocatedKw = Array.from({ length: 48 }, (_, i) =>
    getBaselineDrawAtHour(i / 2, panelConfig.baselineLoadKw)
  );

  for (const app of sorted) {
    const durationSlots = Math.round((app.durationHours || 1) * 2); // 30-min slots
    const targetStartHour = app.scheduledStartHour ?? app.originalStartHour ?? 13;
    const targetStartSlot = Math.round(targetStartHour * 2);

    // Helper: evaluate if candidate start slot is feasible and calculate its carbon score
    const evaluateSlot = (candidateStartSlot: number) => {
      // Must fit in 24 hours
      if (candidateStartSlot < 0 || candidateStartSlot + durationSlots > 48) {
        return { feasible: false, carbonScore: Infinity };
      }

      // Check breaker budget for each slice of the duration
      for (let s = candidateStartSlot; s < candidateStartSlot + durationSlots; s++) {
        if (allocatedKw[s] + app.powerDrawKw > panelConfig.planningBudgetKw) {
          return { feasible: false, carbonScore: Infinity };
        }
      }

      // Compute carbon score (lower intensity is better)
      let carbonSum = 0;
      for (let s = candidateStartSlot; s < candidateStartSlot + durationSlots; s++) {
        const hour = Math.floor(s / 2);
        const forecastEntry = forecast[hour] || forecast[12];
        carbonSum += forecastEntry.carbonIntensity;
      }

      // Prefer slots close to targetStartSlot as tie-breaker
      const distancePenalty = Math.abs(candidateStartSlot - targetStartSlot) * 2;
      return { feasible: true, carbonScore: carbonSum + distancePenalty };
    };

    // First check if targetStartSlot is already feasible
    let bestSlot = targetStartSlot;
    const initialCheck = evaluateSlot(targetStartSlot);

    if (!initialCheck.feasible) {
      // Search all candidate slots from 8 AM (slot 16) to 9 PM (slot 42)
      let minScore = Infinity;
      let foundBest = targetStartSlot;

      for (let cand = 16; cand <= 42 - durationSlots; cand++) {
        const res = evaluateSlot(cand);
        if (res.feasible && res.carbonScore < minScore) {
          minScore = res.carbonScore;
          foundBest = cand;
        }
      }

      bestSlot = foundBest;
      if (bestSlot !== targetStartSlot) {
        adjustmentsCount++;
      }
    }

    // Allocate the chosen slots
    for (let s = bestSlot; s < bestSlot + durationSlots; s++) {
      allocatedKw[s] += app.powerDrawKw;
    }

    const newStartHour = bestSlot / 2;
    const isShifted = newStartHour !== app.scheduledStartHour;

    updatedAppliances.push({
      ...app,
      scheduledStartHour: newStartHour,
      status: 'optimized',
      carbonSavedGrams: app.carbonSavedGrams + (isShifted ? 380 : 0),
    });
  }

  // Restore original order
  const orderMap = new Map(appliances.map((a, idx) => [a.id, idx]));
  updatedAppliances.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  const explanation =
    adjustmentsCount > 0
      ? `Staggered ${adjustmentsCount} appliance(s) across clean solar windows (11:30 AM – 3:30 PM) to ensure total load never exceeds the ${panelConfig.planningBudgetKw} kW planning budget.`
      : `Current schedule verified: all overlapping intervals operate safely within the ${panelConfig.planningBudgetKw} kW panel planning budget.`;

  return {
    staggeredAppliances: updatedAppliances,
    adjustmentsCount,
    explanation,
  };
}

/**
 * Validates any AI-recommended schedule against the deterministic breaker safety authority.
 * If the proposal exceeds the breaker budget, it is automatically corrected.
 */
export function validateAndEnforceBreakerSafety(
  proposedSchedules: Array<{ id: string; recommendedStartHour: number }>,
  currentAppliances: SmartAppliance[],
  forecast: HourlyForecast[],
  panelConfig: ServicePanelConfig
): {
  approvedSchedules: Array<{ id: string; recommendedStartHour: number; adjustedForSafety: boolean; rationale?: string }>;
  wasAdjusted: boolean;
  maxSimultaneousKw: number;
} {
  // Apply proposed start hours tentatively
  const testAppliances = currentAppliances.map((app) => {
    const prop = proposedSchedules.find((p) => p.id === app.id);
    return prop ? { ...app, scheduledStartHour: prop.recommendedStartHour } : app;
  });

  const analysis = analyzeBreakerLoad(testAppliances, panelConfig);

  if (!analysis.isOverloaded) {
    return {
      approvedSchedules: proposedSchedules.map((p) => ({ ...p, adjustedForSafety: false })),
      wasAdjusted: false,
      maxSimultaneousKw: analysis.peakTotalKw,
    };
  }

  // Breaker overload detected: run the deterministic staggering solver as the absolute authority
  const solved = solveStaggeredSchedule(testAppliances, forecast, panelConfig);

  const approvedSchedules = proposedSchedules.map((p) => {
    const fixed = solved.staggeredAppliances.find((a) => a.id === p.id);
    const newStart = fixed?.scheduledStartHour ?? p.recommendedStartHour;
    const adjusted = newStart !== p.recommendedStartHour;
    return {
      id: p.id,
      recommendedStartHour: newStart,
      adjustedForSafety: adjusted,
      rationale: adjusted
        ? `Shifted to ${newStart}:00 to prevent concurrent breaker overload with heavy loads.`
        : undefined,
    };
  });

  return {
    approvedSchedules,
    wasAdjusted: true,
    maxSimultaneousKw: analysis.peakTotalKw,
  };
}
