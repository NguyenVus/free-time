import { QUALITY } from '../config';

export const PETAL_SPREAD = 60;    // width of the box of petals around the player
export const PETAL_MAX_DIST = 36;    // recycled beyond this horizontal distance
export const PETAL_MIN_HEIGHT = -4;  // relative to the player
export const PETAL_MAX_HEIGHT = 15;
export const PETAL_WIND_DRIFT = 2.5;
export const PETAL_COLORS = [0xffc2d4, 0xffd6e2, 0xffe9f0, 0xffa8c5, 0xffffff];

export class PetalSystem {
  declare count: any;
  declare dummy: any;
  declare mesh: any;
  declare petals: any;
  declare rippleGeo: any;
  declare rippleGroup: any;
  declare rippleMat: any;
  declare ripples: any;
  declare scene: any;
  declare time: any;

  constructor(scene, count = QUALITY.flyingPetals) {
    this.scene = scene;
    this.count = count;
    this.time = 0;
    this.dummy = new THREE.Object3D();

    const outline = new THREE.Shape();
    outline.moveTo(0, -0.16);
    outline.quadraticCurveTo(0.15, -0.04, 0.09, 0.1);
    outline.quadraticCurveTo(0.04, 0.17, 0, 0.13);
    outline.quadraticCurveTo(-0.04, 0.17, -0.09, 0.1);
    outline.quadraticCurveTo(-0.15, -0.04, 0, -0.16);
    const geo = new THREE.ShapeGeometry(outline, 2);
    const mat = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Three r128 culls an InstancedMesh by its single geometry at the world origin, which
    // would hide every petal whenever the camera looks away from (0, 0, 0).
    this.mesh.frustumCulled = false;
    const tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      this.mesh.setColorAt(i, tint.setHex(PETAL_COLORS[i % PETAL_COLORS.length]));
    }
    this.mesh.instanceColor.needsUpdate = true;
    scene.add(this.mesh);

    this.petals = [];
    this.initPetals();

    this.ripples = [];
    this.rippleGeo = new THREE.RingGeometry(0.08, 0.18, 16);
    this.rippleGeo.rotateX(-Math.PI / 2);
    this.rippleMat = new THREE.MeshBasicMaterial({
      color: 0xa5d8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    this.rippleGroup = new THREE.Group();
    scene.add(this.rippleGroup);
  }

  initPetals() {
    this.petals = [];
    for (let i = 0; i < this.count; i++) {
      this.petals.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * PETAL_SPREAD,
          8 + Math.random() * 22,
          (Math.random() - 0.5) * PETAL_SPREAD
        ),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        fallSpeed: 0.45 + Math.random() * 0.55,
        spinSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 2.8,
          (Math.random() - 0.5) * 2.2
        ),
        flutterFreqX: 1.8 + Math.random() * 1.5,
        flutterFreqZ: 1.4 + Math.random() * 1.6,
        flutterAmpX: 0.35 + Math.random() * 0.45,
        flutterAmpZ: 0.30 + Math.random() * 0.40,
        phaseX: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        scale: 0.75 + Math.random() * 0.5,
        windSensitivity: 0.8 + Math.random() * 0.5,
        floatingTime: 0
      });
    }
  }

  burstAt(pos, count = 35) {
    for (let i = 0; i < count; i++) {
      const p = this.petals[Math.floor(Math.random() * this.petals.length)];
      p.pos.set(
        pos.x + (Math.random() - 0.5) * 2.5,
        pos.y + (Math.random() - 0.5) * 1.8,
        pos.z + (Math.random() - 0.5) * 2.5
      );
      p.fallSpeed = 0.5 + Math.random() * 1.4;
      p.floatingTime = 0;
    }
  }

  update(dt, playerPos, wind) {
    this.time += dt;
    const waterY = 6.02;
    const windAngle = wind ? wind.angle : 0.55;
    const windStrength = wind ? wind.strength : 0.35;
    const windDx = Math.cos(windAngle) * windStrength;
    const windDz = Math.sin(windAngle) * windStrength;

    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];

      if (p.pos.y <= waterY) {
        p.pos.y = waterY;
        p.floatingTime += dt;
        p.pos.x += windDx * 0.25 * dt;
        p.pos.z += windDz * 0.25 * dt;
        p.rot.x = THREE.MathUtils.lerp(p.rot.x, 0, dt * 3);
        p.rot.z = THREE.MathUtils.lerp(p.rot.z, 0, dt * 3);
        p.rot.y += 0.2 * dt;

        if (p.floatingTime > 3.0 || Math.hypot(p.pos.x - playerPos.x, p.pos.z - playerPos.z) > PETAL_MAX_DIST) {
          this.recyclePetal(p, playerPos, windDx, windDz);
        }
      } else {
        const flutterX = Math.sin(this.time * p.flutterFreqX + p.phaseX) * p.flutterAmpX;
        const flutterZ = Math.cos(this.time * p.flutterFreqZ + p.phaseZ) * p.flutterAmpZ;

        p.pos.y -= (p.fallSpeed - windStrength * 0.1) * dt;
        p.pos.x += (windDx * p.windSensitivity * PETAL_WIND_DRIFT + flutterX) * dt;
        p.pos.z += (windDz * p.windSensitivity * PETAL_WIND_DRIFT + flutterZ) * dt;

        p.rot.x += (p.spinSpeed.x + flutterX * 1.2) * dt;
        p.rot.y += p.spinSpeed.y * dt;
        p.rot.z += (p.spinSpeed.z + flutterZ * 1.2) * dt;

        if (p.pos.y < playerPos.y + PETAL_MIN_HEIGHT ||
            Math.hypot(p.pos.x - playerPos.x, p.pos.z - playerPos.z) > PETAL_MAX_DIST) {
          this.recyclePetal(p, playerPos, windDx, windDz);
        }
      }

      this.dummy.position.copy(p.pos);
      this.dummy.rotation.copy(p.rot);
      this.dummy.scale.set(p.scale, p.scale, p.scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  recyclePetal(p, playerPos, windDx, windDz) {
    const upwindX = -windDx * 10;
    const upwindZ = -windDz * 10;
    const spreadX = (Math.random() - 0.5) * PETAL_SPREAD;
    const spreadZ = (Math.random() - 0.5) * PETAL_SPREAD;

    p.pos.set(
      playerPos.x + upwindX + spreadX,
      playerPos.y + PETAL_MIN_HEIGHT + Math.random() * (PETAL_MAX_HEIGHT - PETAL_MIN_HEIGHT),
      playerPos.z + upwindZ + spreadZ
    );
    p.floatingTime = 0;
    p.fallSpeed = 0.45 + Math.random() * 0.55;
  }
}
