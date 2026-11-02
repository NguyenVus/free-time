import { FUJI, fujiHazeForDistance } from '../config';

const BACKDROP_DISTANCE = 340; // inside the camera's far plane
const HIDE_WITHIN = 70; // this close, the real mountain has loaded all the way to the summit

// A simple cone drawn behind everything. The world only loads about 80 blocks around the player, so
// without this the mountain could not be seen from the village. It is placed at a fixed distance and
// scaled by how far away the real mountain is, so it grows and shifts exactly as the real one would.
export class FujiBackdrop {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;

  constructor(scene: THREE.Scene) {
    const radius = FUJI.radius;
    const height = FUJI.peakY - FUJI.baseY;
    const profile: THREE.Vector2[] = [];
    for (let i = 0; i <= 14; i++) {
      const along = i / 14;
      profile.push(new THREE.Vector2(FUJI.rimRadius + (radius - FUJI.rimRadius) * (1 - along), height * Math.pow(along, FUJI.profilePower)));
    }
    profile.push(new THREE.Vector2(0, height - FUJI.craterDepth));

    const geometry = new THREE.LatheGeometry(profile, 40);
    const positions = geometry.getAttribute('position');
    const snowLine = FUJI.snowY - FUJI.baseY;
    const snow = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
      // A jagged snow line, as on the real mountain, instead of a straight ring
      const angle = Math.atan2(positions.getZ(i), positions.getX(i));
      snow[i] = positions.getY(i) > snowLine + Math.sin(angle * 7) * 2.5 + Math.sin(angle * 17) * 1.2 ? 1 : 0;
    }
    geometry.setAttribute('aSnow', new THREE.BufferAttribute(snow, 1));

    this.material = new THREE.ShaderMaterial({
      depthTest: false, // drawn first, so hills and trees simply cover it
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uHorizon: { value: new THREE.Color() },
        uHaze: { value: 0.5 },
        uLight: { value: 1 }
      },
      vertexShader: `
        attribute float aSnow;
        varying float vSnow;
        varying float vHeight;
        void main() {
          vSnow = aSnow;
          vHeight = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position.z = gl_Position.w * 0.999; // never clipped by the far plane when scaled up
        }
      `,
      fragmentShader: `
        uniform vec3 uHorizon;
        uniform float uHaze;
        uniform float uLight;
        varying float vSnow;
        varying float vHeight;
        void main() {
          vec3 rock = mix(vec3(0.25, 0.27, 0.36), vec3(0.33, 0.34, 0.45), clamp(vHeight / 40.0, 0.0, 1.0));
          vec3 ground = mix(rock, vec3(0.97, 0.98, 1.0), smoothstep(0.35, 0.65, vSnow));
          gl_FragColor = vec4(mix(ground * uLight, uHorizon, uHaze), 1.0);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = -9; // just after the sky dome
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update(camera: THREE.Camera, horizon: THREE.Color, sunIntensity: number) {
    const dx = FUJI.x - camera.position.x;
    const dz = FUJI.z - camera.position.z;
    const distance = Math.hypot(dx, dz);
    this.mesh.visible = distance > HIDE_WITHIN;
    if (!this.mesh.visible) return;

    const scale = BACKDROP_DISTANCE / distance;
    this.mesh.position.set(
      camera.position.x + dx * scale,
      camera.position.y + (FUJI.baseY - camera.position.y) * scale,
      camera.position.z + dz * scale
    );
    this.mesh.scale.setScalar(scale);
    this.material.uniforms.uHorizon.value.copy(horizon);
    this.material.uniforms.uHaze.value = fujiHazeForDistance(distance);
    this.material.uniforms.uLight.value = Math.min(1, 0.25 + sunIntensity * 0.55);
  }
}
