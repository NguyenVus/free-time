import { WATER_LEVEL } from '../config';
import { BLOCK_DEFS } from '../world/blocks';

export const FISHING_REACH = 16;
const WAIT_MIN_SECONDS = 2.5;
const WAIT_RANDOM_SECONDS = 4.5;
const BITE_WINDOW_SECONDS = 1.4;
const MAX_DISTANCE_FROM_BOBBER = 20;
const RAY_STEP = 0.1;

// Rarer fish come later in the list. `chance` is the share of catches.
const CATCHES: Array<{ item: string; chance: number }> = [
  { item: 'carp', chance: 0.6 },
  { item: 'silverfish', chance: 0.32 },
  { item: 'koi', chance: 0.08 }
];

export const pickCatch = (roll: number): string => {
  let total = 0;
  for (const entry of CATCHES) {
    total += entry.chance;
    if (roll < total) return entry.item;
  }
  return CATCHES[0].item;
};

type FishingState = 'idle' | 'waiting' | 'bite';
export type FishingEvent = 'cast' | 'bite' | 'caught' | 'lost' | 'reeled' | 'too-far';

/** Casts a bobber onto water, waits for a bite, and catches a fish if the player reacts in time. */
export class Fishing {
  state: FishingState = 'idle';
  private timer = 0;
  private time = 0;
  private bobber: THREE.Mesh;
  private line: THREE.Line;
  private surfaceY = WATER_LEVEL + 1;

  constructor(
    scene: THREE.Scene,
    private world: { getBlock(x: number, y: number, z: number): number },
    private onEvent: (event: FishingEvent, item?: string) => void
  ) {
    const material = new THREE.MeshLambertMaterial({ color: 0xe0352b });
    this.bobber = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), material);
    this.bobber.visible = false;
    scene.add(this.bobber);

    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    this.line.visible = false;
    this.line.frustumCulled = false;
    scene.add(this.line);
  }

  get isActive(): boolean {
    return this.state !== 'idle';
  }

  /** The water the camera is aiming at, or null. Solid blocks in the way stop the line of sight. */
  findWater(origin: THREE.Vector3, direction: THREE.Vector3): THREE.Vector3 | null {
    for (let distance = 0; distance < FISHING_REACH; distance += RAY_STEP) {
      const x = origin.x + direction.x * distance;
      const y = origin.y + direction.y * distance;
      const z = origin.z + direction.z * distance;
      const block = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
      if (block === BLOCK_DEFS.WATER) return new THREE.Vector3(x, WATER_LEVEL + 1, z);
      if (block !== BLOCK_DEFS.AIR) return null;
    }
    return null;
  }

  cast(spot: THREE.Vector3) {
    this.state = 'waiting';
    this.timer = WAIT_MIN_SECONDS + Math.random() * WAIT_RANDOM_SECONDS;
    this.surfaceY = spot.y;
    this.bobber.position.copy(spot);
    this.bobber.visible = true;
    this.line.visible = true;
    this.onEvent('cast');
  }

  /** The player pressed the button while the line is out. */
  react() {
    if (this.state === 'bite') {
      this.finish();
      this.onEvent('caught', pickCatch(Math.random()));
    } else if (this.state === 'waiting') {
      this.finish();
      this.onEvent('reeled');
    }
  }

  private finish() {
    this.state = 'idle';
    this.bobber.visible = false;
    this.line.visible = false;
  }

  update(dt: number, holder: THREE.Vector3) {
    if (this.state === 'idle') return;
    this.time += dt;

    if (holder.distanceTo(this.bobber.position) > MAX_DISTANCE_FROM_BOBBER) {
      this.finish();
      this.onEvent('too-far');
      return;
    }

    this.timer -= dt;
    if (this.timer <= 0) {
      if (this.state === 'waiting') {
        this.state = 'bite';
        this.timer = BITE_WINDOW_SECONDS;
        this.onEvent('bite');
      } else {
        this.finish();
        this.onEvent('lost');
        return;
      }
    }

    // Floats gently while waiting, and is pulled under by a bite
    this.bobber.position.y = this.state === 'bite'
      ? this.surfaceY - 0.18 + Math.sin(this.time * 24) * 0.06
      : this.surfaceY + Math.sin(this.time * 2.4) * 0.03;

    const points = this.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    points.setXYZ(0, holder.x, holder.y - 0.4, holder.z);
    points.setXYZ(1, this.bobber.position.x, this.bobber.position.y, this.bobber.position.z);
    points.needsUpdate = true;
  }
}
