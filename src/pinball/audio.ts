/** Gesture-gated pinball sound design. Everything is synthesized locally. */
export class PinballAudio {
  enabled = true;
  private context?: AudioContext;
  private master?: GainNode;
  private voices = new Set<OscillatorNode>();
  private last = new Map<string, number>();
  private active = false;
  private disposed = false;

  unlock(): void {
    if (this.disposed || typeof window === 'undefined') return;
    try {
      if (!this.context) {
        const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Constructor) return;
        this.context = new Constructor();
        this.master = this.context.createGain();
        this.master.gain.value = this.enabled ? 0.38 : 0;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Sound should never interrupt play. */ }
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.context && this.master) this.master.gain.setTargetAtTime(this.enabled ? 0.38 : 0, this.context.currentTime, 0.02);
    if (this.enabled) this.unlock();
    return this.enabled;
  }

  setIntensity(active: boolean): void { this.active = active; }

  play(event: string, combo = 0): void {
    const ctx = this.context;
    if (!ctx || this.disposed || !this.enabled || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const interval = event === 'wall' ? 0.04 : event === 'hit' ? 0.055 : event === 'paddle' ? 0.07 : 0.09;
    if (now - (this.last.get(event) ?? -10) < interval || this.voices.size > 28) return;
    this.last.set(event, now);
    const scale = [0, 3, 5, 7, 10, 12, 15, 17];
    const pitch = 392 * Math.pow(2, scale[Math.min(7, Math.floor(Math.max(0, combo) / 3))]! / 12);
    switch (event) {
      case 'bumper':
        this.tone(pitch * 1.8, pitch, 0.15, 0.22, 'triangle');
        this.tone(pitch * 2, pitch * 2, 0.3, 0.05, 'sine', 0.015);
        this.tone(130, 55, 0.065, 0.18, 'sine');
        break;
      case 'paddle':
        this.tone(210, 70, 0.09, 0.3, 'triangle');
        this.tone(960, 320, 0.025, 0.12, 'square');
        break;
      case 'wall': this.tone(1450, 720, 0.035, 0.055, 'triangle'); break;
      case 'launch':
        this.tone(85, 820, 0.21, 0.2, 'sawtooth');
        this.tone(160, 80, 0.1, 0.24, 'sine', 0.16);
        break;
      case 'hit': this.tone(this.active ? 185 : 155, 65, 0.055, 0.13, 'triangle'); break;
      case 'kill': this.chord([520, 780], 0.1, 0.08, 0.025); break;
      case 'freeze': this.chord([1174, 1568, 2349], 0.34, 0.08, 0.04); break;
      case 'steam':
        this.tone(420, 1900, 0.18, 0.08, 'sawtooth');
        this.chord([587, 880, 1174], 0.32, 0.11, 0.055);
        break;
      case 'conduct': this.chord([392, 587, 784, 1174], 0.19, 0.11, 0.035); break;
      case 'storm':
        this.tone(170, 65, 0.16, 0.13, 'sawtooth');
        this.chord([587, 880, 1174], 0.21, 0.08, 0.025);
        break;
      case 'plasma':
        this.tone(110, 55, 0.28, 0.28, 'triangle');
        this.chord([440, 659, 880, 1318], 0.3, 0.11, 0.035);
        break;
      case 'spectrum': this.chord([392, 494, 587, 784, 988, 1174], 0.48, 0.11, 0.045); break;
      case 'overdrive':
        this.chord([196, 294, 392, 587, 784, 1174], 0.6, 0.13, 0.055);
        this.tone(85, 38, 0.55, 0.26, 'sine');
        break;
      case 'wave': this.chord([196, 294, 392], 0.35, 0.12, 0.12); break;
      case 'clear': this.chord([392, 494, 587, 784], 0.45, 0.1, 0.06); break;
      case 'win': this.chord([261.63, 329.63, 392, 523.25, 659.25, 784], 0.8, 0.13, 0.1); break;
      case 'lose': this.chord([220, 196, 146.83, 110], 0.7, 0.11, 0.13); break;
      case 'drain': this.tone(330, 65, 0.4, 0.2, 'triangle'); break;
      case 'build': this.chord([294, 392, 587], 0.22, 0.1, 0.045); break;
      case 'upgrade': this.chord([392, 587, 784, 1174], 0.4, 0.12, 0.065); break;
      default: this.tone(700, 500, 0.035, 0.06, 'sine');
    }
  }

  dispose(): void {
    this.disposed = true;
    for (const voice of this.voices) { try { voice.stop(); } catch {} }
    this.voices.clear();
    this.last.clear();
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
  }

  private chord(notes: number[], duration: number, volume: number, spacing: number): void {
    notes.forEach((note, i) => this.tone(note, note, duration, volume, 'sine', i * spacing));
  }

  private tone(from: number, to: number, duration: number, volume: number, type: OscillatorType, delay = 0): void {
    const ctx = this.context;
    if (!ctx || !this.master || this.voices.size >= 32) return;
    const start = ctx.currentTime + delay;
    const source = ctx.createOscillator();
    const gain = ctx.createGain();
    source.type = type;
    source.frequency.setValueAtTime(from, start);
    source.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(gain);
    gain.connect(this.master);
    this.voices.add(source);
    source.onended = () => { this.voices.delete(source); source.disconnect(); gain.disconnect(); };
    source.start(start);
    source.stop(start + duration + 0.01);
  }
}
