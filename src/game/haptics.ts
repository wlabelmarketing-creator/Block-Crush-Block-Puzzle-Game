const HAPTICS_STORAGE_KEY = 'block_crush_haptics_v1';

class HapticsEngine {
  private enabled: boolean = true;

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(HAPTICS_STORAGE_KEY);
        this.enabled = stored === null ? true : stored === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'
    );
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(HAPTICS_STORAGE_KEY, String(value));
      }
    } catch {
      // ignore storage failure
    }
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    if (this.enabled) {
      this.vibrate(14);
    }
    return this.enabled;
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.enabled || !this.isSupported()) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore on browsers blocking vibration before gesture
    }
  }

  pickup(): void {
    this.vibrate(8);
  }

  place(): void {
    this.vibrate(16);
  }

  clear(linesCleared: number): void {
    if (linesCleared >= 2) {
      this.vibrate([18, 28, 32, 24, 40]);
    } else {
      this.vibrate([18, 26, 28]);
    }
  }

  invalid(): void {
    this.vibrate([12, 22, 12]);
  }

  gameOver(): void {
    this.vibrate([35, 45, 55]);
  }
}

export const hapticsEngine = new HapticsEngine();
