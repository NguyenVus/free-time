import { ITEMS } from '../items/items';

const SWING_SECONDS = 0.28;
const BOW_SHOWN_SECONDS = 1.1;
// Where things are held: the character's right hand, or the bottom right of the first-person view
const IN_HAND = new THREE.Vector3(0.36, 0.72, -0.34);
const IN_VIEW = new THREE.Vector3(0.34, -0.36, -0.62);
const ARM_RAISED_ANGLE = 0.9;
const SWING_ANGLE = 1.3;
const BOW_TURN_IN_VIEW = 1.15;

type ToolModel = 'wooden_pickaxe' | 'stone_pickaxe' | 'bow';

const box = (w: number, h: number, d: number, color: number, x: number, y: number, z: number): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  mesh.position.set(x, y, z);
  return mesh;
};

const createPickaxe = (headColor: number): THREE.Group => {
  const group = new THREE.Group();
  group.add(box(0.05, 0.62, 0.05, 0x8a5a2b, 0, 0.2, 0), box(0.42, 0.08, 0.08, headColor, 0, 0.48, 0));
  group.add(box(0.08, 0.06, 0.08, headColor, -0.23, 0.44, 0), box(0.08, 0.06, 0.08, headColor, 0.23, 0.44, 0));
  return group;
};

const createBow = (): THREE.Group => {
  const group = new THREE.Group();
  // A curve made of short pieces, with the string straight across its ends
  for (let i = -3; i <= 3; i++) {
    const piece = box(0.05, 0.14, 0.05, 0x7a4a24, 0, i * 0.12, -0.16 + Math.abs(i) * Math.abs(i) * 0.018);
    piece.rotation.x = i * 0.13;
    group.add(piece);
  }
  group.add(box(0.012, 0.8, 0.012, 0xf4f0e6, 0, 0, 0));
  return group;
};

/** What the player is visibly carrying. Purely visual: only this player sees it for now. */
export class HeldItem {
  private root = new THREE.Group();
  private tools: Record<ToolModel, THREE.Group>;
  private block: THREE.Mesh;
  private blockMaterials = new Map<string, THREE.MeshLambertMaterial>();
  private swing = 0;
  private bowTime = 0;
  private shown: string | null = null;

  constructor(private textures: Record<string, { texture?: THREE.Texture }>) {
    this.tools = {
      wooden_pickaxe: createPickaxe(0xb08350),
      stone_pickaxe: createPickaxe(0x8b8d96),
      bow: createBow()
    };
    Object.values(this.tools).forEach(tool => {
      tool.visible = false;
      this.root.add(tool);
    });
    this.block = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24));
    this.block.visible = false;
    this.root.add(this.block);
  }

  /** Name of what is showing, or null for an empty hand. */
  get showing(): string | null {
    return this.shown;
  }

  startSwing() {
    this.swing = SWING_SECONDS;
  }

  showBow() {
    this.bowTime = BOW_SHOWN_SECONDS;
  }

  private show(itemId: string | null) {
    this.shown = itemId;
    (Object.keys(this.tools) as ToolModel[]).forEach(id => {
      this.tools[id].visible = id === itemId;
    });
    const texture = itemId && ITEMS[itemId]?.texture ? this.textures[ITEMS[itemId].texture]?.texture : undefined;
    this.block.visible = !!texture;
    if (texture) {
      if (!this.blockMaterials.has(itemId)) this.blockMaterials.set(itemId, new THREE.MeshLambertMaterial({ map: texture }));
      this.block.material = this.blockMaterials.get(itemId);
    }
  }

  /**
   * `tool` is the tool the player chose, `slotItem` is the block in the active slot if they have any,
   * `bestPickaxe` is shown while digging. The bow and a dig briefly take over from everything else.
   */
  update(
    dt: number,
    camera: THREE.Camera,
    character: { group: THREE.Group; armR: THREE.Mesh },
    thirdPerson: boolean,
    choice: { hidden: boolean; tool: string | null; slotItem: string | null; bestPickaxe: string | null }
  ) {
    this.swing = Math.max(0, this.swing - dt);
    this.bowTime = Math.max(0, this.bowTime - dt);

    let item: string | null = choice.tool || choice.slotItem;
    if (this.swing > 0 && choice.bestPickaxe) item = choice.bestPickaxe;
    if (this.bowTime > 0) item = 'bow';
    if (choice.hidden) item = null;
    this.show(item);

    const holder = thirdPerson ? character.group : camera;
    if (this.root.parent !== holder) holder.add(this.root);
    this.root.position.copy(thirdPerson ? IN_HAND : IN_VIEW);
    this.root.visible = item !== null;
    // Seen from directly behind in first person a bow would be a thin line, so it is turned to show its curve
    this.tools.bow.rotation.y = thirdPerson ? 0 : BOW_TURN_IN_VIEW;

    // A quick chop forward and back
    const swingAmount = Math.sin((this.swing / SWING_SECONDS) * Math.PI);
    this.root.rotation.set(-swingAmount * SWING_ANGLE, thirdPerson ? 0 : 0.35, 0);
    if (thirdPerson && item !== null) character.armR.rotation.x = ARM_RAISED_ANGLE + swingAmount * 0.9;
  }
}
