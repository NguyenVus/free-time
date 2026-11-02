/**
 * PetalSystem.ts
 * High-performance 60FPS multi-layered Sakura Petal simulation.
 * Includes 3D tumbling projection, wind gusts, mouse wind wake,
 * click blossom burst, and water ripple generation.
 */

export interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export interface Petal {
  x: number;
  y: number;
  z: number; // 0.2 (distant) to 1.6 (close foreground)
  size: number;
  vx: number;
  vy: number;
  extraVx: number;
  extraVy: number;
  angleZ: number;
  angleX: number;
  angleY: number;
  rotSpeedZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  oscPhase: number;
  oscSpeed: number;
  colorIndex: number;
  isBurst: boolean;
  opacity: number;
  floatingOnWater?: boolean;
  baseWaterY?: number;
  waterFloatTimer?: number;
}

export class PetalSystem {
  private petals: Petal[] = [];
  public ripples: WaterRipple[] = [];
  private maxPetals: number = 140;
  private width: number = 0;
  private height: number = 0;

  // Lake bounds for water collision
  private lakeTopRatio: number = 0.54;
  private lakeBottomRatio: number = 0.74;

  // Wind states
  public baseWind: number = 1.2;
  public gustMultiplier: number = 0.0;
  public windDirection: number = 1.0; // 1 = to the right

  // Mouse interaction
  private mouseX: number = -1000;
  private mouseY: number = -1000;
  private mouseVx: number = 0;
  private mouseVy: number = 0;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private lastMouseTime: number = 0;

  // Color palettes (Soft cherry pinks, blush, and white)
  private readonly petalColors: { base: string; tip: string; highlight: string }[] = [
    { base: '#ff85a1', tip: '#ffccd5', highlight: '#ffffff' }, // Classic Sakura Rose
    { base: '#f472b6', tip: '#fbcfe8', highlight: '#fff1f2' }, // Pink Blush
    { base: '#fb7185', tip: '#fecdd3', highlight: '#ffffff' }, // Coral Blossom
    { base: '#fda4af', tip: '#ffe4e6', highlight: '#ffffff' }, // Tender White-Pink
    { base: '#e879f9', tip: '#f5d0fe', highlight: '#faf5ff' }  // Wisteria-tinted Pink
  ];

  // Callback when ripple created
  public onWaterRipple?: (x: number, y: number) => void;

  constructor() {}

