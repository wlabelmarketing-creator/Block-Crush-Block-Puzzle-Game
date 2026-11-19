import React, { useEffect, useState } from 'react';
import {
  Download,
  HelpCircle,
  Play,
  Smartphone,
  Trophy,
  Vibrate,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BLOCK_COLORS } from '../game/shapes';
import type { BlockColorId } from '../game/types';

interface TitleScreenProps {
  bestScore: number;
  muted: boolean;
  hapticsEnabled: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  onStart: () => void;
  onShowInstructions: () => void;
  onToggleMute: () => void;
  onToggleHaptics: () => void;
  onInstallApp: () => void;
}

const SHOWCASE_PATTERN: (BlockColorId | null)[][] = [
  [null, null, 'sky', 'sky', null, null, null, null],
  [null, 'amber', 'sky', null, null, 'coral', 'coral', null],
  [null, 'amber', 'amber', null, 'emerald', 'emerald', 'coral', null],
  ['indigo', 'indigo', 'amber', 'emerald', 'emerald', null, null, null],
  ['indigo', null, null, null, 'rose', 'rose', 'rose', null],
  ['teal', 'teal', 'teal', null, null, 'rose', null, null],
  ['teal', null, 'amber', 'amber', 'sky', 'sky', 'sky', null],
  [null, null, 'amber', 'amber', null, null, null, null],
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  bestScore,
  muted,
  hapticsEnabled,
  isInstallable,
  isInstalled,
  onStart,
  onShowInstructions,
  onToggleMute,
  onToggleHaptics,
  onInstallApp,
}) => {
  const [pulsePhase, setPulsePhase] = useState(0);
  const [showInstallTip, setShowInstallTip] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPulsePhase((p) => (p + 1) % 8);
    }, 950);
    return () => window.clearInterval(id);
  }, []);

  const handleInstallClick = () => {
    if (isInstallable) {
      onInstallApp();
    } else {
      setShowInstallTip((prev) => !prev);
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-hidden bg-[#0B1020]">
      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[360px] h-[240px] rounded-full bg-indigo-500/12 blur-3xl"
      />

      {/* Top Mobile App Bar */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          {bestScore > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-display font-bold tabular-nums text-base">
              <Trophy className="w-4 h-4" aria-hidden="true" />
              Best {bestScore.toLocaleString()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              Android Edition
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onShowInstructions}
            aria-label="How to play"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-300 hover:text-white bg-[#131B31] hover:bg-[#1B2542] border border-slate-700/70 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleHaptics}
            aria-label={hapticsEnabled ? 'Disable vibration haptics' : 'Enable vibration haptics'}
            aria-pressed={hapticsEnabled}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-300 hover:text-white bg-[#131B31] hover:bg-[#1B2542] border border-slate-700/70 transition-colors cursor-pointer"
          >
            <Vibrate
              className={`w-5 h-5 ${
                hapticsEnabled ? 'text-emerald-300' : 'text-slate-500'
              }`}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-pressed={muted}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-300 hover:text-white bg-[#131B31] hover:bg-[#1B2542] border border-slate-700/70 transition-colors cursor-pointer"
          >
            {muted ? (
              <VolumeX className="w-5 h-5 text-slate-500" aria-hidden="true" />
            ) : (
              <Volume2 className="w-5 h-5 text-amber-300" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Center Portrait Showcase & Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-4">
        {/* Bespoke inline SVG Title Emblem */}
        <svg viewBox="0 0 120 44" className="w-24 h-9 mb-3" aria-hidden="true">
          <defs>
            <linearGradient id="emblemAmber" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="emblemSky" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="emblemCoral" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <linearGradient id="emblemEmerald" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect x="4" y="6" width="16" height="16" rx="4" fill="url(#emblemAmber)" stroke="#FEF3C7" strokeWidth="1" strokeOpacity="0.4" />
          <rect x="23" y="6" width="16" height="16" rx="4" fill="url(#emblemAmber)" stroke="#FEF3C7" strokeWidth="1" strokeOpacity="0.4" />
          <rect x="4" y="25" width="16" height="16" rx="4" fill="url(#emblemAmber)" stroke="#FEF3C7" strokeWidth="1" strokeOpacity="0.4" />

          <rect x="46" y="6" width="16" height="16" rx="4" fill="url(#emblemSky)" stroke="#E0F2FE" strokeWidth="1" strokeOpacity="0.4" />
          <rect x="46" y="25" width="16" height="16" rx="4" fill="url(#emblemSky)" stroke="#E0F2FE" strokeWidth="1" strokeOpacity="0.4" />
          <rect x="65" y="25" width="16" height="16" rx="4" fill="url(#emblemSky)" stroke="#E0F2FE" strokeWidth="1" strokeOpacity="0.4" />

          <rect x="84" y="6" width="16" height="16" rx="4" fill="url(#emblemCoral)" stroke="#FFEDD5" strokeWidth="1" strokeOpacity="0.4" />
          <rect x="103" y="6" width="16" height="16" rx="4" fill="url(#emblemCoral)" stroke="#FFEDD5" strokeWidth="1" strokeOpacity="0.4" />
          <rect x="103" y="25" width="16" height="16" rx="4" fill="url(#emblemEmerald)" stroke="#D1FAE5" strokeWidth="1" strokeOpacity="0.4" />
        </svg>

        <h1 className="font-display text-4xl font-extrabold tracking-tight text-white text-balance leading-tight">
          Block Crush
        </h1>
        <p className="mt-1.5 text-sm text-slate-300 max-w-[300px] leading-snug">
          Drag blocks onto the 8×8 grid. Clear full rows or columns to build combos.
        </p>

        {/* Compact Portrait Mini-Board Preview */}
        <div
          aria-hidden="true"
          className="mt-5 w-full max-w-[236px] aspect-square p-2.5 rounded-2xl bg-[#131B31] border border-slate-700/70 shadow-[0_18px_40px_rgba(2,6,23,0.75)]"
        >
          <div className="grid grid-cols-8 grid-rows-8 gap-1 w-full h-full">
            {SHOWCASE_PATTERN.map((rowArr, r) =>
              rowArr.map((color, c) => {
                const highlightRow = r === pulsePhase;
                if (!color) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`rounded-[5px] transition-colors duration-300 ${
                        highlightRow ? 'bg-amber-400/14' : 'bg-[#1B2542]'
                      }`}
                    />
                  );
                }
                const theme = BLOCK_COLORS[color];
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      background: theme.gradient,
                      boxShadow: `0 2px 3px rgba(2,6,23,0.4), inset 0 -1.5px 0 ${theme.shadow}, inset 0 1px 0 ${theme.highlight}`,
                    }}
                    className={`rounded-[5px] border border-white/20 transition-transform duration-300 ${
                      highlightRow ? 'scale-105 brightness-115' : ''
                    }`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Natural Thumb-Zone CTAs */}
      <div className="relative z-10 w-full flex flex-col gap-2.5">
        <button
          type="button"
          data-start="true"
          onClick={onStart}
          className="w-full min-h-[54px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-display font-bold text-lg shadow-[0_10px_26px_rgba(245,158,11,0.34),inset_0_2px_0_rgba(255,255,255,0.5)] transition-all duration-150 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" aria-hidden="true" />
          <span>Play</span>
        </button>

        {!isInstalled && (
          <>
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#131B31] hover:bg-[#1B2542] text-slate-200 font-medium text-sm border border-slate-700/70 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-300" aria-hidden="true" />
              <span>
                {isInstallable ? 'Install Android App' : 'Add to Android Home Screen'}
              </span>
            </button>

            {showInstallTip && !isInstallable && (
              <p className="text-xs text-slate-300 text-center bg-[#131B31] border border-slate-700/70 rounded-xl px-3 py-2.5 leading-relaxed">
                In Chrome on Android, tap the <strong>⋮ Menu</strong> and select{' '}
                <strong>Install app</strong> or <strong>Add to Home screen</strong> to play fullscreen offline.
              </p>
            )}
          </>
        )}

        <footer className="text-center text-xs text-slate-400 pt-1">
          Touch &amp; drag blocks onto the grid · Tap to select &amp; place
        </footer>
      </div>
    </main>
  );
};
