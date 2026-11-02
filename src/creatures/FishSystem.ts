import { QUALITY, WATER_LEVEL } from '../config';

// =========================================================================
// 6. INSTANCED FALLING PETALS (GPU Instancing & Smooth Sine Motion)
// =========================================================================
export const FISH_SCHOOL_SIZE = 5;
export const FISH_RANGE = 44; // schools live within this distance of the player, along the river
export const FISH_FLEE_DISTANCE = 4.5;
export const FISH_FLEE_SECONDS = 1.5;
export const FISH_FLEE_SPEED_FACTOR = 3.5;
export const FISH_MAX_LANE = 0.7; // share of the river's half width; the edges are too shallow
export const FISH_SURFACE_Y = WATER_LEVEL + 0.6;
export const FISH_ABOVE_BED = 1.25;
export const FISH_BED_REFRESH_FRAMES = 8;
export const FISH_COLORS = [0xff7a2a, 0xf4f0e6, 0xd9342b, 0xf5c542, 0x9fb4c7, 0xff9d5c];

// Schools of koi that swim along the river. Each school is a position along the river plus a
// lane across it, so the fish follow every bend and never need collision checks against banks.
export class FishSystem {
  declare dummy: any;
  declare frame: any;
  declare mesh: any;
  declare schools: any;
  declare time: any;
  declare world: any;

