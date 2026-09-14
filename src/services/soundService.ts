// Web Audio API Synthesized Chime Generator for Spendly V3 UI Feedback

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isSoundEnabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('spendly_sound_enabled');
    this.isSoundEnabled = saved !== null ? saved === 'true' : true;
  }

  public getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
    localStorage.setItem('spendly_sound_enabled', enabled ? 'true' : 'false');
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Soft digital confirmation chime for transaction save
  public playTransactionChime(): void {
    if (!this.isSoundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Dual oscillator harmonic chime (E5 -> G#5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(830.61, now + 0.08); // G#5

      osc2.frequency.setValueAtTime(1318.5, now); // E6
      osc2.frequency.exponentialRampToValueAtTime(1661.2, now + 0.08); // G#6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.22);
      osc2.stop(now + 0.22);
    } catch {
      // Fail silently if audio context is restricted by browser policy
    }
  }

  // Soft cloud sync success chime (B5 -> E6)
  public playSyncChime(): void {
    if (!this.isSoundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio policy errors
    }
  }
}

export const soundService = new SoundService();
