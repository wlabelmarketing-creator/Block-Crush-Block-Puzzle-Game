import React, { useEffect, useState } from 'react';
import { CheckCircle2, Gift, Sparkles, X } from 'lucide-react';
import { pickAdCreative } from '../game/ads';

export type RewardedAdPurpose = 'revive' | 'swap-tray';

interface RewardedAdModalProps {
  purpose: RewardedAdPurpose;
  creativeSeed: number;
  onClaimReward: () => void;
  onCancel: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  purpose,
  creativeSeed,
  onClaimReward,
  onCancel,
}) => {
  const DURATION = 5;
  const [secondsLeft, setSecondsLeft] = useState<number>(DURATION);
  const creative = pickAdCreative(creativeSeed + 1);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const isReady = secondsLeft === 0;
  const progressPct = ((DURATION - secondsLeft) / DURATION) * 100;
  const rewardLabel =
    purpose === 'revive'
      ? 'Clear Center 4×4 & Continue'
      : 'Deal 3 New Fitting Blocks';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewarded-ad-title"
      data-testid="rewarded-ad-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/92"
    >
      <div className="w-full max-w-[390px] rounded-3xl bg-[#131B31] border border-slate-700/80 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.95)]">
        {/* Top Ad Status Row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            <Gift className="w-4 h-4" aria-hidden="true" />
            <span>
              {isReady
                ? 'Reward Ready!'
                : `Rewarded Ad · ${secondsLeft}s`}
            </span>
          </span>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close ad without reward"
            className="min-h-[36px] px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1B2542] transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Countdown Progress Bar */}
        <div
          aria-hidden="true"
          className="w-full h-1.5 rounded-full bg-[#1B2542] overflow-hidden mb-5"
        >
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full bg-amber-400 transition-all duration-700 ease-linear"
          />
        </div>

        {/* Ad Creative Showcase */}
        <div className="rounded-2xl bg-[#1B2542] border border-slate-700/60 p-5 text-center mb-5">
          <div
            aria-hidden="true"
            style={{
              backgroundColor: `${creative.accentHex}22`,
              borderColor: `${creative.accentHex}55`,
              color: creative.accentHex,
            }}
            className="w-16 h-16 rounded-2xl border mx-auto mb-3 font-display font-extrabold text-xl flex items-center justify-center"
          >
            {creative.badgeText}
          </div>

          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
            Sponsored · {creative.advertiser}
          </div>
          <h2
            id="rewarded-ad-title"
            className="font-display text-xl font-bold text-white"
          >
            {creative.headline}
          </h2>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {creative.subline}
          </p>
        </div>

        {/* Reward Summary & Claim CTA */}
        <div className="text-center text-xs text-slate-300 mb-3">
          Reward: <strong className="text-emerald-300">{rewardLabel}</strong>
        </div>

        <button
          type="button"
          disabled={!isReady}
          onClick={onClaimReward}
          data-testid="claim-reward-btn"
          className={`w-full min-h-[50px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-display font-bold text-base transition-colors ${
            isReady
              ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer'
              : 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isReady ? (
            <>
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>Claim Reward</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Wait {secondsLeft}s…</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface InterstitialAdModalProps {
  creativeSeed: number;
  onClose: () => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  creativeSeed,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(3);
  const creative = pickAdCreative(creativeSeed + 2);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const canClose = secondsLeft === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interstitial-ad-title"
      data-testid="interstitial-ad-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/92"
    >
      <div className="w-full max-w-[390px] rounded-3xl bg-[#131B31] border border-slate-700/80 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.95)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Sponsored Interstitial
          </span>
          <button
            type="button"
            disabled={!canClose}
            onClick={onClose}
            aria-label={canClose ? 'Close advertisement' : `Ad closes in ${secondsLeft}s`}
            className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
              canClose
                ? 'bg-[#1B2542] hover:bg-[#253359] text-white cursor-pointer'
                : 'bg-[#1B2542]/50 text-slate-400 cursor-not-allowed'
            }`}
          >
            {canClose ? <X className="w-5 h-5" aria-hidden="true" /> : `${secondsLeft}s`}
          </button>
        </div>

        <div className="rounded-2xl bg-[#1B2542] border border-slate-700/60 p-6 text-center mb-5">
          <div
            aria-hidden="true"
            style={{
              backgroundColor: `${creative.accentHex}22`,
              borderColor: `${creative.accentHex}55`,
              color: creative.accentHex,
            }}
            className="w-20 h-20 rounded-2xl border mx-auto mb-4 font-display font-extrabold text-2xl flex items-center justify-center"
          >
            {creative.badgeText}
          </div>
          <div className="text-xs font-semibold text-amber-300 mb-1">
            {creative.advertiser}
          </div>
          <h2
            id="interstitial-ad-title"
            className="font-display text-2xl font-bold text-white"
          >
            {creative.headline}
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {creative.subline}
          </p>
        </div>

        <button
          type="button"
          disabled={!canClose}
          onClick={onClose}
          className={`w-full min-h-[50px] rounded-2xl font-display font-bold text-base transition-colors ${
            canClose
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
              : 'bg-slate-700/60 text-slate-400 cursor-not-allowed'
          }`}
        >
          {canClose ? 'Continue to Next Game' : `Ad ends in ${secondsLeft}s…`}
        </button>
      </div>
    </div>
  );
};
