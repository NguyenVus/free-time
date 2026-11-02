import * as THREE from 'three';
import { Terrain } from './Terrain.ts';
import { VoxelTextureGenerator } from '../utils/VoxelTextureGenerator.ts';

export interface ShrineData {
  id: number;
  name: string;
  position: THREE.Vector3;
  discovered: boolean;
  mesh: THREE.Group;
  crystal: THREE.Mesh;
  lightBeam: THREE.Mesh;
}

export class Structures {
  public group: THREE.Group;
  public shrines: ShrineData[] = [];

  constructor(scene: THREE.Scene, terrain: Terrain) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.createToriiGate(terrain);
    this.createTeaDeck(terrain);
    this.createBeacon(terrain);
  }

  private createBlock(mat: THREE.Material, size: THREE.Vector3): THREE.Mesh {
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Clean, iconic Japanese Torii Gate on the cliff overlook
   */
  private createToriiGate(terrain: Terrain): void {
    const torii = new THREE.Group();
    const crimsonMat = new THREE.MeshStandardMaterial({
      map: VoxelTextureGenerator.getToriiCrimson(),
      roughness: 0.65
    });
    const slateMat = new THREE.MeshStandardMaterial({
      map: VoxelTextureGenerator.getDarkSlate(),
      roughness: 0.8
    });

    // 2 Pillars
    const p1 = this.createBlock(crimsonMat, new THREE.Vector3(1.2, 7.0, 1.2));
    p1.position.set(-3.2, 3.5, 0);
    torii.add(p1);

    const p2 = this.createBlock(crimsonMat, new THREE.Vector3(1.2, 7.0, 1.2));
    p2.position.set(3.2, 3.5, 0);
    torii.add(p2);

    // Cross beam
    const beam = this.createBlock(crimsonMat, new THREE.Vector3(10.0, 1.0, 1.2));
    beam.position.set(0, 6.8, 0);
    torii.add(beam);

    // Roof cap
    const roof = this.createBlock(slateMat, new THREE.Vector3(10.6, 0.4, 1.5));
    roof.position.set(0, 7.4, 0);
    torii.add(roof);

    // Place at scenic eastern hill overlook (x: 28, z: -20)
    const tx = 28;
    const tz = -20;
    const ty = terrain.getHeightAt(tx, tz);
    torii.position.set(tx, ty, tz);
    torii.rotation.y = -Math.PI * 0.2;
    this.group.add(torii);
  }

  /**
   * Cozy Cherry Wood Tea Deck with Lanterns
   */
  private createTeaDeck(terrain: Terrain): void {
    const deck = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      map: VoxelTextureGenerator.getCherryPlanks(),
      roughness: 0.75
    });
    const slateMat = new THREE.MeshStandardMaterial({
      map: VoxelTextureGenerator.getDarkSlate(),
      roughness: 0.8
    });

    // Platform (6x6)
    const floor = this.createBlock(woodMat, new THREE.Vector3(6.0, 0.5, 6.0));
    floor.position.set(0, 0.25, 0);
    deck.add(floor);

    // 4 Corner Posts
    for (let cx of [-2.4, 2.4]) {
      for (let cz of [-2.4, 2.4]) {
        const post = this.createBlock(woodMat, new THREE.Vector3(0.5, 3.2, 0.5));
        post.position.set(cx, 1.85, cz);
        deck.add(post);
      }
    }

    // Pagoda Roof
    const roof = this.createBlock(slateMat, new THREE.Vector3(7.2, 0.5, 7.2));
    roof.position.set(0, 3.65, 0);
    deck.add(roof);

    // Warm hanging light in deck
    const light = new THREE.PointLight(0xffaa44, 2.0, 15);
    light.position.set(0, 2.5, 0);
    deck.add(light);

    // Place deck near meadow center
    const dx = -14;
    const dz = 6;
    const dy = terrain.getHeightAt(dx, dz);
    deck.position.set(dx, dy, dz);
    deck.rotation.y = Math.PI * 0.15;
    this.group.add(deck);
  }

  /**
   * Ancient Minecraft Beacon Shrine
   */
  private createBeacon(terrain: Terrain): void {
    const bx = 0;
    const bz = -20;
    const by = terrain.getHeightAt(bx, bz);

    const shrine = new THREE.Group();
    shrine.position.set(bx, by, bz);

    const quartzMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4 });
    const beaconMat = new THREE.MeshStandardMaterial({
      map: VoxelTextureGenerator.getBeaconTexture(),
      emissive: new THREE.Color(0x38d9a9),
      emissiveIntensity: 0.8
    });

    // Base
    const base = this.createBlock(quartzMat, new THREE.Vector3(4.0, 0.8, 4.0));
    base.position.set(0, 0.4, 0);
    shrine.add(base);

    // Glowing Beacon Core
    const crystalGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const crystal = new THREE.Mesh(crystalGeo, beaconMat);
    crystal.position.y = 1.4;
    shrine.add(crystal);

    // Celestial Light Beam
    const beamGeo = new THREE.CylinderGeometry(0.5, 0.5, 300, 12);
    beamGeo.translate(0, 150, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x4ef2bb,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const lightBeam = new THREE.Mesh(beamGeo, beamMat);
    lightBeam.position.y = 1.4;
    shrine.add(lightBeam);

    this.group.add(shrine);

    this.shrines.push({
      id: 1,
      name: 'Bảo Tháp Ngự Uyển (Sakura Beacon)',
      position: new THREE.Vector3(bx, by, bz),
      discovered: false,
      mesh: shrine,
      crystal,
      lightBeam
    });
  }

  public update(time: number): void {
    this.shrines.forEach((s) => {
      s.crystal.rotation.y = time * 0.8;
      s.crystal.position.y = 1.4 + Math.sin(time * 2.0) * 0.15;
    });
  }
}
