/**
 * Procedural Sound Engine using Web Audio API
 * Generates natural ambient audio completely procedurally with zero external asset files.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private masterGain: GainNode | null = null;

  // Sound nodes
  private oceanGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private birdsGain: GainNode | null = null;
  private cricketsGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private birdIntervalId: number | null = null;
  private musicIntervalId: number | null = null;
  private cricketIntervalId: number | null = null;
  private zenIntervalId: number | null = null;

  private isRaining: boolean = false;
  private timeOfDay: number = 12; // 0 to 24

  constructor() {
    // Initialized on first user interaction
  }

  public async init(): Promise<void> {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.setupWind();
    this.setupRain();
    this.setupBirds();
    this.setupCrickets();
    this.setupAmbientPad();
    this.setupZenGardenChimes();

    this.isEnabled = true;
    this.updateAtmosphere(this.timeOfDay, this.isRaining);
  }

  public toggle(): boolean {
    if (!this.ctx) {
      this.init();
      return true;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      this.isEnabled = true;
    } else if (this.ctx.state === 'running') {
      if (this.masterGain) {
        if (this.isEnabled) {
          this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
          this.isEnabled = false;
        } else {
          this.masterGain.gain.setTargetAtTime(0.7, this.ctx.currentTime, 0.2);
          this.isEnabled = true;
        }
      }
    }
    return this.isEnabled;
  }

  public get active(): boolean {
    return this.isEnabled;
  }

  /**
   * Procedural Ocean Surf (filtered pink noise modulated by wave swell LFO)
   */
  private setupOceanSurf(): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // Wave swell gain modulation (LFO)
    const swellGain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave period

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    lfo.connect(lfoGain);

    swellGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    lfoGain.connect(swellGain.gain);

    this.oceanGain = this.ctx.createGain();
    this.oceanGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(swellGain);
    swellGain.connect(this.oceanGain);
    this.oceanGain.connect(this.masterGain);

    noise.start();
    lfo.start();
  }

  /**
   * Procedural Dynamic Wind
   */
  private setupWind(): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // Wind gust frequency modulation
    const gustLfo = this.ctx.createOscillator();
    gustLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);
    const gustAmp = this.ctx.createGain();
    gustAmp.gain.setValueAtTime(250, this.ctx.currentTime);
    gustLfo.connect(gustAmp);
    gustAmp.connect(filter.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    noise.start();
    gustLfo.start();
  }

  /**
   * Procedural Rain Sound
   */
  private setupRain(): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);

    noise.start();
  }

  /**
   * Procedural Forest Birds Chirping during day
   */
  private setupBirds(): void {
    if (!this.ctx || !this.masterGain) return;
    this.birdsGain = this.ctx.createGain();
    this.birdsGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.birdsGain.connect(this.masterGain);

    this.birdIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.birdsGain || !this.isEnabled) return;
      if (this.timeOfDay < 5 || this.timeOfDay > 19 || this.isRaining) return;
      if (Math.random() > 0.45) this.chirpBird();
    }, 2800);
  }

  private chirpBird(): void {
    if (!this.ctx || !this.birdsGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 2200 + Math.random() * 1200;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.18);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.birdsGain);

    osc.start(now);
    osc.stop(now + 0.25);

    // Secondary echo chirp
    if (Math.random() > 0.4) {
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      const delay = 0.16;
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 1.2, now + delay);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + delay + 0.07);

      gain2.gain.setValueAtTime(0, now + delay);
      gain2.gain.linearRampToValueAtTime(0.06, now + delay + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.16);

      osc2.connect(gain2);
      gain2.connect(this.birdsGain);

      osc2.start(now + delay);
      osc2.stop(now + delay + 0.18);
    }
  }

  /**
   * Procedural Crickets for Twilight & Night
   */
  private setupCrickets(): void {
    if (!this.ctx || !this.masterGain) return;
    this.cricketsGain = this.ctx.createGain();
    this.cricketsGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.cricketsGain.connect(this.masterGain);

    this.cricketIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.cricketsGain || !this.isEnabled) return;
      if (this.timeOfDay >= 6 && this.timeOfDay <= 18) return;
      if (Math.random() > 0.3) this.chirpCricket();
    }, 1200);
  }

  private chirpCricket(): void {
    if (!this.ctx || !this.cricketsGain) return;
    const now = this.ctx.currentTime;
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.06;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(4500 + Math.random() * 600, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.03, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.cricketsGain);

      osc.start(t);
      osc.stop(t + 0.06);
    }
  }

  /**
   * Procedural Meditative Ethereal Chords (Pentatonic Zen Pad)
   */
  private setupAmbientPad(): void {
    if (!this.ctx || !this.masterGain) return;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Ethereal Pentatonic Frequencies (D, F#, A, B, C#)
    const chords = [
      [293.66, 369.99, 440.0, 587.33], // D maj7
      [220.0, 261.63, 329.63, 440.0],  // A min
      [329.63, 392.0, 493.88, 659.25], // E min7
      [246.94, 293.66, 369.99, 493.88] // B min7
    ];
    let chordIdx = 0;

    this.musicIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isEnabled) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;
      this.playEtherealChord(notes);
    }, 9000);

    // Trigger first chord soon
    setTimeout(() => {
      if (this.ctx && this.isEnabled) this.playEtherealChord(chords[0]);
    }, 1500);
  }

  private playEtherealChord(frequencies: number[]): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const duration = 8.5;

    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      // Subtle detune for lush chorus feeling
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.045 / frequencies.length, now + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Procedural Player Footsteps
   */
  public playFootstep(): void {
    if (!this.ctx || !this.masterGain || !this.isEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Magical Shrine Discovery Chime
   */
  public playShrineChime(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66, 1479.98]; // Rising crystal arpeggio

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.14;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 2.6);
    });
  }

  /**
   * Update audio balance dynamically based on environment state
   */
  public updateAtmosphere(time: number, isRaining: boolean): void {
    this.timeOfDay = time;
    this.isRaining = isRaining;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const isDay = time >= 6 && time <= 18;
    const isNight = time < 5 || time > 19;

    if (this.birdsGain) {
      const targetBirdGain = isDay && !isRaining ? 0.35 : 0.0;
      this.birdsGain.gain.setTargetAtTime(targetBirdGain, now, 1.5);
    }

    if (this.cricketsGain) {
      const targetCricketGain = isNight && !isRaining ? 0.45 : 0.0;
      this.cricketsGain.gain.setTargetAtTime(targetCricketGain, now, 1.5);
    }

    if (this.rainGain) {
      const targetRainGain = isRaining ? 0.45 : 0.0;
      this.rainGain.gain.setTargetAtTime(targetRainGain, now, 1.5);
    }
  }

  /**
   * Procedural Japanese Zen Wind Bell & Bamboo Clack (Shishi-odoshi)
   */
  private setupZenGardenChimes(): void {
    if (!this.ctx || !this.masterGain) return;

    this.zenIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || !this.isEnabled) return;
      // Soft gentle wind bell note (Penta frequencies: E, G, A, B, D)
      const bells = [1318.51, 1567.98, 1760.0, 1975.53, 2349.32];
      const freq = bells[Math.floor(Math.random() * bells.length)];

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 3.3);
    }, 7000);
  }

  public destroy(): void {
    if (this.birdIntervalId) clearInterval(this.birdIntervalId);
    if (this.cricketIntervalId) clearInterval(this.cricketIntervalId);
    if (this.musicIntervalId) clearInterval(this.musicIntervalId);
    if (this.zenIntervalId) clearInterval(this.zenIntervalId);
    if (this.ctx) this.ctx.close();
  }
}
