import * as THREE from 'three';
import { VoxelTextureGenerator } from '../utils/VoxelTextureGenerator.ts';

export class Particles {
  public group: THREE.Group;

  // Delicate Falling Sakura Petals (Simple, Light, Beautiful)
  private petalsMesh: THREE.Points;
  private petalsGeo: THREE.BufferGeometry;
  private petalPositions: Float32Array;
  private petalVelocities: Float32Array;
  private petalCount = 180;

  // Rain
  private rainMesh: THREE.Points;
  private rainGeo: THREE.BufferGeometry;
  private rainPositions: Float32Array;
  private rainCount = 1500;
  private isRaining = false;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // 1. Sakura Petals
    this.petalsGeo = new THREE.BufferGeometry();
    this.petalPositions = new Float32Array(this.petalCount * 3);
    this.petalVelocities = new Float32Array(this.petalCount * 3);

    for (let i = 0; i < this.petalCount; i++) {
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 80;
      this.petalPositions[i * 3 + 1] = 2 + Math.random() * 20;
      this.petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      this.petalVelocities[i * 3] = 0.4 + Math.random() * 0.4; // gentle drift
      this.petalVelocities[i * 3 + 1] = -(0.5 + Math.random() * 0.4); // gentle fall
      this.petalVelocities[i * 3 + 2] = 0.3 + Math.random() * 0.3;
    }

    this.petalsGeo.setAttribute('position', new THREE.BufferAttribute(this.petalPositions, 3));

    const petalTex = VoxelTextureGenerator.getPetalParticle();
    const petalMat = new THREE.PointsMaterial({
      map: petalTex,
      color: 0xffb3c6,
      size: 0.22, // small, delicate, does not block camera
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    this.petalsMesh = new THREE.Points(this.petalsGeo, petalMat);
    this.group.add(this.petalsMesh);

    // 2. Rain
    this.rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 150;
      this.rainPositions[i * 3 + 1] = Math.random() * 70;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.25,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.rainMesh = new THREE.Points(this.rainGeo, rainMat);
    this.group.add(this.rainMesh);
  }

  public setRain(active: boolean): void {
    this.isRaining = active;
  }

  public update(delta: number, time: number, timeOfDay: number, windSpeed: number): void {
    // 1. Petals update
    const pArr = this.petalPositions;
    for (let i = 0; i < this.petalCount; i++) {
      const idx = i * 3;
      pArr[idx] += this.petalVelocities[idx] * delta * 2.5 * windSpeed;
      pArr[idx + 1] += this.petalVelocities[idx + 1] * delta * 2.0;
      pArr[idx + 2] += this.petalVelocities[idx + 2] * delta * 2.5 * windSpeed;

      // Recycle when landing
      if (pArr[idx + 1] < 1.0 || Math.abs(pArr[idx]) > 50 || Math.abs(pArr[idx + 2]) > 50) {
        pArr[idx] = (Math.random() - 0.5) * 60;
        pArr[idx + 1] = 14 + Math.random() * 10;
        pArr[idx + 2] = (Math.random() - 0.5) * 60;
      }
    }
    this.petalsGeo.attributes.position.needsUpdate = true;

    // 2. Rain update
    const rainMat = this.rainMesh.material as THREE.PointsMaterial;
    const targetRainOpacity = this.isRaining ? 0.7 : 0.0;
    rainMat.opacity = THREE.MathUtils.lerp(rainMat.opacity, targetRainOpacity, delta * 3.0);

    if (rainMat.opacity > 0.01) {
      const rArr = this.rainPositions;
      for (let i = 0; i < this.rainCount; i++) {
        const idx = i * 3;
        rArr[idx + 1] -= delta * 90.0;
        if (rArr[idx + 1] < 0) {
          rArr[idx + 1] = 50 + Math.random() * 20;
          rArr[idx] = (Math.random() - 0.5) * 140;
          rArr[idx + 2] = (Math.random() - 0.5) * 140;
        }
      }
      this.rainGeo.attributes.position.needsUpdate = true;
    }
  }
}
