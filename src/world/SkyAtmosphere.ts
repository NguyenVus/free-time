import * as THREE from 'three';
import { VoxelTextureGenerator } from '../utils/VoxelTextureGenerator.ts';

export interface AtmosphereState {
  timeOfDay: number;
  sunDirection: THREE.Vector3;
  sunColor: THREE.Color;
  ambientColor: THREE.Color;
  skyHorizonColor: THREE.Color;
  fogColor: THREE.Color;
}

export class SkyAtmosphere {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;

  // Minecraft Square Celestial Bodies
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;

  // Minecraft 3D Volumetric Box Clouds
  private cloudsGroup: THREE.Group;
  private cloudMaterial: THREE.MeshStandardMaterial;

  // Voxel Aurora Borealis
  public auroraMesh: THREE.Mesh;
  public auroraMaterial: THREE.ShaderMaterial;

  public state: AtmosphereState;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.scene.background = new THREE.Color(0x78a7ff); // Crisp vibrant Minecraft sky blue

    this.state = {
      timeOfDay: 12.0,
      sunDirection: new THREE.Vector3(0.5, 0.8, 0.3).normalize(),
      sunColor: new THREE.Color(1, 0.96, 0.88),
      ambientColor: new THREE.Color(0.48, 0.54, 0.62),
      skyHorizonColor: new THREE.Color(0.72, 0.86, 0.98),
      fogColor: new THREE.Color(0.72, 0.86, 0.98)
    };

