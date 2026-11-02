// =========================================================================
// 3. UNIFIED PROCEDURAL WIND SYSTEM (Smooth Gusts & Synced Reaction)
// =========================================================================
export class WindSystem {
  declare angle: any;
  declare baseStrength: any;
  declare gustDuration: any;
  declare gustPeak: any;
  declare gustProgress: any;
  declare gustTimer: any;
  declare isGusting: any;
  declare strength: any;
  declare targetAngle: any;
  declare targetStrength: any;
  declare time: any;

  constructor() {
    this.time = 0;
    this.baseStrength = 0.35;
    this.strength = 0.35;
    this.targetStrength = 0.35;
    this.angle = 0.55;
    this.targetAngle = 0.55;

    this.gustTimer = 6.0;
    this.gustDuration = 5.0;
    this.gustProgress = 0.0;
    this.isGusting = false;
    this.gustPeak = 1.6;
  }

  update(dt) {
    this.time += dt;

    if (!this.isGusting) {
      this.gustTimer -= dt;
      if (this.gustTimer <= 0) {
        // Trigger a smooth natural gust
        this.isGusting = true;
        this.gustProgress = 0.0;
        this.gustDuration = 4.5 + Math.random() * 3.0;
        this.gustPeak = 1.4 + Math.random() * 0.7;
        this.targetAngle = this.angle + (Math.random() - 0.5) * 0.6;
      }
    }

    if (this.isGusting) {
      this.gustProgress += dt / this.gustDuration;
      if (this.gustProgress >= 1.0) {
        this.isGusting = false;
        this.gustTimer = 10.0 + Math.random() * 12.0;
        this.targetStrength = this.baseStrength;
      } else {
        // Smooth sine bell curve for gust ramp-up and fade-out
        const envelope = Math.sin(this.gustProgress * Math.PI);
        this.targetStrength = this.baseStrength + (this.gustPeak - this.baseStrength) * envelope;
      }
    }

    // Smooth angle and strength easing
    this.angle = THREE.MathUtils.lerp(this.angle, this.targetAngle, dt * 0.6);
    this.strength = THREE.MathUtils.lerp(this.strength, this.targetStrength, dt * 2.0);
  }
}
