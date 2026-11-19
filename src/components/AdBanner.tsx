import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import {
  getAdNetworkConfig,
  getNativeAndroidAdBridge,
  pickAdCreative,
} from '../game/ads';

interface AdBannerProps {
  rotationSeed: number;
}

export const AdBanner: React.FC<AdBannerProps> = ({ rotationSeed }) => {
  const [showAdInfo, setShowAdInfo] = useState(false);
  const { adClient, bannerSlot, hasLiveNetwork } = getAdNetworkConfig();
  const creative = pickAdCreative(rotationSeed);

  useEffect(() => {
    const bridge = getNativeAndroidAdBridge();
    if (bridge?.showBanner) {
      bridge.showBanner();
      return () => {
        bridge.hideBanner?.();
      };
    }

    if (hasLiveNetwork && typeof window !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // ignore if AdSense script not loaded
      }
    }
  }, [hasLiveNetwork]);

  return (
    <>
      <aside
        aria-label="Sponsored advertisement"
        data-testid="ad-banner"
        className="w-full rounded-xl bg-[#131B31] border border-slate-700/70 px-2.5 py-1.5 flex items-center justify-between gap-2.5 min-h-[52px]"
      >
        {hasLiveNetwork ? (
          <ins
            className="adsbygoogle block w-full h-[50px]"
            data-ad-client={adClient}
            data-ad-slot={bannerSlot}
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                aria-hidden="true"
                style={{
                  backgroundColor: `${creative.accentHex}22`,
                  borderColor: `${creative.accentHex}55`,
                  color: creative.accentHex,
                }}
                className="w-9 h-9 rounded-lg border font-display font-bold text-xs flex items-center justify-center shrink-0"
              >
                {creative.badgeText}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Ad
                  </span>
                  <span aria-hidden="true" className="text-slate-600 text-[10px]">
                    ·
                  </span>
                  <span className="text-xs font-semibold text-white truncate">
                    {creative.advertiser}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {creative.headline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAdInfo(true)}
                aria-label={`Learn about ${creative.advertiser} ad`}
                className="min-h-[36px] px-3 rounded-lg bg-[#1B2542] hover:bg-[#253359] border border-slate-700/70 text-xs font-semibold text-amber-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                {creative.ctaLabel}
              </button>
              <button
                type="button"
                onClick={() => setShowAdInfo(true)}
                aria-label="About this advertisement"
                className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1B2542] transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </aside>

      {showAdInfo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ad-info-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75"
        >
          <div className="animate-sheet-up w-full max-w-[430px] rounded-t-3xl bg-[#131B31] border-t border-x border-slate-700/80 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(2,6,23,0.9)]">
            <div
              aria-hidden="true"
              className="w-10 h-1.5 rounded-full bg-slate-600/80 mx-auto mb-4"
            />
            <div className="flex items-center justify-between mb-3">
              <h2
                id="ad-info-title"
                className="font-display text-lg font-bold text-white"
              >
                Sponsored Placement
              </h2>
              <button
                type="button"
                onClick={() => setShowAdInfo(false)}
                aria-label="Close ad info"
                className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1B2542] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="rounded-xl bg-[#1B2542] p-4 border border-slate-700/60 mb-4">
              <div className="text-xs font-semibold text-amber-300 mb-1">
                {creative.advertiser}
              </div>
              <div className="text-sm font-bold text-white">
                {creative.headline}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {creative.subline}
              </p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Banner slots support Google AdSense / Android TWA AdMob bridge (<code className="text-slate-300">window.AndroidAds</code>) when configured via environment variables.
            </p>
            <button
              type="button"
              onClick={() => setShowAdInfo(false)}
              className="w-full min-h-[48px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-sm cursor-pointer"
            >
              Back to Game
            </button>
          </div>
        </div>
      )}
    </>
  );
};
