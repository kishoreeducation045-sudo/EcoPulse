import React from 'react';
import {
  Mic,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Menu,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { playNavSound } from '../utils/audioEffects';

interface VirtualFireTVRemoteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onSelect: () => void;
  onBack: () => void;
  onHome: () => void;
  onAlexaPrompt: () => void;
  focusedId: string;
}

export const VirtualFireTVRemote: React.FC<VirtualFireTVRemoteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelect,
  onBack,
  onHome,
  onAlexaPrompt,
  focusedId,
}) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Fire TV Remote Simulator"
      className="fixed bottom-6 right-6 z-50 w-72 bg-gradient-to-b from-[#181d29] via-[#121622] to-[#0c0f18] border-2 border-slate-700/80 rounded-[36px] p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Fire TV Remote
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          title="Minimize remote"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Blue Alexa Voice Microphone Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => {
            playNavSound('alexa');
            onAlexaPrompt();
          }}
          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/25 hover:brightness-110 active:scale-95 transition-all"
          title="Press to trigger Alexa+ Voice routine"
        >
          <Mic className="w-4 h-4 text-slate-950" />
          <span>Alexa Voice Assist</span>
        </button>
      </div>

      {/* Fire TV D-Pad Directional Ring */}
      <div className="mt-6 flex flex-col items-center">
        <div className="relative w-44 h-44 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center shadow-inner">
          {/* UP */}
          <button
            onClick={() => {
              playNavSound('focus');
              onNavigate('up');
            }}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-14 h-11 flex items-center justify-center text-slate-300 hover:text-white active:bg-slate-800/80 rounded-t-full transition-colors"
            title="Navigate Up (ArrowUp)"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* DOWN */}
          <button
            onClick={() => {
              playNavSound('focus');
              onNavigate('down');
            }}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-14 h-11 flex items-center justify-center text-slate-300 hover:text-white active:bg-slate-800/80 rounded-b-full transition-colors"
            title="Navigate Down (ArrowDown)"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* LEFT */}
          <button
            onClick={() => {
              playNavSound('focus');
              onNavigate('left');
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-11 h-14 flex items-center justify-center text-slate-300 hover:text-white active:bg-slate-800/80 rounded-l-full transition-colors"
            title="Navigate Left (ArrowLeft)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* RIGHT */}
          <button
            onClick={() => {
              playNavSound('focus');
              onNavigate('right');
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-14 flex items-center justify-center text-slate-300 hover:text-white active:bg-slate-800/80 rounded-r-full transition-colors"
            title="Navigate Right (ArrowRight)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* CENTER SELECT / OK BUTTON */}
          <button
            onClick={() => {
              playNavSound('select');
              onSelect();
            }}
            className="w-18 h-18 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-600 flex flex-col items-center justify-center text-white font-bold text-xs shadow-md hover:border-emerald-400 active:scale-95 transition-all"
            title="Select / OK (Enter)"
          >
            <span>SELECT</span>
          </button>
        </div>
      </div>

      {/* Lower Row Controls: Back, Home, Menu */}
      <div className="mt-5 grid grid-cols-3 gap-2 px-2">
        <button
          onClick={() => {
            playNavSound('back');
            onBack();
          }}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white active:scale-95 transition-all text-[11px] gap-1"
          title="Back (Backspace/Escape)"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => {
            playNavSound('select');
            onHome();
          }}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white active:scale-95 transition-all text-[11px] gap-1"
          title="Home Screen"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            playNavSound('focus');
            onAlexaPrompt();
          }}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white active:scale-95 transition-all text-[11px] gap-1"
          title="Menu / Voice"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </div>

      {/* Focus Indicator & Keyboard Help */}
      <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate max-w-[140px]">
          Target: <span className="font-mono text-emerald-400">{focusedId || 'none'}</span>
        </span>
        <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
          Arrows / Enter
        </span>
      </div>
    </aside>
  );
};
