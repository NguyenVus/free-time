import { WATER_LEVEL } from '../config';
import { BLOCK_DEFS } from '../world/blocks';

export const FISHING_REACH = 16;
const WAIT_MIN_SECONDS = 2.5;
const WAIT_RANDOM_SECONDS = 4.5;
const BITE_WINDOW_SECONDS = 1.4;
const MAX_DISTANCE_FROM_BOBBER = 20;
const RAY_STEP = 0.1;
const ROD_LENGTH = 1.7;
const ROD_UP = new THREE.Vector3(0, 1, 0);
const LINE_POINTS = 14;
const LINE_SAG = 0.35; // how far the middle of the line hangs below a straight line
const BOBBER_FLOAT_HEIGHT = 0.1; // above the water's surface, so it is not seen through the water
const ROD_DIRECTION = new THREE.Vector3(0, 0.62, -0.78).normalize(); // up and forward
// Where the rod is held: in the character's right hand, or at the bottom right of the first-person view
const ROD_IN_HAND = new THREE.Vector3(0.36, 0.95, -0.4);
const ROD_IN_VIEW = new THREE.Vector3(0.3, -0.38, -0.5);
const ARM_RAISED_ANGLE = 1.25; // the right arm points forward while holding the rod
const REEL_SECONDS = 0.8;
const REEL_ARC_HEIGHT = 2.6; // how high the fish flies on its way to the player
const ROD_FLICK_ANGLE = 0.9;
const ROD_AXIS = new THREE.Vector3(1, 0, 0);
const CATCH_COLORS: Record<string, number> = { carp: 0xff7a2a, silverfish: 0x9fb4c7, koi: 0xf4f0e6 };

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

type FishingState = 'idle' | 'waiting' | 'bite' | 'reeling';
export type FishingEvent = 'cast' | 'bite' | 'splash' | 'caught' | 'lost' | 'reeled' | 'too-far';

/** Casts a bobber onto water, waits for a bite, and catches a fish if the player reacts in time. */
export class Fishing {
  state: FishingState = 'idle';
  private timer = 0;
  private time = 0;
  private bobber: THREE.Group;
  private line: THREE.Line;
  rod: THREE.Mesh;
  private rodTip = new THREE.Vector3();
  private fish: THREE.Group;
  private fishBody: THREE.MeshLambertMaterial;
  private catchItem: string | null = null;
  private reelTime = 0;
  private reelFrom = new THREE.Vector3();
  private surfaceY = WATER_LEVEL + 1;

