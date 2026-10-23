/** Small, gesture-gated procedural soundscape. No audio assets or network access. */
export class AudioEngine {
  enabled = true;
  private context?: AudioContext;
  private master?: GainNode;
  private atmosphere?: GainNode;
  private noiseBuffer?: AudioBuffer;
  private ambientSources: AudioScheduledSourceNode[] = [];
  private ambientNodes: AudioNode[] = [];
  private voices = new Set<AudioScheduledSourceNode>();
  private lastPlayed = new Map<string, number>();
  private active = false;
  private disposed = false;
  private unlocked = false;

  /** Call from a click/key handler. Browsers require a user gesture to start audio. */
  unlock(): void {
    if (this.disposed || typeof window === 'undefined') return;
    this.unlocked = true;
    try {
      if (!this.context) {
        const AudioCtor = window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return;
        this.context = new AudioCtor();
        this.master = this.context.createGain();
        this.master.gain.value = this.enabled ? 0.48 : 0;
        this.master.connect(this.context.destination);
        const size = this.context.sampleRate * 3;
        this.noiseBuffer = this.context.createBuffer(1, size, this.context.sampleRate);
        const samples = this.noiseBuffer.getChannelData(0);
        // Gentle smoothed noise; filtering below removes the harsh high end.
        let previous = 0;
        for (let i = 0; i < size; i++) {
          previous = (previous + (Math.random() * 2 - 1) * 0.14) / 1.14;
          samples[i] = previous * 2.6;
        }
      }
      if (this.context.state === 'suspended') {
        void this.context.resume().then(() => this.startAtmosphere()).catch(() => {});
      } else this.startAtmosphere();
    } catch {
      // Audio is decorative: unavailable devices never interrupt a game.
    }
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.context && this.master) {
      const now = this.context.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.enabled ? 0.48 : 0, now, 0.025);
      if (!this.enabled) this.stopAtmosphere();
      else if (this.unlocked) this.unlock();
    }
    return this.enabled;
  }

  setIntensity(active: boolean): void {
    this.active = active;
    if (this.context && this.atmosphere) {
      this.atmosphere.gain.setTargetAtTime(active ? 0.105 : 0.065, this.context.currentTime, 1.4);
    }
  }

  play(event: string): void {
    const ctx = this.context;
    if (this.disposed || !this.enabled || !ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const interval = event === 'arrow' ? 0.065 : event === 'death' ? 0.12 : 0.075;
    if (now - (this.lastPlayed.get(event) ?? -100) < interval || this.voices.size >= 24) return;
    this.lastPlayed.set(event, now);
    switch (event) {
      case 'arrow':
        this.noise(0.075, 0.075, 2600, 'highpass');
        this.tone(660, 250, 0.055, 0.038, 'triangle');
        break;
      case 'cannon':
        this.tone(105, 35, 0.34, 0.3, 'sine');
        this.noise(0.29, 0.22, 900, 'lowpass');
        break;
      case 'frost':
        this.tone(1480, 1070, 0.3, 0.09, 'sine');
        this.tone(2215, 1800, 0.24, 0.035, 'sine', 0.035);
        this.noise(0.15, 0.035, 4100, 'highpass');
        break;
      case 'storm':
        this.noise(0.16, 0.13, 1900, 'bandpass');
        this.tone(240, 90, 0.18, 0.12, 'sawtooth');
        break;
      case 'build':
        this.tone(160, 82, 0.15, 0.19, 'triangle');
        this.chord([392, 523.25], 0.2, 0.075, 0.055);
        break;
      case 'upgrade':
        this.chord([392, 523.25, 783.99], 0.48, 0.1, 0.07);
        break;
      case 'sell':
        this.chord([660, 523.25, 392], 0.14, 0.07, 0.055);
        break;
      case 'wave':
        this.tone(110, 110, 0.75, 0.14, 'triangle');
        this.tone(164.81, 164.81, 0.7, 0.08, 'sine', 0.18);
        this.noise(0.65, 0.07, 550, 'lowpass');
        break;
      case 'victory':
        this.chord([261.63, 329.63, 392, 523.25, 659.25], 1.25, 0.14, 0.16);
        break;
      case 'defeat':
        this.chord([220, 174.61, 146.83, 110], 1.05, 0.11, 0.16);
        break;
      case 'meteor':
        this.tone(580, 40, 0.72, 0.22, 'triangle');
        this.noise(0.95, 0.3, 1000, 'lowpass');
        this.tone(75, 28, 1.15, 0.25, 'sine', 0.18);
        break;
      case 'leak':
        this.tone(155, 90, 0.24, 0.18, 'triangle');
        this.tone(146, 82, 0.25, 0.08, 'sine', 0.06);
        break;
      case 'death':
        this.tone(155, 75, 0.1, 0.055, 'sine');
        break;
      case 'click':
        this.tone(720, 540, 0.045, 0.055, 'sine');
        break;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAtmosphere();
    for (const source of this.voices) {
      try { source.stop(); } catch {}
    }
    this.voices.clear();
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
    this.lastPlayed.clear();
  }

  private chord(notes: number[], duration: number, volume: number, spacing: number): void {
    notes.forEach((note, index) => this.tone(note, note, duration, volume, 'sine', index * spacing));
  }

  private tone(from: number, to: number, duration: number, volume: number,
    type: OscillatorType, delay = 0): void {
    const ctx = this.context;
    if (!ctx || !this.master || this.voices.size >= 24) return;
    const source = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    source.type = type;
    source.frequency.setValueAtTime(from, start);
    source.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
    this.envelope(gain.gain, start, duration, volume);
    source.connect(gain);
    gain.connect(this.master);
    this.track(source, [gain], start, duration);
  }

  private noise(duration: number, volume: number, frequency: number, type: BiquadFilterType): void {
    const ctx = this.context;
    if (!ctx || !this.master || !this.noiseBuffer || this.voices.size >= 24) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    this.envelope(gain.gain, ctx.currentTime, duration, volume);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    this.track(source, [filter, gain], ctx.currentTime, duration);
  }

  private envelope(param: AudioParam, start: number, duration: number, volume: number): void {
    param.setValueAtTime(0.0001, start);
    param.linearRampToValueAtTime(volume, start + Math.min(0.014, duration / 4));
    param.exponentialRampToValueAtTime(0.0001, start + duration);
  }

  private track(source: AudioScheduledSourceNode, nodes: AudioNode[], start: number, duration: number): void {
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
      nodes.forEach(node => node.disconnect());
    };
    source.start(start);
    source.stop(start + duration + 0.015);
  }

  private startAtmosphere(): void {
    const ctx = this.context;
    if (!ctx || !this.master || !this.noiseBuffer || !this.enabled || this.disposed ||
      ctx.state !== 'running' || this.ambientSources.length) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(this.active ? 0.105 : 0.065, ctx.currentTime, 2);
    gain.connect(this.master);
    this.atmosphere = gain;
    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuffer;
    wind.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.4;
    wind.connect(filter);
    filter.connect(gain);
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 73.416;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.12;
    drone.connect(droneGain);
    droneGain.connect(gain);
    // Slow wind movement keeps the quiet ambient loop from sounding static.
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.075;
    const modulation = ctx.createGain();
    modulation.gain.value = 110;
    breath.connect(modulation);
    modulation.connect(filter.frequency);
    this.ambientSources = [wind, drone, breath];
    this.ambientNodes = [gain, filter, droneGain, modulation];
    this.ambientSources.forEach(source => source.start());
  }

  private stopAtmosphere(): void {
    for (const source of this.ambientSources) {
      try { source.stop(); } catch {}
      source.disconnect();
    }
    this.ambientNodes.forEach(node => node.disconnect());
    this.ambientSources = [];
    this.ambientNodes = [];
    this.atmosphere = undefined;
  }
}
