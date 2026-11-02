import * as THREE from 'three';
import { VoxelTextureGenerator } from '../utils/VoxelTextureGenerator.ts';

export class Terrain {
  public mesh: THREE.Mesh;
  public geometry: THREE.BufferGeometry;
  public materials: THREE.Material[];

  // Vast, solid land - continuous rolling hills (NO ocean, NO water holes)
  public readonly size = 260;
  public readonly blockSize = 2.0;
  private res: number;
  private heightMap: number[][];

  constructor() {
    this.res = Math.floor(this.size / this.blockSize);
    this.heightMap = [];

    const half = this.size * 0.5;
    const B = this.blockSize;

    // Generate continuous stepped Minecraft Cherry Grove hills across the entire map
    for (let ix = 0; ix <= this.res; ix++) {
      this.heightMap[ix] = [];
      const x = -half + ix * B;
      for (let iz = 0; iz <= this.res; iz++) {
        const z = -half + iz * B;
        this.heightMap[ix][iz] = this.calcStepHeight(x, z);
      }
    }

    // Material 0: Grass Top (vibrant meadow green) | Material 1: Grass Side (dirt with hanging grass roots)
    const grassTop = VoxelTextureGenerator.getGrassTop();
    const grassSide = VoxelTextureGenerator.getGrassSide();

    this.materials = [
      new THREE.MeshStandardMaterial({
        map: grassTop,
        roughness: 0.85,
        metalness: 0.05
      }),
      new THREE.MeshStandardMaterial({
        map: grassSide,
        roughness: 0.85,
        metalness: 0.05
      })
    ];

    this.geometry = this.buildSteppedTerraces();
    this.mesh = new THREE.Mesh(this.geometry, this.materials);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
  }

  /**
   * Continuous, logical Minecraft Cherry Grove rolling hillside topography:
   * - 100% solid land everywhere (Y >= 2.0, zero ocean, zero water)
   * - Gentle valley in foreground matching reference photo (Y = 2.0)
   * - Stepped terraces rising on the left and background (Y = 4.0, 6.0, 8.0, 10.0, 12.0)
   */
  private calcStepHeight(x: number, z: number): number {
    const B = this.blockSize;

    // 1. Natural rolling multi-scale landscape curves
    const wave1 = Math.sin(x * 0.04) * Math.cos(z * 0.035) * 5.0;
    const wave2 = Math.sin((x + z) * 0.025 + 1.0) * 4.0;
    const wave3 = Math.cos(x * 0.08) * Math.sin(z * 0.07) * 2.0;

    let h = 4.0 + wave1 + wave2 + wave3;

    // 2. Beautiful terraced amphitheater valley in center (where player stands)
    // Matches the stepped terraces rising on the left as in reference photo
    if (x > -12 && x < 16 && z > -4 && z < 24) {
      h = 2.0; // gentle flat meadow for the foreground flowers
    } else if (x <= -12) {
      // Stepped terraces rising up on the left
      const step = Math.floor((Math.abs(x) - 12) / 6.0) * 2.0;
      h = Math.max(h, 4.0 + step);
    } else if (z <= -4) {
      // Stepped terraces rising in the background
      const step = Math.floor((Math.abs(z) - 4) / 7.0) * 2.0;
      h = Math.max(h, 4.0 + step);
    }

    // Minimum height is strictly 2.0 (solid ground, NO water, 100% land)
    h = Math.max(2.0, Math.min(h, 16.0));

    return Math.floor(h / B) * B;
  }

  /**
   * Builds solid stepped voxel geometry with Top & Side materials
   */
  private buildSteppedTerraces(): THREE.BufferGeometry {
    const B = this.blockSize;
    const half = this.size * 0.5;
    const res = this.res;

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const topIndices: number[] = [];
    const sideIndices: number[] = [];
    let vertCount = 0;

    const addQuad = (
      p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3,
      n: THREE.Vector3,
      isTop: boolean
    ) => {
      positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
      normals.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
      uvs.push(0, 0, 1, 0, 1, 1, 0, 1);

      const targetIndices = isTop ? topIndices : sideIndices;
      targetIndices.push(vertCount, vertCount + 1, vertCount + 2, vertCount, vertCount + 2, vertCount + 3);
      vertCount += 4;
    };

    const up = new THREE.Vector3(0, 1, 0);
    const px = new THREE.Vector3(1, 0, 0);
    const nx = new THREE.Vector3(-1, 0, 0);
    const pz = new THREE.Vector3(0, 0, 1);
    const nz = new THREE.Vector3(0, 0, -1);

    for (let ix = 0; ix < res; ix++) {
      const x0 = -half + ix * B;
      const x1 = x0 + B;

      for (let iz = 0; iz < res; iz++) {
        const z0 = -half + iz * B;
        const z1 = z0 + B;
        const y = this.heightMap[ix][iz];

        // 1. Horizontal Top face (Grass Top)
        addQuad(
          new THREE.Vector3(x0, y, z0),
          new THREE.Vector3(x1, y, z0),
          new THREE.Vector3(x1, y, z1),
          new THREE.Vector3(x0, y, z1),
          up,
          true
        );

        // 2. Vertical drop walls (Grass Side)
        const hR = ix < res - 1 ? this.heightMap[ix + 1][iz] : y;
        const hL = ix > 0 ? this.heightMap[ix - 1][iz] : y;
        const hD = iz < res - 1 ? this.heightMap[ix][iz + 1] : y;
        const hU = iz > 0 ? this.heightMap[ix][iz - 1] : y;

        if (hR < y) {
          addQuad(
            new THREE.Vector3(x1, y, z0),
            new THREE.Vector3(x1, y, z1),
            new THREE.Vector3(x1, hR, z1),
            new THREE.Vector3(x1, hR, z0),
            px,
            false
          );
        }
        if (hL < y) {
          addQuad(
            new THREE.Vector3(x0, y, z1),
            new THREE.Vector3(x0, y, z0),
            new THREE.Vector3(x0, hL, z0),
            new THREE.Vector3(x0, hL, z1),
            nx,
            false
          );
        }
        if (hD < y) {
          addQuad(
            new THREE.Vector3(x1, y, z1),
            new THREE.Vector3(x0, y, z1),
            new THREE.Vector3(x0, hD, z1),
            new THREE.Vector3(x1, hD, z1),
            pz,
            false
          );
        }
        if (hU < y) {
          addQuad(
            new THREE.Vector3(x0, y, z0),
            new THREE.Vector3(x1, y, z0),
            new THREE.Vector3(x1, hU, z0),
            new THREE.Vector3(x0, hU, z0),
            nz,
            false
          );
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const allIndices = [...topIndices, ...sideIndices];
    geo.setIndex(allIndices);
    geo.addGroup(0, topIndices.length, 0);
    geo.addGroup(topIndices.length, sideIndices.length, 1);

    return geo;
  }

  public getHeightAt(x: number, z: number): number {
    return this.calcStepHeight(x, z);
  }

  public update(sunDir: THREE.Vector3, sunCol: THREE.Color, ambientCol: THREE.Color, fogCol: THREE.Color): void {
    // Dynamic lighting handled by Three.js Standard Material
  }
}
