import { BLOCK_DEFS } from '../world/blocks';
import { CHUNK_HEIGHT, CHUNK_SIZE, QUALITY } from '../config';

export const ANIMAL_MAX_RANGE = 56; // never beyond the loaded world, so animals cannot generate terrain
export const ANIMAL_SPAWN_MIN_DISTANCE = 26; // out in the haze rather than appearing in plain view
export const ANIMAL_HERD_RADIUS = 5;
export const ANIMAL_SPAWN_TRIES = 6;
export const ANIMAL_FLEE_SECONDS = 1.6;
export const ANIMAL_FLEE_SPEED_FACTOR = 3;
export const ANIMAL_MAX_STEP = 1;
export const ANIMAL_GROUND_CHECK_FRAMES = 15; // the ground can be dug away from under a standing animal
export const BOAR_MIN_DISTANCE_FROM_START = 130;
const ARROW_HIT_RADIUS = 0.75;
const ANIMAL_RESPAWN_SECONDS = 25;

export interface ArrowHit {
  animal: any;
  species: any;
  position: THREE.Vector3;
}

export const ANIMAL_SPECIES = {
  // The only animal that can be hunted, and only found far from the garden
  boar: {
    herdSize: 2, speed: 1.2, fleeDistance: 6, hipHeight: 0.3, hop: 0, legSpeed: 11,
    huntable: true, health: 2, minDistanceFromStart: BOAR_MIN_DISTANCE_FROM_START,
    drops: [['meat', 2], ['hide', 1]],
    tints: [0xffffff, 0xe0d4c6, 0xc9bcae],
    parts: [
      [-0.14, 0.15, 0.24, 0.1, 0.3, 0.1, 0x2c2019, 1], [0.14, 0.15, 0.24, 0.1, 0.3, 0.1, 0x2c2019, -1],
      [-0.14, 0.15, -0.24, 0.1, 0.3, 0.1, 0x2c2019, -1], [0.14, 0.15, -0.24, 0.1, 0.3, 0.1, 0x2c2019, 1],
      [0, 0.5, 0, 0.42, 0.42, 0.8, 0x4a3628], [0, 0.74, -0.02, 0.1, 0.08, 0.66, 0x2c2019],
      [0, 0.52, 0.48, 0.3, 0.3, 0.26, 0x3f2e22], [0, 0.46, 0.66, 0.16, 0.14, 0.12, 0x6b4b38],
      [-0.1, 0.4, 0.66, 0.03, 0.1, 0.03, 0xf2ead8], [0.1, 0.4, 0.66, 0.03, 0.1, 0.03, 0xf2ead8],
      [-0.152, 0.58, 0.54, 0.012, 0.05, 0.05, 0x000000], [0.152, 0.58, 0.54, 0.012, 0.05, 0.05, 0x000000],
      [0, 0.56, -0.43, 0.04, 0.2, 0.04, 0x2c2019]
    ]
  },
  deer: {
    herdSize: 3, speed: 1.3, fleeDistance: 5, hipHeight: 0.6, hop: 0, legSpeed: 9,
    tints: [0xffffff, 0xe8dccb, 0xfff1e0],
    parts: [
      [-0.14, 0.3, 0.3, 0.1, 0.6, 0.1, 0x7a5230, 1], [0.14, 0.3, 0.3, 0.1, 0.6, 0.1, 0x7a5230, -1],
      [-0.14, 0.3, -0.3, 0.1, 0.6, 0.1, 0x7a5230, -1], [0.14, 0.3, -0.3, 0.1, 0.6, 0.1, 0x7a5230, 1],
      [0, 0.78, 0, 0.34, 0.36, 0.85, 0x9a6b3f], [0, 0.61, 0, 0.3, 0.03, 0.7, 0xe6d3b8],
      [0, 1.02, 0.42, 0.16, 0.42, 0.16, 0x9a6b3f], [0, 1.26, 0.52, 0.2, 0.2, 0.32, 0xa8784a],
      [0, 1.21, 0.7, 0.12, 0.1, 0.06, 0x2c1b12],
      [-0.105, 1.3, 0.58, 0.012, 0.05, 0.05, 0x000000], [0.105, 1.3, 0.58, 0.012, 0.05, 0.05, 0x000000],
      [-0.08, 1.48, 0.44, 0.03, 0.26, 0.03, 0x5a4330], [0.08, 1.48, 0.44, 0.03, 0.26, 0.03, 0x5a4330],
      [-0.13, 1.54, 0.44, 0.09, 0.03, 0.03, 0x5a4330], [0.13, 1.54, 0.44, 0.09, 0.03, 0.03, 0x5a4330],
      [0, 0.9, -0.46, 0.1, 0.12, 0.07, 0xf4efe4]
    ]
  },
  sheep: {
    herdSize: 4, speed: 0.75, fleeDistance: 3.5, hipHeight: 0.35, hop: 0, legSpeed: 7,
    tints: [0xffffff, 0xf2eee4, 0xd9d4c8],
    parts: [
      [-0.13, 0.17, 0.22, 0.09, 0.35, 0.09, 0x2f2a28, 1], [0.13, 0.17, 0.22, 0.09, 0.35, 0.09, 0x2f2a28, -1],
      [-0.13, 0.17, -0.22, 0.09, 0.35, 0.09, 0x2f2a28, -1], [0.13, 0.17, -0.22, 0.09, 0.35, 0.09, 0x2f2a28, 1],
      [0, 0.56, 0, 0.46, 0.42, 0.72, 0xf7f4ec], [0, 0.8, 0, 0.32, 0.08, 0.5, 0xffffff],
      [0, 0.7, 0.42, 0.2, 0.22, 0.24, 0x38302c],
      [-0.102, 0.74, 0.48, 0.012, 0.05, 0.05, 0x000000], [0.102, 0.74, 0.48, 0.012, 0.05, 0.05, 0x000000],
      [-0.15, 0.78, 0.38, 0.1, 0.05, 0.05, 0x38302c], [0.15, 0.78, 0.38, 0.1, 0.05, 0.05, 0x38302c]
    ]
  },
  rabbit: {
    herdSize: 2, speed: 1.1, fleeDistance: 4, hipHeight: 0, hop: 0.32, legSpeed: 0,
    tints: [0xffffff, 0xbfa58a, 0x9c9894],
    parts: [
      [0, 0.17, -0.02, 0.2, 0.2, 0.34, 0xf1ece4], [0, 0.32, 0.18, 0.16, 0.16, 0.17, 0xf1ece4],
      [-0.082, 0.35, 0.22, 0.01, 0.04, 0.04, 0x000000], [0.082, 0.35, 0.22, 0.01, 0.04, 0.04, 0x000000],
      [-0.04, 0.48, 0.15, 0.04, 0.2, 0.05, 0xf1ece4], [0.04, 0.48, 0.15, 0.04, 0.2, 0.05, 0xf1ece4],
      [-0.04, 0.48, 0.178, 0.02, 0.15, 0.01, 0xf2a6b4], [0.04, 0.48, 0.178, 0.02, 0.15, 0.01, 0xf2a6b4],
      [0, 0.2, -0.21, 0.08, 0.08, 0.06, 0xffffff]
    ]
  }
};

