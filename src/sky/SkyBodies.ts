import { QUALITY } from '../config';

export const SKY_BODY_DISTANCE = 320; // inside the camera's far plane, beyond all loaded terrain
export const SKY_BODY_MODES = {
  day: { sun: 1, moon: 0, stars: 0, sunColor: 0xfffbea, sunSize: 170 },
  sunset: { sun: 1, moon: 0, stars: 0.12, sunColor: 0xffd27a, sunSize: 230 },
  night: { sun: 0, moon: 1, stars: 1, sunColor: 0xffd27a, sunSize: 170 }
};
export const SKY_DOME_RADIUS = 360;
export const STAR_DISTANCE = 340;
export const STAR_DRIFT_SPEED = 0.004; // radians per second, the slow turning of the night sky

// The visible sun and moon. Both sit in the direction of the scene's main light, so what you
// see in the sky matches how the world is lit. They follow the camera to stay infinitely far
// away, and depth testing lets trees and hills pass in front of them.
export class SkyBodies {
  declare direction: any;
  declare dome: any;
  declare moon: any;
  declare moonGlow: any;
  declare scene: any;
  declare starMaterials: any;
  declare stars: any;
  declare sun: any;
  declare targetMoon: any;
  declare targetStars: any;
  declare targetSun: any;
  declare targetSunColor: any;
  declare targetSunSize: any;

  constructor(scene) {
    const glowTexture = new THREE.CanvasTexture(this.drawGlow());

    // Normal blending keeps the sunset sun orange; adding it to a pink sky would clip to white
    this.sun = this.createSprite(glowTexture, THREE.NormalBlending, -3);
    this.moonGlow = this.createSprite(glowTexture, THREE.AdditiveBlending, -2);
    this.moonGlow.material.color.setHex(0x9fb2ea);
    this.moonGlow.scale.setScalar(150);
    this.moon = this.createSprite(new THREE.CanvasTexture(this.drawMoon()), THREE.NormalBlending, -1);
    this.moon.scale.setScalar(44);
    scene.add(this.sun, this.moonGlow, this.moon);

    this.scene = scene;
    this.dome = this.createDome();
    scene.add(this.dome);

    this.stars = new THREE.Group();
    this.starMaterials = [
      this.createStarLayer(QUALITY.stars, 1.5, 0.35, 0.8),
      this.createStarLayer(Math.floor(QUALITY.stars / 10), 2.6, 0.8, 1.0)
    ];
    scene.add(this.stars);

    this.direction = new THREE.Vector3();
    this.targetSunColor = new THREE.Color();
    this.targetSun = 1;
    this.targetMoon = 0;
    this.targetStars = 0;
    this.targetSunSize = 170;
  }

