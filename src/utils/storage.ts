/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EcoPulse Local Storage & Household State Persistence
 * 
 * Manages versioned local storage with schema validation, day-rollover accounting,
 * and reliable fallback if local storage is restricted.
 */

import { SmartAppliance } from '../types';
import { INITIAL_APPLIANCES } from '../data/mockTelemetry';

export interface EcoPulseStorageSchema {
  schemaVersion: 2;
  lastActiveDate: string; // YYYY-MM-DD
  appliances: SmartAppliance[];
  dailyCarbonBudgetKg: number;
  servicePanelAmps: 100 | 125 | 150 | 200;
  unlockedAchievementIds: string[];
  cumulativePreventedKg: number;
  dailyEmissionsSpentKg: number;
}

const STORAGE_KEY = 'ecopulse_household_state_v2';

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function getDefaultStorageState(): EcoPulseStorageSchema {
  return {
    schemaVersion: 2,
    lastActiveDate: getTodayDateString(),
    appliances: INITIAL_APPLIANCES,
    dailyCarbonBudgetKg: 6.0,
    servicePanelAmps: 100, // 100A / 19.2 kW budget default
    unlockedAchievementIds: ['first_shift'],
    cumulativePreventedKg: 28.4,
    dailyEmissionsSpentKg: 2.1,
  };
}

export interface StorageStatus {
  isAvailable: boolean;
  isDayRollover: boolean;
  schemaVersion: number;
}

let inMemoryState: EcoPulseStorageSchema = getDefaultStorageState();
let isStorageAvailableCache: boolean | null = null;

export function checkStorageAvailability(): boolean {
  if (isStorageAvailableCache !== null) return isStorageAvailableCache;
  try {
    const testKey = '__ecopulse_storage_probe__';
    window.localStorage.setItem(testKey, 'ok');
    window.localStorage.removeItem(testKey);
    isStorageAvailableCache = true;
    return true;
  } catch (err) {
    isStorageAvailableCache = false;
    return false;
  }
}

/**
 * Loads stored household state, performing version upgrades and day rollover checks.
 */
export function loadHouseholdState(): { state: EcoPulseStorageSchema; status: StorageStatus } {
  const isAvailable = checkStorageAvailability();
  const today = getTodayDateString();

  if (!isAvailable) {
    const isDayRollover = inMemoryState.lastActiveDate !== today;
    if (isDayRollover) {
      inMemoryState.lastActiveDate = today;
      inMemoryState.dailyEmissionsSpentKg = 0;
    }
    return {
      state: inMemoryState,
      status: { isAvailable: false, isDayRollover, schemaVersion: 2 },
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = getDefaultStorageState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return {
        state: defaultState,
        status: { isAvailable: true, isDayRollover: false, schemaVersion: 2 },
      };
    }

    const parsed: Partial<EcoPulseStorageSchema> = JSON.parse(raw);

    // Schema version check & migration
    if (!parsed.schemaVersion || parsed.schemaVersion < 2) {
      console.info('[EcoPulse Storage] Upgrading storage schema to v2...');
      const upgradedState: EcoPulseStorageSchema = {
        ...getDefaultStorageState(),
        appliances: Array.isArray(parsed.appliances) ? parsed.appliances : INITIAL_APPLIANCES,
        dailyCarbonBudgetKg: typeof parsed.dailyCarbonBudgetKg === 'number' ? parsed.dailyCarbonBudgetKg : 6.0,
        unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds)
          ? parsed.unlockedAchievementIds
          : ['first_shift'],
        schemaVersion: 2,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(upgradedState));
      return {
        state: upgradedState,
        status: { isAvailable: true, isDayRollover: false, schemaVersion: 2 },
      };
    }

    // Day rollover check
    const isDayRollover = parsed.lastActiveDate !== today;
    const finalState: EcoPulseStorageSchema = {
      schemaVersion: 2,
      lastActiveDate: today,
      appliances: Array.isArray(parsed.appliances) && parsed.appliances.length > 0 ? parsed.appliances : INITIAL_APPLIANCES,
      dailyCarbonBudgetKg: typeof parsed.dailyCarbonBudgetKg === 'number' ? parsed.dailyCarbonBudgetKg : 6.0,
      servicePanelAmps: [100, 125, 150, 200].includes(parsed.servicePanelAmps as any)
        ? (parsed.servicePanelAmps as any)
        : 100,
      unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds) ? parsed.unlockedAchievementIds : ['first_shift'],
      cumulativePreventedKg: typeof parsed.cumulativePreventedKg === 'number' ? parsed.cumulativePreventedKg : 28.4,
      dailyEmissionsSpentKg: isDayRollover ? 0 : (parsed.dailyEmissionsSpentKg ?? 2.1),
    };

    if (isDayRollover) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(finalState));
    }

    return {
      state: finalState,
      status: { isAvailable: true, isDayRollover, schemaVersion: 2 },
    };
  } catch (err) {
    console.warn('[EcoPulse Storage] Parse error, reverting to clean defaults:', err);
    const fallback = getDefaultStorageState();
    return {
      state: fallback,
      status: { isAvailable: true, isDayRollover: false, schemaVersion: 2 },
    };
  }
}

/**
 * Saves current household state to local storage or memory.
 */
export function saveHouseholdState(state: Partial<EcoPulseStorageSchema>): void {
  const isAvailable = checkStorageAvailability();
  const current = inMemoryState;
  const merged: EcoPulseStorageSchema = {
    ...current,
    ...state,
    schemaVersion: 2,
    lastActiveDate: getTodayDateString(),
  };

  inMemoryState = merged;

  if (isAvailable) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn('[EcoPulse Storage] Failed to write localStorage:', e);
    }
  }
}

/**
 * Resets storage to pristine factory defaults.
 */
export function resetHouseholdStateToDefaults(): EcoPulseStorageSchema {
  const defaults = getDefaultStorageState();
  inMemoryState = defaults;
  if (checkStorageAvailability()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    } catch (e) {
      console.warn('[EcoPulse Storage] Clear error:', e);
    }
  }
  return defaults;
}
