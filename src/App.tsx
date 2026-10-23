/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GridRegion, HourlyForecast, SmartAppliance, OptimizationResult, AlexaRoutineResult } from './types';
import {
  REGION_DETAILS,
  generate24HourForecast,
  DEFAULT_ALEXA_ROUTINE,
} from './data/mockTelemetry';
import { Header } from './components/Header';
import { AmbientBiosphere } from './components/AmbientBiosphere';
import { ApplianceHub } from './components/ApplianceHub';
import { CarbonTimeline } from './components/CarbonTimeline';
import { AlexaRoutineView } from './components/AlexaRoutineView';
import { VirtualFireTVRemote } from './components/VirtualFireTVRemote';
import { HackathonModal } from './components/HackathonModal';
import { OptimizationResultModal } from './components/OptimizationResultModal';
import { EfficiencyAlertModal } from './components/EfficiencyAlertModal';
import { EnergySavings } from './components/EnergySavings';
import { SystemResilienceModal } from './components/SystemResilienceModal';
import { WeeklyReports } from './components/WeeklyReports';
import { NavigationDrawer } from './components/NavigationDrawer';
import { playNavSound } from './utils/audioEffects';
import {
  PANEL_PRESETS,
  getBaselineDrawAtHour,
  analyzeBreakerLoad,
  solveStaggeredSchedule,
  validateAndEnforceBreakerSafety,
} from './utils/breakerSafety';
import {
  loadHouseholdState,
  saveHouseholdState,
  resetHouseholdStateToDefaults,
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('ambient');
  const [selectedRegion, setSelectedRegion] = useState<GridRegion>('CAISO');
  const [currentHour, setCurrentHour] = useState<number>(13); // Default to 1:00 PM (Solar Peak)
  const [isRemoteOpen, setIsRemoteOpen] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(false);
  const [focusedId, setFocusedId] = useState<string>('nav-ambient');

  // Persistence: initialize state from versioned localStorage
  const initialHousehold = useMemo(() => loadHouseholdState().state, []);
  const [appliances, setAppliances] = useState<SmartAppliance[]>(initialHousehold.appliances);
  const [dailyCarbonBudgetKg, setDailyCarbonBudgetKg] = useState<number>(initialHousehold.dailyCarbonBudgetKg);
  const [servicePanelAmps, setServicePanelAmps] = useState<100 | 125 | 150 | 200>(initialHousehold.servicePanelAmps);

  // Provenance & System Resilience state
  const [engineMode, setEngineMode] = useState<'gemini' | 'deterministic_local'>('gemini');
  const [isResilienceModalOpen, setIsResilienceModalOpen] = useState<boolean>(false);
  const [weatherSource, setWeatherSource] = useState<string>('Open-Meteo Live API');
  const [weatherLastUpdated, setWeatherLastUpdated] = useState<string>('Recently');

  // AI & Automation state
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);

  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState<boolean>(false);
  const [alexaRoutine, setAlexaRoutine] = useState<AlexaRoutineResult | null>(DEFAULT_ALEXA_ROUTINE);
  const [isHackathonModalOpen, setIsHackathonModalOpen] = useState<boolean>(false);

  // Efficiency Alert Diagnostic state
  const [isEfficiencyAlertOpen, setIsEfficiencyAlertOpen] = useState<boolean>(false);
  const [selectedEfficiencyApplianceId, setSelectedEfficiencyApplianceId] = useState<string | null>(null);

  // Save to localStorage whenever appliances, budget, or service panel change
  useEffect(() => {
    saveHouseholdState({
      appliances,
      dailyCarbonBudgetKg,
      servicePanelAmps,
    });
  }, [appliances, dailyCarbonBudgetKg, servicePanelAmps]);

  // Generate 24-hour forecast whenever region changes
  const forecast = useMemo<HourlyForecast[]>(() => {
    return generate24HourForecast(selectedRegion);
  }, [selectedRegion]);

  const currentSlot = forecast[currentHour] || forecast[12];

  // Service panel config & continuous planning budget
  const panelConfig = useMemo(() => {
    return PANEL_PRESETS[servicePanelAmps] || PANEL_PRESETS[100];
  }, [servicePanelAmps]);

  // Baseline load at current hour (refrigeration, always-on electronics, lights)
  const baselineDrawKw = useMemo(() => {
    return getBaselineDrawAtHour(currentHour, panelConfig.baselineLoadKw);
  }, [currentHour, panelConfig]);

  // Dynamic total home draw calculation (baseline + running appliances)
  const homeDrawKw = useMemo(() => {
    const activeApplianceKw = appliances
      .filter((a) => a.status === 'running')
      .reduce((sum, a) => sum + a.powerDrawKw, 0);
    return parseFloat((baselineDrawKw + activeApplianceKw).toFixed(1));
  }, [appliances, baselineDrawKw]);

  // Real-time breaker load concurrency analysis across 24 hours
  const breakerAnalysis = useMemo(() => {
    return analyzeBreakerLoad(appliances, panelConfig);
  }, [appliances, panelConfig]);

  const solarKw = currentSlot.solarKw;

  // Spatial Navigation list for 10-foot Fire TV UI
  const getFocusableElements = useCallback(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.tv-focusable'));
    return elements.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
    });
  }, []);

  // Spatial Move Handler
  const handleSpatialNavigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const focusables = getFocusableElements();
      if (!focusables.length) return;

      const currentIdx = focusables.findIndex((el) => el.id === focusedId);
      let targetIdx = 0;

      if (currentIdx === -1) {
        targetIdx = 0;
      } else {
        if (direction === 'right' || direction === 'down') {
          targetIdx = (currentIdx + 1) % focusables.length;
        } else {
          targetIdx = (currentIdx - 1 + focusables.length) % focusables.length;
        }
      }

      const targetEl = focusables[targetIdx];
      if (targetEl) {
        setFocusedId(targetEl.id);
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },
    [focusedId, getFocusableElements]
  );

  // Select / OK Handler
  const handleSelectFocused = useCallback(() => {
    if (!focusedId) return;
    const el = document.getElementById(focusedId);
    if (el) {
      el.click();
    }
  }, [focusedId]);

  // Back Handler
  const handleBack = useCallback(() => {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return;
    }
    if (isResilienceModalOpen) {
      setIsResilienceModalOpen(false);
      return;
    }
    if (isResultModalOpen) {
      setIsResultModalOpen(false);
      return;
    }
    if (isHackathonModalOpen) {
      setIsHackathonModalOpen(false);
      return;
    }
    if (isEfficiencyAlertOpen) {
      setIsEfficiencyAlertOpen(false);
      return;
    }
    if (activeTab !== 'ambient') {
      setActiveTab('ambient');
      setFocusedId('nav-ambient');
    }
  }, [
    isDrawerOpen,
    isResilienceModalOpen,
    isResultModalOpen,
    isHackathonModalOpen,
    isEfficiencyAlertOpen,
    activeTab,
  ]);

  // Physical Keyboard Listener (Arrow keys = D-Pad, Enter = Select, Esc/Backspace = Back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        playNavSound('focus');
        handleSpatialNavigate('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        playNavSound('focus');
        handleSpatialNavigate('down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        playNavSound('focus');
        handleSpatialNavigate('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        playNavSound('focus');
        handleSpatialNavigate('right');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        playNavSound('select');
        handleSelectFocused();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        playNavSound('back');
        handleBack();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        playNavSound('select');
        setActiveTab('ambient');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpatialNavigate, handleSelectFocused, handleBack]);

  // Handle Tab changes
  const handleTabChange = (tabId: string) => {
    if (tabId === 'hackathon') {
      setIsHackathonModalOpen(true);
      return;
    }
    setActiveTab(tabId);
  };

  // Auto-Stagger Schedule to resolve Breaker Overload
  const handleAutoStaggerSchedule = () => {
    const solved = solveStaggeredSchedule(appliances, forecast, panelConfig);
    setAppliances(solved.staggeredAppliances);
  };

  // Factory Reset to clean defaults
  const handleResetToDefaults = () => {
    const defaults = resetHouseholdStateToDefaults();
    setAppliances(defaults.appliances);
    setDailyCarbonBudgetKg(defaults.dailyCarbonBudgetKg);
    setServicePanelAmps(defaults.servicePanelAmps);
  };

  // AI Load Shift Call with Breaker Safety Authority Validation
  const triggerAiOptimization = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/gemini/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gridRegion: REGION_DETAILS[selectedRegion].name,
          currentCarbonIntensity: currentSlot.carbonIntensity,
          cleanEnergyShare: currentSlot.renewablePct,
          currentHour,
          solarKw,
          homeDrawKw,
          appliances,
          forecast,
        }),
      });

      const resJson = await response.json();
      const rawResult: OptimizationResult = resJson.data || resJson.fallbackData;

      if (resJson.engineProvenance) {
        setEngineMode(resJson.engineProvenance);
      } else if (resJson.isFallback) {
        setEngineMode('deterministic_local');
      } else {
        setEngineMode('gemini');
      }

      // Authoritative Breaker Safety Validation
      if (rawResult?.applianceSchedules) {
        const validation = validateAndEnforceBreakerSafety(
          rawResult.applianceSchedules,
          appliances,
          forecast,
          panelConfig
        );

        if (validation.wasAdjusted) {
          rawResult.summary += ` [Breaker Safety Governor Active: Staggered appliances to ensure concurrent draw stays under ${panelConfig.planningBudgetKw} kW budget].`;
          rawResult.applianceSchedules = rawResult.applianceSchedules.map((item) => {
            const approved = validation.approvedSchedules.find((s) => s.id === item.id);
            return approved
              ? {
                  ...item,
                  recommendedStartHour: approved.recommendedStartHour,
                  recommendedEndHour: approved.recommendedStartHour + 2,
                  rationale: approved.rationale || item.rationale,
                }
              : item;
          });
        }
      }

      setOptimizationResult(rawResult);
      setIsResultModalOpen(true);
    } catch (err) {
      console.warn('Load shift optimization request fell back to client solver:', err);
      setEngineMode('deterministic_local');
      const solved = solveStaggeredSchedule(appliances, forecast, panelConfig);
      setOptimizationResult({
        summary: `Deterministic Engine: Staggered appliances safely across solar peak to comply with ${panelConfig.planningBudgetKw} kW planning budget.`,
        cleanWindowRecommendation: 'Optimal window 11:30 AM - 3:30 PM with high solar share',
        projectedCo2SavedKg: 4.8,
        projectedCostSavedDollars: 3.9,
        peakGridAvoidedKw: 6.8,
        applianceSchedules: solved.staggeredAppliances.map((a) => ({
          id: a.id,
          recommendedStartHour: a.scheduledStartHour,
          recommendedEndHour: a.scheduledStartHour + a.durationHours,
          rationale: `Aligned to clean solar window within ${panelConfig.planningBudgetKw} kW continuous budget`,
          carbonSavingsGrams: 750,
        })),
        alexaVoiceBriefing: `EcoPulse scheduled your appliances safely within your ${panelConfig.serviceAmps}A panel budget to save 4.8 kg of carbon.`,
        livingBiosphereStatus: 'Emerald canopy thriving with clean solar energy balance.',
      });
      setIsResultModalOpen(true);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Apply Schedule Recommended by AI
  const applyRecommendedSchedule = () => {
    if (!optimizationResult?.applianceSchedules) return;

    setAppliances((prev) =>
      prev.map((app) => {
        const recommendation = optimizationResult.applianceSchedules.find(
          (rec) => rec.id === app.id
        );
        if (recommendation) {
          return {
            ...app,
            scheduledStartHour: recommendation.recommendedStartHour,
            carbonSavedGrams: app.carbonSavedGrams + recommendation.carbonSavingsGrams,
            status: 'optimized',
          };
        }
        return app;
      })
    );
    setIsResultModalOpen(false);
  };

  // Generate Alexa+ Routine
  const generateAlexaRoutine = async (goal?: string) => {
    setIsGeneratingRoutine(true);
    try {
      const response = await fetch('/api/gemini/alexa-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userGoal: goal || 'Automatically shift EV and heavy loads into clean solar hours',
          applianceNames: appliances.map((a) => a.name),
          currentGridStatus: `${selectedRegion}, ${currentSlot.carbonIntensity} gCO2/kWh, ${currentSlot.renewablePct}% clean`,
        }),
      });

      const resJson = await response.json();
      if (resJson.data) {
        setAlexaRoutine(resJson.data);
      } else if (resJson.fallbackData) {
        setAlexaRoutine(resJson.fallbackData);
      }
    } catch (err) {
      console.warn('Alexa routine request fell back:', err);
    } finally {
      setIsGeneratingRoutine(false);
    }
  };

  // Appliance Actions
  const handleUpdateSchedule = (id: string, newStartHour: number) => {
    setAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, scheduledStartHour: newStartHour } : a))
    );
  };

  const handleToggleStatus = (id: string) => {
    setAppliances((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: a.status === 'running' ? 'idle' : 'running',
            }
          : a
      )
    );
  };

  const handleAlignToOptimal = (id: string) => {
    // Find cleanest upcoming hour
    const upcoming = forecast.slice(currentHour).concat(forecast.slice(0, currentHour));
    const cleanest = upcoming.reduce((prev, curr) =>
      curr.carbonIntensity < prev.carbonIntensity ? curr : prev
    );

    setAppliances((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              scheduledStartHour: cleanest.hour,
              status: 'optimized',
              carbonSavedGrams: a.carbonSavedGrams + 450,
            }
          : a
      )
    );
  };

  const handleOpenEfficiencyAlert = (id?: string) => {
    setSelectedEfficiencyApplianceId(id || null);
    setIsEfficiencyAlertOpen(true);
  };

  const handleRemediateAppliance = (id: string, targetKw: number) => {
    setAppliances((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              powerDrawKw: targetKw,
              status: 'optimized',
              carbonSavedGrams: app.carbonSavedGrams + 650,
              costSavedDollars: parseFloat((app.costSavedDollars + 1.2).toFixed(2)),
            }
          : app
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#080c15] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 3-Zone Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isRemoteOpen={isRemoteOpen}
        setIsRemoteOpen={setIsRemoteOpen}
        onOptimize={triggerAiOptimization}
        isOptimizing={isOptimizing}
        engineMode={engineMode}
        onOpenResilienceModal={() => setIsResilienceModalOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        isSimpleMode={isSimpleMode}
        onToggleSimpleMode={() => setIsSimpleMode((prev) => !prev)}
        focusedId={focusedId}
      />

      {/* Main 10-Foot Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* View 1: Ambient Living Biosphere (Default 10-Foot Screen) */}
        {activeTab === 'ambient' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <AmbientBiosphere
              currentHour={currentHour}
              setCurrentHour={setCurrentHour}
              forecast={forecast}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              homeDrawKw={homeDrawKw}
              solarKw={solarKw}
              dailyCarbonBudgetKg={dailyCarbonBudgetKg}
              onUpdateDailyBudget={setDailyCarbonBudgetKg}
              onOpenApplianceHub={() => setActiveTab('appliances')}
              onOptimize={triggerAiOptimization}
              isSimpleMode={isSimpleMode}
              focusedId={focusedId}
            />

            {/* In-view 24h Timeline summary */}
            <CarbonTimeline
              forecast={forecast}
              currentHour={currentHour}
              setCurrentHour={setCurrentHour}
              appliances={appliances}
              focusedId={focusedId}
            />
          </div>
        )}

        {/* View 2: Weekly Reports (Comprehensive 7-Day Performance & Voice Readout) */}
        {activeTab === 'weekly' && (
          <div className="animate-in fade-in duration-200">
            <WeeklyReports
              selectedRegion={selectedRegion}
              isSimpleMode={isSimpleMode}
              onOpenApplianceHub={() => setActiveTab('appliances')}
              onOptimize={triggerAiOptimization}
              focusedId={focusedId}
            />
          </div>
        )}

        {/* View 3: Smart Appliance Hub */}
        {activeTab === 'appliances' && (
          <div className="animate-in fade-in duration-200">
            <ApplianceHub
              appliances={appliances}
              panelConfig={panelConfig}
              breakerAnalysis={breakerAnalysis}
              currentDrawKw={homeDrawKw}
              baselineDrawKw={baselineDrawKw}
              onChangePanelAmps={setServicePanelAmps}
              onAutoStaggerSchedule={handleAutoStaggerSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onToggleStatus={handleToggleStatus}
              onAlignToOptimal={handleAlignToOptimal}
              onOptimizeAll={triggerAiOptimization}
              onOpenEfficiencyAlert={handleOpenEfficiencyAlert}
              isOptimizing={isOptimizing}
              focusedId={focusedId}
            />
          </div>
        )}

        {/* View 4: Recharts Energy Savings & Emissions Prevented */}
        {activeTab === 'savings' && (
          <div className="animate-in fade-in duration-200">
            <EnergySavings focusedId={focusedId} />
          </div>
        )}

        {/* View 5: Full 24-Hour Carbon Duck Curve Timeline */}
        {activeTab === 'timeline' && (
          <div className="animate-in fade-in duration-200">
            <CarbonTimeline
              forecast={forecast}
              currentHour={currentHour}
              setCurrentHour={setCurrentHour}
              appliances={appliances}
              focusedId={focusedId}
            />
          </div>
        )}

        {/* View 6: Alexa+ Agent Routine & MCP Schema */}
        {activeTab === 'alexa' && (
          <div className="animate-in fade-in duration-200">
            <AlexaRoutineView
              routineData={alexaRoutine}
              onGenerateRoutine={generateAlexaRoutine}
              isGenerating={isGeneratingRoutine}
              selectedRegion={selectedRegion}
              focusedId={focusedId}
            />
          </div>
        )}
      </main>

      {/* Virtual Fire TV Remote Simulator */}
      <VirtualFireTVRemote
        isOpen={isRemoteOpen}
        onClose={() => setIsRemoteOpen(false)}
        onNavigate={handleSpatialNavigate}
        onSelect={handleSelectFocused}
        onBack={handleBack}
        onHome={() => {
          setActiveTab('ambient');
          setFocusedId('nav-ambient');
        }}
        onAlexaPrompt={() => {
          setActiveTab('alexa');
          generateAlexaRoutine();
        }}
        focusedId={focusedId}
      />

      {/* Navigation Drawer (Hamburger Menu) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        isSimpleMode={isSimpleMode}
        onToggleSimpleMode={() => setIsSimpleMode((prev) => !prev)}
        onOptimize={triggerAiOptimization}
        onOpenResilienceModal={() => setIsResilienceModalOpen(true)}
        onOpenHackathonModal={() => setIsHackathonModalOpen(true)}
        onResetDefaults={handleResetToDefaults}
        focusedId={focusedId}
      />

      {/* Modals */}
      <OptimizationResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        result={optimizationResult}
        onApplySchedule={applyRecommendedSchedule}
      />

      <EfficiencyAlertModal
        isOpen={isEfficiencyAlertOpen}
        onClose={() => setIsEfficiencyAlertOpen(false)}
        appliances={appliances}
        selectedApplianceId={selectedEfficiencyApplianceId}
        onSelectAppliance={(id) => setSelectedEfficiencyApplianceId(id)}
        selectedRegion={selectedRegion}
        onRemediateAppliance={handleRemediateAppliance}
        focusedId={focusedId}
      />

      <SystemResilienceModal
        isOpen={isResilienceModalOpen}
        onClose={() => setIsResilienceModalOpen(false)}
        engineMode={engineMode}
        weatherSource={weatherSource}
        weatherLastUpdated={weatherLastUpdated}
        appliances={appliances}
        forecast={forecast}
        onResetToDefaults={handleResetToDefaults}
        focusedId={focusedId}
      />

      <HackathonModal
        isOpen={isHackathonModalOpen}
        onClose={() => setIsHackathonModalOpen(false)}
      />
    </div>
  );
}
