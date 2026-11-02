/**
 * GardenRenderer.ts
 * Master 60FPS procedural Canvas 2D engine for Vườn Anh Đào (Sakura Sanctuary).
 * Zero external images: renders sky gradient, drifting clouds, celestial bodies,
 * distant Mount Fuji, rolling mountain ridges, valley mist, lake with mirrored reflection
 * and sun/moonlight shimmer columns, vermilion Torii gate, arched wooden bridge,
 * curving stepping stone path, glowing stone lanterns (Tōrō), multi-layered cherry blossom
 * trees with wind-reactive branch swaying, foreground framing boughs with swinging glowing
 * paper lanterns (Chōchin), god rays, moonbeams, floating bokeh, and night fireflies.
 */

import { GardenMood } from '../audio/GardenSoundEngine.ts';
import { PetalSystem } from './PetalSystem.ts';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  puffs: { dx: number; dy: number; r: number; alpha: number }[];
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulsePhase: number;
  pulseSpeed: number;
  size: number;
}

interface BokehParticle {
  x: number;
  y: number;
  size: number;
  vy: number;
  alpha: number;
  phase: number;
}

export class GardenRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private petalSystem: PetalSystem;

  // Sizing & DPI
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  // Parallax
  private targetParallaxX: number = 0;
  private targetParallaxY: number = 0;
  private currentParallaxX: number = 0;
  private currentParallaxY: number = 0;

  // Mood & Time transition
  private currentMood: GardenMood = 'day';
  private targetMood: GardenMood = 'day';
  private moodTransition: number = 1.0; // 0 to 1
  private prevMood: GardenMood = 'day';

  // Wind state
  public windGust: number = 0.0;
  private branchWiggleTime: number = 0;

  // Procedural scenic elements
  private stars: Star[] = [];
  private clouds: Cloud[] = [];
  private fireflies: Firefly[] = [];
  private bokehParticles: BokehParticle[] = [];

  // Performance monitoring
  private lastFrameTime: number = 0;
  private fps: number = 60;
  private fpsUpdateTimer: number = 0;
  private frameCount: number = 0;
  public onFpsUpdate?: (fps: number) => void;

  constructor(canvas: HTMLCanvasElement, petalSystem: PetalSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.petalSystem = petalSystem;

    this.initScenicElements();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.petalSystem.resize(this.width, this.height);
  }

  private initScenicElements(): void {
    // 1. Stars (for night mode)
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.52, // In upper sky
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.35 + Math.random() * 0.65,
        twinkleSpeed: 1.5 + Math.random() * 3.5,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    // 2. Procedural soft clouds
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      const puffs: Cloud['puffs'] = [];
      const puffCount = 5 + Math.floor(Math.random() * 4);
      for (let j = 0; j < puffCount; j++) {
        puffs.push({
          dx: (j - puffCount / 2) * 28 + (Math.random() - 0.5) * 15,
          dy: (Math.random() - 0.5) * 12,
          r: 25 + Math.random() * 22,
          alpha: 0.18 + Math.random() * 0.15
        });
      }

      this.clouds.push({
        x: Math.random() * 1.5 - 0.25,
        y: 0.08 + Math.random() * 0.24,
        scale: 0.8 + Math.random() * 0.7,
        speed: 0.00004 + Math.random() * 0.00006,
        puffs
      });
    }

    // 3. Fireflies (for night mode)
    this.fireflies = [];
    for (let i = 0; i < 38; i++) {
      this.fireflies.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight * 0.40 + Math.random() * window.innerHeight * 0.52,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.8 + Math.random() * 2.2,
        size: 2.0 + Math.random() * 1.6
      });
    }

    // 4. Bokeh floating sparkles
    this.bokehParticles = [];
    for (let i = 0; i < 48; i++) {
      this.bokehParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 3 + Math.random() * 9,
        vy: 0.2 + Math.random() * 0.5,
        alpha: 0.1 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  public setMood(mood: GardenMood): void {
    if (mood === this.targetMood) return;
    this.prevMood = this.currentMood;
    this.targetMood = mood;
    this.moodTransition = 0.0;
  }

  public getMood(): GardenMood {
    return this.targetMood;
  }

  public setParallax(xRatio: number, yRatio: number): void {
    // xRatio, yRatio in range [-0.5, 0.5]
    this.targetParallaxX = xRatio * 65;
    this.targetParallaxY = yRatio * 40;
  }

  public triggerWindGust(): void {
    this.windGust = 1.0;
  }

  /**
   * Helper to interpolate two hex/rgba color strings
   */
  private interpolateColor(colorA: string, colorB: string, t: number): string {
    const parse = (hex: string) => {
      const cleaned = hex.replace('#', '');
      if (cleaned.length === 3) {
        return [
          parseInt(cleaned[0] + cleaned[0], 16),
          parseInt(cleaned[1] + cleaned[1], 16),
          parseInt(cleaned[2] + cleaned[2], 16)
        ];
      }
      const c = parseInt(cleaned, 16);
      return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
    };
    try {
      const c1 = parse(colorA);
      const c2 = parse(colorB);
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      return colorB;
    }
  }

  /**
   * Helper to interpolate a mood-dependent color
   */
  private interpMoodColor(palette: Record<GardenMood, string>): string {
    const colA = palette[this.prevMood];
    const colB = palette[this.targetMood];
    return this.interpolateColor(colA, colB, this.moodTransition);
  }

  /**
   * Main render loop called every frame
   */
  public render(currentTime: number): void {
    const delta = this.lastFrameTime > 0 ? (currentTime - this.lastFrameTime) / 1000 : 0.016;
    this.lastFrameTime = currentTime;

    // Performance tracking
    this.frameCount++;
    this.fpsUpdateTimer += delta;
    if (this.fpsUpdateTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsUpdateTimer);
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;
      if (this.onFpsUpdate) this.onFpsUpdate(this.fps);

      // Adaptive optimization: reduce petals if FPS consistently drops
      if (this.fps < 45 && this.petalSystem.getPetalDensity() > 70) {
        this.petalSystem.setPetalDensity(this.petalSystem.getPetalDensity() - 15);
      }
    }

    // Smooth mood transition
    if (this.moodTransition < 1.0) {
      this.moodTransition = Math.min(1.0, this.moodTransition + delta * 0.85);
      if (this.moodTransition >= 1.0) {
        this.currentMood = this.targetMood;
      }
    }

    // Wind gust decay
    if (this.windGust > 0.0) {
      this.windGust = Math.max(0.0, this.windGust - delta * 0.35);
    }
    this.petalSystem.gustMultiplier = this.windGust;
    this.branchWiggleTime += delta * (1.2 + this.windGust * 2.5);

    // Smooth parallax lerp
    this.currentParallaxX += (this.targetParallaxX - this.currentParallaxX) * (delta * 4.5);
    this.currentParallaxY += (this.targetParallaxY - this.currentParallaxY) * (delta * 4.5);

    const pX = this.currentParallaxX;
    const pY = this.currentParallaxY;
    const timeSec = currentTime / 1000;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // ==========================================
    // LAYER 1: Sky, Celestial Bodies & Stars
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.04, pY * 0.02);
    this.drawSky(timeSec);
    this.drawStars(timeSec);
    this.ctx.restore();

    // ==========================================
    // LAYER 2: Drifting Soft Clouds
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.09, pY * 0.05);
    this.drawClouds(timeSec, delta);
    this.ctx.restore();

    // ==========================================
    // LAYER 3: Distant Mountains, Fuji & Fog
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.18, pY * 0.08);
    this.drawDistantMountains();
    this.ctx.restore();

    // ==========================================
    // LAYER 4: Far Cherry Blossom Groves & Mist
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.28, pY * 0.14);
    this.drawFarGroves();
    this.ctx.restore();

    // ==========================================
    // LAYER 5: Lake with Mirrored Reflections & Ripples
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.38, pY * 0.20);
    // Align Fuji reflection with Layer 3 Fuji position
    const fujiRelOffset = (pX * 0.18) - (pX * 0.38);
    this.drawLake(timeSec, fujiRelOffset);
    this.ctx.restore();

    // Background Petals (behind Torii and bridge)
    this.petalSystem.drawPetals(this.ctx, 'background', pX * 0.38);

    // ==========================================
    // LAYER 6: Japanese Torii Gate & Wooden Bridge
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.46, pY * 0.24);
    this.drawToriiGate();
    this.drawWoodenBridge();
    this.ctx.restore();

    // ==========================================
    // LAYER 7: Ground Bank, Stepping Stone Path & Midground Trees
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.60, pY * 0.32);
    this.drawStonePath();
    this.drawMidgroundTrees();
    this.ctx.restore();

    // Midground Petals
    this.petalSystem.drawPetals(this.ctx, 'midground', pX * 0.60);

    // ==========================================
    // LAYER 8: Foreground Framing Boughs & Hanging Paper Lanterns
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.90, pY * 0.48);
    this.drawForegroundFraming();
    this.ctx.restore();

    // ==========================================
    // LAYER 9: Atmospheric Lighting (God rays / Moonbeams & Bokeh)
    // ==========================================
    this.drawAtmosphere(timeSec);

    // ==========================================
    // LAYER 10: Night Fireflies
    // ==========================================
    this.ctx.save();
    this.ctx.translate(pX * 0.65, pY * 0.35);
    this.drawFireflies(delta);
    this.ctx.restore();

    // Foreground Petals (Closest & largest)
    this.petalSystem.drawPetals(this.ctx, 'foreground', pX * 0.90);

    // Update Petal Physics
    this.petalSystem.update(delta, timeSec);
  }

  /**
   * 1. Draws Sky Gradient and Sun/Moon
   */
  private drawSky(timeSec: number): void {
    const W = this.width;
    const H = this.height;

    // Palettes: Day (peach pink - pale purple - blue), Sunset (amber - magenta - deep violet), Night (deep starlit indigo)
    const palettes = {
      day: { top: '#79a8e0', mid: '#d8bbf0', horizon: '#ffd6e0', sunAura: 'rgba(255, 235, 180, 0.45)' },
      sunset: { top: '#3b1d5c', mid: '#b83b63', horizon: '#f59e0b', sunAura: 'rgba(245, 158, 11, 0.55)' },
      night: { top: '#050816', mid: '#15143a', horizon: '#2e1c4e', sunAura: 'rgba(203, 213, 225, 0.3)' }
    };

    const topCol = this.interpMoodColor({ day: palettes.day.top, sunset: palettes.sunset.top, night: palettes.night.top });
    const midCol = this.interpMoodColor({ day: palettes.day.mid, sunset: palettes.sunset.mid, night: palettes.night.mid });
    const horCol = this.interpMoodColor({ day: palettes.day.horizon, sunset: palettes.sunset.horizon, night: palettes.night.horizon });

    const grad = this.ctx.createLinearGradient(0, -60, 0, H * 0.75);
    grad.addColorStop(0, topCol);
    grad.addColorStop(0.55, midCol);
    grad.addColorStop(1, horCol);

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(-80, -80, W + 160, H + 160);

    // Sun at Day & Sunset
    const sunX = W * 0.72;
    const sunY = H * 0.24;

    const nightWeight = this.targetMood === 'night' ? this.moodTransition : (this.prevMood === 'night' ? 1 - this.moodTransition : 0);
    const sunAlpha = 1 - nightWeight;

    if (sunAlpha > 0.01) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, sunAlpha);

      // Sun halo aura
      const sunHalo = this.ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 120);
      const auraCol = this.targetMood === 'sunset' ? 'rgba(245, 158, 11, ' : 'rgba(255, 235, 180, ';
      sunHalo.addColorStop(0, `${auraCol}0.55)`);
      sunHalo.addColorStop(0.5, `${auraCol}0.2)`);
      sunHalo.addColorStop(1, `${auraCol}0)`);
      this.ctx.fillStyle = sunHalo;
      this.ctx.beginPath();
      this.ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
      this.ctx.fill();

      // Sun body
      this.ctx.fillStyle = this.targetMood === 'sunset' ? '#fef08a' : '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Moon at Night
    if (nightWeight > 0.01) {
      const moonX = W * 0.28;
      const moonY = H * 0.22;

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, nightWeight);

      // Moon glowing halo
      const moonHalo = this.ctx.createRadialGradient(moonX, moonY, 16, moonX, moonY, 105);
      moonHalo.addColorStop(0, 'rgba(224, 231, 255, 0.5)');
      moonHalo.addColorStop(0.5, 'rgba(165, 180, 252, 0.2)');
      moonHalo.addColorStop(1, 'rgba(165, 180, 252, 0)');
      this.ctx.fillStyle = moonHalo;
      this.ctx.beginPath();
      this.ctx.arc(moonX, moonY, 105, 0, Math.PI * 2);
      this.ctx.fill();

      // Moon disc with gentle crater texture
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.beginPath();
      this.ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
      this.ctx.fill();

      // Soft crater textures
      this.ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(moonX - 6, moonY - 5, 5.5, 0, Math.PI * 2);
      this.ctx.arc(moonX + 7, moonY + 4, 7, 0, Math.PI * 2);
      this.ctx.arc(moonX - 2, moonY + 9, 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  /**
   * 2. Draws Twinkling Stars in Night Sky
   */
  private drawStars(timeSec: number): void {
    const nightWeight = this.targetMood === 'night' ? this.moodTransition : (this.prevMood === 'night' ? 1 - this.moodTransition : 0);
    if (nightWeight <= 0.01) return;

    this.ctx.save();
    for (const star of this.stars) {
      const sx = star.x * this.width;
      const sy = star.y * this.height;
      const twinkle = Math.sin(timeSec * star.twinkleSpeed + star.twinklePhase) * 0.35 + 0.65;
      const a = star.alpha * twinkle * nightWeight;

      this.ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  /**
   * 3. Draws Drifting Soft Procedural Clouds
   */
  private drawClouds(timeSec: number, delta: number): void {
    const W = this.width;
    const H = this.height;

    const cloudTints = {
      day: 'rgba(255, 245, 250, ',
      sunset: 'rgba(254, 215, 226, ',
      night: 'rgba(76, 60, 110, '
    };
    const tint = cloudTints[this.targetMood];

    this.ctx.save();
    for (const cloud of this.clouds) {
      // Drifting across horizontally
      cloud.x += cloud.speed * (1.0 + this.windGust * 2.2);
      if (cloud.x > 1.35) cloud.x = -0.35;

      const cx = cloud.x * W;
      const cy = cloud.y * H;

      for (const puff of cloud.puffs) {
        const px = cx + puff.dx * cloud.scale;
        const py = cy + puff.dy * cloud.scale;
        const r = puff.r * cloud.scale;

        const radGrad = this.ctx.createRadialGradient(px, py, 0, px, py, r);
        radGrad.addColorStop(0, `${tint}${puff.alpha})`);
        radGrad.addColorStop(0.7, `${tint}${puff.alpha * 0.6})`);
        radGrad.addColorStop(1, `${tint}0)`);

        this.ctx.fillStyle = radGrad;
        this.ctx.beginPath();
        this.ctx.arc(px, py, r, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }

  /**
   * 4. Draws Distant Mountains, Mount Fuji, and Valley Fog
   */
  private drawDistantMountains(): void {
    const W = this.width;
    const H = this.height;
    const horizon = H * 0.54;

    const mtnPalettes = {
      day: { fuji: '#b4a2c4', snow: '#ffffff', farRidge: '#c8b6d8', midRidge: '#a894bc', fog: 'rgba(255, 235, 245, ' },
      sunset: { fuji: '#782d5a', snow: '#ffd6e7', farRidge: '#88396c', midRidge: '#5e234c', fog: 'rgba(251, 146, 175, ' },
      night: { fuji: '#191738', snow: '#94a3b8', farRidge: '#1e1c45', midRidge: '#161432', fog: 'rgba(30, 27, 75, ' }
    };

    const fujiColor = this.interpMoodColor({ day: mtnPalettes.day.fuji, sunset: mtnPalettes.sunset.fuji, night: mtnPalettes.night.fuji });
    const snowColor = this.interpMoodColor({ day: mtnPalettes.day.snow, sunset: mtnPalettes.sunset.snow, night: mtnPalettes.night.snow });
    const farRidgeColor = this.interpMoodColor({ day: mtnPalettes.day.farRidge, sunset: mtnPalettes.sunset.farRidge, night: mtnPalettes.night.farRidge });
    const midRidgeColor = this.interpMoodColor({ day: mtnPalettes.day.midRidge, sunset: mtnPalettes.sunset.midRidge, night: mtnPalettes.night.midRidge });
    const fogColor = mtnPalettes[this.targetMood].fog;

    this.ctx.save();

    // 4a. Mount Fuji Profile (Iconic symmetrical peak)
    const fujiX = W * 0.38;
    const fujiPeakY = H * 0.28;
    const fujiWidth = W * 0.45;

    this.ctx.fillStyle = fujiColor;
    this.ctx.beginPath();
    this.ctx.moveTo(fujiX - fujiWidth * 0.5, horizon + 20);
    this.ctx.bezierCurveTo(
      fujiX - fujiWidth * 0.22, horizon * 0.82,
      fujiX - fujiWidth * 0.08, fujiPeakY + 6,
      fujiX - fujiWidth * 0.035, fujiPeakY
    );
    this.ctx.lineTo(fujiX + fujiWidth * 0.035, fujiPeakY);
    this.ctx.bezierCurveTo(
      fujiX + fujiWidth * 0.08, fujiPeakY + 6,
      fujiX + fujiWidth * 0.22, horizon * 0.82,
      fujiX + fujiWidth * 0.5, horizon + 20
    );
    this.ctx.closePath();
    this.ctx.fill();

    // Fuji Snow Cap
    this.ctx.fillStyle = snowColor;
    this.ctx.beginPath();
    this.ctx.moveTo(fujiX - fujiWidth * 0.035, fujiPeakY);
    this.ctx.lineTo(fujiX + fujiWidth * 0.035, fujiPeakY);
    this.ctx.bezierCurveTo(
      fujiX + fujiWidth * 0.065, fujiPeakY + 28,
      fujiX + fujiWidth * 0.05, fujiPeakY + 38,
      fujiX + fujiWidth * 0.08, fujiPeakY + 54
    );
    this.ctx.lineTo(fujiX + fujiWidth * 0.04, fujiPeakY + 44);
    this.ctx.lineTo(fujiX + 0, fujiPeakY + 56);
    this.ctx.lineTo(fujiX - fujiWidth * 0.03, fujiPeakY + 46);
    this.ctx.lineTo(fujiX - fujiWidth * 0.07, fujiPeakY + 52);
    this.ctx.bezierCurveTo(
      fujiX - fujiWidth * 0.05, fujiPeakY + 38,
      fujiX - fujiWidth * 0.065, fujiPeakY + 28,
      fujiX - fujiWidth * 0.035, fujiPeakY
    );
    this.ctx.closePath();
    this.ctx.fill();

    // 4b. Far Mountain Ridges
    this.ctx.fillStyle = farRidgeColor;
    this.ctx.beginPath();
    this.ctx.moveTo(-60, horizon + 20);
    this.ctx.bezierCurveTo(W * 0.15, horizon - 90, W * 0.35, horizon - 50, W * 0.55, horizon - 75);
    this.ctx.bezierCurveTo(W * 0.75, horizon - 100, W * 0.9, horizon - 45, W + 60, horizon - 65);
    this.ctx.lineTo(W + 60, horizon + 20);
    this.ctx.lineTo(-60, horizon + 20);
    this.ctx.closePath();
    this.ctx.fill();

    // 4c. Mid Ridge
    this.ctx.fillStyle = midRidgeColor;
    this.ctx.beginPath();
    this.ctx.moveTo(-60, horizon + 20);
    this.ctx.bezierCurveTo(W * 0.2, horizon - 45, W * 0.45, horizon - 65, W * 0.7, horizon - 35);
    this.ctx.bezierCurveTo(W * 0.85, horizon - 15, W * 0.95, horizon - 50, W + 60, horizon - 30);
    this.ctx.lineTo(W + 60, horizon + 20);
    this.ctx.lineTo(-60, horizon + 20);
    this.ctx.closePath();
    this.ctx.fill();

    // 4d. Soft Valley Fog / Mist Bands
    const fogGrad = this.ctx.createLinearGradient(0, horizon - 60, 0, horizon + 20);
    fogGrad.addColorStop(0, `${fogColor}0)`);
    fogGrad.addColorStop(0.5, `${fogColor}0.5)`);
    fogGrad.addColorStop(1, `${fogColor}0.1)`);
    this.ctx.fillStyle = fogGrad;
    this.ctx.fillRect(-60, horizon - 60, W + 120, 80);

    this.ctx.restore();
  }

  /**
   * 5. Draws Far Cherry Blossom Groves (Cây ở xa mờ dần như sương)
   */
  private drawFarGroves(): void {
    const W = this.width;
    const H = this.height;
    const horizon = H * 0.54;

    const grovePalettes = {
      day: { canopy: '#ffc8dc', shadow: '#ebaac3' },
      sunset: { canopy: '#f472b6', shadow: '#be3264' },
      night: { canopy: '#644b82', shadow: '#3c2d5a' }
    };

    const canopyCol = this.interpMoodColor({ day: grovePalettes.day.canopy, sunset: grovePalettes.sunset.canopy, night: grovePalettes.night.canopy });
    const shadowCol = this.interpMoodColor({ day: grovePalettes.day.shadow, sunset: grovePalettes.sunset.shadow, night: grovePalettes.night.shadow });

    this.ctx.save();
    const clusterPositions = [
      { x: 0.10, y: horizon - 15, r: 44 },
      { x: 0.22, y: horizon - 18, r: 52 },
      { x: 0.33, y: horizon - 12, r: 38 },
      { x: 0.65, y: horizon - 20, r: 46 },
      { x: 0.78, y: horizon - 16, r: 56 },
      { x: 0.92, y: horizon - 22, r: 50 }
    ];

    for (const cl of clusterPositions) {
      const cx = cl.x * W;
      const cy = cl.y;

      // Canopy puff
      this.ctx.fillStyle = canopyCol;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, cl.r, 0, Math.PI * 2);
      this.ctx.arc(cx - cl.r * 0.4, cy + 4, cl.r * 0.7, 0, Math.PI * 2);
      this.ctx.arc(cx + cl.r * 0.4, cy + 6, cl.r * 0.75, 0, Math.PI * 2);
      this.ctx.fill();

      // Lower shade
      this.ctx.fillStyle = shadowCol;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy + cl.r * 0.3, cl.r * 0.7, 0, Math.PI);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  /**
   * 6. Draws Lake & Water Surface with Reflection, Wavelets & Expanding Ripples
   */
  private drawLake(timeSec: number, fujiRelOffset: number): void {
    const W = this.width;
    const H = this.height;
    const lakeTop = H * 0.54;
    const lakeBottom = H * 0.74;
    const lakeH = lakeBottom - lakeTop;

    const waterPalettes = {
      day: { baseTop: '#a5c4f2', baseBottom: '#82b1ea', sheen: 'rgba(255, 255, 255, 0.32)' },
      sunset: { baseTop: '#a84e7a', baseBottom: '#752d58', sheen: 'rgba(253, 186, 116, 0.40)' },
      night: { baseTop: '#101535', baseBottom: '#0a0d24', sheen: 'rgba(165, 180, 252, 0.25)' }
    };

    const topCol = this.interpMoodColor({ day: waterPalettes.day.baseTop, sunset: waterPalettes.sunset.baseTop, night: waterPalettes.night.baseTop });
    const botCol = this.interpMoodColor({ day: waterPalettes.day.baseBottom, sunset: waterPalettes.sunset.baseBottom, night: waterPalettes.night.baseBottom });
    const sheenCol = waterPalettes[this.targetMood].sheen;

    this.ctx.save();

    // 6a. Lake base gradient (extending beyond edges for parallax safety)
    const lakeGrad = this.ctx.createLinearGradient(0, lakeTop - 10, 0, lakeBottom + 10);
    lakeGrad.addColorStop(0, topCol);
    lakeGrad.addColorStop(1, botCol);

    this.ctx.fillStyle = lakeGrad;
    this.ctx.fillRect(-80, lakeTop - 10, W + 160, lakeH + 20);

    // 6b. Mirrored reflection of Mount Fuji (aligned with Layer 3 Fuji)
    this.ctx.save();
    this.ctx.globalAlpha = 0.32;
    const fujiX = W * 0.38 + fujiRelOffset;
    this.ctx.fillStyle = this.targetMood === 'night' ? '#161432' : (this.targetMood === 'sunset' ? '#88396c' : '#c8b6d8');
    this.ctx.beginPath();
    this.ctx.moveTo(fujiX - W * 0.2, lakeTop);
    this.ctx.lineTo(fujiX, lakeTop + lakeH * 0.65);
    this.ctx.lineTo(fujiX + W * 0.2, lakeTop);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // 6c. Sun / Moon Light Shimmer Column on water ("mặt hồ phản chiếu ánh trời")
    this.ctx.save();
    const isNight = this.targetMood === 'night';
    const isSunset = this.targetMood === 'sunset';
    const lightX = isNight ? W * 0.28 : W * 0.72;
    const lightColor = isNight ? 'rgba(224, 231, 255, ' : (isSunset ? 'rgba(251, 191, 36, ' : 'rgba(255, 250, 220, ');

    // Vertical luminous light pillar across water
    const lightGrad = this.ctx.createLinearGradient(lightX - 45, 0, lightX + 45, 0);
    lightGrad.addColorStop(0, `${lightColor}0)`);
    lightGrad.addColorStop(0.5, `${lightColor}0.25)`);
    lightGrad.addColorStop(1, `${lightColor}0)`);
    this.ctx.fillStyle = lightGrad;
    this.ctx.fillRect(lightX - 45, lakeTop, 90, lakeH);

    // Shimmering cross ripples in light column
    this.ctx.strokeStyle = `${lightColor}0.5)`;
    this.ctx.lineWidth = 1.6;
    for (let sy = lakeTop + 6; sy < lakeBottom; sy += 9) {
      const prog = (sy - lakeTop) / lakeH;
      const shWidth = 14 + prog * 45;
      const shOff = Math.sin(timeSec * 2.5 + sy * 0.1) * 6;
      this.ctx.beginPath();
      this.ctx.moveTo(lightX - shWidth + shOff, sy);
      this.ctx.lineTo(lightX + shWidth + shOff, sy);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // 6d. Animated lake wavelets (Gợn sóng nhẹ lăn tăn)
    this.ctx.strokeStyle = sheenCol;
    this.ctx.lineWidth = 1.2;
    const rowCount = 10;

    for (let i = 0; i < rowCount; i++) {
      const yNorm = i / rowCount;
      const y = lakeTop + yNorm * lakeH;
      const waveSpeed = 1.6 + yNorm * 0.8;
      const waveFreq = 0.015 - yNorm * 0.006;
      const waveAmp = (1.5 + yNorm * 2.5) * (1.0 + this.windGust * 0.8);

      this.ctx.beginPath();
      for (let x = -40; x < W + 40; x += 36) {
        const segLen = 22 + Math.sin(x * 0.02 + timeSec) * 12;
        const waveY = y + Math.sin(x * waveFreq + timeSec * waveSpeed + i) * waveAmp;
        this.ctx.moveTo(x, waveY);
        this.ctx.lineTo(x + segLen, waveY);
      }
      this.ctx.stroke();
    }

    // 6e. Render dynamic water ripples from PetalSystem
    this.petalSystem.drawRipples(this.ctx, 0);

    // 6f. Distant shoreline bank strip
    const farBankCol = this.interpMoodColor({ day: '#2d4734', sunset: '#382218', night: '#0d1824' });
    this.ctx.fillStyle = farBankCol;
    this.ctx.fillRect(-80, lakeTop - 3, W + 160, 4);

    this.ctx.restore();
  }

  /**
   * 7. Draws Japanese Torii Gate (Cổng Torii kiểu Nhật)
   */
  private drawToriiGate(): void {
    const W = this.width;
    const H = this.height;

    // Placed serenely on the right-hand lakeside
    const toriiX = W * 0.80;
    const toriiBaseY = H * 0.66;
    const scale = Math.min(W / 1200, 1.2) * 1.1;

    const toriiPalettes = {
      day: { wood: '#dc2626', topBlack: '#1f2937', shadow: '#991b1b', stone: '#64748b' },
      sunset: { wood: '#b91c1c', topBlack: '#111827', shadow: '#7f1d1d', stone: '#475569' },
      night: { wood: '#7f1d1d', topBlack: '#090d16', shadow: '#450a0a', stone: '#334155' }
    };

    const woodCol = this.interpMoodColor({ day: toriiPalettes.day.wood, sunset: toriiPalettes.sunset.wood, night: toriiPalettes.night.wood });
    const topCol = this.interpMoodColor({ day: toriiPalettes.day.topBlack, sunset: toriiPalettes.sunset.topBlack, night: toriiPalettes.night.topBlack });
    const stoneCol = this.interpMoodColor({ day: toriiPalettes.day.stone, sunset: toriiPalettes.sunset.stone, night: toriiPalettes.night.stone });

    this.ctx.save();
    this.ctx.translate(toriiX, toriiBaseY);
    this.ctx.scale(scale, scale);

    const postHeight = 115;
    const postDist = 68;
    const postWidth = 9;

    // Torii water reflection
    this.ctx.save();
    this.ctx.globalAlpha = 0.28;
    this.ctx.scale(1, -0.6);
    this.ctx.fillStyle = woodCol;
    this.ctx.fillRect(-postDist / 2 - postWidth / 2, 0, postWidth, postHeight);
    this.ctx.fillRect(postDist / 2 - postWidth / 2, 0, postWidth, postHeight);
    this.ctx.fillRect(-postDist * 0.8, postHeight * 0.7, postDist * 1.6, 8);
    this.ctx.restore();

    // Stone base plinths (Kamebara)
    this.ctx.fillStyle = stoneCol;
    this.ctx.fillRect(-postDist / 2 - postWidth / 2 - 2, 0, postWidth + 4, 10);
    this.ctx.fillRect(postDist / 2 - postWidth / 2 - 2, 0, postWidth + 4, 10);

    // Two Main Posts (Hashira)
    this.ctx.fillStyle = woodCol;
    this.ctx.save();
    this.ctx.translate(-postDist / 2, 0);
    this.ctx.rotate(0.015);
    this.ctx.fillRect(-postWidth / 2, -postHeight, postWidth, postHeight);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.translate(postDist / 2, 0);
    this.ctx.rotate(-0.015);
    this.ctx.fillRect(-postWidth / 2, -postHeight, postWidth, postHeight);
    this.ctx.restore();

    // Lower Crossbeam (Nuki)
    this.ctx.fillStyle = woodCol;
    this.ctx.fillRect(-postDist * 0.72, -postHeight * 0.74, postDist * 1.44, 7);

    // Central Tablet Plaque (Gakuzuka)
    this.ctx.fillStyle = topCol;
    this.ctx.fillRect(-4, -postHeight * 0.96, 8, postHeight * 0.22);

    // Upper Crossbeam (Shimaki)
    this.ctx.fillStyle = woodCol;
    this.ctx.fillRect(-postDist * 0.85, -postHeight * 0.96, postDist * 1.7, 9);

    // Top Lintel (Kasagi) with classic upward-sweeping curved ends
    this.ctx.fillStyle = topCol;
    this.ctx.beginPath();
    const kasagiW = postDist * 1.95;
    const topY = -postHeight - 4;
    this.ctx.moveTo(-kasagiW / 2, topY - 5);
    this.ctx.quadraticCurveTo(0, topY, kasagiW / 2, topY - 5);
    this.ctx.lineTo(kasagiW / 2 + 6, topY + 6);
    this.ctx.quadraticCurveTo(0, topY + 10, -kasagiW / 2 - 6, topY + 6);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * 8. Draws Japanese Arched Wooden Bridge (Cầu gỗ nhỏ kiểu Nhật)
   */
  private drawWoodenBridge(): void {
    const W = this.width;
    const H = this.height;

    // Placed gracefully spanning water on left-center
    const bridgeX = W * 0.32;
    const bridgeY = H * 0.64;
    const scale = Math.min(W / 1200, 1.2) * 1.05;

    const bridgePalettes = {
      day: { arch: '#92400e', plank: '#b45309', railing: '#b91c1c', postCap: '#f59e0b', shadow: '#451a03' },
      sunset: { arch: '#78350f', plank: '#92400e', railing: '#991b1b', postCap: '#d97706', shadow: '#311002' },
      night: { arch: '#451a03', plank: '#5b2106', railing: '#6b1212', postCap: '#92400e', shadow: '#1a0801' }
    };

    const archCol = this.interpMoodColor({ day: bridgePalettes.day.arch, sunset: bridgePalettes.sunset.arch, night: bridgePalettes.night.arch });
    const railCol = this.interpMoodColor({ day: bridgePalettes.day.railing, sunset: bridgePalettes.sunset.railing, night: bridgePalettes.night.railing });
    const capCol = this.interpMoodColor({ day: bridgePalettes.day.postCap, sunset: bridgePalettes.sunset.postCap, night: bridgePalettes.night.postCap });
    const shadowCol = this.interpMoodColor({ day: bridgePalettes.day.shadow, sunset: bridgePalettes.sunset.shadow, night: bridgePalettes.night.shadow });

    this.ctx.save();
    this.ctx.translate(bridgeX, bridgeY);
    this.ctx.scale(scale, scale);

    const span = 175;
    const archRise = 32;

    // Bridge Water Reflection
    this.ctx.save();
    this.ctx.globalAlpha = 0.25;
    this.ctx.scale(1, -0.5);
    this.ctx.fillStyle = archCol;
    this.ctx.beginPath();
    this.ctx.moveTo(-span / 2, 0);
    this.ctx.quadraticCurveTo(0, -archRise, span / 2, 0);
    this.ctx.lineTo(span / 2, 8);
    this.ctx.quadraticCurveTo(0, -archRise + 8, -span / 2, 8);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // Main Arched Deck (Taiko-bashi)
    this.ctx.fillStyle = archCol;
    this.ctx.beginPath();
    this.ctx.moveTo(-span / 2, 0);
    this.ctx.quadraticCurveTo(0, -archRise, span / 2, 0);
    this.ctx.lineTo(span / 2, 10);
    this.ctx.quadraticCurveTo(0, -archRise + 10, -span / 2, 10);
    this.ctx.closePath();
    this.ctx.fill();

    // Deck Planking vertical slats
    this.ctx.strokeStyle = shadowCol;
    this.ctx.lineWidth = 1.0;
    const plankCount = 20;
    for (let i = 0; i <= plankCount; i++) {
      const t = i / plankCount;
      const px = -span / 2 + t * span;
      const py = -(1 - Math.pow(2 * t - 1, 2)) * archRise;
      this.ctx.beginPath();
      this.ctx.moveTo(px, py);
      this.ctx.lineTo(px, py + 9);
      this.ctx.stroke();
    }

    // Curved Railings (Handrails)
    this.ctx.strokeStyle = railCol;
    this.ctx.lineWidth = 3.5;
    this.ctx.beginPath();
    this.ctx.moveTo(-span / 2 - 4, -18);
    this.ctx.quadraticCurveTo(0, -archRise - 20, span / 2 + 4, -18);
    this.ctx.stroke();

    // Railing Balusters (Posts) with golden Giboshi decorative caps
    const postCount = 7;
    for (let i = 0; i < postCount; i++) {
      const t = i / (postCount - 1);
      const px = -span / 2 + t * span;
      const pyBase = -(1 - Math.pow(2 * t - 1, 2)) * archRise;
      const pyTop = pyBase - 20;

      this.ctx.strokeStyle = railCol;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(px, pyBase);
      this.ctx.lineTo(px, pyTop);
      this.ctx.stroke();

      this.ctx.fillStyle = capCol;
      this.ctx.beginPath();
      this.ctx.arc(px, pyTop - 2, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  /**
   * 9. Draws Stepping Stone Path (Đường mòn lát đá dẫn sâu vào vườn) & Stone Lanterns
   */
  private drawStonePath(): void {
    const W = this.width;
    const H = this.height;

    const pathPalettes = {
      day: { grass: '#3a6344', stone: '#cbd5e1', stoneEdge: '#64748b', moss: '#4ade80' },
      sunset: { grass: '#42372d', stone: '#d8b4a0', stoneEdge: '#574136', moss: '#ca8a04' },
      night: { grass: '#142018', stone: '#475569', stoneEdge: '#1e293b', moss: '#166534' }
    };

    const grassCol = this.interpMoodColor({ day: pathPalettes.day.grass, sunset: pathPalettes.sunset.grass, night: pathPalettes.night.grass });
    const stoneCol = this.interpMoodColor({ day: pathPalettes.day.stone, sunset: pathPalettes.sunset.stone, night: pathPalettes.night.stone });
    const edgeCol = this.interpMoodColor({ day: pathPalettes.day.stoneEdge, sunset: pathPalettes.sunset.stoneEdge, night: pathPalettes.night.stoneEdge });
    const mossCol = this.interpMoodColor({ day: pathPalettes.day.moss, sunset: pathPalettes.sunset.moss, night: pathPalettes.night.moss });

    this.ctx.save();

    // Lush ground bank leading up from bottom (with margin for parallax safety)
    this.ctx.fillStyle = grassCol;
    this.ctx.beginPath();
    this.ctx.moveTo(-60, H * 0.72);
    this.ctx.quadraticCurveTo(W * 0.4, H * 0.69, W + 60, H * 0.75);
    this.ctx.lineTo(W + 60, H + 60);
    this.ctx.lineTo(-60, H + 60);
    this.ctx.closePath();
    this.ctx.fill();

    // S-curve stepping stones (Tobi-ishi) receding into depth towards the bridge
    const stones = [
      { x: 0.82, y: 0.95, rx: 55, ry: 24, rot: 0.1 },
      { x: 0.72, y: 0.89, rx: 46, ry: 20, rot: -0.15 },
      { x: 0.62, y: 0.84, rx: 38, ry: 17, rot: 0.2 },
      { x: 0.54, y: 0.79, rx: 32, ry: 14, rot: -0.05 },
      { x: 0.47, y: 0.75, rx: 26, ry: 11, rot: 0.12 },
      { x: 0.41, y: 0.72, rx: 20, ry: 9, rot: -0.1 },
      { x: 0.36, y: 0.69, rx: 16, ry: 7, rot: 0.05 }
    ];

    for (const st of stones) {
      const sx = st.x * W;
      const sy = st.y * H;

      // Drop shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      this.ctx.beginPath();
      this.ctx.ellipse(sx + 3, sy + 4, st.rx, st.ry, st.rot, 0, Math.PI * 2);
      this.ctx.fill();

      // Stone body
      this.ctx.fillStyle = stoneCol;
      this.ctx.beginPath();
      this.ctx.ellipse(sx, sy, st.rx, st.ry, st.rot, 0, Math.PI * 2);
      this.ctx.fill();

      // Stone rim highlight
      this.ctx.strokeStyle = edgeCol;
      this.ctx.lineWidth = 1.6;
      this.ctx.stroke();

      // Moss patch
      this.ctx.fillStyle = mossCol;
      this.ctx.beginPath();
      this.ctx.ellipse(sx - st.rx * 0.4, sy + st.ry * 0.2, st.rx * 0.25, st.ry * 0.35, st.rot, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Japanese Stone Lantern (Yukimi-Dōrō / Tōrō) beside the stone path
    this.drawStoneLantern(W * 0.68, H * 0.78);

    this.ctx.restore();
  }

  /**
   * Draws a traditional Japanese Stone Lantern (Tōrō) with glowing fire chamber
   */
  private drawStoneLantern(x: number, y: number): void {
    const isNight = this.targetMood === 'night';
    const isSunset = this.targetMood === 'sunset';
    const targetGlow = isNight ? 1.0 : isSunset ? 0.6 : 0.05;
    const prevGlow = this.prevMood === 'night' ? 1.0 : this.prevMood === 'sunset' ? 0.6 : 0.05;
    const glowIntensity = prevGlow + (targetGlow - prevGlow) * this.moodTransition;

    this.ctx.save();
    this.ctx.translate(x, y);

    const graniteCol = this.interpMoodColor({ day: '#64748b', sunset: '#574136', night: '#334155' });
    const roofCol = this.interpMoodColor({ day: '#475569', sunset: '#382218', night: '#1e293b' });

    this.ctx.fillStyle = graniteCol;

    // Base pedestal
    this.ctx.fillRect(-14, 0, 28, 8);
    // Column (sao)
    this.ctx.fillRect(-6, -26, 12, 26);
    // Platform (chudai)
    this.ctx.fillRect(-16, -32, 32, 6);

    // Light chamber box (Hibukuro)
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(-10, -50, 20, 18);

    // Warm glowing chamber interior
    if (glowIntensity > 0.08) {
      const aura = this.ctx.createRadialGradient(0, -41, 4, 0, -41, 65);
      aura.addColorStop(0, `rgba(251, 191, 36, ${0.85 * glowIntensity})`);
      aura.addColorStop(0.5, `rgba(245, 158, 11, ${0.3 * glowIntensity})`);
      aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(0, -41, 65, 0, Math.PI * 2);
      this.ctx.fill();

      // Window aperture
      this.ctx.fillStyle = `rgba(254, 240, 138, ${glowIntensity})`;
      this.ctx.fillRect(-5, -46, 10, 10);
    }

    // Hexagonal Roof (Kasa)
    this.ctx.fillStyle = roofCol;
    this.ctx.beginPath();
    this.ctx.moveTo(-24, -50);
    this.ctx.lineTo(24, -50);
    this.ctx.lineTo(12, -62);
    this.ctx.lineTo(-12, -62);
    this.ctx.closePath();
    this.ctx.fill();

    // Top Jewel (Hoju finial)
    this.ctx.beginPath();
    this.ctx.arc(0, -66, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * 10. Draws Midground Cherry Blossom Trees with Organic Branch Swaying
   */
  private drawMidgroundTrees(): void {
    const W = this.width;
    const H = this.height;

    // Swaying calculation bending WITH the wind direction
    const gustLean = this.windGust * 16 * this.petalSystem.windDirection;
    const sway = Math.sin(this.branchWiggleTime) * (3.5 + this.windGust * 10) + gustLean;

    const treeConfigs = [
      { baseX: W * 0.18, baseY: H * 0.74, scale: 0.95 },
      { baseX: W * 0.58, baseY: H * 0.72, scale: 0.85 },
      { baseX: W * 0.86, baseY: H * 0.77, scale: 1.05 }
    ];

    for (const tr of treeConfigs) {
      this.drawSingleSakuraTree(tr.baseX, tr.baseY, tr.scale, sway);
    }
  }

  private drawSingleSakuraTree(x: number, y: number, scale: number, sway: number): void {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    const barkCol = this.interpMoodColor({ day: '#382218', sunset: '#271406', night: '#18121f' });

    // 10a. Gnarled Trunk & Branching
    this.ctx.fillStyle = barkCol;
    this.ctx.strokeStyle = barkCol;
    this.ctx.lineCap = 'round';

    // Main Trunk
    this.ctx.beginPath();
    this.ctx.moveTo(-16, 0);
    this.ctx.bezierCurveTo(-12, -45, -22, -85, -8 + sway * 0.3, -135);
    this.ctx.lineTo(12 + sway * 0.3, -135);
    this.ctx.bezierCurveTo(4, -85, 14, -45, 18, 0);
    this.ctx.closePath();
    this.ctx.fill();

    // Left main bough
    this.ctx.lineWidth = 12;
    this.ctx.beginPath();
    this.ctx.moveTo(-4 + sway * 0.3, -115);
    this.ctx.quadraticCurveTo(-65 + sway * 0.6, -155, -95 + sway, -175);
    this.ctx.stroke();

    // Right main bough
    this.ctx.lineWidth = 14;
    this.ctx.beginPath();
    this.ctx.moveTo(6 + sway * 0.3, -125);
    this.ctx.quadraticCurveTo(60 + sway * 0.6, -165, 110 + sway, -185);
    this.ctx.stroke();

    // Center higher bough
    this.ctx.lineWidth = 9;
    this.ctx.beginPath();
    this.ctx.moveTo(0 + sway * 0.3, -135);
    this.ctx.quadraticCurveTo(15 + sway * 0.7, -200, 20 + sway * 1.1, -235);
    this.ctx.stroke();

    // 10b. Billowing Blossom Clusters
    const blossomPalettes = {
      day: { deep: '#ff758f', main: '#ffb3c6', light: '#ffe5ec', white: '#ffffff' },
      sunset: { deep: '#e11d48', main: '#fb7185', light: '#fda4af', white: '#fff1f2' },
      night: { deep: '#831843', main: '#a855f7', light: '#c084fc', white: '#f3e8ff' }
    };

    const deepCol = this.interpMoodColor({ day: blossomPalettes.day.deep, sunset: blossomPalettes.sunset.deep, night: blossomPalettes.night.deep });
    const mainCol = this.interpMoodColor({ day: blossomPalettes.day.main, sunset: blossomPalettes.sunset.main, night: blossomPalettes.night.main });
    const lightCol = this.interpMoodColor({ day: blossomPalettes.day.light, sunset: blossomPalettes.sunset.light, night: blossomPalettes.night.light });
    const whiteCol = this.interpMoodColor({ day: blossomPalettes.day.white, sunset: blossomPalettes.sunset.white, night: blossomPalettes.night.white });

    const clusters = [
      { cx: -105 + sway, cy: -185, r: 52 },
      { cx: -65 + sway * 0.8, cy: -205, r: 62 },
      { cx: 0 + sway * 0.9, cy: -245, r: 68 },
      { cx: 75 + sway * 0.9, cy: -215, r: 64 },
      { cx: 125 + sway * 1.1, cy: -190, r: 56 },
      { cx: 35 + sway * 0.8, cy: -175, r: 54 }
    ];

    for (const cl of clusters) {
      // 1. Deep shadow base
      this.ctx.fillStyle = deepCol;
      this.ctx.beginPath();
      this.ctx.arc(cl.cx, cl.cy + 8, cl.r * 0.9, 0, Math.PI * 2);
      this.ctx.fill();

      // 2. Main sakura pink mass
      this.ctx.fillStyle = mainCol;
      this.ctx.beginPath();
      this.ctx.arc(cl.cx, cl.cy, cl.r, 0, Math.PI * 2);
      this.ctx.arc(cl.cx - cl.r * 0.35, cl.cy - 4, cl.r * 0.65, 0, Math.PI * 2);
      this.ctx.arc(cl.cx + cl.r * 0.35, cl.cy - 6, cl.r * 0.7, 0, Math.PI * 2);
      this.ctx.fill();

      // 3. Highlighted upper puffs
      this.ctx.fillStyle = lightCol;
      this.ctx.beginPath();
      this.ctx.arc(cl.cx, cl.cy - cl.r * 0.25, cl.r * 0.65, 0, Math.PI * 2);
      this.ctx.arc(cl.cx + cl.r * 0.25, cl.cy - cl.r * 0.3, cl.r * 0.5, 0, Math.PI * 2);
      this.ctx.fill();

      // 4. White crests
      this.ctx.fillStyle = whiteCol;
      this.ctx.beginPath();
      this.ctx.arc(cl.cx - cl.r * 0.15, cl.cy - cl.r * 0.45, cl.r * 0.32, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  /**
   * 11. Draws Dramatic Foreground Framing Boughs & Hanging Traditional Paper Lanterns
   */
  private drawForegroundFraming(): void {
    const W = this.width;
    const H = this.height;

    const gustLean = this.windGust * 18 * this.petalSystem.windDirection;
    const sway = Math.sin(this.branchWiggleTime * 0.85) * (5 + this.windGust * 14) + gustLean;
    const bark = this.interpMoodColor({ day: '#271406', sunset: '#1a0d04', night: '#110b14' });

    this.ctx.save();

    // 11a. Top-Right Sweeping Foreground Branch
    this.ctx.strokeStyle = bark;
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 26;

    this.ctx.beginPath();
    this.ctx.moveTo(W + 30, -20);
    this.ctx.bezierCurveTo(
      W * 0.85, H * 0.08,
      W * 0.72 + sway * 0.5, H * 0.12,
      W * 0.58 + sway, H * 0.18
    );
    this.ctx.stroke();

    // Sub-branches
    this.ctx.lineWidth = 14;
    this.ctx.beginPath();
    this.ctx.moveTo(W * 0.76 + sway * 0.4, H * 0.1);
    this.ctx.quadraticCurveTo(W * 0.70 + sway * 0.6, H * 0.22, W * 0.65 + sway * 0.9, H * 0.28);
    this.ctx.stroke();

    // Hanging clusters of foreground blossoms
    const fgPalettes = {
      day: { base: '#f472b6', tip: '#fbcfe8', white: '#ffffff' },
      sunset: { base: '#e11d48', tip: '#fda4af', white: '#fff1f2' },
      night: { base: '#9333ea', tip: '#d8b4fe', white: '#faf5ff' }
    };

    const fgBase = this.interpMoodColor({ day: fgPalettes.day.base, sunset: fgPalettes.sunset.base, night: fgPalettes.night.base });
    const fgTip = this.interpMoodColor({ day: fgPalettes.day.tip, sunset: fgPalettes.sunset.tip, night: fgPalettes.night.tip });
    const fgWhite = this.interpMoodColor({ day: fgPalettes.day.white, sunset: fgPalettes.sunset.white, night: fgPalettes.night.white });

    const fgPuffs = [
      { x: W * 0.58 + sway, y: H * 0.18, r: 65 },
      { x: W * 0.65 + sway * 0.9, y: H * 0.28, r: 55 },
      { x: W * 0.72 + sway * 0.6, y: H * 0.15, r: 75 },
      { x: W * 0.84 + sway * 0.3, y: H * 0.11, r: 80 }
    ];

    for (const puff of fgPuffs) {
      this.ctx.fillStyle = fgBase;
      this.ctx.beginPath();
      this.ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = fgTip;
      this.ctx.beginPath();
      this.ctx.arc(puff.x - 8, puff.y - 8, puff.r * 0.75, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = fgWhite;
      this.ctx.beginPath();
      this.ctx.arc(puff.x - 14, puff.y - 14, puff.r * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 11b. Right Hanging Traditional Paper Lantern (Chōchin)
    const rightLanternX = W * 0.69 + sway * 0.55;
    const rightLanternY = H * 0.12;
    this.drawHangingPaperLantern(rightLanternX, rightLanternY, sway * 0.8);

    // 11c. Top-Left Framing Branch
    this.ctx.lineWidth = 18;
    this.ctx.strokeStyle = bark;
    this.ctx.beginPath();
    this.ctx.moveTo(-30, -20);
    this.ctx.quadraticCurveTo(W * 0.12 - sway * 0.4, H * 0.08, W * 0.24 - sway * 0.7, H * 0.16);
    this.ctx.stroke();

    this.ctx.fillStyle = fgTip;
    this.ctx.beginPath();
    this.ctx.arc(W * 0.24 - sway * 0.7, H * 0.16, 54, 0, Math.PI * 2);
    this.ctx.arc(W * 0.15 - sway * 0.4, H * 0.12, 64, 0, Math.PI * 2);
    this.ctx.fill();

    // 11d. Left Hanging Traditional Paper Lantern (Chōchin)
    const leftLanternX = W * 0.20 - sway * 0.5;
    const leftLanternY = H * 0.14;
    this.drawHangingPaperLantern(leftLanternX, leftLanternY, -sway * 0.7);

    this.ctx.restore();
  }

  /**
   * Draws a traditional swinging Japanese Paper Lantern (Chōchin) with glowing flame aura
   */
  private drawHangingPaperLantern(x: number, y: number, swingAngle: number): void {
    const isNight = this.targetMood === 'night';
    const isSunset = this.targetMood === 'sunset';
    const targetGlow = isNight ? 0.95 : isSunset ? 0.65 : 0.15;
    const prevGlow = this.prevMood === 'night' ? 0.95 : this.prevMood === 'sunset' ? 0.65 : 0.15;
    const glowAlpha = prevGlow + (targetGlow - prevGlow) * this.moodTransition;

    this.ctx.save();
    this.ctx.translate(x, y);

    // Swing angle in radians
    this.ctx.rotate(swingAngle * 0.015);

    // Hanging string / cord
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, 24);
    this.ctx.stroke();

    this.ctx.translate(0, 24);

    // Warm radial fire aura
    if (glowAlpha > 0.18) {
      const aura = this.ctx.createRadialGradient(0, 22, 6, 0, 22, 95);
      aura.addColorStop(0, `rgba(251, 146, 60, ${0.85 * glowAlpha})`);
      aura.addColorStop(0.4, `rgba(239, 68, 68, ${0.35 * glowAlpha})`);
      aura.addColorStop(1, 'rgba(239, 68, 68, 0)');
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(0, 22, 95, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Top & Bottom wooden caps
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(-12, 0, 24, 4);
    this.ctx.fillRect(-12, 40, 24, 4);

    // Paper ribbed lantern body
    const paperGrad = this.ctx.createLinearGradient(-15, 0, 15, 0);
    paperGrad.addColorStop(0, '#dc2626');
    paperGrad.addColorStop(0.5, glowAlpha > 0.4 ? '#fef08a' : '#f87171');
    paperGrad.addColorStop(1, '#dc2626');

    this.ctx.fillStyle = paperGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 22, 16, 20, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Rib lines (bamboo hoops)
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.lineWidth = 1.0;
    for (let r = 8; r <= 36; r += 7) {
      this.ctx.beginPath();
      this.ctx.ellipse(0, r, 15, 4, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Bottom decorative hanging tassel
    this.ctx.strokeStyle = '#dc2626';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 44);
    this.ctx.lineTo(0, 62);
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * 12. Atmospheric Lighting: God Rays (Day/Sunset), Silver Moonbeams (Night) & Bokeh Sparkles
   */
  private drawAtmosphere(timeSec: number): void {
    const W = this.width;
    const H = this.height;

    const nightWeight = this.targetMood === 'night' ? this.moodTransition : (this.prevMood === 'night' ? 1 - this.moodTransition : 0);

    // 12a. Daytime / Sunset God rays
    const daySunsetAlpha = (1 - nightWeight) * (this.targetMood === 'sunset' ? 0.18 : 0.22);
    if (daySunsetAlpha > 0.01) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'screen';

      const originX = W * 0.72;
      const originY = H * 0.24;
      const rays = [
        { angle: 2.3, width: 0.18 },
        { angle: 2.55, width: 0.24 },
        { angle: 2.85, width: 0.15 },
        { angle: 3.1, width: 0.22 }
      ];

      for (const ray of rays) {
        const breath = Math.sin(timeSec * 0.8 + ray.angle * 4) * 0.05 + 0.95;
        const len = H * 1.5;

        const p1x = originX + Math.cos(ray.angle - ray.width * 0.5) * len;
        const p1y = originY + Math.sin(ray.angle - ray.width * 0.5) * len;
        const p2x = originX + Math.cos(ray.angle + ray.width * 0.5) * len;
        const p2y = originY + Math.sin(ray.angle + ray.width * 0.5) * len;

        const rayGrad = this.ctx.createLinearGradient(originX, originY, p1x, p1y);
        const rayTint = this.targetMood === 'sunset' ? '255, 200, 160' : '255, 245, 220';
        rayGrad.addColorStop(0, `rgba(${rayTint}, ${daySunsetAlpha * breath})`);
        rayGrad.addColorStop(1, `rgba(${rayTint}, 0)`);

        this.ctx.fillStyle = rayGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(originX, originY);
        this.ctx.lineTo(p1x, p1y);
        this.ctx.lineTo(p2x, p2y);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 12b. Night Silver Moonbeams
    if (nightWeight > 0.05) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'screen';

      const moonOriginX = W * 0.28;
      const moonOriginY = H * 0.22;
      const moonRays = [
        { angle: 0.85, width: 0.2 },
        { angle: 1.15, width: 0.26 },
        { angle: 1.45, width: 0.18 }
      ];

      for (const ray of moonRays) {
        const breath = Math.sin(timeSec * 0.7 + ray.angle * 3) * 0.06 + 0.94;
        const len = H * 1.4;

        const p1x = moonOriginX + Math.cos(ray.angle - ray.width * 0.5) * len;
        const p1y = moonOriginY + Math.sin(ray.angle - ray.width * 0.5) * len;
        const p2x = moonOriginX + Math.cos(ray.angle + ray.width * 0.5) * len;
        const p2y = moonOriginY + Math.sin(ray.angle + ray.width * 0.5) * len;

        const moonGrad = this.ctx.createLinearGradient(moonOriginX, moonOriginY, p1x, p1y);
        moonGrad.addColorStop(0, `rgba(200, 220, 255, ${0.14 * nightWeight * breath})`);
        moonGrad.addColorStop(1, 'rgba(200, 220, 255, 0)');

        this.ctx.fillStyle = moonGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(moonOriginX, moonOriginY);
        this.ctx.lineTo(p1x, p1y);
        this.ctx.lineTo(p2x, p2y);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 12c. Floating Bokeh Sparkles (Lấp lánh)
    this.ctx.save();
    for (const b of this.bokehParticles) {
      b.y -= b.vy;
      if (b.y < -20) {
        b.y = H + 20;
        b.x = Math.random() * W;
      }

      const pulse = Math.sin(timeSec * 2.0 + b.phase) * 0.35 + 0.65;
      const alpha = b.alpha * pulse;

      const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size);
      grad.addColorStop(0, `rgba(255, 240, 245, ${alpha})`);
      grad.addColorStop(0.6, `rgba(255, 210, 230, ${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(255, 210, 230, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  /**
   * 13. Draws Bioluminescent Fireflies at Night (Đom đóm bay chập chờn)
   */
  private drawFireflies(delta: number): void {
    const nightWeight = this.targetMood === 'night' ? this.moodTransition : (this.prevMood === 'night' ? 1 - this.moodTransition : 0);
    if (nightWeight <= 0.02) return;

    const W = this.width;
    const H = this.height;

    this.ctx.save();
    for (const f of this.fireflies) {
      // Random wandering flight
      f.vx += (Math.random() - 0.5) * 0.4;
      f.vy += (Math.random() - 0.5) * 0.3;
      f.vx = Math.max(-1.5, Math.min(1.5, f.vx));
      f.vy = Math.max(-1.0, Math.min(1.0, f.vy));

      f.x += f.vx;
      f.y += f.vy;

      // Wrap around bounds
      if (f.x < -30) f.x = W + 30;
      if (f.x > W + 30) f.x = -30;
      if (f.y < H * 0.35) f.vy += 0.2;
      if (f.y > H * 0.95) f.vy -= 0.2;

      // Organic rhythmic pulsing
      f.pulsePhase += f.pulseSpeed * delta;
      const glow = Math.pow(Math.max(0, Math.sin(f.pulsePhase)), 2.5) * nightWeight;

      if (glow > 0.05) {
        // Outer soft chartreuse aura
        const aura = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 18);
        aura.addColorStop(0, `rgba(217, 249, 157, ${0.85 * glow})`);
        aura.addColorStop(0.4, `rgba(163, 230, 53, ${0.45 * glow})`);
        aura.addColorStop(1, 'rgba(163, 230, 53, 0)');

        this.ctx.fillStyle = aura;
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, 18, 0, Math.PI * 2);
        this.ctx.fill();

        // Core bright ember
        this.ctx.fillStyle = `rgba(255, 255, 255, ${glow})`;
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, f.size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }
}
