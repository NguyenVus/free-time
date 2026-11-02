// =========================================================================
// 2. PROCEDURAL 2D PERLIN NOISE GENERATOR
// =========================================================================
export class SimpleNoise {
  declare p: any;

  constructor(seed = 42817) {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      const t = perm[i];
      perm[i] = perm[j];
      perm[j] = t;
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = perm[i & 255];
    }
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const u = fade(xf);
    const v = fade(yf);

    const p = this.p;
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];

    const grad = (hash, gx, gy) => {
      const h = hash & 7;
      const u1 = h < 4 ? gx : gy;
      const v1 = h < 4 ? gy : gx;
      return ((h & 1) ? -u1 : u1) + ((h & 2) ? -2.0 * v1 : 2.0 * v1);
    };

    const x1 = THREE.MathUtils.lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = THREE.MathUtils.lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return THREE.MathUtils.lerp(x1, x2, v) * 0.5 + 0.5;
  }
}
