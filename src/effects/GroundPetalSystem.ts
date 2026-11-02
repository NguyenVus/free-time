import { QUALITY } from '../config';

export class GroundPetalSystem {
  declare count: any;
  declare mesh: any;
  declare scene: any;
  declare world: any;

  constructor(scene, textureAtlas, world) {
    this.scene = scene;
    this.world = world;
    this.count = QUALITY.groundPetals;

    const geo = new THREE.PlaneGeometry(0.85, 0.85);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      map: textureAtlas['ground_petals'].texture,
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false; // see PetalSystem: r128 culls this at the world origin
    scene.add(this.mesh);

    this.spawnAround(0, 0);
  }

  spawnAround(px, pz) {
    const dummy = new THREE.Object3D();
    let idx = 0;
    const range = 50;

    for (let x = px - range; x <= px + range && idx < this.count; x += 2.2) {
      for (let z = pz - range; z <= pz + range && idx < this.count; z += 2.2) {
        const rx = Math.floor(x) + 0.5;
        const rz = Math.floor(z) + 0.5;
        const hash = Math.sin(rx * 12.9898 + rz * 78.233) * 43758.5453;
        if (hash - Math.floor(hash) > 0.42) {
          const gy = this.world.getTerrainHeight(rx, rz);
          if (gy >= 7 && !this.world.isInVillage(rx, rz)) {
            dummy.position.set(rx + (Math.random() - 0.5) * 0.8, gy + 1.01, rz + (Math.random() - 0.5) * 0.8);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            const s = 0.7 + Math.random() * 0.45;
            dummy.scale.set(s, 1, s);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(idx++, dummy.matrix);
          }
        }
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
