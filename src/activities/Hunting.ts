import { CHUNK_SIZE } from '../config';
import { BLOCK_DEFS } from '../world/blocks';
import type { AnimalSystem, ArrowHit } from '../creatures/AnimalSystem';

const ARROW_COUNT = 12;
const ARROW_SPEED = 34;
const ARROW_GRAVITY = 9.8;
const ARROW_MAX_SECONDS = 4;
const ARROW_STUCK_SECONDS = 5;
const SHOOT_COOLDOWN_SECONDS = 0.6;
export const ARROW_DAMAGE = 4;

interface Arrow {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  flying: boolean;
}

/** Arrows flying in an arc. They stop at the first block or animal. */
export class Hunting {
  private arrows: Arrow[] = [];
  private cooldown = 0;
  private previous = new THREE.Vector3();
  private forward = new THREE.Vector3(0, 0, 1);

  constructor(
    scene: THREE.Scene,
    private world: { getBlock(x: number, y: number, z: number): number; getLoadedChunk(cx: number, cz: number): unknown },
    private animals: AnimalSystem,
    private onHit: (hit: ArrowHit, from: THREE.Vector3, damage: number) => void
  ) {
    const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.7);
    const material = new THREE.MeshLambertMaterial({ color: 0x7a5a36 });
    for (let i = 0; i < ARROW_COUNT; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      scene.add(mesh);
      this.arrows.push({ mesh, velocity: new THREE.Vector3(), life: 0, flying: false });
    }
  }

  get canShoot(): boolean {
    return this.cooldown <= 0;
  }

  shoot(origin: THREE.Vector3, direction: THREE.Vector3) {
    // A spare arrow, or else the one that has been around the longest
    const arrow = this.arrows.find(a => !a.mesh.visible) || this.arrows.reduce((a, b) => (a.life < b.life ? a : b));
    arrow.mesh.position.copy(origin).addScaledVector(direction, 0.8);
    arrow.velocity.copy(direction).multiplyScalar(ARROW_SPEED);
    arrow.life = ARROW_MAX_SECONDS;
    arrow.flying = true;
    arrow.mesh.visible = true;
    arrow.mesh.quaternion.setFromUnitVectors(this.forward, direction);
    this.cooldown = SHOOT_COOLDOWN_SECONDS;
  }

  update(dt: number) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (const arrow of this.arrows) {
      if (!arrow.mesh.visible) continue;
      arrow.life -= dt;
      if (arrow.life <= 0) {
        arrow.mesh.visible = false;
        arrow.flying = false;
        continue;
      }
      if (!arrow.flying) continue;

      this.previous.copy(arrow.mesh.position);
      arrow.velocity.y -= ARROW_GRAVITY * dt;
      arrow.mesh.position.addScaledVector(arrow.velocity, dt);
      arrow.mesh.quaternion.setFromUnitVectors(this.forward, this.previous.clone().sub(arrow.mesh.position).negate().normalize());

      const hit = this.animals.hitTest(this.previous, arrow.mesh.position);
      if (hit) {
        arrow.mesh.visible = false;
        arrow.flying = false;
        this.onHit(hit, this.previous, ARROW_DAMAGE);
        continue;
      }
      if (this.isBlocked(arrow.mesh.position)) {
        // Stuck where it landed for a little while
        arrow.flying = false;
        arrow.life = ARROW_STUCK_SECONDS;
      }
    }
  }

  private isBlocked(p: THREE.Vector3): boolean {
    const x = Math.floor(p.x);
    const z = Math.floor(p.z);
    // Unloaded chunks must not be generated mid-frame just because an arrow flew there
    if (!this.world.getLoadedChunk(Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE))) return true;
    const block = this.world.getBlock(x, Math.floor(p.y), z);
    return block !== BLOCK_DEFS.AIR && block !== BLOCK_DEFS.WATER;
  }
}
