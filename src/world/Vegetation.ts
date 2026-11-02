import * as THREE from 'three';
import { Terrain } from './Terrain.ts';
import { VoxelTextureGenerator } from '../utils/VoxelTextureGenerator.ts';

export class Vegetation {
  public group: THREE.Group;

  constructor(scene: THREE.Scene, terrain: Terrain) {
    this.group = new THREE.Group();
    scene.add(this.group);

    const cherryLogSide = VoxelTextureGenerator.getCherryLogSide();
    const cherryLeaves = VoxelTextureGenerator.getCherryLeaves();

    const barkMat = new THREE.MeshStandardMaterial({
      map: cherryLogSide,
      roughness: 0.85
    });

    // Authentic Cherry Leaves with floral alpha test
    const leafMat = new THREE.MeshStandardMaterial({
      map: cherryLeaves,
      transparent: true,
      alphaTest: 0.25,
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    const B = terrain.blockSize; // 2.0
    const trunkMatrices: THREE.Matrix4[] = [];
    const leafMatrices: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();

    // =========================================================================
    // 1. CURATED CHERRY GROVE TREES (Matching Reference Photo Layout)
    // =========================================================================
    // Specifically placed to match the foreground branching tree and arched grove
    const treeConfigs = [
      // Foreground center-left branching tree (prominent in photo)
      { x: -3, z: 2, height: 4, branchDir: 'left', canopyW: 4, canopyL: 4 },
      // Foreground right tree
      { x: 9, z: 3, height: 4, branchDir: 'right', canopyW: 4, canopyL: 4 },
      // Midground left tree on terrace
      { x: -14, z: -6, height: 4, branchDir: 'both', canopyW: 4, canopyL: 4 },
      // Midground center tree
      { x: 2, z: -10, height: 5, branchDir: 'forward', canopyW: 5, canopyL: 5 },
      // Midground right tree
      { x: 18, z: -8, height: 4, branchDir: 'left', canopyW: 4, canopyL: 4 },
      // Background hillside trees (creating connected blossom canopy overhead)
      { x: -22, z: -18, height: 4, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: -8, z: -22, height: 5, branchDir: 'right', canopyW: 4, canopyL: 4 },
      { x: 8, z: -22, height: 5, branchDir: 'left', canopyW: 4, canopyL: 4 },
      { x: 22, z: -20, height: 4, branchDir: 'none', canopyW: 4, canopyL: 4 },
      // Far perimeter trees covering the rolling hills (360-degree Cherry Grove Biome)
      { x: -16, z: 12, height: 4, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: 16, z: 14, height: 4, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: 0, z: -32, height: 4, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: -35, z: -10, height: 5, branchDir: 'both', canopyW: 4, canopyL: 4 },
      { x: 35, z: -12, height: 5, branchDir: 'both', canopyW: 4, canopyL: 4 },
      { x: -28, z: -35, height: 5, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: 28, z: -35, height: 5, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: 0, z: -45, height: 5, branchDir: 'left', canopyW: 4, canopyL: 4 },
      { x: -45, z: 10, height: 5, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: 45, z: 10, height: 5, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: -30, z: 25, height: 4, branchDir: 'right', canopyW: 4, canopyL: 4 },
      { x: 30, z: 25, height: 4, branchDir: 'left', canopyW: 4, canopyL: 4 },
      { x: 0, z: 35, height: 4, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: -18, z: 32, height: 4, branchDir: 'none', canopyW: 4, canopyL: 4 },
      { x: 18, z: 32, height: 4, branchDir: 'none', canopyW: 4, canopyL: 4 }
    ];

    treeConfigs.forEach((cfg) => {
      this.buildMinecraftCherryTree(
        cfg.x,
        cfg.z,
        cfg.height,
        cfg.branchDir,
        cfg.canopyW,
        cfg.canopyL,
        terrain,
        trunkMatrices,
        leafMatrices,
        dummy
      );
    });

    const boxGeo = new THREE.BoxGeometry(B, B, B);

    // Trunks
    if (trunkMatrices.length > 0) {
      const trunkMesh = new THREE.InstancedMesh(boxGeo, barkMat, trunkMatrices.length);
      trunkMatrices.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      this.group.add(trunkMesh);
    }

    // Leaves
    if (leafMatrices.length > 0) {
      const leafMesh = new THREE.InstancedMesh(boxGeo, leafMat, leafMatrices.length);
      leafMatrices.forEach((m, i) => leafMesh.setMatrixAt(i, m));
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.group.add(leafMesh);
    }

    // =========================================================================
    // 2. GROUND PINK PETALS & TALL GRASS (Exact Match to Photo Foreground)
    // =========================================================================
    this.createGroundFlowers(terrain);
  }

  /**
   * Builds an authentic Minecraft 1.20 Cherry Tree with branching limbs & stepped canopy slab
   */
  private buildMinecraftCherryTree(
    x: number,
    z: number,
    trunkH: number,
    branchDir: string,
    canopyW: number,
    canopyL: number,
    terrain: Terrain,
    outTrunk: THREE.Matrix4[],
    outLeaves: THREE.Matrix4[],
    dummy: THREE.Object3D
  ): void {
    const B = terrain.blockSize;
    const y = terrain.getHeightAt(x, z);

    // 1. Vertical trunk column
    for (let th = 0; th < trunkH; th++) {
      dummy.position.set(x, y + th * B + B * 0.5, z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      outTrunk.push(dummy.matrix.clone());
    }

    // 2. Horizontal Branching limbs (iconic Minecraft cherry tree shape)
    const branchY = y + (trunkH - 1) * B + B * 0.5;

    if (branchDir === 'left' || branchDir === 'both') {
      dummy.position.set(x - B, branchY, z);
      dummy.updateMatrix();
      outTrunk.push(dummy.matrix.clone());

      dummy.position.set(x - B * 2, branchY, z);
      dummy.updateMatrix();
      outTrunk.push(dummy.matrix.clone());
    }

    if (branchDir === 'right' || branchDir === 'both') {
      dummy.position.set(x + B, branchY, z);
      dummy.updateMatrix();
      outTrunk.push(dummy.matrix.clone());
    }

    if (branchDir === 'forward') {
      dummy.position.set(x, branchY, z - B);
      dummy.updateMatrix();
      outTrunk.push(dummy.matrix.clone());
    }

    // 3. Thick stepped rectangular canopy overhead (forms continuous blossom ceiling)
    const canopyBaseY = y + trunkH * B;

    for (let dx = -canopyW; dx <= canopyW; dx++) {
      for (let dz = -canopyL; dz <= canopyL; dz++) {
        const edgeDist = Math.max(Math.abs(dx) / canopyW, Math.abs(dz) / canopyL);
        if (edgeDist > 1.0) continue;

        // 2-3 layers of leaves
        const maxLayers = edgeDist > 0.75 ? 1 : 2;

        for (let dy = 0; dy <= maxLayers; dy++) {
          // Leave open space immediately around trunk
          if (dx === 0 && dz === 0 && dy < 0) continue;

          dummy.position.set(x + dx * B, canopyBaseY + dy * B + B * 0.5, z + dz * B);
          dummy.scale.set(1.02, 1.02, 1.02);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          outLeaves.push(dummy.matrix.clone());
        }

        // Stepped hanging leaf blocks on underside edges (creates depth in shade)
        if (edgeDist > 0.6 && edgeDist <= 0.85 && Math.random() > 0.4) {
          dummy.position.set(x + dx * B, canopyBaseY - B * 0.5, z + dz * B);
          dummy.scale.set(1.02, 1.02, 1.02);
          dummy.updateMatrix();
          outLeaves.push(dummy.matrix.clone());
        }
      }
    }
  }

  /**
   * Ground Flowers: Minecraft 1.20 Pink Petal clusters and tall grass blades
   */
  private createGroundFlowers(terrain: Terrain): void {
    const B = terrain.blockSize;

    // 1. Pink Petal Flower Sprite
    const petalTex = VoxelTextureGenerator.getFlowerTexture('cherry_petal');
    const petalMat = new THREE.MeshStandardMaterial({
      map: petalTex,
      transparent: true,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });

    // 2. Tall Grass Sprite
    const grassTex = VoxelTextureGenerator.getFlowerTexture('tall_grass');
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      transparent: true,
      alphaTest: 0.25,
      side: THREE.DoubleSide
    });

    const crossGeo = new THREE.BufferGeometry();
    const s = 0.9;
    const h = 1.2;
    const positions = [
      -s * 0.5, 0, -s * 0.5,  s * 0.5, 0,  s * 0.5,  s * 0.5, h,  s * 0.5, -s * 0.5, h, -s * 0.5,
      -s * 0.5, 0,  s * 0.5,  s * 0.5, 0, -s * 0.5,  s * 0.5, h, -s * 0.5, -s * 0.5, h,  s * 0.5,
    ];
    const uvs = [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1];
    const indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7];
    crossGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    crossGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    crossGeo.setIndex(indices);
    crossGeo.computeVertexNormals();

    const dummy = new THREE.Object3D();

    // Scatter ~160 Pink Petals across foreground meadow
    const petalMatrices: THREE.Matrix4[] = [];
    for (let i = 0; i < 180; i++) {
      const rx = (Math.random() - 0.5) * 55;
      const rz = (Math.random() - 0.5) * 45;
      const ry = terrain.getHeightAt(rx, rz);

      if (ry >= 2.0) {
        dummy.position.set(rx, ry, rz);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(1.0, 1.0, 1.0);
        dummy.updateMatrix();
        petalMatrices.push(dummy.matrix.clone());
      }
    }

    if (petalMatrices.length > 0) {
      const petalMesh = new THREE.InstancedMesh(crossGeo, petalMat, petalMatrices.length);
      petalMatrices.forEach((m, i) => petalMesh.setMatrixAt(i, m));
      this.group.add(petalMesh);
    }

    // Scatter ~70 Tall Grass blades
    const grassMatrices: THREE.Matrix4[] = [];
    for (let i = 0; i < 75; i++) {
      const rx = (Math.random() - 0.5) * 55;
      const rz = (Math.random() - 0.5) * 45;
      const ry = terrain.getHeightAt(rx, rz);

      if (ry >= 2.0) {
        dummy.position.set(rx, ry, rz);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(0.9, 1.1, 0.9);
        dummy.updateMatrix();
        grassMatrices.push(dummy.matrix.clone());
      }
    }

    if (grassMatrices.length > 0) {
      const grassMesh = new THREE.InstancedMesh(crossGeo, grassMat, grassMatrices.length);
      grassMatrices.forEach((m, i) => grassMesh.setMatrixAt(i, m));
      this.group.add(grassMesh);
    }
  }

  public update(time: number, windSpeed: number, sunDir: THREE.Vector3, sunCol: THREE.Color, fogCol: THREE.Color): void {
    // 60 FPS rock solid
  }
}