// Animals that wander near the player and run away when approached. They walk on real blocks
// and turn back at water, cliffs, trees and walls. Each player's animals are their own.
export class AnimalSystem {
  declare dummy: any;
  declare frame: any;
  declare herds: any;
  declare time: any;
  declare world: any;

  constructor(scene, world, counts = QUALITY.animals) {
    this.world = world;
    this.time = { value: 0 };
    this.dummy = new THREE.Object3D();
    this.herds = [];

    for (const [name, species] of Object.entries(ANIMAL_SPECIES)) {
      const count = counts[name];
      const mesh = new THREE.InstancedMesh(this.createGeometry(species, count), this.createMaterial(species), count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false; // see PetalSystem: r128 culls this at the world origin
      mesh.visible = false;
      const tint = new THREE.Color();
      const animals = [];
      for (let i = 0; i < count; i++) {
        mesh.setColorAt(i, tint.setHex(species.tints[Math.floor(Math.random() * species.tints.length)]));
        animals.push({
          index: i, active: false, x: 0, y: 0, z: 0, yaw: 0, targetYaw: 0, timer: 0, moving: false,
          fleeing: 0, cellX: null, cellZ: null, groundY: 0, scale: 0.9 + Math.random() * 0.2,
          phase: Math.random() * Math.PI * 2
        });
      }
      mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);
      this.herds.push({ species, mesh, animals, moving: mesh.geometry.getAttribute('aMoving') });
    }
  }

