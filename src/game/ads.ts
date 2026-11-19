export type AdFormat = 'banner' | 'rewarded' | 'interstitial';

export interface AdCreative {
  id: string;
  advertiser: string;
  headline: string;
  subline: string;
  ctaLabel: string;
  accentHex: string;
  badgeText: string;
}

export interface AndroidAdBridge {
  showBanner?: () => void;
  hideBanner?: () => void;
  showInterstitial?: () => boolean;
  showRewarded?: (rewardType: string) => boolean;
}

declare global {
  interface Window {
    AndroidAds?: AndroidAdBridge;
    adsbygoogle?: unknown[];
  }
}

export const AD_CREATIVES: AdCreative[] = [
  {
    id: 'ad-word-vault',
    advertiser: 'Word Vault Daily',
    headline: 'Daily Crossword & Word Chains',
    subline: 'Train your vocabulary offline in 3-minute rounds.',
    ctaLabel: 'Play Free',
    accentHex: '#38BDF8',
    badgeText: 'WV',
  },
  {
    id: 'ad-solitaire-zen',
    advertiser: 'Solitaire Classic Pro',
    headline: 'Crisp Klondike & Spider Decks',
    subline: 'Smooth 60fps card animations built for Android.',
    ctaLabel: 'Get App',
    accentHex: '#34D399',
    badgeText: 'SC',
  },
  {
    id: 'ad-sudoku-grid',
    advertiser: 'Sudoku Logic 9×9',
    headline: 'Master Pure Logic Puzzles',
    subline: 'Pencil marks, smart hints, and 2,000+ handcrafted boards.',
    ctaLabel: 'Install',
    accentHex: '#FBBF24',
    badgeText: 'S9',
  },
];

export function getAdNetworkConfig(): {
  adClient: string;
  bannerSlot: string;
  hasLiveNetwork: boolean;
} {
  const env =
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ? (import.meta as unknown as { env: Record<string, string | undefined> }).env
      : {};
  const adClient = (env.VITE_AD_CLIENT ?? '').trim();
  const bannerSlot = (env.VITE_AD_BANNER_SLOT ?? '').trim();
  return {
    adClient,
    bannerSlot,
    hasLiveNetwork: Boolean(adClient && bannerSlot),
  };
}

export function getNativeAndroidAdBridge(): AndroidAdBridge | null {
  if (typeof window !== 'undefined' && window.AndroidAds) {
    return window.AndroidAds;
  }
  return null;
}

export function shouldShowInterstitial(gamesCompleted: number): boolean {
  return gamesCompleted > 0 && gamesCompleted % 2 === 0;
}

export function pickAdCreative(index: number): AdCreative {
  return AD_CREATIVES[Math.abs(index) % AD_CREATIVES.length];
}