  // Gradient sky: the scene's fog colour at the horizon, so distant terrain melts into it,
  // and the scene's sky colour overhead.
  createDome() {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(SKY_DOME_RADIUS, 24, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() }
        },
        vertexShader: `
          varying float vHeight;
          void main() {
            vHeight = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          varying float vHeight;
          void main() {
            float t = pow(clamp(vHeight, 0.0, 1.0), 0.7);
            gl_FragColor = vec4(mix(uHorizon, uTop, t), 1.0);
          }
        `
      })
    );
    dome.renderOrder = -10; // drawn first, so everything else covers it
    dome.frustumCulled = false;
    return dome;
  }

  createStarLayer(count, size, minBrightness, maxBrightness) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const point = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      // Uniform over the sphere, skipping the part hidden below the horizon
      point.set(Math.random() - 0.5, Math.random() * 0.55 - 0.03, Math.random() - 0.5)
        .normalize().multiplyScalar(STAR_DISTANCE);
      point.toArray(positions, i * 3);
      const brightness = minBrightness + Math.random() * (maxBrightness - minBrightness);
      const warmth = Math.random() * 0.12; // some stars are slightly warm, some slightly blue
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * (1 - warmth * 0.4);
      colors[i * 3 + 2] = brightness * (1 - warmth);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      opacity: 0
    });
    const layer = new THREE.Points(geometry, material);
    layer.renderOrder = -4;
    layer.frustumCulled = false;
    this.stars.add(layer);
    return material;
  }

  createSprite(texture, blending, renderOrder) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      blending,
      transparent: true,
      depthWrite: false,
      fog: false,
      opacity: 0
    }));
    sprite.renderOrder = renderOrder; // falling petals draw in front
    return sprite;
  }

  drawGlow() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const glow = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.11, 'rgba(255, 255, 255, 1)');
    glow.addColorStop(0.15, 'rgba(255, 255, 255, 0.55)');
    glow.addColorStop(0.3, 'rgba(255, 255, 255, 0.18)');
    glow.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 256, 256);
    return c;
  }

  drawMoon() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const disc = (x, y, r) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.clip();

    const face = ctx.createRadialGradient(110, 105, 20, 128, 128, 120);
    face.addColorStop(0, '#fbf9ef');
    face.addColorStop(0.75, '#e9e6d8');
    face.addColorStop(1, '#bdbbb0');
    ctx.fillStyle = face;
    ctx.fillRect(0, 0, 256, 256);

    // Maria: the large dark plains, with soft edges that blend where they overlap
    [[86, 84, 46], [132, 66, 34], [158, 104, 42], [78, 146, 38], [122, 128, 32], [176, 156, 26], [108, 176, 22]]
      .forEach(([x, y, r]) => {
        const mare = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
        mare.addColorStop(0, 'rgba(118, 120, 130, 0.42)');
        mare.addColorStop(0.65, 'rgba(118, 120, 130, 0.3)');
        mare.addColorStop(1, 'rgba(118, 120, 130, 0)');
        ctx.fillStyle = mare;
        disc(x, y, r);
      });

    // Craters: a shallow bowl with a pale rim offset toward the light
    [[176, 74, 5], [64, 188, 6], [138, 204, 9], [192, 186, 4], [40, 112, 4], [104, 224, 3], [150, 36, 3]]
      .forEach(([x, y, r]) => {
        ctx.fillStyle = 'rgba(255, 255, 250, 0.5)';
        disc(x + 1.5, y + 1.5, r);
        ctx.fillStyle = 'rgba(120, 120, 126, 0.32)';
        disc(x, y, r);
      });
    return c;
  }

  setMode(mode, smooth) {
    const settings = SKY_BODY_MODES[mode];
    this.targetSun = settings.sun;
    this.targetMoon = settings.moon;
    this.targetStars = settings.stars;
    this.targetSunSize = settings.sunSize;
    this.targetSunColor.setHex(settings.sunColor);
    if (!smooth) {
      this.starMaterials.forEach(m => { m.opacity = settings.stars; });
      this.sun.material.opacity = settings.sun;
      this.moon.material.opacity = settings.moon;
      this.moonGlow.material.opacity = settings.moon * 0.4;
      this.sun.material.color.setHex(settings.sunColor);
      this.sun.scale.setScalar(settings.sunSize);
    }
  }

  update(camera, lightPosition, dt) {
    const rate = 1.0 - Math.exp(-2.2 * dt);

    this.dome.position.copy(camera.position);
    this.dome.material.uniforms.uTop.value.copy(this.scene.background);
    this.dome.material.uniforms.uHorizon.value.copy(this.scene.fog.color);

    this.starMaterials.forEach(m => {
      m.opacity = THREE.MathUtils.lerp(m.opacity, this.targetStars, rate);
    });
    this.stars.visible = this.starMaterials[0].opacity > 0.005;
    this.stars.position.copy(camera.position);
    this.stars.rotation.y += STAR_DRIFT_SPEED * dt;

    const sunMaterial = this.sun.material;
    sunMaterial.opacity = THREE.MathUtils.lerp(sunMaterial.opacity, this.targetSun, rate);
    sunMaterial.color.lerp(this.targetSunColor, rate);
    this.sun.scale.setScalar(THREE.MathUtils.lerp(this.sun.scale.x, this.targetSunSize, rate));
    this.moon.material.opacity = THREE.MathUtils.lerp(this.moon.material.opacity, this.targetMoon, rate);
    this.moonGlow.material.opacity = this.moon.material.opacity * 0.4;

    this.direction.copy(lightPosition).normalize().multiplyScalar(SKY_BODY_DISTANCE);
    for (const body of [this.sun, this.moonGlow, this.moon]) {
      body.position.copy(camera.position).add(this.direction);
      body.visible = body.material.opacity > 0.005;
    }
  }
}
