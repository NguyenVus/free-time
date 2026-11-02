// =========================================================================
// 7. BLOCK POPPING ANIMATOR & BREAK PARTICLES
// =========================================================================
export class BlockPlacementAnimator {
  declare animations: any;
  declare boxGeo: any;
  declare materials: any;
  declare scene: any;

  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.animations = [];
    this.boxGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
  }

  spawnPop(x, y, z, blockId) {
    let mat = this.materials[blockId];
    if (Array.isArray(mat)) mat = mat[0];
    if (!mat) return;

    const mesh = new THREE.Mesh(this.boxGeo, mat);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    mesh.scale.set(0.2, 0.2, 0.2);
    this.scene.add(mesh);

    this.animations.push({
      mesh,
      timer: 0,
      duration: 0.24
    });
  }

  update(dt) {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      anim.timer += dt;
      const t = Math.min(anim.timer / anim.duration, 1.0);
      // Elastic pop overshoot bounce
      const scale = 1.0 + Math.sin(t * Math.PI) * 0.24;
      anim.mesh.scale.set(scale, scale, scale);

      if (t >= 1.0) {
        this.scene.remove(anim.mesh);
        this.animations.splice(i, 1);
      }
    }
  }
}
