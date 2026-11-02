/**
 * GardenSoundEngine.ts
 * Procedural Web Audio API soundscape for Vườn Anh Đào.
 * Zero external audio files: generates dynamic wind with natural gusts,
 * dual-layer lake water (murmuring depth + surface trickling brook + water droplets),
 * Japanese Bush Warbler (Uguisu) bird calls, night Suzumushi crickets,
 * metallic Edo/Nambu wind chimes (Fūrin), and authentic Japanese Koto melodies.
 */

export type GardenMood = 'day' | 'sunset' | 'night';

export class GardenSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentVolume: number = 0.7;
  private currentMood: GardenMood = 'day';

  // Subsystem gains
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private waterGain: GainNode | null = null;
  private birdsGain: GainNode | null = null;
  private cricketsGain: GainNode | null = null;
  private kotoGain: GainNode | null = null;
  private chimeGain: GainNode | null = null;
  private waterDropGain: GainNode | null = null;

  // Timers
  private birdTimerId: number | null = null;
  private cricketTimerId: number | null = null;
  private kotoTimerId: number | null = null;
  private gustTimerId: number | null = null;

  // Callback when a wind gust begins
  public onWindGust?: () => void;

  // Traditional Japanese Hirajoshi / Insen Pentatonic Scale (D, Eb, G, A, Bb, D, Eb, G, A)
  private readonly kotoScale: number[] = [
    293.66, // D4
    311.13, // Eb4
    392.00, // G4
    440.00, // A4
    466.16, // Bb4
    587.33, // D5
    622.25, // Eb5
    783.99, // G5
    880.00  // A5
  ];

  // Classic Japanese Koto Melodic Motifs (Sakura theme & meditative zen phrases)
  private readonly kotoMotifs: number[][] = [
    // Motif 1: Classic Sakura opening phrase (A4, A4, B4, A4, A4, B4, A4, G4, Eb4)
    [440.0, 440.0, 466.16, 440.0, 440.0, 466.16, 440.0, 392.0, 311.13],
    // Motif 2: Serene rising Hirajoshi arc (D4 -> Eb4 -> G4 -> A4 -> Bb4 -> A4)
    [293.66, 311.13, 392.0, 440.0, 466.16, 440.0],
    // Motif 3: High contemplative blossom cascade (D5 -> Bb4 -> A4 -> G4 -> Eb4 -> D4)
    [587.33, 466.16, 440.0, 392.0, 311.13, 293.66],
    // Motif 4: Twilight garden echo (G4 -> A4 -> D5 -> Eb5 -> D5 -> Bb4 -> A4)
    [392.0, 440.0, 587.33, 622.25, 587.33, 466.16, 440.0],
    // Motif 5: Gentle lakeside question & answer (D4 -> G4 -> A4 -> G4, Eb4 -> D4)
    [293.66, 392.0, 440.0, 392.0, 311.13, 293.66],
    // Motif 6: Spring breeze flourish (A4 -> Bb4 -> D5 -> G5 -> Eb5 -> D5)
    [440.0, 466.16, 587.33, 783.99, 622.25, 587.33]
  ];
  private currentMotifIndex: number = 0;

  // Wind chime physical resonance partials (Edo glass / Nambu bronze bell)
  private readonly chimePartials: number[] = [1480, 2240, 3210, 4420, 5890];

  constructor() {}

  /**
   * Initializes the AudioContext after user interaction (e.g. clicking 'Bước vào vườn')
   */
  public async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Initialize individual procedural sound generators
    this.setupWind();
    this.setupWaterStream();
    this.setupBirds();
    this.setupCrickets();
    this.setupWindChimes();
    this.setupWaterDrops();
    this.setupKotoMelody();

    // Start background loops
    this.startAmbientSequencer();

    // Opening gentle wind chime chord
    setTimeout(() => {
      this.playChime();
    }, 400);
  }

  /**
   * Procedural dynamic wind using filtered pink/brown noise with natural breathing
   */
  private setupWind(): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-noise approximation filter
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // Ambient slow LFO for natural breeze breathing
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.32, this.ctx.currentTime);

    noise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    noise.start();
    lfo.start();
  }

  /**
   * Procedural dual-layer lake water:
   * Layer A: deep murmuring wave lapping
   * Layer B: high delicate surface brook trickling
   */
  private setupWaterStream(): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.09;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Layer A: Low lake water body
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(320, this.ctx.currentTime);

    const lowGain = this.ctx.createGain();
    lowGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

    // Wave lapping LFO swell (0.22 Hz ~ 4.5s per wave)
    const swellLfo = this.ctx.createOscillator();
    swellLfo.frequency.setValueAtTime(0.22, this.ctx.currentTime);
    const swellGain = this.ctx.createGain();
    swellGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    swellLfo.connect(swellGain);
    swellGain.connect(lowGain.gain);

    // Layer B: Surface brook trickling
    const brookFilter = this.ctx.createBiquadFilter();
    brookFilter.type = 'bandpass';
    brookFilter.frequency.setValueAtTime(880, this.ctx.currentTime);
    brookFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const brookGain = this.ctx.createGain();
    brookGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    // Trickle flutter LFO
    const flutterLfo = this.ctx.createOscillator();
    flutterLfo.frequency.setValueAtTime(0.68, this.ctx.currentTime);
    const flutterGain = this.ctx.createGain();
    flutterGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    flutterLfo.connect(flutterGain);
    flutterGain.connect(brookGain.gain);

    // Master Water Bus
    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(lowGain);
    lowGain.connect(this.waterGain);

    noiseSource.connect(brookFilter);
    brookFilter.connect(brookGain);
    brookGain.connect(this.waterGain);

    this.waterGain.connect(this.masterGain);

    noiseSource.start();
    swellLfo.start();
    flutterLfo.start();
  }

  /**
   * Daytime birds singing in the garden
   */
  private setupBirds(): void {
    if (!this.ctx || !this.masterGain) return;

    this.birdsGain = this.ctx.createGain();
    this.birdsGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.birdsGain.connect(this.masterGain);
  }

  /**
   * Night crickets & bell crickets (Suzumushi)
   */
  private setupCrickets(): void {
    if (!this.ctx || !this.masterGain) return;

    this.cricketsGain = this.ctx.createGain();
    this.cricketsGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // Starts muted in day
    this.cricketsGain.connect(this.masterGain);
  }

  /**
   * Wind Chime bus
   */
  private setupWindChimes(): void {
    if (!this.ctx || !this.masterGain) return;

    this.chimeGain = this.ctx.createGain();
    this.chimeGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
    this.chimeGain.connect(this.masterGain);
  }

  /**
   * Water droplet bus
   */
  private setupWaterDrops(): void {
    if (!this.ctx || !this.masterGain) return;

    this.waterDropGain = this.ctx.createGain();
    this.waterDropGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    this.waterDropGain.connect(this.masterGain);
  }

  /**
   * Japanese Koto string melody bus
   */
  private setupKotoMelody(): void {
    if (!this.ctx || !this.masterGain) return;

    this.kotoGain = this.ctx.createGain();
    this.kotoGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
    this.kotoGain.connect(this.masterGain);
  }

  /**
   * Synthesizes a delicate water droplet plink when petals hit the lake
   */
  public playWaterDrop(): void {
    if (!this.ctx || !this.waterDropGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = 1500 + Math.random() * 400;
    const endFreq = 600 + Math.random() * 150;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.07);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.waterDropGain);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Plays a single Koto string note with silk string pluck & paulownia wood body resonance
   */
  public playKotoNote(freq: number, velocity: number = 0.5): void {
    if (!this.ctx || !this.kotoGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const duration = 2.5;

    // 1. Fundamental warm body (triangle wave)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq * 1.012, now); // micro-bend on pluck
    osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.06);

    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.75, now);
    osc1.connect(osc1Gain);

    // 2. Harmonic brightness (sawtooth wave, softer)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 2.0, now);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.22, now);
    osc2.connect(osc2Gain);

    // 3. Wooden soundboard body filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.6, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.95, now + duration * 0.7);
    filter.Q.setValueAtTime(2.8, now);

    osc1Gain.connect(filter);
    osc2Gain.connect(filter);

    // 4. Pluck transient pick noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.22));
    }
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * 0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    noiseNode.connect(noiseGain);
    noiseGain.connect(filter);

    // 5. Main envelope
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(velocity * 0.17, now + 0.005);
    env.gain.exponentialRampToValueAtTime(velocity * 0.055, now + 0.38);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    filter.connect(env);
    env.connect(this.kotoGain);

    osc1.onended = () => {
      osc1.disconnect();
      osc2.disconnect();
      osc1Gain.disconnect();
      osc2Gain.disconnect();
      filter.disconnect();
      env.disconnect();
    };

    osc1.start(now);
    osc2.start(now);
    noiseNode.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Plays realistic Japanese wind chime (Fūrin) bells with harmonic shimmer
   */
  public playChime(pitchMultiplier: number = 1.0): void {
    if (!this.ctx || !this.chimeGain || this.isMuted) return;

    const baseFreq = 1420 * pitchMultiplier * (0.96 + Math.random() * 0.08);
    const count = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const delay = i * (0.05 + Math.random() * 0.08);
      const noteFreq = baseFreq * (this.chimePartials[i % this.chimePartials.length] / 1480);
      this.playSingleBell(noteFreq, delay);
    }
  }

  private playSingleBell(freq: number, delaySeconds: number): void {
    if (!this.ctx || !this.chimeGain) return;

    const t = this.ctx.currentTime + delaySeconds;
    const oscFundamental = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gainFund = this.ctx.createGain();
    const gainHarm = this.ctx.createGain();

    // Fundamental chime tone
    oscFundamental.type = 'sine';
    oscFundamental.frequency.setValueAtTime(freq, t);

    gainFund.gain.setValueAtTime(0, t);
    gainFund.gain.linearRampToValueAtTime(0.038, t + 0.004);
    gainFund.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);

    // High crystalline metallic partial (2.76x)
    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2.76, t);

    gainHarm.gain.setValueAtTime(0, t);
    gainHarm.gain.linearRampToValueAtTime(0.015, t + 0.003);
    gainHarm.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    oscFundamental.connect(gainFund);
    gainFund.connect(this.chimeGain);

    oscHarmonic.connect(gainHarm);
    gainHarm.connect(this.chimeGain);

    oscFundamental.onended = () => {
      oscFundamental.disconnect();
      oscHarmonic.disconnect();
      gainFund.disconnect();
      gainHarm.disconnect();
    };

    oscFundamental.start(t);
    oscHarmonic.start(t);

    oscFundamental.stop(t + 2.4);
    oscHarmonic.stop(t + 0.55);
  }

  /**
   * Procedural Japanese Bush Warbler (Uguisu) bird call
   * Features the iconic rising introductory whistle followed by playful melodic trills
   */
  public playBirdSong(): void {
    if (!this.ctx || !this.birdsGain || this.isMuted) return;
    if (this.currentMood === 'night') return;

    const now = this.ctx.currentTime;

    // 1. Iconic long rising intro whistle ("Hooo...")
    const introOsc = this.ctx.createOscillator();
    const introGain = this.ctx.createGain();
    introOsc.type = 'sine';

    const startF = 2100 + Math.random() * 200;
    const peakF = startF + 1050;

    introOsc.frequency.setValueAtTime(startF, now);
    introOsc.frequency.exponentialRampToValueAtTime(peakF, now + 0.42);

    introGain.gain.setValueAtTime(0.0001, now);
    introGain.gain.linearRampToValueAtTime(0.032, now + 0.08);
    introGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    introOsc.connect(introGain);
    introGain.connect(this.birdsGain);

    introOsc.onended = () => {
      introOsc.disconnect();
      introGain.disconnect();
    };

    introOsc.start(now);
    introOsc.stop(now + 0.49);

    // 2. Joyful rapid trills ("Hokekyo!")
    const trillStart = now + 0.54;
    const trillCount = 3 + Math.floor(Math.random() * 2);

    for (let i = 0; i < trillCount; i++) {
      const t = trillStart + i * 0.08;
      const trillOsc = this.ctx.createOscillator();
      const trillGain = this.ctx.createGain();

      trillOsc.type = 'sine';
      const trillF1 = 3300 + Math.random() * 300;
      const trillF2 = trillF1 - 650;

      trillOsc.frequency.setValueAtTime(trillF1, t);
      trillOsc.frequency.exponentialRampToValueAtTime(trillF2, t + 0.06);

      trillGain.gain.setValueAtTime(0, t);
      trillGain.gain.linearRampToValueAtTime(0.035, t + 0.012);
      trillGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);

      trillOsc.connect(trillGain);
      trillGain.connect(this.birdsGain);

      trillOsc.onended = () => {
        trillOsc.disconnect();
        trillGain.disconnect();
      };

      trillOsc.start(t);
      trillOsc.stop(t + 0.08);
    }
  }

  /**
   * Procedural Japanese Suzumushi / Matsumushi night crickets
   * Realistic acoustic stridulation using detuned beating tones and rapid AM flutter
   */
  public playCricketPulse(): void {
    if (!this.ctx || !this.cricketsGain || this.isMuted) return;
    if (this.currentMood !== 'night') return;

    const now = this.ctx.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 2); // 3 to 4 chirps ("chiri-chiri-chiri")
    const baseFreq = 4650 + Math.random() * 250;

    for (let i = 0; i < pulses; i++) {
      const t = now + i * 0.12;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Wing stridulation AM tremolo LFO (38 Hz)
      const tremolo = this.ctx.createOscillator();
      tremolo.frequency.setValueAtTime(38, t);
      const tremoloGain = this.ctx.createGain();
      tremoloGain.gain.setValueAtTime(0.4, t);
      tremolo.connect(tremoloGain);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, t);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq + 65, t); // acoustic beat interference

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.032, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);

      tremoloGain.connect(gain.gain);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.cricketsGain);

      osc1.onended = () => {
        osc1.disconnect();
        osc2.disconnect();
        tremolo.disconnect();
        tremoloGain.disconnect();
        gain.disconnect();
      };

      osc1.start(t);
      osc2.start(t);
      tremolo.start(t);

      osc1.stop(t + 0.09);
      osc2.stop(t + 0.09);
      tremolo.stop(t + 0.09);
    }
  }

  /**
   * Triggers a sudden gust of wind (swells wind filter, rings chimes, and notifies visual engine)
   */
  public triggerWindGust(): void {
    if (!this.ctx || !this.windFilter || !this.windGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Ramp up filter frequency
    this.windFilter.frequency.cancelScheduledValues(now);
    this.windFilter.frequency.setValueAtTime(this.windFilter.frequency.value, now);
    this.windFilter.frequency.exponentialRampToValueAtTime(1600, now + 1.2);
    this.windFilter.frequency.exponentialRampToValueAtTime(450, now + 4.5);

    // Swell wind gain
    this.windGain.gain.cancelScheduledValues(now);
    this.windGain.gain.setValueAtTime(this.windGain.gain.value, now);
    this.windGain.gain.linearRampToValueAtTime(0.65, now + 1.2);
    this.windGain.gain.linearRampToValueAtTime(0.32, now + 4.5);

    // Notify visual engine so trees sway and petals blow together
    if (this.onWindGust) {
      this.onWindGust();
    }

    // Play lively wind chime in the gust
    setTimeout(() => {
      this.playChime(1.15);
    }, 600);
  }

  /**
   * Master Ambient Sequencer: orchestrates periodic birds, crickets, gusts, and Koto melodies
   */
  private startAmbientSequencer(): void {
    // 1. Koto phrase generator playing authentic Japanese pentatonic motifs
    const playNextKotoPhrase = () => {
      if (!this.ctx || this.isMuted) {
        this.kotoTimerId = window.setTimeout(playNextKotoPhrase, 4000);
        return;
      }

      const motif = this.kotoMotifs[this.currentMotifIndex % this.kotoMotifs.length];
      this.currentMotifIndex++;

      let noteDelay = 0;
      for (let i = 0; i < motif.length; i++) {
        const note = motif[i];
        const vel = 0.42 + Math.random() * 0.35;
        setTimeout(() => {
          this.playKotoNote(note, vel);
        }, noteDelay * 1000);

        noteDelay += 0.48 + Math.random() * 0.42;
      }

      // Rest between contemplative phrases: 6 to 11 seconds
      const restDuration = (noteDelay + 6.0 + Math.random() * 5.0) * 1000;
      this.kotoTimerId = window.setTimeout(playNextKotoPhrase, restDuration);
    };

    // First koto note after 1.5s
    this.kotoTimerId = window.setTimeout(playNextKotoPhrase, 1500);

    // 2. Periodic birds (Day / Sunset)
    const scheduleNextBird = () => {
      this.playBirdSong();
      const nextDelay = (4.5 + Math.random() * 6.5) * 1000;
      this.birdTimerId = window.setTimeout(scheduleNextBird, nextDelay);
    };
    this.birdTimerId = window.setTimeout(scheduleNextBird, 3000);

    // 3. Periodic night crickets
    const scheduleNextCricket = () => {
      this.playCricketPulse();
      const nextDelay = (2.2 + Math.random() * 3.5) * 1000;
      this.cricketTimerId = window.setTimeout(scheduleNextCricket, nextDelay);
    };
    this.cricketTimerId = window.setTimeout(scheduleNextCricket, 2000);

    // 4. Periodic natural wind gusts
    const scheduleNextGust = () => {
      this.triggerWindGust();
      const nextDelay = (14.0 + Math.random() * 12.0) * 1000;
      this.gustTimerId = window.setTimeout(scheduleNextGust, nextDelay);
    };
    this.gustTimerId = window.setTimeout(scheduleNextGust, 12000);
  }

  /**
   * Sets the visual & sonic mood: day, sunset, or night
   */
  public setMood(mood: GardenMood): void {
    this.currentMood = mood;
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fadeTime = 2.0;

    if (this.birdsGain) {
      const targetBirdGain = mood === 'day' ? 0.35 : mood === 'sunset' ? 0.2 : 0.0;
      this.birdsGain.gain.setTargetAtTime(targetBirdGain, now, fadeTime);
    }

    if (this.cricketsGain) {
      const targetCricketGain = mood === 'night' ? 0.45 : 0.0;
      this.cricketsGain.gain.setTargetAtTime(targetCricketGain, now, fadeTime);
    }
  }

  /**
   * Adjusts master volume (0.0 to 1.0)
   */
  public setVolume(vol: number): void {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  /**
   * Toggles audio mute state
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.ctx || !this.masterGain) return this.isMuted;

    const now = this.ctx.currentTime;
    if (this.isMuted) {
      this.masterGain.gain.setTargetAtTime(0, now, 0.08);
    } else {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, now, 0.08);
    }
    return this.isMuted;
  }

  public get muted(): boolean {
    return this.isMuted;
  }

  public get isInitialized(): boolean {
    return this.ctx !== null;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.birdTimerId) clearTimeout(this.birdTimerId);
    if (this.cricketTimerId) clearTimeout(this.cricketTimerId);
    if (this.kotoTimerId) clearTimeout(this.kotoTimerId);
    if (this.gustTimerId) clearTimeout(this.gustTimerId);
    if (this.ctx) this.ctx.close();
  }
}
