import React from 'react';
import {
  Tv,
  Sparkles,
  SlidersHorizontal,
  Award,
  TrendingDown,
  Calendar,
  Menu,
  Smile,
} from 'lucide-react';
import { playNavSound } from '../utils/audioEffects';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isRemoteOpen: boolean;
  setIsRemoteOpen: (open: boolean) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  engineMode: 'gemini' | 'deterministic_local';
  onOpenResilienceModal: () => void;
  onOpenDrawer: () => void;
  isSimpleMode: boolean;
  onToggleSimpleMode: () => void;
  focusedId: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isRemoteOpen,
  setIsRemoteOpen,
  onOptimize,
  isOptimizing,
  engineMode,
  onOpenResilienceModal,
  onOpenDrawer,
  isSimpleMode,
  onToggleSimpleMode,
  focusedId,
}) => {
  const navItems = [
    { id: 'ambient', label: 'Ambient View', icon: Tv },
    { id: 'weekly', label: 'Weekly Reports', icon: Calendar },
    { id: 'appliances', label: 'Appliance Hub', icon: SlidersHorizontal },
    { id: 'savings', label: 'Energy Savings', icon: TrendingDown },
    { id: 'timeline', label: 'Grid Duck Curve', icon: null },
    { id: 'alexa', label: 'Alexa+ Routine', icon: null },
    { id: 'hackathon', label: 'Hackathon Pitch', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#080c15]/95 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Hamburger Menu Trigger & Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Hamburger Menu Button */}
          <button
            id="btn-hamburger-menu"
            onClick={() => {
              playNavSound('select');
              onOpenDrawer();
            }}
            className={`tv-focusable px-3 py-1.5 rounded-xl bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 transition-all border border-slate-700/80 flex items-center gap-2 shadow-sm ${
              focusedId === 'btn-hamburger-menu' ? 'tv-focused' : ''
            }`}
            title="Open Main Menu (All Features)"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Menu
            </span>
          </button>

          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                EcoPulse
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                {engineMode === 'gemini' ? 'Gemini 3.8 Flash' : 'Deterministic (429 Shield)'}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span>Fire TV 10-Foot Edition</span>
              <span aria-hidden="true">·</span>
              <span>Vega OS Ready</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-Line) */}
        <nav className="hidden xl:flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800/80">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isItemFocused = focusedId === `nav-${item.id}`;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  playNavSound('select');
                  setActiveTab(item.id);
                }}
                className={`tv-focusable px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                } ${isItemFocused ? 'tv-focused' : ''}`}
              >
                {item.icon && <item.icon className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & Accessibility */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Easy Mode Switcher */}
          <button
            id="btn-toggle-easy-mode"
            onClick={() => {
              playNavSound('select');
              onToggleSimpleMode();
            }}
            className={`tv-focusable px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isSimpleMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-700/80'
            } ${focusedId === 'btn-toggle-easy-mode' ? 'tv-focused' : ''}`}
            title="Toggle Easy View with large icons and plain language"
          >
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <span>{isSimpleMode ? 'Easy Mode: ON' : 'Easy Mode'}</span>
          </button>

          <button
            id="btn-open-resilience"
            onClick={() => {
              playNavSound('select');
              onOpenResilienceModal();
            }}
            className={`tv-focusable hidden md:flex px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap shrink-0 items-center gap-1.5 bg-slate-900/80 text-slate-300 hover:bg-slate-800 border-slate-700/80 ${
              focusedId === 'btn-open-resilience' ? 'tv-focused' : ''
            }`}
            title="Inspect System Resilience & Run Invariant Checks"
          >
            <span>Test Suite</span>
          </button>

          <button
            id="btn-remote-toggle"
            onClick={() => {
              playNavSound('select');
              setIsRemoteOpen(!isRemoteOpen);
            }}
            className={`tv-focusable px-2.5 md:px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isRemoteOpen
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border-slate-700'
            } ${focusedId === 'btn-remote-toggle' ? 'tv-focused' : ''}`}
            title="Toggle Fire TV Virtual Remote Controller"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isRemoteOpen ? 'Close Remote' : 'TV Remote'}</span>
          </button>

          <button
            id="btn-ai-optimize"
            onClick={() => {
              playNavSound('optimize');
              onOptimize();
            }}
            disabled={isOptimizing}
            className={`tv-focusable px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap shrink-0 flex items-center gap-1.5 disabled:opacity-60 ${
              focusedId === 'btn-ai-optimize' ? 'tv-focused' : ''
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizing...' : 'Save Energy'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
