import React from 'react';
import {
  HelpCircle,
  Home,
  Play,
  PlayCircle,
  RotateCcw,
  Trophy,
  Vibrate,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { RunStatsSnapshot } from '../game/types';

interface PauseModalProps {
  score: number;
  bestScore: number;
  linesCleared: number;
  muted: boolean;
  hapticsEnabled: boolean;
  onToggleMute: () => void;
  onToggleHaptics: () => void;
  onResume: () => void;
  onRestart: () => void;
  onShowInstructions: () => void;
  onExitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  score,
  bestScore,
  linesCleared,
  muted,
  hapticsEnabled,
  onToggleMute,
  onToggleHaptics,
  onResume,
  onRestart,
  onShowInstructions,
  onExitToTitle,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75"
    >
      <div className="animate-sheet-up w-full max-w-[430px] rounded-t-3xl bg-[#131B31] border-t border-x border-slate-700/80 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(2,6,23,0.9)]">
        {/* Android Bottom Sheet Drag Handle */}
        <div
          aria-hidden="true"
          className="w-10 h-1.5 rounded-full bg-slate-600/80 mx-auto mb-4"
        />

        <div className="flex items-center justify-between mb-4">
          <h2
            id="pause-modal-title"
            className="font-display text-2xl font-bold text-white"
          >
            Game Paused
          </h2>
          <button
            type="button"
            onClick={onResume}
            aria-label="Close pause menu"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1B2542] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="rounded-xl bg-[#1B2542] p-3 border border-slate-700/50">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Score
            </div>
            <div className="font-display text-lg font-bold tabular-nums text-white mt-0.5">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-[#1B2542] p-3 border border-slate-700/50">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Best
            </div>
            <div className="font-display text-lg font-bold tabular-nums text-amber-300 mt-0.5">
              {bestScore.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-[#1B2542] p-3 border border-slate-700/50">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Lines
            </div>
            <div className="font-display text-lg font-bold tabular-nums text-emerald-300 mt-0.5">
              {linesCleared}
            </div>
          </div>
        </div>

        {/* Sound & Vibration Quick Toggles */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={!muted}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-[#1B2542] hover:bg-[#253359] text-sm font-medium text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-300" aria-hidden="true" />
            )}
            <span>{muted ? 'Sound Off' : 'Sound On'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleHaptics}
            aria-pressed={hapticsEnabled}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-[#1B2542] hover:bg-[#253359] text-sm font-medium text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <Vibrate
              className={`w-4 h-4 ${
                hapticsEnabled ? 'text-emerald-300' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <span>{hapticsEnabled ? 'Haptics On' : 'Haptics Off'}</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-slate-950" aria-hidden="true" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B2542] hover:bg-[#253359] text-white font-medium text-sm border border-slate-700/60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>New Game</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onShowInstructions}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B2542] hover:bg-[#253359] text-slate-200 font-medium text-sm border border-slate-700/60 transition-colors cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span>How to Play</span>
            </button>

            <button
              type="button"
              onClick={onExitToTitle}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-[#1B2542]/60 hover:bg-[#1B2542] font-medium text-sm border border-slate-700/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: RunStatsSnapshot;
  canRevive: boolean;
  onReviveAd: () => void;
  onPlayAgain: () => void;
  onExitToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  canRevive,
  onReviveAd,
  onPlayAgain,
  onExitToTitle,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80"
    >
      <div className="animate-sheet-up w-full max-w-[430px] rounded-t-3xl bg-[#131B31] border-t border-x border-slate-700/80 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(2,6,23,0.9)] text-center">
        <div
          aria-hidden="true"
          className="w-10 h-1.5 rounded-full bg-slate-600/80 mx-auto mb-4"
        />

        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 mb-2.5">
          <Trophy className="w-6 h-6" aria-hidden="true" />
        </div>

        <h2
          id="gameover-modal-title"
          className="font-display text-2xl font-extrabold text-white"
        >
          No Moves Left
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {stats.isNewBest
            ? 'New personal best score achieved!'
            : 'None of the remaining blocks fit on the grid.'}
        </p>

        <div className="my-4 rounded-2xl bg-[#1B2542] p-4 border border-slate-700/60">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Final Score
          </div>
          <div className="font-display text-4xl font-extrabold tabular-nums text-white mt-1">
            {stats.score.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold tabular-nums text-amber-300">
            <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Best: {stats.bestScore.toLocaleString()}
              {stats.isNewBest ? ' · New Record!' : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5 text-center">
          <div className="rounded-xl bg-[#1B2542]/75 p-2.5">
            <div className="text-[11px] text-slate-400">Lines</div>
            <div className="font-display text-base font-bold tabular-nums text-emerald-300">
              {stats.linesCleared}
            </div>
          </div>
          <div className="rounded-xl bg-[#1B2542]/75 p-2.5">
            <div className="text-[11px] text-slate-400">Max Combo</div>
            <div className="font-display text-base font-bold tabular-nums text-sky-300">
              ×{Math.max(1, stats.maxCombo)}
            </div>
          </div>
          <div className="rounded-xl bg-[#1B2542]/75 p-2.5">
            <div className="text-[11px] text-slate-400">Blocks</div>
            <div className="font-display text-base font-bold tabular-nums text-slate-200">
              {stats.piecesPlaced}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {canRevive && (
            <button
              type="button"
              onClick={onReviveAd}
              data-testid="revive-ad-btn"
              className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
            >
              <PlayCircle className="w-5 h-5" aria-hidden="true" />
              <span>Revive · Watch Ad</span>
            </button>
          )}

          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Play Again</span>
          </button>

          <button
            type="button"
            onClick={onExitToTitle}
            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1B2542]/60 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface InstructionsModalProps {
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  onClose,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80"
    >
      <div className="animate-sheet-up w-full max-w-[430px] rounded-t-3xl bg-[#131B31] border-t border-x border-slate-700/80 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(2,6,23,0.9)]">
        <div
          aria-hidden="true"
          className="w-10 h-1.5 rounded-full bg-slate-600/80 mx-auto mb-4"
        />

        <div className="flex items-center justify-between mb-4">
          <h2
            id="instructions-modal-title"
            className="font-display text-2xl font-bold text-white"
          >
            How to Play
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close instructions"
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1B2542] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <ol className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 font-display font-bold flex items-center justify-center text-xs">
              1
            </span>
            <div>
              <strong className="text-white block">Touch &amp; Drag onto the 8×8 Grid</strong>
              Drag any block from the bottom tray—it floats slightly above your thumb so you can aim cleanly. Or tap a block, then tap a cell.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-sky-400/20 text-sky-300 font-display font-bold flex items-center justify-center text-xs">
              2
            </span>
            <div>
              <strong className="text-white block">Clear Full Rows &amp; Columns</strong>
              Fill any complete horizontal row or vertical column to clear those blocks and score bonus points.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 font-display font-bold flex items-center justify-center text-xs">
              3
            </span>
            <div>
              <strong className="text-white block">Chain Combos &amp; Multi-Line Clears</strong>
              Clear multiple lines in one drop or clear lines on back-to-back turns to multiply your combo score. Clearing the whole board grants +300!
            </div>
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full min-h-[50px] px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
