const MUTE_STORAGE_KEY = 'block_crush_muted_v1';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
      }
    } catch {
      this.muted = false;
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(mute: boolean): void {
    this.muted = mute;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(MUTE_STORAGE_KEY, String(mute));
      }
    } catch {
      // ignore storage failure
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playPickup();
    }
    return this.muted;
  }

  playPickup(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(510, now + 0.055);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playPlace(cellCount: number = 3): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Warm tactile thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = Math.max(150, 250 - cellCount * 10);
    osc.frequency.setValueAtTime(baseFreq * 1.4, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + 0.08);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);

    // Crisp click transient
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(680, now);
    clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.03);
    clickGain.gain.setValueAtTime(0.06, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.04);
  }

  playInvalid(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(125, now + 0.09);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playClear(linesCleared: number, combo: number): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonic pentatonic arpeggio shifted up with combo streak
    const semitoneBoost = Math.min(combo - 1, 6) * 2;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const count = Math.min(linesCleared + 1, notes.length);

    for (let i = 0; i < count; i++) {
      const start = now + i * 0.048;
      const freq = notes[i] * Math.pow(2, semitoneBoost / 12);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === count - 1 && combo > 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, start + 0.22);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.13, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    }
  }

  playDeal(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = now + i * 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380 + i * 60, start);
      osc.frequency.exponentialRampToValueAtTime(520 + i * 70, start + 0.045);
      gain.gain.setValueAtTime(0.045, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.055);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.06);
    }
  }

  playGameOver(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [392.0, 349.23, 311.13, 261.63];
    freqs.forEach((freq, idx) => {
      const start = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.11, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  }
}

export const soundEngine = new SoundEngine();