  constructor(scene, world, count = QUALITY.fish) {
    this.world = world;
    this.frame = 0;
    this.time = { value: 0 };
    this.dummy = new THREE.Object3D();

    this.mesh = new THREE.InstancedMesh(this.createGeometry(), this.createMaterial(), count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false; // see PetalSystem: r128 culls this at the world origin
    scene.add(this.mesh);

    this.schools = [];
    const tint = new THREE.Color();
    for (let start = 0; start < count; start += FISH_SCHOOL_SIZE) {
      const school = { active: false, z: 0, lane: 0, depth: 0, dir: 1, speed: 1, drift: 0, fleeing: 0, members: [] };
      const main = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
      const size = Math.min(FISH_SCHOOL_SIZE, count - start);
      for (let m = 0; m < size; m++) {
        const index = start + m;
        // Mostly one colour per school, with the odd fish that stands out
        const color = Math.random() < 0.7 ? main : FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
        this.mesh.setColorAt(index, tint.setHex(color));
        school.members.push({
          index,
          offsetZ: (Math.random() - 0.5) * 3.2,
          offsetLane: (Math.random() - 0.5) * 0.3,
          offsetDepth: (Math.random() - 0.5) * 0.3,
          scale: 0.75 + Math.random() * 0.45,
          position: new THREE.Vector3(),
          yaw: 0,
          bed: 0
        });
      }
      this.schools.push(school);
    }
    this.mesh.instanceColor.needsUpdate = true;
  }

  // A blocky koi pointing along +z. Colour is multiplied by the instance tint: white keeps it,
  // above 1 gives the paler belly, and black makes the eyes.
  createGeometry() {
    const positions = [];
    const normals = [];
    const colors = [];
    const pushFace = (corners, normal, shade) => {
      for (const i of [0, 1, 2, 0, 2, 3]) {
        positions.push(...corners[i]);
        normals.push(...normal);
        colors.push(shade, shade, shade);
      }
    };
    const pushBox = (cx, cy, cz, sx, sy, sz, shade, bellyShade = shade) => {
      const x0 = cx - sx / 2, x1 = cx + sx / 2;
      const y0 = cy - sy / 2, y1 = cy + sy / 2;
      const z0 = cz - sz / 2, z1 = cz + sz / 2;
      pushFace([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], shade);
      pushFace([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], shade);
      pushFace([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], shade);
      pushFace([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], bellyShade);
      pushFace([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], shade);
      pushFace([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], shade);
    };

    pushBox(0, 0, 0.12, 0.2, 0.22, 0.34, 1, 1.25); // head and chest
    pushBox(0, 0, -0.16, 0.14, 0.17, 0.26, 1, 1.25); // rear body
    pushBox(0, 0, -0.34, 0.03, 0.26, 0.14, 0.85); // tail fin
    pushBox(0, 0.14, -0.02, 0.03, 0.07, 0.24, 0.85); // back fin
    pushBox(0.102, 0.04, 0.2, 0.012, 0.05, 0.05, 0); // right eye
    pushBox(-0.102, 0.04, 0.2, 0.012, 0.05, 0.05, 0); // left eye

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }

  createMaterial() {
    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uFishTime = this.time;
      shader.vertexShader = 'uniform float uFishTime;\n' + shader.vertexShader;
      // The tail sways more than the head. Each fish's position gives it its own rhythm.
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float tailAmount = clamp(0.1 - position.z, 0.0, 0.5);
        transformed.x += sin(uFishTime * 11.0 + instanceMatrix[3][0] + instanceMatrix[3][2]) * tailAmount * 0.32;
        `
      );
    };
    return material;
  }

  respawn(school, center, anywhere) {
    const side = Math.random() < 0.5 ? -1 : 1;
    school.z = anywhere
      ? center.z + (Math.random() * 2 - 1) * FISH_RANGE
      : center.z + side * FISH_RANGE * (0.75 + Math.random() * 0.25); // out in the haze, not in view
    school.lane = (Math.random() * 2 - 1) * FISH_MAX_LANE * 0.7;
    school.depth = 0.15 + Math.random() * 0.7;
    school.dir = Math.random() < 0.5 ? -1 : 1;
    school.speed = 0.9 + Math.random() * 0.9;
    school.drift = Math.random() * Math.PI * 2;
    school.fleeing = 0;
    school.active = true;
    school.members.forEach(m => { m.placed = false; });
  }

  update(dt, center) {
    this.time.value += dt;
    this.frame++;
    const world = this.world;
    let anyVisible = false;

    for (const school of this.schools) {
      if (!school.active) this.respawn(school, center, true);
      else if (Math.abs(school.z - center.z) > FISH_RANGE) this.respawn(school, center, false);

      // Far from the river there is nothing to see, so skip the work
      const nearRiver = Math.abs(world.getRiverCenter(school.z) - center.x) < FISH_RANGE;
      if (!nearRiver) {
        for (const m of school.members) {
          this.dummy.scale.setScalar(0);
          this.dummy.updateMatrix();
          this.mesh.setMatrixAt(m.index, this.dummy.matrix);
          m.placed = false;
        }
        this.dummy.scale.setScalar(1);
        continue;
      }
      anyVisible = true;

      const riverX = world.getRiverCenter(school.z) + school.lane * world.getRiverHalfWidth(school.z);
      if (Math.hypot(riverX - center.x, school.z - center.z) < FISH_FLEE_DISTANCE && school.fleeing <= 0) {
        school.fleeing = FISH_FLEE_SECONDS;
        school.dir = school.z >= center.z ? 1 : -1;
      }
      school.fleeing = Math.max(0, school.fleeing - dt);

      const speed = school.speed * (school.fleeing > 0 ? FISH_FLEE_SPEED_FACTOR : 1);
      school.z += school.dir * speed * dt;
      school.drift += dt * 0.5;
      school.lane = Math.max(-FISH_MAX_LANE, Math.min(FISH_MAX_LANE, school.lane + Math.sin(school.drift) * dt * 0.06));

      for (const m of school.members) {
        const z = school.z + m.offsetZ;
        const lane = Math.max(-FISH_MAX_LANE, Math.min(FISH_MAX_LANE, school.lane + m.offsetLane));
        const x = world.getRiverCenter(z) + lane * world.getRiverHalfWidth(z);

        if (!m.placed || (this.frame + m.index) % FISH_BED_REFRESH_FRAMES === 0) {
          m.bed = world.getTerrainHeight(Math.floor(x), Math.floor(z)) + 1;
        }
        // Capped at the surface: a fish crossing a very shallow spot must not rise out of the water
        const lowest = Math.min(FISH_SURFACE_Y, m.bed + FISH_ABOVE_BED - 1);
        const depth = Math.max(0, Math.min(1, school.depth + m.offsetDepth));
        const y = lowest + (FISH_SURFACE_Y - lowest) * depth;

        if (m.placed) {
          const dx = x - m.position.x;
          const dz = z - m.position.z;
          if (dx * dx + dz * dz > 1e-6) m.yaw = Math.atan2(dx, dz);
          // Easing makes depth changes gentle, but the fish must never sink into a rising bed
          m.position.set(x, Math.max(lowest, THREE.MathUtils.lerp(m.position.y, y, Math.min(1, dt * 2))), z);
        } else {
          m.position.set(x, y, z);
          m.yaw = school.dir > 0 ? 0 : Math.PI;
          m.placed = true;
        }

        this.dummy.position.copy(m.position);
        this.dummy.rotation.set(0, m.yaw, 0);
        this.dummy.scale.setScalar(m.scale);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(m.index, this.dummy.matrix);
      }
    }

    this.mesh.visible = anyVisible;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
