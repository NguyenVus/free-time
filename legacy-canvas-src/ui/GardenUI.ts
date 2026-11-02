/**
 * GardenUI.ts
 * Manages the Welcome Screen, Glassmorphism Floating Control Bar,
 * Haiku display rotation, synchronized sound/wind triggers, and responsive input.
 */

import { GardenSoundEngine, GardenMood } from '../audio/GardenSoundEngine.ts';
import { GardenRenderer } from '../garden/GardenRenderer.ts';
import { PetalSystem } from '../garden/PetalSystem.ts';
import { SAKURA_HAIKUS, HaikuPoem } from '../garden/HaikuData.ts';

export class GardenUI {
  private soundEngine: GardenSoundEngine;
  private renderer: GardenRenderer;
  private petalSystem: PetalSystem;

  // DOM Elements
  private welcomeOverlay: HTMLElement | null = null;
  private enterGardenBtn: HTMLElement | null = null;
  private controlBar: HTMLElement | null = null;
  private audioToggleBtn: HTMLElement | null = null;
  private volumeSlider: HTMLInputElement | null = null;
  private petalSlider: HTMLInputElement | null = null;
  private petalValText: HTMLElement | null = null;
  private windGustBtn: HTMLElement | null = null;
  private fullscreenBtn: HTMLElement | null = null;
  private fpsDisplay: HTMLElement | null = null;
  private haikuBox: HTMLElement | null = null;
  private haikuContent: HTMLElement | null = null;
  private haikuJapanese: HTMLElement | null = null;
  private haikuAuthor: HTMLElement | null = null;

  // Haiku Rotation
  private currentHaikuIndex: number = 0;
  private haikuIntervalId: number | null = null;

  // Touch deduplication
  private lastTouchTime: number = 0;

  constructor(
    soundEngine: GardenSoundEngine,
    renderer: GardenRenderer,
    petalSystem: PetalSystem
  ) {
    this.soundEngine = soundEngine;
    this.renderer = renderer;
    this.petalSystem = petalSystem;

    // Connect sound & visual synchronization
    this.soundEngine.onWindGust = () => {
      this.renderer.triggerWindGust();
    };

    this.petalSystem.onWaterRipple = () => {
      this.soundEngine.playWaterDrop();
    };

    this.bindDOMElements();
    this.setupEventListeners();
    this.setupInteractiveCanvas();
    this.setupMobileSensors();
  }