    // Sun Directional Light with Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 700;
    const d = 220;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0x7b93b8, 0.75);
    scene.add(this.ambientLight);

    // 1. Minecraft Square Sun
    const sunTex = VoxelTextureGenerator.getSunTexture();
    const sunGeo = new THREE.PlaneGeometry(75, 75);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(this.sunMesh);

    // 2. Minecraft Square Moon
    const moonTex = VoxelTextureGenerator.getMoonTexture();
    const moonGeo = new THREE.PlaneGeometry(65, 65);
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(this.moonMesh);

    // 3. Minecraft 3D Volumetric Box Clouds
    this.cloudsGroup = new THREE.Group();
    this.cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88
    });
    this.buildMinecraftClouds();
    scene.add(this.cloudsGroup);

    // 4. Aurora Borealis in Night Sky
    const auroraGeo = new THREE.CylinderGeometry(500, 520, 180, 64, 16, true);
    this.auroraMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.0 }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          float wave = sin(p.x * 0.015 + uTime * 0.8) * cos(p.z * 0.012 + uTime * 0.6) * 35.0;
          p.x += wave;
          vec4 worldPos = modelMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        void main() {
          if (uIntensity <= 0.01) discard;
          float curtain = sin(vUv.x * 35.0 + uTime * 0.9) * 0.5 + 0.5;
          float verticalAlpha = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
          vec3 greenAurora = vec3(0.15, 0.95, 0.55);
          vec3 violetAurora = vec3(0.65, 0.2, 0.95);
          vec3 auroraCol = mix(greenAurora, violetAurora, sin(vUv.x * 6.0 + uTime * 0.3) * 0.5 + 0.5);
          float alpha = verticalAlpha * curtain * uIntensity * 0.75;
          gl_FragColor = vec4(auroraCol * 2.0, alpha);
        }
      `
    });
    this.auroraMesh = new THREE.Mesh(auroraGeo, this.auroraMaterial);
    this.auroraMesh.position.set(0, 150, 0);
    scene.add(this.auroraMesh);
  }

  /**
   * Builds majestic 3D Minecraft Volumetric Box Clouds
   */
  private buildMinecraftClouds(): void {
    const cloudHeight = 120;
    const count = 12;

    for (let i = 0; i < count; i++) {
      const cx = (Math.random() - 0.5) * 500;
      const cz = (Math.random() - 0.5) * 500;
      const width = 35 + Math.random() * 40;
      const length = 35 + Math.random() * 50;
      const thickness = 6;

      const geo = new THREE.BoxGeometry(width, thickness, length);
      const mesh = new THREE.Mesh(geo, this.cloudMaterial);
      mesh.position.set(cx, cloudHeight + (Math.random() - 0.5) * 10, cz);
      this.cloudsGroup.add(mesh);
    }
  }

  public setTimeOfDay(time: number, isRaining = false): void {
    this.state.timeOfDay = (time + 24) % 24;
    const t = this.state.timeOfDay;

    const sunAngle = ((t - 6.0) / 24.0) * Math.PI * 2.0;
    const sunDist = 550;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunZ = Math.sin(sunAngle * 0.5) * 140;

    // Position sun light
    this.sunLight.position.set(sunX, Math.max(sunY, -30), sunZ);
    this.state.sunDirection.copy(this.sunLight.position).normalize();

    // Position Square Sun mesh
    this.sunMesh.position.set(sunX * 0.95, sunY * 0.95, sunZ * 0.95);
    this.sunMesh.lookAt(0, 0, 0);

    // Position Square Moon mesh (opposite of sun)
    this.moonMesh.position.set(-sunX * 0.95, -sunY * 0.95, -sunZ * 0.95);
    this.moonMesh.lookAt(0, 0, 0);

    let sunCol: THREE.Color;
    let ambCol: THREE.Color;
    let fogCol: THREE.Color;
    let skyBg: THREE.Color;
    let cloudCol: THREE.Color;
    let aurora = 0.0;
    let sunIntensity = 2.4;

    if (t >= 5.0 && t < 9.5) {
      // MORNING / DAWN: Warm, bright, sun-drenched Minecraft Cherry Grove (matching reference photo)
      sunCol = new THREE.Color(1.0, 0.92, 0.82);
      ambCol = new THREE.Color(0.62, 0.68, 0.75);
      fogCol = new THREE.Color(0.88, 0.92, 0.98);
      skyBg = new THREE.Color(0x9ed1ff);
      cloudCol = new THREE.Color(1.0, 0.96, 0.92);
      sunIntensity = 2.6;
      this.sunMesh.visible = true;
      this.moonMesh.visible = false;
    } else if (t >= 9.5 && t < 16.5) {
      // NOON: Crisp azure sky with bright white clouds
      sunCol = new THREE.Color(1.0, 0.98, 0.94);
      ambCol = new THREE.Color(0.52, 0.58, 0.68);
      fogCol = new THREE.Color(0.72, 0.86, 0.98);
      skyBg = new THREE.Color(0x6aa6ff);
      cloudCol = new THREE.Color(1.0, 1.0, 1.0);
      sunIntensity = 2.4;
      this.sunMesh.visible = true;
      this.moonMesh.visible = false;
    } else if (t >= 16.5 && t < 19.5) {
      // SUNSET: Radiant fiery orange & violet
      sunCol = new THREE.Color(1.0, 0.55, 0.28);
      ambCol = new THREE.Color(0.50, 0.38, 0.48);
      fogCol = new THREE.Color(0.92, 0.52, 0.42);
      skyBg = new THREE.Color(0xd95738);
      cloudCol = new THREE.Color(1.0, 0.65, 0.55);
      sunIntensity = 1.9;
      this.sunMesh.visible = true;
      this.moonMesh.visible = true;
    } else {
      // NIGHT: Deep indigo starry sky with glowing Square Moon & Aurora
      sunCol = new THREE.Color(0.32, 0.44, 0.72);
      ambCol = new THREE.Color(0.12, 0.16, 0.26);
      fogCol = new THREE.Color(0.06, 0.10, 0.18);
      skyBg = new THREE.Color(0x060c18);
      cloudCol = new THREE.Color(0.25, 0.32, 0.45);
      sunIntensity = 0.45;
      aurora = 1.0;
      this.sunMesh.visible = false;
      this.moonMesh.visible = true;
    }

    if (isRaining) {
      sunCol.multiplyScalar(0.45);
      ambCol.setHex(0x3a4858);
      fogCol.setHex(0x4c5b6c);
      skyBg.setHex(0x405060);
      cloudCol.setHex(0x556270);
      aurora = 0.0;
      this.sunMesh.visible = false;
      this.moonMesh.visible = false;
    }

    this.state.sunColor.copy(sunCol);
    this.state.ambientColor.copy(ambCol);
    this.state.fogColor.copy(fogCol);

    this.scene.background = skyBg;
    this.sunLight.color.copy(sunCol);
    this.sunLight.intensity = sunIntensity;
    this.ambientLight.color.copy(ambCol);
    this.cloudMaterial.color.copy(cloudCol);

    this.auroraMaterial.uniforms.uIntensity.value = aurora;
  }

  public update(time: number): void {
    this.auroraMaterial.uniforms.uTime.value = time;

    // Drifting Minecraft Clouds
    this.cloudsGroup.children.forEach((cloud) => {
      cloud.position.x += 0.08;
      if (cloud.position.x > 450) {
        cloud.position.x = -450;
      }
    });
  }
}
