import React from 'react';
import {
  X,
  Tv,
  Calendar,
  SlidersHorizontal,
  TrendingDown,
  Clock,
  Mic,
  Award,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Sun,
  Eye,
  Zap,
} from 'lucide-react';
import { playNavSound } from '../utils/audioEffects';
import { speakMessage, stopSpeaking } from '../utils/speechVoice';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isSimpleMode: boolean;
  onToggleSimpleMode: () => void;
  onOptimize: () => void;
  onOpenResilienceModal: () => void;
  onOpenHackathonModal: () => void;
  onResetDefaults: () => void;
  focusedId: string;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  isSimpleMode,
  onToggleSimpleMode,
  onOptimize,
  onOpenResilienceModal,
  onOpenHackathonModal,
  onResetDefaults,
  focusedId,
}) => {
  if (!isOpen) return null;

  const navMenuItems = [
    {
      id: 'ambient',
      title: 'Home & Biosphere',
      simpleTitle: '1. Home Status',
      desc: 'Check if electricity is clean and cheap right now.',
      icon: Tv,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'weekly',
      title: 'Weekly Reports',
      simpleTitle: '2. Weekly Report',
      desc: 'See how much money you saved and clean energy used this week.',
      icon: Calendar,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badge: 'New',
    },
    {
      id: 'appliances',
      title: 'Appliance Hub & Breaker Safety',
      simpleTitle: '3. My Machines',
      desc: 'Control washer, car charger, and AC without tripping breakers.',
      icon: SlidersHorizontal,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    },
    {
      id: 'savings',
      title: 'Savings & Achievement Badges',
      simpleTitle: '4. Money & Badges',
      desc: 'View your dollar savings, avoided smoke, and unlocked trophies.',
      icon: TrendingDown,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    },
    {
      id: 'timeline',
      title: 'Grid Carbon Duck Curve',
      simpleTitle: '5. Sun Hours Chart',
      desc: '24-hour visual curve showing best hours to run machines.',
      icon: Clock,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    {
      id: 'alexa',
      title: 'Alexa+ Voice Routine',
      simpleTitle: '6. Alexa Voice',
      desc: 'Say "Alexa, ask EcoPulse" to control your home by voice.',
      icon: Mic,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    },
  ];

  const handleReadMenuOutLoud = () => {
    playNavSound('select');
    const menuSpeech = `EcoPulse Main Menu. You can choose: 1. Home Status, 2. Weekly Report, 3. My Machines and Appliance Control, 4. Money and Carbon Badges, 5. Sun Hours Chart, or 6. Alexa Voice Control. Tap Save Energy Now at any time to automatically optimize your appliances.`;
    speakMessage(menuSpeech);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={() => {
          playNavSound('back');
          onClose();
        }}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#0b101b] border-r border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                EcoPulse Menu
              </h2>
              <p className="text-xs text-slate-400">All Features & Quick Settings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="drawer-speak-btn"
              onClick={handleReadMenuOutLoud}
              className={`tv-focusable p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-slate-700 ${
                focusedId === 'drawer-speak-btn' ? 'tv-focused' : ''
              }`}
              title="Read menu aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              id="drawer-close-btn"
              onClick={() => {
                playNavSound('back');
                onClose();
              }}
              className={`tv-focusable p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all border border-slate-700 ${
                focusedId === 'drawer-close-btn' ? 'tv-focused' : ''
              }`}
              title="Close Menu (Back)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Mode Switcher (Simple / Normal) */}
        <div className="p-4 bg-emerald-950/30 border-b border-emerald-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-emerald-200">
                  Easy Mode (For Everyone)
                </div>
                <div className="text-[11px] text-slate-300">
                  {isSimpleMode
                    ? 'Active: Big buttons & simple words'
                    : 'Standard: Detailed technical metrics'}
                </div>
              </div>
            </div>

            <button
              id="drawer-simple-mode-btn"
              onClick={() => {
                playNavSound('select');
                onToggleSimpleMode();
              }}
              className={`tv-focusable px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                isSimpleMode
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/20'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              } ${focusedId === 'drawer-simple-mode-btn' ? 'tv-focused' : ''}`}
            >
              {isSimpleMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Menu Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
            Application Sections
          </div>

          {navMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            const isItemFocused = focusedId === `drawer-nav-${item.id}`;
            const ItemIcon = item.icon;

            return (
              <button
                key={item.id}
                id={`drawer-nav-${item.id}`}
                onClick={() => {
                  playNavSound('select');
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`tv-focusable w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  isActive
                    ? 'bg-slate-800/90 border-emerald-500/70 shadow-md'
                    : 'bg-slate-900/40 border-slate-850 hover:bg-slate-800/60 hover:border-slate-700'
                } ${isItemFocused ? 'tv-focused' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${item.color}`}
                >
                  <ItemIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isActive ? 'text-emerald-300' : 'text-slate-100'
                      }`}
                    >
                      {isSimpleMode ? item.simpleTitle : item.title}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Quick Tools & Extras */}
          <div className="pt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1">
              Safety & Developer Tools
            </div>

            <div className="space-y-2 mt-1">
              <button
                id="drawer-resilience-btn"
                onClick={() => {
                  playNavSound('select');
                  onClose();
                  onOpenResilienceModal();
                }}
                className={`tv-focusable w-full p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-left transition-all flex items-center gap-3 text-xs text-slate-300 ${
                  focusedId === 'drawer-resilience-btn' ? 'tv-focused' : ''
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-200">System Resilience & Tests</div>
                  <div className="text-[11px] text-slate-400">Quota shield & breaker governor</div>
                </div>
              </button>

              <button
                id="drawer-hackathon-btn"
                onClick={() => {
                  playNavSound('select');
                  onClose();
                  onOpenHackathonModal();
                }}
                className={`tv-focusable w-full p-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-left transition-all flex items-center gap-3 text-xs text-slate-300 ${
                  focusedId === 'drawer-hackathon-btn' ? 'tv-focused' : ''
                }`}
              >
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-200">Hackathon Vision & Architecture</div>
                  <div className="text-[11px] text-slate-400">Fire TV 10-foot ambient experience</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer Quick Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-2">
          <button
            id="drawer-optimize-btn"
            onClick={() => {
              playNavSound('optimize');
              onClose();
              onOptimize();
            }}
            className={`tv-focusable w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 ${
              focusedId === 'drawer-optimize-btn' ? 'tv-focused' : ''
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Save Energy & Money Now</span>
          </button>

          <button
            id="drawer-reset-btn"
            onClick={() => {
              playNavSound('select');
              if (window.confirm('Reset all schedules and custom settings back to factory defaults?')) {
                onResetDefaults();
                onClose();
              }
            }}
            className={`tv-focusable w-full py-1.5 px-3 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all flex items-center justify-center gap-1.5 ${
              focusedId === 'drawer-reset-btn' ? 'tv-focused' : ''
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Factory Reset Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