  private bindDOMElements(): void {
    this.welcomeOverlay = document.getElementById('welcome-overlay');
    this.enterGardenBtn = document.getElementById('enter-garden-btn');
    this.controlBar = document.getElementById('control-bar');
    this.audioToggleBtn = document.getElementById('audio-toggle-btn');
    this.volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
    this.petalSlider = document.getElementById('petal-slider') as HTMLInputElement;
    this.petalValText = document.getElementById('petal-val');
    this.windGustBtn = document.getElementById('wind-gust-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.fpsDisplay = document.getElementById('fps-display');
    this.haikuBox = document.getElementById('haiku-box');
    this.haikuContent = document.getElementById('haiku-content');
    this.haikuJapanese = document.getElementById('haiku-japanese');
    this.haikuAuthor = document.getElementById('haiku-author');
  }

  private setupEventListeners(): void {
    // 1. Enter Garden button
    if (this.enterGardenBtn) {
      this.enterGardenBtn.addEventListener('click', async () => {
        // Request iOS device orientation permission if required
        if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
          try {
            await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
          } catch {
            // User rejected or not available
          }
        }

        // Initialize Web Audio API
        await this.soundEngine.init();

        // Fade out welcome screen
        if (this.welcomeOverlay) {
          this.welcomeOverlay.classList.add('fade-out');
        }

        // Show control bar & start haikus
        if (this.controlBar) {
          this.controlBar.classList.remove('hidden');
        }
        this.startHaikuCycle();
      });
    }

    // 2. Day / Sunset / Night mode pills
    const moodButtons = document.querySelectorAll<HTMLButtonElement>('.mood-pill');
    moodButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mood = btn.dataset.mood as GardenMood;
        if (!mood) return;

        moodButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.renderer.setMood(mood);
        this.soundEngine.setMood(mood);
      });
    });

    // 3. Audio Toggle
    if (this.audioToggleBtn) {
      this.audioToggleBtn.addEventListener('click', () => {
        if (!this.soundEngine.isInitialized) {
          this.soundEngine.init();
        }
        const isMuted = this.soundEngine.toggleMute();
        this.updateAudioUI(!isMuted);
      });
    }

    // 4. Volume Slider
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', () => {
        const vol = parseFloat(this.volumeSlider!.value);
        this.soundEngine.setVolume(vol);
        if (vol > 0 && this.soundEngine.muted) {
          this.soundEngine.toggleMute();
          this.updateAudioUI(true);
        }
      });
    }

    // 5. Petal Density Slider
    if (this.petalSlider) {
      this.petalSlider.addEventListener('input', () => {
        const count = parseInt(this.petalSlider!.value, 10);
        this.petalSystem.setPetalDensity(count);
        if (this.petalValText) {
          this.petalValText.textContent = `${count}`;
        }
      });
    }

    // 6. Wind Gust Button (triggers both visual and audio gusts synchronously)
    if (this.windGustBtn) {
      this.windGustBtn.addEventListener('click', () => {
        this.renderer.triggerWindGust();
        this.soundEngine.triggerWindGust();
      });
    }

    // 7. Fullscreen Toggle
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // 8. FPS display callback & adaptive petal count sync
    this.renderer.onFpsUpdate = (fps: number) => {
      if (this.fpsDisplay) {
        this.fpsDisplay.textContent = `${fps} FPS`;
      }
      // Keep UI slider in sync if adaptive throttling kicks in
      const currentDensity = this.petalSystem.getPetalDensity();
      if (this.petalSlider && parseInt(this.petalSlider.value, 10) !== currentDensity) {
        this.petalSlider.value = String(currentDensity);
        if (this.petalValText) {
          this.petalValText.textContent = `${currentDensity}`;
        }
      }
    };
  }

  private updateAudioUI(isPlaying: boolean): void {
    if (this.audioToggleBtn) {
      if (isPlaying) {
        this.audioToggleBtn.classList.add('playing');
        this.audioToggleBtn.setAttribute('title', 'Tắt âm thanh');
      } else {
        this.audioToggleBtn.classList.remove('playing');
        this.audioToggleBtn.setAttribute('title', 'Bật âm thanh');
      }
    }
  }

  /**
   * Sets up Mouse and Touch interactions on the Canvas
   */
  private setupInteractiveCanvas(): void {
    const canvas = document.getElementById('garden-canvas');
    if (!canvas) return;

    // Mouse Move -> Parallax + Petal Wind Wake
    window.addEventListener('mousemove', (e: MouseEvent) => {
      const rx = e.clientX / window.innerWidth - 0.5;
      const ry = e.clientY / window.innerHeight - 0.5;
      this.renderer.setParallax(rx, ry);
      this.petalSystem.handleMouseMove(e.clientX, e.clientY);
    });

    // Mouse Click -> Blossom Burst + Wind Chime
    canvas.addEventListener('click', (e: MouseEvent) => {
      // Ignore click if simulated shortly after a touch event
      if (performance.now() - this.lastTouchTime < 500) return;

      this.petalSystem.spawnBlossomBurst(e.clientX, e.clientY, 32);
      this.soundEngine.playChime(1.1);
    });

    // Touch Support for Mobile
    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rx = touch.clientX / window.innerWidth - 0.5;
        const ry = touch.clientY / window.innerHeight - 0.5;
        this.renderer.setParallax(rx, ry);
        this.petalSystem.handleMouseMove(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      this.lastTouchTime = performance.now();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.petalSystem.spawnBlossomBurst(touch.clientX, touch.clientY, 26);
        this.soundEngine.playChime(1.05);
      }
    }, { passive: true });
  }

  /**
   * Mobile Gyroscope / DeviceOrientation Parallax
   */
  private setupMobileSensors(): void {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
        if (event.gamma !== null && event.beta !== null) {
          // Gamma is left-to-right tilt in [-90, 90]
          // Beta is front-to-back tilt in [-180, 180]
          const rx = Math.max(-0.5, Math.min(0.5, event.gamma / 45));
          const ry = Math.max(-0.5, Math.min(0.5, (event.beta - 45) / 45));
          this.renderer.setParallax(rx, ry);
        }
      }, { passive: true });
    }
  }

  /**
   * Rotates Haiku poems with graceful fade-in / fade-out
   */
  private startHaikuCycle(): void {
    // Show first poem after 3.5s
    setTimeout(() => {
      this.displayNextHaiku();
    }, 3500);

    // Rotate every 24 seconds
    this.haikuIntervalId = window.setInterval(() => {
      this.displayNextHaiku();
    }, 24000);
  }

  private displayNextHaiku(): void {
    if (!this.haikuBox || !this.haikuContent || !this.haikuJapanese || !this.haikuAuthor) return;

    const poem: HaikuPoem = SAKURA_HAIKUS[this.currentHaikuIndex % SAKURA_HAIKUS.length];
    this.currentHaikuIndex++;

    // Fade out
    this.haikuBox.classList.remove('visible');

    setTimeout(() => {
      if (!this.haikuContent || !this.haikuJapanese || !this.haikuAuthor || !this.haikuBox) return;

      // Populate text
      this.haikuContent.innerHTML = poem.lines.map(line => `<div>${line}</div>`).join('');
      this.haikuJapanese.textContent = poem.japanese;
      this.haikuAuthor.textContent = `— ${poem.author}`;

      // Fade in
      this.haikuBox.classList.add('visible');

      // Keep visible for 8.5 seconds, then fade out
      setTimeout(() => {
        if (this.haikuBox) {
          this.haikuBox.classList.remove('visible');
        }
      }, 8500);
    }, 1200);
  }

  public destroy(): void {
    if (this.haikuIntervalId) clearInterval(this.haikuIntervalId);
  }
}
