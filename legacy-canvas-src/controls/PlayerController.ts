import * as THREE from 'three';
import { Terrain } from '../world/Terrain.ts';
import { Structures } from '../world/Structures.ts';
import { SoundEngine } from '../audio/SoundEngine.ts';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private euler: THREE.Euler;

  private isLocked: boolean = false;
  private keys: { [key: string]: boolean } = {};

  private playerHeight = 1.75;
  private walkSpeed = 7.5;
  private runSpeed = 15.0;
  private gravity = 28.0;
  private verticalVelocity = 0;
  private isGrounded = true;

  private footstepTimer = 0;
  private soundEngine: SoundEngine;
  public onShrineDiscovered?: (shrineName: string, count: number) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, soundEngine: SoundEngine) {
    this.camera = camera;
    this.soundEngine = soundEngine;

    // Position player directly in the cherry grove matching reference photo
    this.position = new THREE.Vector3(0, 3.75, 10);
    this.camera.position.copy(this.position);
    this.velocity = new THREE.Vector3();
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.setupInputs();
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Global click listener so clicking ANYWHERE on the screen (except buttons/sliders) enters walk mode!
    window.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('.mood-btn') ||
        target.closest('.action-btn') ||
        target.closest('.glass-panel')
      ) {
        return; // Allow interacting with UI buttons & sliders
      }

      if (!this.isLocked) {
        document.body.requestPointerLock();
      }
    });

    // Also support clicking directly on the center prompt
    const hint = document.getElementById('click-to-play-hint');
    if (hint) {
      hint.style.pointerEvents = 'auto';
      hint.style.cursor = 'pointer';
      hint.addEventListener('click', () => {
        if (!this.isLocked) {
          document.body.requestPointerLock();
        }
      });
    }

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement !== null;
      if (this.isLocked) {
        document.body.classList.add('pointer-locked');
      } else {
        document.body.classList.remove('pointer-locked');
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const sensitivity = 0.0022;
      this.euler.y -= e.movementX * sensitivity;
      this.euler.x -= e.movementY * sensitivity;

      this.euler.x = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.euler.x));
      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  public get locked(): boolean {
    return this.isLocked;
  }

  public update(delta: number, terrain: Terrain, structures: Structures): void {
    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.x += 1;

    const isRunning = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const currentSpeed = isRunning ? this.runSpeed : this.walkSpeed;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();

      const yaw = this.euler.y;
      const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

      const worldMove = new THREE.Vector3()
        .addScaledVector(forward, -moveDir.z)
        .addScaledVector(right, moveDir.x);

      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, worldMove.x * currentSpeed, delta * 10);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, worldMove.z * currentSpeed, delta * 10);

      if (this.isGrounded) {
        this.footstepTimer += delta * (isRunning ? 2.8 : 1.8);
        if (this.footstepTimer >= 1.0) {
          this.soundEngine.playFootstep();
          this.footstepTimer = 0;
        }
      }
    } else {
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, delta * 12);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, delta * 12);
    }

    if (this.keys['Space'] && this.isGrounded) {
      this.verticalVelocity = 9.5;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * delta;
    }

    const oldX = this.position.x;
    const oldZ = this.position.z;
    const nextX = oldX + this.velocity.x * delta;
    const nextZ = oldZ + this.velocity.z * delta;

    const rawGroundAhead = terrain.getHeightAt(nextX, nextZ);
    const currentFeetY = this.position.y - this.playerHeight;
    const stepDiff = rawGroundAhead - currentFeetY;

    // In Minecraft, player can step up 1 block (<= 2.2 units) automatically
    if (stepDiff > terrain.blockSize * 1.15 && this.isGrounded) {
      // Collided with vertical cliff wall
      this.velocity.x = 0;
      this.velocity.z = 0;
    } else {
      this.position.x = nextX;
      this.position.z = nextZ;
    }

    this.position.y += this.verticalVelocity * delta;

    const currentGroundHeight = terrain.getHeightAt(this.position.x, this.position.z);
    const targetY = currentGroundHeight + this.playerHeight;

    if (this.position.y <= targetY) {
      this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, Math.min(delta * 25, 1.0));
      if (Math.abs(this.position.y - targetY) < 0.02) {
        this.position.y = targetY;
      }
      this.verticalVelocity = 0;
      this.isGrounded = true;
    }

    let headBob = 0;
    if (this.isGrounded && (Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.z) > 0.5)) {
      headBob = Math.sin(this.footstepTimer * Math.PI * 2.0) * 0.06;
    }

    this.camera.position.set(this.position.x, this.position.y + headBob, this.position.z);

    structures.shrines.forEach((shrine) => {
      if (!shrine.discovered) {
        const dist = this.position.distanceTo(shrine.position);
        if (dist < 10.0) {
          shrine.discovered = true;
          this.soundEngine.playShrineChime();
          const discoveredCount = structures.shrines.filter((s) => s.discovered).length;
          if (this.onShrineDiscovered) {
            this.onShrineDiscovered(shrine.name, discoveredCount);
          }
        }
      }
    });
  }
}
