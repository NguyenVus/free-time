import * as THREE from 'three';
import { Terrain } from '../world/Terrain.ts';

export type CameraMode = 'walk' | 'drone' | 'meditation';

export class CinematicCamera {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'walk';

  // Drone Mode parameters
  private dronePos: THREE.Vector3;
  private droneVelocity: THREE.Vector3;
  private droneEuler: THREE.Euler;
  private isLocked: boolean = false;
  private keys: { [key: string]: boolean } = {};

  // Meditation Mode parameters
  private tourTime: number = 0;
  private scenicWaypoints: THREE.Vector3[] = [];
  private scenicTargets: THREE.Vector3[] = [];

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.dronePos = new THREE.Vector3(0, 25, 120);
    this.droneVelocity = new THREE.Vector3();
    this.droneEuler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.setupScenicWaypoints();
    this.setupInputs(domElement);
  }

  private setupScenicWaypoints(): void {
    // 5 Cinematic Waypoints & LookAt targets for the Zen Tour
    this.scenicWaypoints = [
      new THREE.Vector3(0, 3.8, 10),    // Cherry Grove Biome view (matching reference photo)
      new THREE.Vector3(-10, 5.0, 10),  // Tea Deck view
      new THREE.Vector3(20, 7.5, -12),  // Torii Gate cliff view
      new THREE.Vector3(0, 18, 28),     // Aerial Garden overview
      new THREE.Vector3(0, 5.0, 6)      // Sakura Beacon shrine view
    ];

    this.scenicTargets = [
      new THREE.Vector3(-1, 4.8, -2),   // Looking through branching cherry tree into sunlight
      new THREE.Vector3(-14, 4.0, 6),   // Looking at Tea Deck
      new THREE.Vector3(28, 6.0, -20),  // Looking at Torii Gate
      new THREE.Vector3(0, 3.0, -5),    // Looking at center garden
      new THREE.Vector3(0, 4.0, -20)    // Looking at Beacon beam
    ];
  }

  private setupInputs(domElement: HTMLElement): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mode !== 'drone' || !document.pointerLockElement) return;
      const sens = 0.0024;
      this.droneEuler.y -= e.movementX * sens;
      this.droneEuler.x -= e.movementY * sens;
      this.droneEuler.x = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.droneEuler.x));
    });
  }

  public setMode(mode: CameraMode): void {
    this.mode = mode;
    if (mode === 'drone') {
      this.dronePos.copy(this.camera.position);
      this.droneEuler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      document.body.classList.remove('cinematic-active');
    } else if (mode === 'meditation') {
      document.body.classList.add('cinematic-active');
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } else {
      document.body.classList.remove('cinematic-active');
    }
  }

  public update(delta: number, terrain: Terrain): void {
    if (this.mode === 'drone') {
      this.updateDrone(delta, terrain);
    } else if (this.mode === 'meditation') {
      this.updateMeditation(delta);
    }
  }

  private updateDrone(delta: number, terrain: Terrain): void {
    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW']) moveDir.z -= 1;
    if (this.keys['KeyS']) moveDir.z += 1;
    if (this.keys['KeyA']) moveDir.x -= 1;
    if (this.keys['KeyD']) moveDir.x += 1;
    if (this.keys['Space']) moveDir.y += 1;
    if (this.keys['ShiftLeft'] || this.keys['KeyC']) moveDir.y -= 1;

    const speed = 25.0;
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();

      const quat = new THREE.Quaternion().setFromEuler(this.droneEuler);
      const worldDir = moveDir.applyQuaternion(quat);

      this.droneVelocity.lerp(worldDir.multiplyScalar(speed), delta * 5.0);
    } else {
      this.droneVelocity.lerp(new THREE.Vector3(), delta * 5.0);
    }

    this.dronePos.addScaledVector(this.droneVelocity, delta);

    // Keep above terrain
    const minHeight = terrain.getHeightAt(this.dronePos.x, this.dronePos.z) + 1.5;
    if (this.dronePos.y < minHeight) {
      this.dronePos.y = minHeight;
    }

    this.camera.position.copy(this.dronePos);
    this.camera.quaternion.setFromEuler(this.droneEuler);
  }

  private updateMeditation(delta: number): void {
    this.tourTime += delta * 0.07; // Slow relaxing drift
    const totalWaypoints = this.scenicWaypoints.length;
    const currentProgress = this.tourTime % totalWaypoints;
    const currentIndex = Math.floor(currentProgress);
    const nextIndex = (currentIndex + 1) % totalWaypoints;
    const t = currentProgress - currentIndex;

    // Smooth smoothstep easing
    const smoothT = t * t * (3.0 - 2.0 * t);

    // Interpolate camera position
    const p1 = this.scenicWaypoints[currentIndex];
    const p2 = this.scenicWaypoints[nextIndex];
    this.camera.position.lerpVectors(p1, p2, smoothT);

    // Interpolate look-at target
    const t1 = this.scenicTargets[currentIndex];
    const t2 = this.scenicTargets[nextIndex];
    const target = new THREE.Vector3().lerpVectors(t1, t2, smoothT);

    this.camera.lookAt(target);
  }
}