  createGeometry(species, count) {
    const positions = [];
    const normals = [];
    const colors = [];
    const legs = [];
    const color = new THREE.Color();
    const pushFace = (corners, normal, leg) => {
      for (const i of [0, 1, 2, 0, 2, 3]) {
        positions.push(...corners[i]);
        normals.push(...normal);
        colors.push(color.r, color.g, color.b);
        legs.push(leg);
      }
    };
    for (const [cx, cy, cz, sx, sy, sz, hex, leg = 0] of species.parts) {
      color.setHex(hex);
      const x0 = cx - sx / 2, x1 = cx + sx / 2;
      const y0 = cy - sy / 2, y1 = cy + sy / 2;
      const z0 = cz - sz / 2, z1 = cz + sz / 2;
      pushFace([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], leg);
      pushFace([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], leg);
      pushFace([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], leg);
      pushFace([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], leg);
      pushFace([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], leg);
      pushFace([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], leg);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aLeg', new THREE.Float32BufferAttribute(legs, 1));
    const moving = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
    moving.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aMoving', moving);
    return geometry;
  }

  createMaterial(species) {
    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uAnimalTime = this.time;
      shader.vertexShader = `
        uniform float uAnimalTime;
        attribute float aLeg;
        attribute float aMoving;
      ` + shader.vertexShader;
      // Legs swing from the hip, opposite pairs in turn, only while the animal is walking
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float legReach = clamp(${species.hipHeight.toFixed(2)} - position.y, 0.0, 1.0);
        float legSwing = sin(uAnimalTime * ${species.legSpeed.toFixed(1)} + instanceMatrix[3][0] + instanceMatrix[3][2]);
        transformed.z += aLeg * aMoving * legReach * legSwing * 0.7;
        `
      );
    };
    return material;
  }

  // Where an animal could stand in this column, looking at the real blocks because players dig
  // and build. Scans down from one step above the reference height. Returns null if there is no
  // footing within maxDrop, or for water. The chunk check comes first: reading a block in an
  // unloaded chunk would generate it mid-frame.
  getStandableGround(x, z, referenceY, maxDrop) {
    const cellX = Math.floor(x);
    const cellZ = Math.floor(z);
    const world = this.world;
    if (!world.getLoadedChunk(Math.floor(cellX / CHUNK_SIZE), Math.floor(cellZ / CHUNK_SIZE))) return null;

    const lowest = Math.max(1, referenceY - maxDrop);
    for (let y = referenceY + ANIMAL_MAX_STEP; y >= lowest; y--) {
      const below = world.getBlock(cellX, y - 1, cellZ);
      if (below === BLOCK_DEFS.AIR) continue;
      if (below === BLOCK_DEFS.WATER) return null;
      const hasRoom = world.getBlock(cellX, y, cellZ) === BLOCK_DEFS.AIR &&
                      world.getBlock(cellX, y + 1, cellZ) === BLOCK_DEFS.AIR;
      return hasRoom ? y : null;
    }
    return null;
  }

  respawn(animal, species, herdMates, center, range) {
    if (animal.respawnIn > 0) return;
    const leader = herdMates.find(mate => mate !== animal && mate.active);
    for (let i = 0; i < ANIMAL_SPAWN_TRIES; i++) {
      let x, z;
      if (leader && i < ANIMAL_SPAWN_TRIES / 2) {
        x = leader.x + (Math.random() * 2 - 1) * ANIMAL_HERD_RADIUS;
        z = leader.z + (Math.random() * 2 - 1) * ANIMAL_HERD_RADIUS;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const distance = ANIMAL_SPAWN_MIN_DISTANCE + Math.random() * Math.max(1, range - ANIMAL_SPAWN_MIN_DISTANCE);
        x = center.x + Math.cos(angle) * distance;
        z = center.z + Math.sin(angle) * distance;
      }
      if (Math.hypot(x - center.x, z - center.z) >= range) continue;
      if (species.minDistanceFromStart && Math.hypot(x, z) < species.minDistanceFromStart) continue;
      if (!this.world.getLoadedChunk(Math.floor(Math.floor(x) / CHUNK_SIZE), Math.floor(Math.floor(z) / CHUNK_SIZE))) continue;
      const terrain = this.world.getTerrainHeight(Math.floor(x), Math.floor(z));
      const ground = this.getStandableGround(x, z, terrain + 1, CHUNK_HEIGHT);
      if (ground === null) continue;

      Object.assign(animal, {
        active: true, x, z, y: ground, groundY: ground, yaw: Math.random() * Math.PI * 2,
        cellX: Math.floor(x), cellZ: Math.floor(z), moving: false, fleeing: 0, timer: Math.random() * 3,
        health: species.health || 1
      });
      animal.targetYaw = animal.yaw;
      return;
    }
  }

  // Falls if the ground was dug away; climbs out if a block was placed where the animal stands
  checkFooting(animal) {
    const ground = this.getStandableGround(animal.x, animal.z, animal.groundY, CHUNK_HEIGHT);
    if (ground === null) animal.active = false; // now in water or walled in: reappear elsewhere
    else animal.groundY = ground;
  }

  updateAnimal(animal, species, dt, center) {
    const toPlayerX = animal.x - center.x;
    const toPlayerZ = animal.z - center.z;
    if (Math.hypot(toPlayerX, toPlayerZ) < species.fleeDistance && animal.fleeing <= 0) {
      animal.fleeing = ANIMAL_FLEE_SECONDS;
      animal.targetYaw = Math.atan2(toPlayerX, toPlayerZ);
      animal.moving = true;
    }
    animal.fleeing = Math.max(0, animal.fleeing - dt);

    animal.timer -= dt;
    if (animal.timer <= 0 && animal.fleeing <= 0) {
      animal.moving = !animal.moving;
      animal.timer = animal.moving ? 2 + Math.random() * 4 : 1.5 + Math.random() * 4;
      if (animal.moving) animal.targetYaw = animal.yaw + (Math.random() - 0.5) * Math.PI * 1.6;
    }

    const turn = Math.atan2(Math.sin(animal.targetYaw - animal.yaw), Math.cos(animal.targetYaw - animal.yaw));
    animal.yaw += turn * Math.min(1, dt * 5);

    if (animal.moving) {
      const speed = species.speed * (animal.fleeing > 0 ? ANIMAL_FLEE_SPEED_FACTOR : 1);
      const nextX = animal.x + Math.sin(animal.yaw) * speed * dt;
      const nextZ = animal.z + Math.cos(animal.yaw) * speed * dt;
      const cellX = Math.floor(nextX);
      const cellZ = Math.floor(nextZ);

      if (cellX === animal.cellX && cellZ === animal.cellZ) {
        animal.x = nextX;
        animal.z = nextZ;
      } else {
        const ground = this.getStandableGround(nextX, nextZ, animal.groundY, ANIMAL_MAX_STEP);
        if (ground !== null) {
          animal.x = nextX;
          animal.z = nextZ;
          animal.cellX = cellX;
          animal.cellZ = cellZ;
          animal.groundY = ground;
        } else {
          // Water, a cliff, a tree or a wall: turn back and try another way
          animal.targetYaw = animal.yaw + Math.PI * (0.6 + Math.random() * 0.8);
          animal.timer = Math.max(animal.timer, 1);
        }
      }
    }
    animal.y = THREE.MathUtils.lerp(animal.y, animal.groundY, Math.min(1, dt * 10));
  }

  // Whether an arrow's path this frame touched a huntable animal. Garden animals are never hit.
  hitTestArrow(from: THREE.Vector3, to: THREE.Vector3): ArrowHit | null {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const lengthSquared = dx * dx + dy * dy + dz * dz || 1;
    for (const { species, animals } of this.herds) {
      if (!species.huntable) continue;
      for (const animal of animals) {
        if (!animal.active) continue;
        const cy = animal.y + species.hipHeight + 0.2;
        const t = Math.max(0, Math.min(1, ((animal.x - from.x) * dx + (cy - from.y) * dy + (animal.z - from.z) * dz) / lengthSquared));
        const distance = Math.hypot(from.x + dx * t - animal.x, from.y + dy * t - cy, from.z + dz * t - animal.z);
        if (distance <= ARROW_HIT_RADIUS) {
          return { animal, species, position: new THREE.Vector3(animal.x, cy, animal.z) };
        }
      }
    }
    return null;
  }

  // Returns true if the arrow killed it. A wounded animal runs from where the shot came from.
  damage(hit: ArrowHit, shotFrom: THREE.Vector3): boolean {
    const { animal } = hit;
    animal.health -= 1;
    if (animal.health <= 0) {
      animal.active = false;
      animal.respawnIn = ANIMAL_RESPAWN_SECONDS;
      return true;
    }
    animal.fleeing = ANIMAL_FLEE_SECONDS;
    animal.moving = true;
    animal.targetYaw = Math.atan2(animal.x - shotFrom.x, animal.z - shotFrom.z);
    return false;
  }

  update(dt, center, viewRadius) {
    this.time.value += dt;
    this.frame = (this.frame || 0) + 1;
    const range = Math.min(ANIMAL_MAX_RANGE, viewRadius * CHUNK_SIZE);

    for (const herd of this.herds) {
      const { species, mesh, animals, moving } = herd;
      let anyActive = false;

      animals.forEach((animal, i) => {
        if (animal.active && Math.hypot(animal.x - center.x, animal.z - center.z) >= range) animal.active = false;
        const mates = animals.slice(i - (i % species.herdSize), i - (i % species.herdSize) + species.herdSize);
        animal.respawnIn = Math.max(0, (animal.respawnIn || 0) - dt);
        if (!animal.active) this.respawn(animal, species, mates, center, range);

        if (!animal.active) {
          this.dummy.scale.setScalar(0);
        } else {
          anyActive = true;
          this.updateAnimal(animal, species, dt, center);
          if ((this.frame + animal.index) % ANIMAL_GROUND_CHECK_FRAMES === 0) this.checkFooting(animal);
          const hop = animal.moving ? Math.abs(Math.sin(this.time.value * 9 + animal.phase)) * species.hop : 0;
          this.dummy.position.set(animal.x, animal.y + hop, animal.z);
          this.dummy.rotation.set(0, animal.yaw, 0);
          this.dummy.scale.setScalar(animal.scale);
        }
        this.dummy.updateMatrix();
        mesh.setMatrixAt(animal.index, this.dummy.matrix);
        moving.setX(animal.index, animal.active && animal.moving ? 1 : 0);
      });

      mesh.visible = anyActive;
      mesh.instanceMatrix.needsUpdate = true;
      moving.needsUpdate = true;
    }
  }
}