  constructor(
    scene: THREE.Scene,
    private world: { getBlock(x: number, y: number, z: number): number },
    private onEvent: (event: FishingEvent, item?: string) => void
  ) {
    // Red below and white above, the way a real float is painted
    this.bobber = new THREE.Group();
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.26), new THREE.MeshLambertMaterial({ color: 0xe0352b }));
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    upper.position.y = 0.14;
    this.bobber.add(lower, upper);
    this.bobber.visible = false;
    scene.add(this.bobber);

    // Base at the origin and tip along +y, so it can be pointed by rotating it
    const rodGeometry = new THREE.BoxGeometry(0.035, ROD_LENGTH, 0.035);
    rodGeometry.translate(0, ROD_LENGTH / 2, 0);
    this.rod = new THREE.Mesh(rodGeometry, new THREE.MeshLambertMaterial({ color: 0x8a5a2b }));
    this.rod.quaternion.setFromUnitVectors(ROD_UP, ROD_DIRECTION);
    this.rod.visible = false;

    // The catch, shown as it flies out of the water
    this.fish = new THREE.Group();
    this.fishBody = new THREE.MeshLambertMaterial({ color: 0xff7a2a });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.52), this.fishBody);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.14), this.fishBody);
    tail.position.z = -0.32;
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eyes.position.set(0, 0.04, 0.19);
    this.fish.add(body, tail, eyes);
    this.fish.visible = false;
    scene.add(this.fish);

    const geometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: LINE_POINTS }, () => new THREE.Vector3()));
    this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
    this.line.visible = false;
    this.line.frustumCulled = false;
    scene.add(this.line);
  }

  get isActive(): boolean {
    return this.state !== 'idle';
  }

  /** Where the float is, or the fish while it is being pulled in. */
  get position(): THREE.Vector3 {
    return this.state === 'reeling' ? this.fish.position : this.bobber.position;
  }

  /**
   * Puts the rod in the player's hand for this frame and returns where its tip is. The character
   * is only drawn in third person; in first person the rod is carried by the camera instead.
   */
  holdRod(camera: THREE.Camera, character: { group: THREE.Group; armR: THREE.Mesh }, thirdPerson: boolean): THREE.Vector3 {
    const holder = thirdPerson ? character.group : camera;
    if (this.rod.parent !== holder) holder.add(this.rod);
    this.rod.position.copy(thirdPerson ? ROD_IN_HAND : ROD_IN_VIEW);
    // The rod snaps up and back while a fish is being pulled out
    const flick = this.state === 'reeling' ? Math.sin(Math.min(1, this.reelTime / REEL_SECONDS * 1.6) * Math.PI) * ROD_FLICK_ANGLE : 0;
    this.rod.quaternion.setFromUnitVectors(ROD_UP, ROD_DIRECTION);
    if (flick) this.rod.rotateOnWorldAxis(ROD_AXIS, flick);
    if (thirdPerson) character.armR.rotation.x = ARM_RAISED_ANGLE + flick * 0.6;
    this.rod.updateWorldMatrix(true, false);
    return this.rodTip.set(0, ROD_LENGTH, 0).applyMatrix4(this.rod.matrixWorld);
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
    this.surfaceY = spot.y + BOBBER_FLOAT_HEIGHT;
    this.bobber.position.set(spot.x, this.surfaceY, spot.z);
    this.bobber.visible = true;
    this.line.visible = true;
    this.rod.visible = true;
    this.onEvent('cast');
  }

  /** The player pressed the button while the line is out. */
  react() {
    if (this.state === 'bite') {
      // The fish is pulled out in front of the player, and only theirs once it arrives
      this.state = 'reeling';
      this.reelTime = 0;
      this.catchItem = pickCatch(Math.random());
      this.fishBody.color.setHex(CATCH_COLORS[this.catchItem]);
      this.reelFrom.copy(this.bobber.position);
      this.fish.position.copy(this.bobber.position);
      this.fish.visible = true;
      this.bobber.visible = false;
      this.onEvent('splash');
    } else if (this.state === 'waiting') {
      this.finish();
      this.onEvent('reeled');
    }
  }

  private finish() {
    this.state = 'idle';
    this.bobber.visible = false;
    this.line.visible = false;
    this.rod.visible = false;
    this.fish.visible = false;
  }

  update(dt: number, holder: THREE.Vector3, rodTip: THREE.Vector3 = holder) {
    if (this.state === 'idle') return;
    this.time += dt;

    if (this.state === 'reeling') {
      this.reelTime += dt;
      const t = Math.min(1, this.reelTime / REEL_SECONDS);
      // A high arc from the water to just in front of the player, flapping and turning on the way
      this.fish.position.set(
        this.reelFrom.x + (holder.x - this.reelFrom.x) * t * 0.92,
        this.reelFrom.y + (holder.y + 1.2 - this.reelFrom.y) * t + Math.sin(t * Math.PI) * REEL_ARC_HEIGHT,
        this.reelFrom.z + (holder.z - this.reelFrom.z) * t * 0.92
      );
      this.fish.rotation.set(Math.sin(this.time * 30) * 0.5, this.time * 6, Math.sin(this.time * 24) * 0.7);
      if (t >= 1) {
        const item = this.catchItem;
        this.finish();
        this.onEvent('caught', item);
        return;
      }
    } else if (holder.distanceTo(this.bobber.position) > MAX_DISTANCE_FROM_BOBBER) {
      this.finish();
      this.onEvent('too-far');
      return;
    }

    this.timer -= dt;
    if (this.state !== 'reeling' && this.timer <= 0) {
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
      ? this.surfaceY - 0.26 + Math.sin(this.time * 24) * 0.06
      : this.surfaceY + Math.sin(this.time * 2.4) * 0.03;

    const points = this.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    const end = this.position;
    for (let i = 0; i < LINE_POINTS; i++) {
      const t = i / (LINE_POINTS - 1);
      points.setXYZ(
        i,
        rodTip.x + (end.x - rodTip.x) * t,
        rodTip.y + (end.y + 0.2 - rodTip.y) * t - Math.sin(t * Math.PI) * LINE_SAG,
        rodTip.z + (end.z - rodTip.z) * t
      );
    }
    points.needsUpdate = true;
  }
}
