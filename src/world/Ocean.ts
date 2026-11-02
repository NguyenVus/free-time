import * as THREE from 'three';

export class Ocean {
  public mesh: THREE.Mesh;
  public material: THREE.ShaderMaterial;

  constructor() {
    // Crisp water plane
    const waterGeometry = new THREE.PlaneGeometry(600, 600, 32, 32);
    waterGeometry.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
        uSunColor: { value: new THREE.Color(1.0, 0.95, 0.85) },
        uWaterColor: { value: new THREE.Color(0x1a8bc4) }, // Minecraft crystal cyan
        uDeepWaterColor: { value: new THREE.Color(0x0e4d75) },
        uWaveStrength: { value: 1.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWaveStrength;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 p = position;

          // Gentle voxel-like undulating ripples
          float wave = sin(p.x * 0.08 + uTime * 1.2) * cos(p.z * 0.08 + uTime * 0.9) * 0.35 * uWaveStrength;
          p.y += wave;

          vec4 worldPos = modelMatrix * vec4(p, 1.0);
          vWorldPos = worldPos.xyz;
          vNormal = vec3(0.0, 1.0, 0.0);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDirection;
        uniform vec3 uSunColor;
        uniform vec3 uWaterColor;
        uniform vec3 uDeepWaterColor;

        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          // Pixelated caustic water grid pattern (Minecraft style)
          vec2 blockGrid = floor(vWorldPos.xz * 1.5) / 1.5;
          float c1 = sin(blockGrid.x * 0.3 + uTime * 1.4) * cos(blockGrid.y * 0.3 + uTime * 1.1);
          float c2 = sin((blockGrid.x + blockGrid.y) * 0.25 - uTime * 0.8);
          float caustics = clamp((c1 + c2) * 0.5 + 0.5, 0.0, 1.0);

          // Base water gradient
          vec3 waterCol = mix(uWaterColor, uDeepWaterColor, 0.35);
          waterCol += vec3(caustics * 0.18);

          // Specular sun glint (RTX water reflection)
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 halfDir = normalize(uSunDirection + viewDir);
          float spec = pow(max(dot(vNormal, halfDir), 0.0), 48.0);
          vec3 specular = uSunColor * spec * 1.2;

          // Edge foam
          float foam = step(0.88, caustics) * 0.25;

          vec3 finalColor = waterCol + specular + vec3(foam);
          gl_FragColor = vec4(finalColor, 0.72);
        }
      `
    });

    this.mesh = new THREE.Mesh(waterGeometry, this.material);
    this.mesh.position.y = 0.0; // Sea level
  }

  public update(time: number, sunDir: THREE.Vector3, sunCol: THREE.Color, waveStrength = 1.0): void {
    if (this.material && this.material.uniforms) {
      this.material.uniforms.uTime.value = time;
      this.material.uniforms.uSunDirection.value.copy(sunDir);
      this.material.uniforms.uSunColor.value.copy(sunCol);
      this.material.uniforms.uWaveStrength.value = waveStrength;
    }
  }
}
