// =========================================================================
// 8. 3RD-PERSON VOXEL CHARACTER (Pink Kimono with Damped Limbs)
// =========================================================================
export class VoxelCharacter {
  declare armL: any;
  declare armR: any;
  declare body: any;
  declare group: any;
  declare head: any;
  declare legL: any;
  declare legR: any;
  declare swingAmount: any;
  declare visible: any;
  declare walkCycle: any;

  constructor(scene, kimonoColor = 0xf472b6) {
    this.group = new THREE.Group();
    this.visible = false;
    this.walkCycle = 0;
    this.swingAmount = 0.0;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd1b3, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x211717, roughness: 0.8 });
    const kimonoMat = new THREE.MeshStandardMaterial({ color: kimonoColor, roughness: 0.7 });
    const obiMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3b1d28, roughness: 0.8 });

    const headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 1.38;
    this.group.add(this.head);

    const hairGeo = new THREE.BoxGeometry(0.52, 0.22, 0.52);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.16;
    this.head.add(hair);

    const bodyGeo = new THREE.BoxGeometry(0.52, 0.65, 0.32);
    this.body = new THREE.Mesh(bodyGeo, kimonoMat);
    this.body.position.y = 0.82;
    this.group.add(this.body);

    const obiGeo = new THREE.BoxGeometry(0.54, 0.16, 0.34);
    const obi = new THREE.Mesh(obiGeo, obiMat);
    this.body.add(obi);

    const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    this.armL = new THREE.Mesh(armGeo, kimonoMat);
    this.armL.position.set(-0.36, 0.82, 0);
    this.armR = new THREE.Mesh(armGeo, kimonoMat);
    this.armR.position.set(0.36, 0.82, 0);
    this.group.add(this.armL);
    this.group.add(this.armR);

    const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.2);
    this.legL = new THREE.Mesh(legGeo, pantsMat);
    this.legL.position.set(-0.14, 0.27, 0);
    this.legR = new THREE.Mesh(legGeo, pantsMat);
    this.legR.position.set(0.14, 0.27, 0);
    this.group.add(this.legL);
    this.group.add(this.legR);

    scene.add(this.group);
  }

  update(pos, yaw, isMoving, dt) {
    this.group.position.copy(pos);
    this.group.rotation.y = yaw;
    this.group.visible = this.visible;

    this.swingAmount = THREE.MathUtils.lerp(this.swingAmount, isMoving ? 0.45 : 0.0, dt * 8.0);
    if (isMoving) {
      this.walkCycle += dt * 10;
    }

    const swing = Math.sin(this.walkCycle) * this.swingAmount;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing;
    this.armR.rotation.x = swing;
  }
}