  public resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.rebalancePetals();
  }

  public setPetalDensity(count: number): void {
    this.maxPetals = Math.max(20, Math.min(450, count));
    this.rebalancePetals();
  }

  public getPetalDensity(): number {
    return this.maxPetals;
  }

  private rebalancePetals(): void {
    if (this.width === 0 || this.height === 0) return;

    while (this.petals.length < this.maxPetals) {
      this.petals.push(this.createRandomPetal(true));
    }
    if (this.petals.length > this.maxPetals) {
      this.petals.length = this.maxPetals;
    }
  }

  private createRandomPetal(scatterAnywhere: boolean = false): Petal {
    // Depth z: 0.2 (distant tiny) to 1.5 (foreground large)
    // Distributed with cubic bias so there are more mid & background petals
    const zRandom = Math.random();
    const z = 0.25 + Math.pow(zRandom, 1.8) * 1.3;

    const baseSize = 9 + Math.random() * 8; // 9 to 17px
    const size = baseSize * z;

    return {
      x: scatterAnywhere ? Math.random() * (this.width + 400) - 200 : -50 + Math.random() * (this.width + 100),
      y: scatterAnywhere ? Math.random() * (this.height + 200) - 100 : -60 - Math.random() * 100,
      z,
      size,
      vx: (0.4 + Math.random() * 0.8) * z,
      vy: (0.8 + Math.random() * 1.2) * z,
      extraVx: 0,
      extraVy: 0,
      angleZ: Math.random() * Math.PI * 2,
      angleX: Math.random() * Math.PI * 2,
      angleY: Math.random() * Math.PI * 2,
      rotSpeedZ: (Math.random() - 0.5) * 0.04,
      rotSpeedX: 0.02 + Math.random() * 0.05,
      rotSpeedY: 0.015 + Math.random() * 0.04,
      oscPhase: Math.random() * Math.PI * 2,
      oscSpeed: 1.5 + Math.random() * 2.0,
      colorIndex: Math.floor(Math.random() * this.petalColors.length),
      isBurst: false,
      opacity: 0.85 + Math.random() * 0.15,
      floatingOnWater: false,
      waterFloatTimer: 0,
      baseWaterY: 0
    };
  }

  /**
   * Tracks mouse movement for interactive wind wake
   */
  public handleMouseMove(x: number, y: number): void {
    const now = performance.now();
    const dt = Math.max(0.001, (now - this.lastMouseTime) / 1000);

    this.mouseX = x;
    this.mouseY = y;
    this.mouseVx = (x - this.lastMouseX) / dt * 0.02;
    this.mouseVy = (y - this.lastMouseY) / dt * 0.02;

    // Clamp mouse velocity
    const speed = Math.hypot(this.mouseVx, this.mouseVy);
    if (speed > 25) {
      const factor = 25 / speed;
      this.mouseVx *= factor;
      this.mouseVy *= factor;
    }

    this.lastMouseX = x;
    this.lastMouseY = y;
    this.lastMouseTime = now;
  }

  /**
   * Spawns an explosion of petals radiating from clicked coordinates
   */
  public spawnBlossomBurst(clickX: number, clickY: number, count: number = 32): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2.5 + Math.random() * 6.5;
      const z = 0.5 + Math.random() * 1.0;
      const baseSize = 10 + Math.random() * 8;

      const burstPetal: Petal = {
        x: clickX + (Math.random() - 0.5) * 16,
        y: clickY + (Math.random() - 0.5) * 16,
        z,
        size: baseSize * z,
        vx: (0.3 + Math.random() * 0.5) * z,
        vy: (0.7 + Math.random() * 0.6) * z,
        extraVx: Math.cos(angle) * speed + this.mouseVx * 0.15,
        extraVy: Math.sin(angle) * speed - 1.5 + (Math.random() - 0.5) * 0.5,
        angleZ: Math.random() * Math.PI * 2,
        angleX: Math.random() * Math.PI * 2,
        angleY: Math.random() * Math.PI * 2,
        rotSpeedZ: (Math.random() - 0.5) * 0.15,
        rotSpeedX: 0.08 + Math.random() * 0.1,
        rotSpeedY: 0.08 + Math.random() * 0.1,
        oscPhase: Math.random() * Math.PI * 2,
        oscSpeed: 3.0 + Math.random() * 2.0,
        colorIndex: Math.floor(Math.random() * this.petalColors.length),
        isBurst: true,
        opacity: 1.0,
        floatingOnWater: false,
        waterFloatTimer: 0,
        baseWaterY: 0
      };

      this.petals.push(burstPetal);
    }

    // Trigger ripple if click was in lake area
    const lakeTop = this.height * this.lakeTopRatio;
    const lakeBottom = this.height * this.lakeBottomRatio;
    if (clickY >= lakeTop && clickY <= lakeBottom) {
      this.addWaterRipple(clickX, clickY);
    }
  }

  /**
   * Adds an expanding concentric water ripple
   */
  public addWaterRipple(x: number, y: number, maxRadius: number = 36): void {
    this.ripples.push({
      x,
      y,
      radius: 2,
      maxRadius,
      alpha: 0.75,
      color: 'rgba(255, 230, 240, '
    });

    if (this.onWaterRipple) {
      this.onWaterRipple(x, y);
    }
  }

  /**
   * Updates physics for all petals and ripples
   */
  public update(delta: number, elapsedTime: number): void {
    const dt = Math.min(delta, 0.1); // clamp delta
    const lakeTop = this.height * this.lakeTopRatio;
    const lakeBottom = this.height * this.lakeBottomRatio;

    // Decay mouse velocities
    this.mouseVx *= Math.exp(-dt * 4.0);
    this.mouseVy *= Math.exp(-dt * 4.0);

    // Calculate current effective wind
    const effectiveWind = (this.baseWind + this.gustMultiplier * 3.5) * this.windDirection;

    // 1. Update Petals
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];

      // Handle floating on water
      if (p.floatingOnWater) {
        p.waterFloatTimer = (p.waterFloatTimer || 0) + dt;
        p.x += (effectiveWind * 0.35 + 0.3) * dt * 45;
        p.y = (p.baseWaterY || p.y) + Math.sin(elapsedTime * 2.5 + p.x * 0.03) * 1.5;
        p.opacity -= dt * 0.22;

        if (p.opacity <= 0.05 || (p.waterFloatTimer || 0) > 4.2) {
          if (this.petals.length > this.maxPetals) {
            this.petals.splice(i, 1);
          } else {
            this.petals[i] = this.createRandomPetal(false);
          }
        }
        continue;
      }

      // Air flutter oscillation
      p.oscPhase += p.oscSpeed * dt;
      const flutterX = Math.sin(p.oscPhase) * (1.2 * p.z);
      const flutterY = Math.cos(p.oscPhase * 0.8) * (0.6 * p.z);

      // Mouse wake interaction
      const dx = p.x - this.mouseX;
      const dy = p.y - this.mouseY;
      const dist = Math.hypot(dx, dy);
      const interactRadius = 140;

      if (dist < interactRadius && dist > 1) {
        const force = (1.0 - dist / interactRadius) * (p.z * 1.5);
        p.extraVx += (dx / dist) * force * 1.8 + this.mouseVx * force * 0.4;
        p.extraVy += (dy / dist) * force * 1.2 + this.mouseVy * force * 0.4;
      }

      // Aerodynamic drag decay on extra impulses (decay towards natural fall)
      p.extraVx *= Math.exp(-dt * 3.2);
      p.extraVy *= Math.exp(-dt * 3.0);

      if (p.isBurst && Math.hypot(p.extraVx, p.extraVy) < 0.6) {
        p.isBurst = false;
      }

      // Apply motion
      const currentVx = p.vx + effectiveWind * (1.2 * p.z) + flutterX + p.extraVx;
      const currentVy = p.vy + flutterY + p.extraVy;

      p.x += currentVx * dt * 60;
      p.y += currentVy * dt * 60;

      // Framerate-independent 3D rotation update
      p.angleZ += p.rotSpeedZ * (1.0 + this.gustMultiplier * 1.5) * (dt * 60);
      p.angleX += p.rotSpeedX * (dt * 60);
      p.angleY += p.rotSpeedY * (dt * 60);

      // Check lake collision
      if (
        !p.isBurst &&
        !p.floatingOnWater &&
        p.y >= lakeTop &&
        p.y <= lakeBottom &&
        p.z < 1.0 && // Mid/far petals land on lake
        Math.random() < 0.025
      ) {
        p.floatingOnWater = true;
        p.baseWaterY = p.y;
        p.waterFloatTimer = 0;
        this.addWaterRipple(p.x, p.y, 22 * p.z);
        continue;
      }

      // Reset off-screen petals
      if (p.y > this.height + 80 || p.x > this.width + 120 || p.x < -120) {
        if (p.isBurst && this.petals.length > this.maxPetals) {
          this.petals.splice(i, 1);
        } else {
          this.petals[i] = this.createRandomPetal(false);
        }
      }
    }

    // 2. Update Water Ripples
    for (let r = this.ripples.length - 1; r >= 0; r--) {
      const rip = this.ripples[r];
      rip.radius += (rip.maxRadius - rip.radius) * (dt * 3.2) + 0.35;
      rip.alpha -= dt * 0.42;

      if (rip.alpha <= 0.02 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(r, 1);
      }
    }
  }

  /**
   * Draws ripples on the lake surface
   */
  public drawRipples(ctx: CanvasRenderingContext2D, parallaxOffsetX: number = 0): void {
    ctx.save();
    for (const rip of this.ripples) {
      ctx.beginPath();
      ctx.ellipse(
        rip.x + parallaxOffsetX * 0.25,
        rip.y,
        rip.radius,
        rip.radius * 0.32, // Flattened perspective for lake surface
        0,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = `${rip.color}${Math.max(0, rip.alpha)})`;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Outer secondary faint ring
      if (rip.radius > 6) {
        ctx.beginPath();
        ctx.ellipse(
          rip.x + parallaxOffsetX * 0.25,
          rip.y,
          rip.radius * 0.6,
          rip.radius * 0.6 * 0.32,
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `${rip.color}${Math.max(0, rip.alpha * 0.5)})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /**
   * Draws all petals with realistic sakura geometry and 3D tumble projection
   */
  public drawPetals(
    ctx: CanvasRenderingContext2D,
    layerFilter: 'background' | 'midground' | 'foreground' | 'all',
    parallaxOffsetX: number = 0
  ): void {
    ctx.save();

    for (const p of this.petals) {
      // Depth plane filtering
      if (layerFilter === 'background' && p.z >= 0.6) continue;
      if (layerFilter === 'midground' && (p.z < 0.6 || p.z >= 1.15)) continue;
      if (layerFilter === 'foreground' && p.z < 1.15) continue;

      const pal = this.petalColors[p.colorIndex];
      const cosX = Math.cos(p.angleX);
      const cosY = Math.cos(p.angleY);
      let scaleX = Math.abs(cosX) < 0.08 ? (cosX < 0 ? -0.08 : 0.08) : cosX;
      let scaleY = Math.abs(cosY) < 0.08 ? (cosY < 0 ? -0.08 : 0.08) : cosY;

      // Petals floating on water appear foreshortened
      if (p.floatingOnWater) {
        scaleX = Math.max(0.4, Math.abs(scaleX));
        scaleY = 0.30;
      }

      const renderX = p.x + parallaxOffsetX * (p.z * 0.5);
      const renderY = p.y;

      // Skip off-screen rendering
      if (renderX < -50 || renderX > this.width + 50 || renderY < -50 || renderY > this.height + 50) {
        continue;
      }

      ctx.save();
      ctx.translate(renderX, renderY);
      ctx.rotate(p.angleZ);
      ctx.scale(scaleX, scaleY);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));

      // Draw authentic 5-lobe notched sakura petal
      const len = p.size;
      const wid = p.size * 0.62;

      // Soft linear shading from petal base to tips
      const grad = ctx.createLinearGradient(0, len * 0.5, 0, -len * 0.5);
      grad.addColorStop(0, pal.base);
      grad.addColorStop(0.55, pal.tip);
      grad.addColorStop(1, pal.highlight);

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Base attachment point
      ctx.moveTo(0, len * 0.45);
      // Left curved edge
      ctx.bezierCurveTo(-wid * 0.85, len * 0.2, -wid * 0.95, -len * 0.35, -wid * 0.25, -len * 0.5);
      // Center notched cleft
      ctx.lineTo(0, -len * 0.38);
      // Right curved edge
      ctx.bezierCurveTo(wid * 0.25, -len * 0.5, wid * 0.95, -len * 0.35, wid * 0.85, len * 0.2);
      ctx.closePath();
      ctx.fill();

      // Subtle translucent central spine highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, len * 0.35);
      ctx.lineTo(0, -len * 0.2);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }
}
