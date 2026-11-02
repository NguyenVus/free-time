import { BLOCK_DEFS } from '../world/blocks';

export class VoxelParticleSystem {
  declare geo: any;
  declare maxParticles: any;
  declare palette: any;
  declare pool: any;
  declare scene: any;

  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 80;
    this.geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);

    this.palette = {
      [BLOCK_DEFS.GRASS]: [0x72ba2e, 0x65ab27, 0x3d2516, 0x5c9e22],
      [BLOCK_DEFS.DIRT]: [0x3d2516, 0x4a2e1c, 0x331e11, 0x52331f],
      [BLOCK_DEFS.STONE]: [0x686a73, 0x777983, 0x5d5f67, 0x464850],
      [BLOCK_DEFS.SNOW]: [0xffffff, 0xe8eef7, 0xdfe7f3],
      [BLOCK_DEFS.VOLCANIC_ROCK]: [0x3b3a44, 0x45434f, 0x2b2a32],
      [BLOCK_DEFS.SAND]: [0xddcb9d, 0xd4c18f, 0xe6d6ab],
      [BLOCK_DEFS.WOOD_LOG]: [0x3d2128, 0x46272f, 0xbd796a, 0x2a141b],
      [BLOCK_DEFS.WOOD_PLANKS]: [0xc79462, 0xbc8755, 0xd4a16f],
      [BLOCK_DEFS.LEAVES_LIGHT]: [0xffb7ce, 0xffa3be, 0xffc6da, 0xffffff],
      [BLOCK_DEFS.LEAVES_DEEP]: [0xf06292, 0xe91e63, 0xec407a],
      [BLOCK_DEFS.LEAVES_WHITE]: [0xffffff, 0xfff0f3, 0xfde2e8],
      [BLOCK_DEFS.LEAVES_SOFT]: [0xfca5a5, 0xf472b6, 0xfbcfe8],
      [BLOCK_DEFS.LEAVES_MAGENTA]: [0xbe185d, 0x9d174d, 0xdb2777],
      [BLOCK_DEFS.GROUND_PETALS_CARPET]: [0x72ba2e, 0xffb7ce, 0xf472b6, 0xffffff],
      [BLOCK_DEFS.LANTERN]: [0xffaa44, 0x26170e, 0xffca28],
      [BLOCK_DEFS.PAPER_LANTERN]: [0xfde68a, 0xdc2626, 0xffb74d],
      [BLOCK_DEFS.TORII_RED]: [0xc92a2a, 0xd63333, 0xb52020],
      [BLOCK_DEFS.ROOF_SLATE]: [0x2d3238, 0x383d45, 0x17191d]
    };

    this.pool = [];
    for (let i = 0; i < this.maxParticles; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
      const mesh = new THREE.Mesh(this.geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      this.pool.push({
        mesh,
        pos: mesh.position,
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        timer: 0,
        life: 0.7,
        active: false
      });
    }
  }

  burst(x, y, z, blockId, count = 18) {
    const colors = this.palette[blockId] || [0xffffff, 0xcccccc];
    let spawned = 0;

    for (let i = 0; i < this.pool.length && spawned < count; i++) {
      const p = this.pool[i];
      if (p.active) continue;

      p.active = true;
      p.timer = 0;
      p.life = 0.55 + Math.random() * 0.3;
      p.mesh.visible = true;
      p.mesh.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
      p.mesh.material.opacity = 1.0;
      p.mesh.scale.set(1, 1, 1);

      p.pos.set(
        x + 0.5 + (Math.random() - 0.5) * 0.7,
        y + 0.5 + (Math.random() - 0.5) * 0.7,
        z + 0.5 + (Math.random() - 0.5) * 0.7
      );

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.5;
      p.vel.set(
        Math.cos(angle) * speed * 0.8,
        2.5 + Math.random() * 3.5,
        Math.sin(angle) * speed * 0.8
      );

      p.rotVel.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      );

      spawned++;
    }
  }

  update(dt) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.timer += dt;
      if (p.timer >= p.life) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.vel.y -= 14.0 * dt;
      p.pos.addScaledVector(p.vel, dt);

      p.mesh.rotation.x += p.rotVel.x * dt;
      p.mesh.rotation.y += p.rotVel.y * dt;
      p.mesh.rotation.z += p.rotVel.z * dt;

      const progress = p.timer / p.life;
      const shrink = Math.max(0.01, 1.0 - progress);
      p.mesh.scale.set(shrink, shrink, shrink);
      p.mesh.material.opacity = 1.0 - Math.pow(progress, 2.0);
    }
  }
}
