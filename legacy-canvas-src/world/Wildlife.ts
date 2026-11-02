import * as THREE from 'three';

interface VoxelBird {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  speed: number;
  radius: number;
  altitude: number;
  angle: number;
  center: THREE.Vector3;
}

export class Wildlife {
  public group: THREE.Group;
  private birds: VoxelBird[] = [];

  // Minecraft Fox
  private foxGroup: THREE.Group | null = null;
  private foxHead: THREE.Group | null = null;
  private foxTail: THREE.Group | null = null;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.createMinecraftFox();
    this.createMinecraftBirds();
  }

  /**
   * Builds an authentic cute Minecraft Japanese Red Fox
   */
  private createMinecraftFox(): void {
    const fox = new THREE.Group();
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xd9682b, roughness: 0.85 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f8fb, roughness: 0.85 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x212529, roughness: 0.9 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

    // 1. Torso (rectangular box)
    const bodyGeo = new THREE.BoxGeometry(0.7, 0.65, 1.4);
    const body = new THREE.Mesh(bodyGeo, orangeMat);
    body.position.set(0, 0.75, 0);
    body.castShadow = true;
    fox.add(body);

    // White belly underside
    const bellyGeo = new THREE.BoxGeometry(0.68, 0.15, 1.35);
    const belly = new THREE.Mesh(bellyGeo, whiteMat);
    belly.position.set(0, 0.45, 0);
    fox.add(belly);

    // 2. Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.25, 0.75);

    // Main head box
    const headGeo = new THREE.BoxGeometry(0.85, 0.65, 0.65);
    const head = new THREE.Mesh(headGeo, orangeMat);
    head.castShadow = true;
    headGroup.add(head);

    // White cheeks
    const cheekGeo = new THREE.BoxGeometry(0.86, 0.25, 0.55);
    const cheek = new THREE.Mesh(cheekGeo, whiteMat);
    cheek.position.set(0, -0.18, 0.05);
    headGroup.add(cheek);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.42, 0.3, 0.45);
    const snout = new THREE.Mesh(snoutGeo, orangeMat);
    snout.position.set(0, -0.12, 0.48);
    headGroup.add(snout);

    // Black nose tip
    const noseGeo = new THREE.BoxGeometry(0.18, 0.15, 0.12);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.06, 0.72);
    headGroup.add(nose);

    // Eyes
    for (const sign of [-1, 1]) {
      const eyeGeo = new THREE.BoxGeometry(0.12, 0.14, 0.05);
      const eye = new THREE.Mesh(eyeGeo, darkMat);
      eye.position.set(sign * 0.26, 0.08, 0.34);
      headGroup.add(eye);
    }

    // Triangular Ears
    for (const sign of [-1, 1]) {
      const earGroup = new THREE.Group();
      earGroup.position.set(sign * 0.32, 0.42, -0.05);

      const earGeo = new THREE.BoxGeometry(0.25, 0.35, 0.15);
      const ear = new THREE.Mesh(earGeo, orangeMat);
      earGroup.add(ear);

      const earInnerGeo = new THREE.BoxGeometry(0.15, 0.25, 0.05);
      const earInner = new THREE.Mesh(earInnerGeo, darkMat);
      earInner.position.set(0, -0.02, 0.06);
      earGroup.add(earInner);

      headGroup.add(earGroup);
    }

    fox.add(headGroup);
    this.foxHead = headGroup;

    // 3. Legs (4 little blocky paws)
    const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.24);
    const legOffsets = [
      { x: -0.24, z: 0.45 },
      { x: 0.24, z: 0.45 },
      { x: -0.24, z: -0.45 },
      { x: 0.24, z: -0.45 }
    ];

    legOffsets.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, darkMat);
      leg.position.set(pos.x, 0.32, pos.z);
      leg.castShadow = true;
      fox.add(leg);
    });

    // 4. Bushy Fox Tail with White Tip
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.9, -0.7);

    // Orange tail body
    const tailGeo = new THREE.BoxGeometry(0.48, 0.52, 0.9);
    const tail = new THREE.Mesh(tailGeo, orangeMat);
    tail.position.set(0, -0.15, -0.45);
    tail.castShadow = true;
    tailGroup.add(tail);

    // Fluffy white tail tip
    const tipGeo = new THREE.BoxGeometry(0.44, 0.48, 0.4);
    const tip = new THREE.Mesh(tipGeo, whiteMat);
    tip.position.set(0, -0.15, -0.95);
    tailGroup.add(tip);

    fox.add(tailGroup);
    this.foxTail = tailGroup;

    // Place cute fox on the meadow near the Grand Sakura tree
    fox.position.set(4.0, 3.0, 12.0);
    fox.rotation.y = -Math.PI * 0.75;
    fox.scale.set(1.2, 1.2, 1.2);

    this.group.add(fox);
    this.foxGroup = fox;
  }

  /**
   * Flock of Minecraft Flying Birds with flapping voxel wings
   */
  private createMinecraftBirds(): void {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 }); // Bluebird
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });

    for (let i = 0; i < 5; i++) {
      const birdGroup = new THREE.Group();

      // Body
      const bodyGeo = new THREE.BoxGeometry(0.45, 0.35, 0.9);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      birdGroup.add(body);

      // Head & Beak
      const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(0, 0.2, 0.5);
      birdGroup.add(head);

      const beakGeo = new THREE.BoxGeometry(0.18, 0.12, 0.25);
      const beak = new THREE.Mesh(beakGeo, beakMat);
      beak.position.set(0, 0.15, 0.75);
      birdGroup.add(beak);

      // Left Wing
      const wingGeo = new THREE.BoxGeometry(0.9, 0.08, 0.5);
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-0.55, 0.1, 0);
      birdGroup.add(leftWing);

      // Right Wing
      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(0.55, 0.1, 0);
      birdGroup.add(rightWing);

      birdGroup.scale.set(1.2, 1.2, 1.2);
      this.group.add(birdGroup);

      this.birds.push({
        group: birdGroup,
        leftWing,
        rightWing,
        speed: 0.15 + i * 0.02,
        radius: 80 + i * 22,
        altitude: 45 + i * 8,
        angle: (i * Math.PI * 2) / 5,
        center: new THREE.Vector3(10, 0, -20)
      });
    }
  }

  public update(delta: number): void {
    const time = performance.now() * 0.001;

    // 1. Fox Idle Animation
    if (this.foxHead && this.foxTail) {
      // Subtle curious head tilt
      this.foxHead.rotation.y = Math.sin(time * 0.8) * 0.25;
      this.foxHead.rotation.x = Math.sin(time * 1.4) * 0.1;

      // Tail gentle wag
      this.foxTail.rotation.y = Math.sin(time * 2.2) * 0.35;
      this.foxTail.rotation.x = -0.3 + Math.sin(time * 1.1) * 0.08;
    }

    // 2. Flying Birds Animation
    this.birds.forEach((bird) => {
      bird.angle += bird.speed * delta;

      const x = bird.center.x + Math.cos(bird.angle) * bird.radius;
      const z = bird.center.z + Math.sin(bird.angle) * bird.radius;
      const y = bird.altitude + Math.sin(bird.angle * 2.0) * 3.5;

      bird.group.position.set(x, y, z);

      // Direction of travel
      const tangentX = -Math.sin(bird.angle);
      const tangentZ = Math.cos(bird.angle);
      bird.group.lookAt(x + tangentX, y, z + tangentZ);

      // Flapping wings
      const flap = Math.sin(time * 12.0) * 0.55;
      bird.leftWing.rotation.z = flap;
      bird.rightWing.rotation.z = -flap;
    });
  }
}
