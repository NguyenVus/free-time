import { BARS_PER_SECTION, BASS_ROOTS, BASS_TONE, INTERLUDE_RHYTHMS, MUSIC_BEAT_SECONDS, MUSIC_DEFAULT_TRACK, MUSIC_INTERLUDE_BARS, MUSIC_SCHEDULE_AHEAD, MUSIC_TRACKS, MUSIC_TRACK_ORDER, MUSIC_TRACK_STORAGE_KEY, NOTE_FREQ, SAKURA_MELODY, STEPS_PER_BAR, noteToFrequency } from './music';
import { BLOCK_DEFS } from '../world/blocks';

export class ProceduralAudio {
  declare bar: any;
  declare barCount: any;
  declare beatInBar: any;
  declare ctx: any;
  declare droneGains: any;
  declare isEnabled: any;
  declare isNight: any;
  declare masterGain: any;
  declare musicBus: any;
  declare musicQueue: any;
  declare nextNoteTime: any;
  declare noiseBuffer: any;
  declare playInterludeNext: any;
  declare step: any;
  declare trackBus: any;
  declare trackName: any;
  declare volume: any;

  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isEnabled = false;
    this.volume = 0.7;
    this.isNight = false;
    this.musicQueue = [];
    this.beatInBar = 0;
    this.barCount = 0;
    this.playInterludeNext = false;
    this.step = 0;
    this.bar = 0;
    this.trackName = MUSIC_DEFAULT_TRACK;
    try {
      const saved = localStorage.getItem(MUSIC_TRACK_STORAGE_KEY);
      if (MUSIC_TRACKS[saved]) this.trackName = saved;
    } catch (e) {
      // Private browsing can block storage; the default track plays instead
    }
  }

  get trackLabel() {
    return MUSIC_TRACKS[this.trackName].label;
  }

  nextTrack() {
    const index = MUSIC_TRACK_ORDER.indexOf(this.trackName);
    this.setTrack(MUSIC_TRACK_ORDER[(index + 1) % MUSIC_TRACK_ORDER.length]);
  }

  setTrack(name) {
    this.trackName = name;
    try {
      localStorage.setItem(MUSIC_TRACK_STORAGE_KEY, name);
    } catch (e) {
      // Not saved, which only means the default track next time
    }
    if (this.ctx && this.musicBus) this.startTrack();
  }

  // Notes already scheduled belong to the old bus, which fades out so they cannot clash
  startTrack() {
    const now = this.ctx.currentTime;
    if (this.trackBus) {
      const old = this.trackBus;
      old.gain.setValueAtTime(old.gain.value, now);
      old.gain.linearRampToValueAtTime(0, now + 0.2);
      setTimeout(() => old.disconnect(), MUSIC_SCHEDULE_AHEAD * 1000 + 3500);
    }
    this.trackBus = this.ctx.createGain();
    this.trackBus.connect(this.musicBus);

    const calm = !!MUSIC_TRACKS[this.trackName].calm;
    this.droneGains.forEach(gain => gain.gain.linearRampToValueAtTime(calm ? 0.025 : 0, now + 0.5));

    this.musicQueue = [];
    this.beatInBar = 0;
    this.barCount = 0;
    this.playInterludeNext = false;
    this.step = 0;
    this.bar = 0;
    this.nextNoteTime = now + 0.12;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.ctx.resume(); // iOS creates the context suspended, even inside a tap

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // iOS suspends audio on interruptions such as calls; the next touch brings it back
    window.addEventListener('pointerdown', () => {
      if (this.isEnabled && this.ctx.state !== 'running') this.ctx.resume();
    });

    this.isEnabled = true;
    this.startAmbient();
    this.startMusic();
  }

  createReverb(seconds) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      }
    }
    const reverb = this.ctx.createConvolver();
    reverb.buffer = impulse;
    return reverb;
  }

  startMusic() {
    // Keeps several loud notes and drums at once from distorting
    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 8;
    limiter.connect(this.masterGain);

    this.musicBus = this.ctx.createGain();
    this.musicBus.connect(limiter);

    const noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    this.noiseBuffer = noise;

    const reverbSend = this.ctx.createGain();
    reverbSend.gain.value = 0.2;
    const reverb = this.createReverb(2.4);
    this.musicBus.connect(reverbSend);
    reverbSend.connect(reverb);
    reverb.connect(limiter);

    // Soft open fifth held underneath the calm track
    this.droneGains = [];
    [110.0, 164.81].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0;
      this.droneGains.push(g);
      osc.connect(g);
      g.connect(this.musicBus);
      osc.start();
    });

    this.startTrack();
    // Notes go on the audio clock in advance, so slow frames or a background tab cannot
    // make the rhythm stumble.
    setInterval(() => this.scheduleMusic(), 250);
    this.scheduleMusic();
  }

  nextMusicEvent() {
    if (this.musicQueue.length === 0) {
      this.musicQueue = this.playInterludeNext ? this.createInterlude() : SAKURA_MELODY.slice();
      this.playInterludeNext = !this.playInterludeNext;
    }
    return this.musicQueue.shift();
  }

  // A short improvised passage in the same scale, so the loop does not feel repetitive
  createInterlude() {
    const scale = Object.keys(NOTE_FREQ);
    const events = [];
    let index = 3 + Math.floor(Math.random() * 3);
    for (let bar = 0; bar < MUSIC_INTERLUDE_BARS; bar++) {
      const rhythm = INTERLUDE_RHYTHMS[Math.floor(Math.random() * INTERLUDE_RHYTHMS.length)];
      rhythm.forEach(beats => {
        index += Math.floor(Math.random() * 5) - 2;
        index = Math.max(0, Math.min(scale.length - 1, index));
        events.push([Math.random() < 0.15 ? null : scale[index], beats]);
      });
    }
    return events;
  }

  scheduleMusic() {
    if (!this.isEnabled || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (this.nextNoteTime < now) this.nextNoteTime = now + 0.1;

    const track = MUSIC_TRACKS[this.trackName];
    if (!track.calm) {
      const stepSeconds = 60 / track.bpm / 4;
      while (this.nextNoteTime < now + MUSIC_SCHEDULE_AHEAD) {
        this.playStep(track, this.nextNoteTime);
        this.nextNoteTime += stepSeconds;
      }
      return;
    }

    while (this.nextNoteTime < now + MUSIC_SCHEDULE_AHEAD) {
      if (this.beatInBar === 0) {
        const root = BASS_ROOTS[this.barCount % BASS_ROOTS.length];
        this.pluck(root, this.nextNoteTime, 0.55, 3.2);
        this.pluck(root * 1.5, this.nextNoteTime + 0.09, 0.35, 2.6);
        this.barCount++;
      }

      const [note, beats] = this.nextMusicEvent();
      if (note) this.pluck(NOTE_FREQ[note], this.nextNoteTime, 1.0, 2.8);

      this.nextNoteTime += beats * MUSIC_BEAT_SECONDS;
      this.beatInBar = (this.beatInBar + beats) % 4;
    }
  }

  playStep(track, time) {
    const at = (pattern) => pattern.split(' ')[this.step];
    const section = track.arrangement[Math.floor(this.bar / BARS_PER_SECTION) % track.arrangement.length];
    const chordIndex = this.bar % BARS_PER_SECTION;

    const note = track.melody[section][chordIndex].split(' ')[this.step];
    if (note && note !== '.') this.playTone(noteToFrequency(note), time, track.lead);

    const bass = at(track.bass);
    if (bass !== '.') {
      const root = noteToFrequency(track.roots[chordIndex]);
      this.playTone(bass === 'O' ? root * 2 : root, time, BASS_TONE);
    }
    if (at(track.stabs) !== '.') {
      track.chords[chordIndex].forEach(chordNote => this.playTone(noteToFrequency(chordNote), time, track.stab));
    }
    if (at(track.kick) !== '.') this.playKick(time);
    if (at(track.snare) !== '.') this.playNoiseHit(time, 1400, 0.2, 0.13);
    if (at(track.hat) !== '.') this.playNoiseHit(time, 7000, 0.07, 0.04);

    this.step++;
    if (this.step === STEPS_PER_BAR) {
      this.step = 0;
      this.bar++;
    }
  }

  playTone(frequency, time, { wave, cutoff, gain, seconds }) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const envelope = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = frequency;
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(gain, time + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + seconds);
    osc.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.trackBus);
    osc.start(time);
    osc.stop(time + seconds + 0.02);
  }

  // Taiko-style drum: a low tone that falls quickly in pitch
  playKick(time) {
    const osc = this.ctx.createOscillator();
    const envelope = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.12);
    envelope.gain.setValueAtTime(0.42, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);
    osc.connect(envelope);
    envelope.connect(this.trackBus);
    osc.start(time);
    osc.stop(time + 0.28);
  }

  playNoiseHit(time, highpass, gain, seconds) {
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const envelope = this.ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    envelope.gain.setValueAtTime(gain, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + seconds);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.trackBus);
    source.start(time, Math.random() * 0.5, seconds + 0.02);
  }

  // Koto-like string: a fast attack, a bright overtone that fades quickly, and a long decay
  pluck(freq, time, velocity, duration) {
    const body = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    body.type = 'triangle';
    body.frequency.value = freq;
    bodyGain.gain.setValueAtTime(0.0001, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.26 * velocity, time + 0.005);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    const overtone = this.ctx.createOscillator();
    const overtoneGain = this.ctx.createGain();
    overtone.type = 'sine';
    overtone.frequency.value = freq * 3;
    overtoneGain.gain.setValueAtTime(0.0001, time);
    overtoneGain.gain.exponentialRampToValueAtTime(0.07 * velocity, time + 0.004);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

    body.connect(bodyGain);
    overtone.connect(overtoneGain);
    bodyGain.connect(this.trackBus);
    overtoneGain.connect(this.trackBus);
    body.start(time);
    overtone.start(time);
    body.stop(time + duration + 0.05);
    overtone.stop(time + 0.35);
  }

  setVolume(val) {
    this.volume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  toggleMute() {
    if (!this.ctx) {
      this.init();
      return true;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
      this.isEnabled = true;
      return true;
    } else if (this.isEnabled) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.isEnabled = false;
      return false;
    } else {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.isEnabled = true;
      return true;
    }
  }

  startAmbient() {
    if (!this.ctx) return;
    // Gentle pink noise wind synth
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.08;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);
    whiteNoise.start();

    // Bird chirps during day
    const playBird = () => {
      if (!this.isEnabled || this.isNight || !this.ctx) {
        setTimeout(playBird, 3000 + Math.random() * 5000);
        return;
      }
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400 + Math.random() * 600, now);
      osc.frequency.exponentialRampToValueAtTime(3200 + Math.random() * 400, now + 0.12);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
      setTimeout(playBird, 4000 + Math.random() * 6000);
    };
    setTimeout(playBird, 3000);
  }

  playFootstep(blockType) {
    if (!this.isEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';

    if (blockType === BLOCK_DEFS.STONE) {
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      g.gain.setValueAtTime(0.12, now);
    } else if (blockType === BLOCK_DEFS.WOOD_PLANKS || blockType === BLOCK_DEFS.WOOD_LOG) {
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
      g.gain.setValueAtTime(0.14, now);
    } else {
      // Grass or dirt
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      g.gain.setValueAtTime(0.1, now);
    }

    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playBlockBreak() {
    if (!this.isEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playBlockPlace() {
    if (!this.isEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }
}
