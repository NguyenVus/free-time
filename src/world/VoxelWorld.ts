import type { SharedEdit } from '../multiplayer/MultiplayerClient';
import { BLOCK_DEFS } from './blocks';
import { CHUNK_HEIGHT, CHUNK_SIZE, EDITS_STORAGE_KEY, EDIT_TIMES_STORAGE_KEY, FLOWER_MATERIAL_KEY, FLOWER_STEM_COLOR, FLOWER_STEM_WIDTH, FLOWER_TINTS, FUJI, FUJI_ROAD, HOUSE_WALL_HEIGHT, LAST_RESET_STORAGE_KEY, NATURAL_TERRAIN_MAX, QUALITY, RIVER_BANK_WIDTH, RIVER_BRIDGE_LAKE_CLEARANCE, RIVER_BRIDGE_OFFSET, RIVER_BRIDGE_SPACING, RIVER_DEPTH, RIVER_SAND_WIDTH, RIVER_TREE_CLEARANCE, TREE_MAX_GROUND, VILLAGE, VILLAGE_HOUSES, VILLAGE_ROAD, VILLAGE_TREE_CLEARANCE, WATER_LEVEL } from '../config';
import { SimpleNoise } from './SimpleNoise';

export class VoxelWorld {
  declare fujiRoadEndY: number;
  declare chunks: any;
  declare decoratedChunks: any;
  declare dirtyChunks: any;
  declare editTimes: any;
  declare lakeCenter: any;
  declare lastChunk: any;
  declare lastResetAt: any;
  declare leafWindUniforms: any;
  declare materials: any;
  declare modifiedBlocks: any;
  declare noise: any;
  declare placedLanterns: any;
  declare roadStartY: any;
  declare scene: any;
  declare streamTasks: any;
  declare textures: any;
  declare treeLanterns: any;

  constructor(scene, textures) {
    this.scene = scene;
    this.textures = textures;
    this.noise = new SimpleNoise(31415);
    this.chunks = new Map();
    this.placedLanterns = new Map();
    this.modifiedBlocks = new Map();
    this.editTimes = new Map(); // when each edit was made: with two players, the newest one wins
    this.lastResetAt = 0;
    this.dirtyChunks = new Set();
    this.decoratedChunks = new Set();
    this.streamTasks = [];
    this.lastChunk = null;
    this.treeLanterns = [];

    this.lakeCenter = { x: -14, z: 12 };

    this.leafWindUniforms = {
      uSunsetGlow: { value: 0.0 }
    };

    this.initMaterials();
    this.loadSavedWorld();
  }

  isCollidable(b) {
    return b !== BLOCK_DEFS.AIR && b !== BLOCK_DEFS.WATER;
  }

  isSolid(b) {
    return this.isCollidable(b);
  }

  isOpaque(b) {
    return b === BLOCK_DEFS.GRASS ||
           b === BLOCK_DEFS.DIRT ||
           b === BLOCK_DEFS.STONE ||
           b === BLOCK_DEFS.SAND ||
           b === BLOCK_DEFS.WOOD_LOG ||
           b === BLOCK_DEFS.WOOD_PLANKS ||
           b === BLOCK_DEFS.TORII_RED ||
           b === BLOCK_DEFS.ROOF_SLATE ||
           b === BLOCK_DEFS.CHERRY_HEARTWOOD ||
           b === BLOCK_DEFS.LANTERN ||
           b === BLOCK_DEFS.GROUND_PETALS_CARPET ||
           b === BLOCK_DEFS.SNOW ||
           b === BLOCK_DEFS.VOLCANIC_ROCK;
  }

  createLeafMaterial(textureKey) {
    const mat = new THREE.MeshStandardMaterial({
      map: this.textures[textureKey].texture,
      // Sun + ambient light reach about 1.8x here, which would clip pink to white without this.
      color: new THREE.Color(0.68, 0.68, 0.68),
      roughness: 0.65,
      vertexColors: true
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunsetGlow = this.leafWindUniforms.uSunsetGlow;

      shader.fragmentShader = `
        uniform float uSunsetGlow;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        if (uSunsetGlow > 0.001) {
          gl_FragColor.rgb += vec3(0.24, 0.05, 0.16) * uSunsetGlow;
        }
        `
      );
    };
    return mat;
  }

  initMaterials() {
    this.materials = {
      [BLOCK_DEFS.GRASS]: [
        new THREE.MeshStandardMaterial({ map: this.textures['grass_side'].texture, roughness: 0.85, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['grass_side'].texture, roughness: 0.85, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['grass_top'].texture, roughness: 0.85, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['dirt'].texture, roughness: 0.9, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['grass_side'].texture, roughness: 0.85, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['grass_side'].texture, roughness: 0.85, vertexColors: true })
      ],
      [BLOCK_DEFS.GROUND_PETALS_CARPET]: [
        new THREE.MeshStandardMaterial({ map: this.textures['grass_side'].texture, roughness: 0.85, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['grass_side'].texture, roughness: 0.85, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['carpet_top'].texture, roughness: 0.85, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['dirt'].texture, roughness: 0.9, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['grass_side'].texture, roughness: 0.85, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['grass_side'].texture, roughness: 0.85, vertexColors: true })
      ],
      [BLOCK_DEFS.DIRT]: new THREE.MeshStandardMaterial({ map: this.textures['dirt'].texture, roughness: 0.9, vertexColors: true }),
      [BLOCK_DEFS.SNOW]: new THREE.MeshStandardMaterial({ map: this.textures['snow'].texture, roughness: 0.95, vertexColors: true }),
      [BLOCK_DEFS.VOLCANIC_ROCK]: new THREE.MeshStandardMaterial({ map: this.textures['volcanic_rock'].texture, roughness: 0.9, vertexColors: true }),
      [BLOCK_DEFS.STONE]: new THREE.MeshStandardMaterial({ map: this.textures['stone'].texture, roughness: 0.8, vertexColors: true }),
      [BLOCK_DEFS.SAND]: new THREE.MeshStandardMaterial({ map: this.textures['sand'].texture, roughness: 0.85, vertexColors: true }),
      [BLOCK_DEFS.WOOD_LOG]: [
        new THREE.MeshStandardMaterial({ map: this.textures['log_side'].texture, roughness: 0.8, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['log_side'].texture, roughness: 0.8, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['log_top'].texture, roughness: 0.8, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['log_top'].texture, roughness: 0.8, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['log_side'].texture, roughness: 0.8, vertexColors: true }),
        new THREE.MeshStandardMaterial({ map: this.textures['log_side'].texture, roughness: 0.8, vertexColors: true })
      ],
      [BLOCK_DEFS.WOOD_PLANKS]: new THREE.MeshStandardMaterial({ map: this.textures['planks'].texture, roughness: 0.75, vertexColors: true }),
      [BLOCK_DEFS.LEAVES_LIGHT]: this.createLeafMaterial('leaves_light'),
      [BLOCK_DEFS.LEAVES_DEEP]: this.createLeafMaterial('leaves_deep'),
      [BLOCK_DEFS.LEAVES_WHITE]: this.createLeafMaterial('leaves_white'),
      [BLOCK_DEFS.LEAVES_SOFT]: this.createLeafMaterial('leaves_soft'),
      [BLOCK_DEFS.LEAVES_MAGENTA]: this.createLeafMaterial('leaves_magenta'),
      [BLOCK_DEFS.GLASS]: new THREE.MeshStandardMaterial({
        map: this.textures['glass'].texture,
        transparent: true,
        opacity: 0.45,
        roughness: 0.2
      }),
      [BLOCK_DEFS.LANTERN]: new THREE.MeshStandardMaterial({
        map: this.textures['lantern'].texture,
        emissive: new THREE.Color(0xffaa44),
        emissiveIntensity: 0.9,
        roughness: 0.4
      }),
      [BLOCK_DEFS.PAPER_LANTERN]: new THREE.MeshStandardMaterial({
        map: this.textures['paper_lantern'].texture,
        emissive: new THREE.Color(0xffb74d),
        emissiveIntensity: 0.95,
        roughness: 0.35
      }),
      [BLOCK_DEFS.WATER]: new THREE.MeshStandardMaterial({
        map: this.textures['water'].texture,
        transparent: true,
        opacity: 0.68,
        roughness: 0.1,
        metalness: 0.15,
        side: THREE.DoubleSide // the surface is also visible from underneath
      }),
      [BLOCK_DEFS.TORII_RED]: new THREE.MeshStandardMaterial({ map: this.textures['torii_red'].texture, roughness: 0.7, vertexColors: true }),
      [BLOCK_DEFS.ROOF_SLATE]: new THREE.MeshStandardMaterial({ map: this.textures['roof_slate'].texture, roughness: 0.8, vertexColors: true }),
      [BLOCK_DEFS.CHERRY_HEARTWOOD]: new THREE.MeshStandardMaterial({ map: this.textures['log_side'].texture, roughness: 0.8, vertexColors: true }),
      [FLOWER_MATERIAL_KEY]: new THREE.MeshStandardMaterial({
        map: this.textures['flower'].texture,
        color: new THREE.Color(0.68, 0.68, 0.68),
        alphaTest: 0.4,
        roughness: 0.7,
        side: THREE.DoubleSide,
        vertexColors: true
      })
    };
  }

  loadSavedWorld() {
    try {
      const raw = localStorage.getItem(EDITS_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        for (const [k, v] of Object.entries(data)) {
          this.modifiedBlocks.set(k, v);
        }
      }
      const times = JSON.parse(localStorage.getItem(EDIT_TIMES_STORAGE_KEY) || '{}');
      for (const [k, v] of Object.entries(times)) {
        this.editTimes.set(k, v);
      }
      this.lastResetAt = Number(localStorage.getItem(LAST_RESET_STORAGE_KEY)) || 0;
    } catch (e) {
      console.warn('Could not load saved edits:', e);
    }
  }

  saveEdits() {
    try {
      localStorage.setItem(EDITS_STORAGE_KEY, JSON.stringify(Object.fromEntries(this.modifiedBlocks)));
      localStorage.setItem(EDIT_TIMES_STORAGE_KEY, JSON.stringify(Object.fromEntries(this.editTimes)));
    } catch (e) {
      console.warn('Could not save edits:', e);
    }
  }

  resetWorld(time) {
    this.modifiedBlocks.clear();
    this.editTimes.clear();
    this.dirtyChunks.clear();
    this.lastResetAt = time;
    localStorage.removeItem(EDITS_STORAGE_KEY);
    localStorage.removeItem(EDIT_TIMES_STORAGE_KEY);
    localStorage.setItem(LAST_RESET_STORAGE_KEY, String(time));
    this.chunks.forEach(chunk => {
      if (chunk.mesh) this.scene.remove(chunk.mesh);
    });
    this.chunks.clear();
    this.lastChunk = null;
    this.decoratedChunks.clear();
    this.streamTasks = [];
    this.treeLanterns = [];
    this.placedLanterns.clear();
  }

  getBlock(x, y, z) {
    if (y < 0 || y >= CHUNK_HEIGHT) return BLOCK_DEFS.AIR;

    // chunk.blocks already includes player edits and trees, so no string-keyed lookups are
    // needed here. This is the hottest function in the game (meshing, physics, minimap).
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(cx, cz);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.blocks[lx + lz * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE];
  }

  setBlock(x, y, z, blockId) {
    if (y < 0 || y >= CHUNK_HEIGHT) return 0;
    const key = `${x},${y},${z}`;
    const time = Date.now();
    this.modifiedBlocks.set(key, blockId);
    this.editTimes.set(key, time);
    this.saveEdits();

    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(cx, cz);
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.blocks[lx + lz * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE] = blockId;

    if (blockId === BLOCK_DEFS.LANTERN || blockId === BLOCK_DEFS.PAPER_LANTERN) {
      this.placedLanterns.set(key, { x, y, z });
    } else {
      this.placedLanterns.delete(key);
    }

    // Rebuild only the affected chunk and direct neighbors
    this.buildChunkMesh(chunk);
    if (lx === 0) this.buildChunkMesh(this.getOrCreateChunk(cx - 1, cz));
    if (lx === CHUNK_SIZE - 1) this.buildChunkMesh(this.getOrCreateChunk(cx + 1, cz));
    if (lz === 0) this.buildChunkMesh(this.getOrCreateChunk(cx, cz - 1));
    if (lz === CHUNK_SIZE - 1) this.buildChunkMesh(this.getOrCreateChunk(cx, cz + 1));
    return time;
  }

  // Block edits from another player, as [x, y, z, blockId, time]. They may arrive in large batches,
  // so meshes are rebuilt across frames and the save happens once. Chunks not loaded yet need no
  // work now: they pick up modifiedBlocks when they are generated.
  applySharedEdits(edits: SharedEdit[]) {
    let changed = 0;
    for (const [x, y, z, blockId, time] of edits) {
      if (time < this.lastResetAt) continue;
      const key = `${x},${y},${z}`;
      if (this.modifiedBlocks.has(key)) {
        const known = this.editTimes.get(key) || 0;
        const current = this.modifiedBlocks.get(key);
        // On an exact tie every device picks the same winner, so worlds cannot drift apart
        if (time < known || (time === known && blockId <= current)) continue;
      }
      this.modifiedBlocks.set(key, blockId);
      this.editTimes.set(key, time);
      changed++;

      if (blockId === BLOCK_DEFS.LANTERN || blockId === BLOCK_DEFS.PAPER_LANTERN) {
        this.placedLanterns.set(key, { x, y, z });
      } else {
        this.placedLanterns.delete(key);
      }

      const cx = Math.floor(x / CHUNK_SIZE);
      const cz = Math.floor(z / CHUNK_SIZE);
      const chunk = this.getLoadedChunk(cx, cz);
      if (!chunk) continue;
      const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      chunk.blocks[lx + lz * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE] = blockId;
      this.dirtyChunks.add(chunk);
      const neighbors = [[lx === 0, cx - 1, cz], [lx === CHUNK_SIZE - 1, cx + 1, cz], [lz === 0, cx, cz - 1], [lz === CHUNK_SIZE - 1, cx, cz + 1]];
      for (const [onEdge, nx, nz] of neighbors) {
        const neighbor = onEdge && this.getLoadedChunk(nx, nz);
        if (neighbor) this.dirtyChunks.add(neighbor);
      }
    }
    if (changed > 0) this.saveEdits();
    return changed;
  }

  getLoadedChunk(cx, cz) {
    const last = this.lastChunk;
    if (last && last.cx === cx && last.cz === cz) return last;
    const chunk = this.chunks.get(`${cx},${cz}`);
    if (!chunk) return null;
    this.lastChunk = chunk;
    return chunk;
  }

  // Top non-air block of a column, or null if its chunk is not loaded (never generates terrain).
  getLoadedTopBlock(x, z) {
    const chunk = this.getLoadedChunk(Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE));
    if (!chunk) return null;
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const b = chunk.blocks[lx + lz * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE];
      if (b !== BLOCK_DEFS.AIR) return b;
    }
    return BLOCK_DEFS.AIR;
  }

  getOrCreateChunk(cx, cz) {
    const loaded = this.getLoadedChunk(cx, cz);
    if (loaded) return loaded;

    const key = `${cx},${cz}`;
    const chunk = {
      cx, cz,
      blocks: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT),
      mesh: null
    };
    this.generateChunkTerrain(chunk);
    this.chunks.set(key, chunk);
    return chunk;
  }

  getBaseTerrainHeight(wx, wz) {
    const n1 = this.noise.noise2D(wx * 0.03, wz * 0.03) * 7.5;
    const n2 = this.noise.noise2D(wx * 0.07, wz * 0.07) * 3.0;
    let h = 11 + (n1 + n2);
    const step = Math.floor(h);

    const lakeDist = Math.hypot(wx - this.lakeCenter.x, (wz - this.lakeCenter.z) * 1.15);
    const height = lakeDist < 18
      ? Math.max(5, step - Math.floor((1.0 - lakeDist / 18) * 6.5))
      : Math.min(NATURAL_TERRAIN_MAX, Math.max(7, step));
    return this.carveRiver(height, wx, wz);
  }

  getTerrainHeight(wx, wz) {
    const village = this.flattenVillage(this.gradeVillageRoad(this.getBaseTerrainHeight(wx, wz), wx, wz), wx, wz);
    return this.raiseFuji(this.gradeFujiRoad(village, wx, wz), wx, wz);
  }

  getFujiHeight(wx, wz) {
    const dist = Math.hypot(wx - FUJI.x, wz - FUJI.z);
    if (dist >= FUJI.radius) return 0;
    if (dist < FUJI.rimRadius) {
      const inner = dist / FUJI.rimRadius;
      return Math.round(FUJI.peakY - FUJI.craterDepth * (1 - inner * inner));
    }
    const along = 1 - (dist - FUJI.rimRadius) / (FUJI.radius - FUJI.rimRadius);
    // Ridges and gullies, fading out toward the smooth summit so the rim stays round
    const ridges = this.noise.noise2D(wx * 0.05, wz * 0.05) * 3 * Math.min(1, (1 - along) * 3);
    return Math.round(FUJI.baseY + (FUJI.peakY - FUJI.baseY) * Math.pow(along, FUJI.profilePower) + ridges);
  }

  raiseFuji(height, wx, wz) {
    return Math.max(height, this.getFujiHeight(wx, wz));
  }

  isOnFujiRoad(wx, wz, margin) {
    return Math.abs(wx - FUJI_ROAD.x) < margin && wz <= FUJI_ROAD.startZ && wz >= FUJI_ROAD.endZ;
  }

  // An even slope from the village to the foot of the mountain, like the road from the stone path
  gradeFujiRoad(height, wx, wz) {
    if (wz > FUJI_ROAD.startZ || wz < FUJI_ROAD.endZ) return height;
    const dist = Math.abs(wx - FUJI_ROAD.x);
    if (dist >= FUJI_ROAD.halfWidth + FUJI_ROAD.bankWidth) return height;

    if (this.fujiRoadEndY === undefined) this.fujiRoadEndY = this.getFujiHeight(FUJI_ROAD.x, FUJI_ROAD.endZ);
    const along = (FUJI_ROAD.startZ - wz) / (FUJI_ROAD.startZ - FUJI_ROAD.endZ);
    const roadY = Math.round(VILLAGE.groundY + (this.fujiRoadEndY - VILLAGE.groundY) * along);
    if (dist <= FUJI_ROAD.halfWidth) return roadY;

    const t = (dist - FUJI_ROAD.halfWidth) / FUJI_ROAD.bankWidth;
    return Math.round(roadY + (height - roadY) * t * t * (3 - 2 * t));
  }

  // A torii where the road meets the mountain, and a small one on the crater rim
  buildFujiLandmarks(cx, cz, setStructBlock) {
    const gates = [
      { x: FUJI_ROAD.x, z: FUJI_ROAD.endZ - 2, halfWidth: 3, height: 6 },
      { x: FUJI.x, z: FUJI.z + FUJI.rimRadius + 2, halfWidth: 2, height: 4 }
    ];
    for (const gate of gates) {
      if (Math.floor(gate.x / CHUNK_SIZE) !== cx || Math.floor(gate.z / CHUNK_SIZE) !== cz) continue;
      const ground = this.getTerrainHeight(gate.x, gate.z);
      for (const side of [-gate.halfWidth, gate.halfWidth]) {
        for (let y = 1; y <= gate.height; y++) setStructBlock(gate.x + side, ground + y, gate.z, BLOCK_DEFS.TORII_RED);
      }
      for (let dx = -gate.halfWidth - 1; dx <= gate.halfWidth + 1; dx++) {
        setStructBlock(gate.x + dx, ground + gate.height + 1, gate.z, BLOCK_DEFS.ROOF_SLATE);
        if (Math.abs(dx) <= gate.halfWidth) setStructBlock(gate.x + dx, ground + gate.height - 1, gate.z, BLOCK_DEFS.TORII_RED);
      }
    }
  }

  // The road cuts an even slope from the stone path down to the village. Following the natural
  // hills would leave steps two blocks high, which are too tall to jump.
  gradeVillageRoad(height, wx, wz) {
    const endX = VILLAGE.x - VILLAGE.radius + 2;
    if (wx < VILLAGE_ROAD.startX || wx > endX) return height;
    const dist = Math.abs(wz - VILLAGE_ROAD.z);
    if (dist >= VILLAGE_ROAD.halfWidth + VILLAGE_ROAD.bankWidth) return height;

    if (this.roadStartY === undefined) {
      this.roadStartY = this.getBaseTerrainHeight(VILLAGE_ROAD.startX, VILLAGE_ROAD.z);
    }
    const along = (wx - VILLAGE_ROAD.startX) / (endX - VILLAGE_ROAD.startX);
    const roadY = Math.round(this.roadStartY + (VILLAGE.groundY - this.roadStartY) * along);
    if (dist <= VILLAGE_ROAD.halfWidth) return roadY;

    const t = (dist - VILLAGE_ROAD.halfWidth) / VILLAGE_ROAD.bankWidth;
    return Math.round(roadY + (height - roadY) * t * t * (3 - 2 * t));
  }

  flattenVillage(height, wx, wz) {
    const dist = Math.hypot(wx - VILLAGE.x, wz - VILLAGE.z);
    if (dist <= VILLAGE.radius) return VILLAGE.groundY;
    if (dist >= VILLAGE.radius + VILLAGE.blend) return height;
    const t = (dist - VILLAGE.radius) / VILLAGE.blend;
    const ease = t * t * (3 - 2 * t);
    return Math.round(VILLAGE.groundY + (height - VILLAGE.groundY) * ease);
  }

  isInVillage(wx, wz, margin = 0) {
    return Math.hypot(wx - VILLAGE.x, wz - VILLAGE.z) <= VILLAGE.radius + margin;
  }

  isOnVillageRoad(wx, wz, margin) {
    return Math.abs(wz - VILLAGE_ROAD.z) < margin &&
           wx >= VILLAGE_ROAD.startX && wx <= VILLAGE.x - VILLAGE.radius + 2;
  }

  buildVillageHouses(cx, cz, setStructBlock) {
    for (const house of VILLAGE_HOUSES) {
      const x = VILLAGE.x + house.dx;
      const z = VILLAGE.z + house.dz;
      if (Math.floor(x / CHUNK_SIZE) === cx && Math.floor(z / CHUNK_SIZE) === cz) {
        this.buildHouse(x, z, house, setStructBlock);
      }
    }
  }

  buildHouse(centerX, centerZ, house, setBlock) {
    const x0 = centerX - Math.floor(house.width / 2);
    const x1 = x0 + house.width - 1;
    const z0 = centerZ - Math.floor(house.depth / 2);
    const z1 = z0 + house.depth - 1;
    const floorY = VILLAGE.groundY;
    const wallTop = floorY + HOUSE_WALL_HEIGHT;

    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        setBlock(x, floorY, z, BLOCK_DEFS.WOOD_PLANKS);
        const onEdgeX = x === x0 || x === x1;
        const onEdgeZ = z === z0 || z === z1;
        if (!onEdgeX && !onEdgeZ) continue;

        for (let y = floorY + 1; y <= wallTop; y++) {
          const isCorner = onEdgeX && onEdgeZ;
          const along = onEdgeZ ? x - centerX : z - centerZ;
          const isWindow = !isCorner && y === floorY + 2 && Math.abs(along) % 3 === 2;
          if (isCorner) setBlock(x, y, z, BLOCK_DEFS.WOOD_LOG);
          else setBlock(x, y, z, isWindow ? BLOCK_DEFS.GLASS : BLOCK_DEFS.WOOD_PLANKS);
        }
      }
    }

    // Stepped roof with its ridge along x, overhanging the walls by one block
    const rows = Math.ceil((house.depth + 2) / 2);
    for (let i = 0; i < rows; i++) {
      const y = wallTop + 1 + i;
      const north = z0 - 1 + i;
      const south = z1 + 1 - i;
      for (let x = x0 - 1; x <= x1 + 1; x++) {
        setBlock(x, y, north, BLOCK_DEFS.ROOF_SLATE);
        setBlock(x, y, south, BLOCK_DEFS.ROOF_SLATE);
      }
      // Close the triangles at both ends
      for (let z = north + 1; z < south; z++) {
        setBlock(x0, y, z, BLOCK_DEFS.WOOD_PLANKS);
        setBlock(x1, y, z, BLOCK_DEFS.WOOD_PLANKS);
      }
    }

    // Door opening, two blocks high, facing the middle of the village, with a lantern beside it
    const door = {
      north: [centerX, z0, 1, 0, -1],
      south: [centerX, z1, 1, 0, 1],
      west: [x0, centerZ, 0, 1, 0]
    }[house.door];
    const [doorX, doorZ, sideX, sideZ, outZ] = door;
    const outX = house.door === 'west' ? -1 : 0;
    setBlock(doorX, floorY + 1, doorZ, BLOCK_DEFS.AIR);
    setBlock(doorX, floorY + 2, doorZ, BLOCK_DEFS.AIR);
    setBlock(doorX + sideX * 2 + outX, floorY + 2, doorZ + sideZ * 2 + outZ, BLOCK_DEFS.LANTERN);

    // A lantern lights the room from the middle
    setBlock(centerX, wallTop, centerZ, BLOCK_DEFS.LANTERN);
    this.treeLanterns.push({ x: doorX + sideX * 2 + outX, y: floorY + 2, z: doorZ + sideZ * 2 + outZ });
    this.treeLanterns.push({ x: centerX, y: wallTop, z: centerZ });
  }

  // The river meanders along the z axis, west of the stone path, and flows through the lake.
  getRiverCenter(wz) {
    return -34 + Math.sin(wz * 0.018) * 10 + Math.sin(wz * 0.047 + 1.3) * 6;
  }

  getRiverHalfWidth(wz) {
    return 6 + Math.sin(wz * 0.031) * 2;
  }

  carveRiver(height, wx, wz) {
    const halfWidth = this.getRiverHalfWidth(wz);
    const dist = Math.abs(wx - this.getRiverCenter(wz));

    if (dist < halfWidth) {
      const edge = dist / halfWidth;
      return Math.min(height, WATER_LEVEL - Math.round(RIVER_DEPTH * (1 - edge * edge)));
    }
    if (dist < halfWidth + RIVER_BANK_WIDTH) {
      // Hills ease down to just above the water instead of ending in a cliff
      const t = (dist - halfWidth) / RIVER_BANK_WIDTH;
      const ease = t * t * (3 - 2 * t);
      const bank = WATER_LEVEL + 1 + (height - WATER_LEVEL - 1) * ease;
      return Math.min(height, Math.round(bank));
    }
    return height;
  }

  isOnRiverBank(wx, wz, margin) {
    return Math.abs(wx - this.getRiverCenter(wz)) < this.getRiverHalfWidth(wz) + margin;
  }

  // Wooden crossings, level with the banks so they can be walked onto without jumping.
  buildRiverBridges(cx, cz, setStructBlock) {
    const startZ = cz * CHUNK_SIZE;
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const bridgeZ = startZ + lz;
      const phase = bridgeZ - RIVER_BRIDGE_OFFSET;
      if (((phase % RIVER_BRIDGE_SPACING) + RIVER_BRIDGE_SPACING) % RIVER_BRIDGE_SPACING !== 0) continue;

      const center = Math.round(this.getRiverCenter(bridgeZ));
      if (Math.floor(center / CHUNK_SIZE) !== cx) continue;
      if (Math.hypot(center - this.lakeCenter.x, bridgeZ - this.lakeCenter.z) < RIVER_BRIDGE_LAKE_CLEARANCE) continue;

      const reach = Math.ceil(this.getRiverHalfWidth(bridgeZ)) + RIVER_BANK_WIDTH;
      for (let x = center - reach; x <= center + reach; x++) {
        let hasDeck = false;
        for (let dz = -1; dz <= 1; dz++) {
          if (this.getTerrainHeight(x, bridgeZ + dz) <= WATER_LEVEL) {
            setStructBlock(x, WATER_LEVEL + 1, bridgeZ + dz, BLOCK_DEFS.WOOD_PLANKS);
            hasDeck = true;
          }
        }
        if (hasDeck && x % 2 === 0) {
          setStructBlock(x, WATER_LEVEL + 2, bridgeZ - 2, BLOCK_DEFS.WOOD_LOG);
          setStructBlock(x, WATER_LEVEL + 2, bridgeZ + 2, BLOCK_DEFS.WOOD_LOG);
        }
      }
    }
  }

  getHighestSolidY(x, z) {
    const bx = Math.floor(x);
    const bz = Math.floor(z);
    const cx = Math.floor(bx / CHUNK_SIZE);
    const cz = Math.floor(bz / CHUNK_SIZE);
    const key = `${cx},${cz}`;
    if (!this.decoratedChunks.has(key)) {
      this.decoratedChunks.add(key);
      this.buildTreesAndLandmarks(cx, cz);
    }
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const b = this.getBlock(bx, y, bz);
      if (this.isCollidable(b)) {
        return y + 1;
      }
    }
    return Math.max(6, this.getTerrainHeight(bx, bz) + 1);
  }

  getMaxSolidYInRadius(x, z, radius = 1.0) {
    let maxY = 0;
    const minX = Math.floor(x - radius);
    const maxX = Math.floor(x + radius);
    const minZ = Math.floor(z - radius);
    const maxZ = Math.floor(z + radius);
    for (let bz = minZ; bz <= maxZ; bz++) {
      for (let bx = minX; bx <= maxX; bx++) {
        const y = this.getHighestSolidY(bx, bz);
        if (y > maxY) maxY = y;
      }
    }
    return maxY;
  }

  generateChunkTerrain(chunk) {
    const { cx, cz, blocks } = chunk;
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;
    const waterLevel = WATER_LEVEL;
    const MIN_GROUND_LEVEL = WATER_LEVEL - RIVER_DEPTH;

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wz = startZ + lz;
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = startX + lx;
        const baseH = Math.max(MIN_GROUND_LEVEL, this.getTerrainHeight(wx, wz));
        const lakeDist = Math.hypot(wx - this.lakeCenter.x, wz - this.lakeCenter.z);

        // Bare rock and snow high on the mountain, with an uneven snow line
        const onFujiRock = baseH >= FUJI.rockY && this.getFujiHeight(wx, wz) === baseH;
        const snowLine = FUJI.snowY + Math.sin(wx * 0.31 + wz * 0.17) * 2.5;

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          let block = BLOCK_DEFS.AIR;
          if (onFujiRock && y <= baseH) {
            block = y === baseH && baseH >= snowLine ? BLOCK_DEFS.SNOW : BLOCK_DEFS.VOLCANIC_ROCK;
          } else if (y < baseH - 3 || y <= 2) {
            block = BLOCK_DEFS.STONE;
          } else if (y < baseH) {
            block = BLOCK_DEFS.DIRT;
          } else if (y === baseH) {
            if (baseH <= waterLevel + 1 && (lakeDist < 20 || this.isOnRiverBank(wx, wz, RIVER_SAND_WIDTH))) {
              block = BLOCK_DEFS.SAND;
            } else {
              block = BLOCK_DEFS.GRASS;
            }
          } else if (y <= waterLevel) {
            block = BLOCK_DEFS.WATER;
          }

          // Carve stone walking path along scenic curve
          if (block === BLOCK_DEFS.GRASS) {
            const pathCurve = Math.sin(wz * 0.07) * 7.0 - 4;
            if (Math.abs(wx - pathCurve) < 1.6 || this.isOnVillageRoad(wx, wz, VILLAGE_ROAD.halfWidth) || this.isOnFujiRoad(wx, wz, FUJI_ROAD.halfWidth)) {
              block = BLOCK_DEFS.STONE;
            }
          }

          const idx = lx + lz * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
          blocks[idx] = block;
        }
      }
    }

    this.modifiedBlocks.forEach((val, k) => {
      const [mx, my, mz] = k.split(',').map(Number);
      if (Math.floor(mx / CHUNK_SIZE) === cx && Math.floor(mz / CHUNK_SIZE) === cz) {
        const lx = ((mx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((mz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        blocks[lx + lz * CHUNK_SIZE + my * CHUNK_SIZE * CHUNK_SIZE] = val;
      }
    });
  }

  // =========================================================================
  // PROCEDURAL ORGANIC CHERRY BLOSSOM TREES
  // =========================================================================
  buildTreesAndLandmarks(cx, cz) {
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    const setStructBlock = (wx, wy, wz, blockId) => {
      if (wy < 0 || wy >= CHUNK_HEIGHT) return;
      // Keep a walkable corridor along the road: nearby trees may arch over it, but not block it
      if (this.isOnVillageRoad(wx, wz, VILLAGE_ROAD.clearWidth)) {
        const surface = this.getTerrainHeight(wx, wz);
        if (wy >= surface && wy <= surface + VILLAGE_ROAD.clearHeight) return;
      }
      if (this.isOnFujiRoad(wx, wz, FUJI_ROAD.clearWidth)) {
        const surface = this.getTerrainHeight(wx, wz);
        if (blockId !== BLOCK_DEFS.TORII_RED && blockId !== BLOCK_DEFS.ROOF_SLATE && wy >= surface && wy <= surface + FUJI_ROAD.clearHeight) return;
      }
      const key = `${wx},${wy},${wz}`;
      if (!this.modifiedBlocks.has(key)) {
        const targetChunk = this.getOrCreateChunk(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE));
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        targetChunk.blocks[lx + lz * CHUNK_SIZE + wy * CHUNK_SIZE * CHUNK_SIZE] = blockId;
      }
    };

    this.buildRiverBridges(cx, cz, setStructBlock);
    this.buildVillageHouses(cx, cz, setStructBlock);
    this.buildFujiLandmarks(cx, cz, setStructBlock);

    // Well-spaced organic tree distribution
    for (let lz = 3; lz < CHUNK_SIZE; lz += 8) {
      for (let lx = 3; lx < CHUNK_SIZE; lx += 8) {
        const hash = Math.sin((startX + lx) * 73.123 + (startZ + lz) * 127.547) * 43758.5453;
        const rand = hash - Math.floor(hash);
        const jitterX = Math.floor((rand * 5) - 2);
        const jitterZ = Math.floor((((rand * 10) % 1) * 5) - 2);
        const wx = startX + lx + jitterX;
        const wz = startZ + lz + jitterZ;

        const lakeDist = Math.hypot(wx - this.lakeCenter.x, wz - this.lakeCenter.z);
        if (lakeDist < 12) continue; // inside lake
        if (this.isOnRiverBank(wx, wz, RIVER_TREE_CLEARANCE)) continue;
        if (this.isInVillage(wx, wz, VILLAGE_TREE_CLEARANCE) || this.isOnVillageRoad(wx, wz, VILLAGE_ROAD.treeClearance) || this.isOnFujiRoad(wx, wz, FUJI_ROAD.treeClearance)) continue;

        const gy = this.getTerrainHeight(wx, wz);
        if (gy < 6 || gy > TREE_MAX_GROUND) continue;

        // Avoid spawning on stone path
        const pathCurve = Math.sin(wz * 0.07) * 7.0 - 4;
        if (Math.abs(wx - pathCurve) < 2.5) continue;

        // Avoid spawning inside or too close to lakeside pavilion
        if (Math.hypot(wx - (-4), wz - 22) < 5.5) continue;

        const isWeeping = (lakeDist >= 13 && lakeDist <= 21 && rand > 0.35);
        const isLarge = (!isWeeping && rand > 0.65);
        const isMedium = (!isWeeping && !isLarge && rand > 0.25);
        const isSmall = (!isWeeping && !isLarge && !isMedium);

        this.generateOrganicTree(wx, gy, wz, {
          isWeeping,
          isLarge,
          isMedium,
          isSmall,
          seed: rand,
          setBlock: setStructBlock
        });
      }
    }

    // Landmarks at origin (Torii, Bridge, Stone Lanterns)
    if (cx === 0 && cz === 0) {
      const tX = 8, tZ = 8, tY = this.getTerrainHeight(8, 8);
      for (let sign of [-2, 2]) {
        for (let ty = 0; ty <= 5; ty++) setStructBlock(tX + sign, tY + ty, tZ, BLOCK_DEFS.TORII_RED);
      }
      for (let bx = -3; bx <= 3; bx++) {
        setStructBlock(tX + bx, tY + 4, tZ, BLOCK_DEFS.TORII_RED);
        setStructBlock(tX + bx, tY + 6, tZ, BLOCK_DEFS.TORII_RED);
        setStructBlock(tX + bx, tY + 6, tZ, BLOCK_DEFS.ROOF_SLATE);
      }
      setStructBlock(tX - 4, tY + 6, tZ, BLOCK_DEFS.ROOF_SLATE);
      setStructBlock(tX + 4, tY + 6, tZ, BLOCK_DEFS.ROOF_SLATE);

      const lanterns = [{ x: 5, z: -10 }, { x: -3, z: 2 }, { x: -8, z: 18 }, { x: 10, z: 16 }];
      lanterns.forEach(lp => {
        const ly = this.getTerrainHeight(lp.x, lp.z);
        setStructBlock(lp.x, ly + 1, lp.z, BLOCK_DEFS.STONE);
        setStructBlock(lp.x, ly + 2, lp.z, BLOCK_DEFS.LANTERN);
        setStructBlock(lp.x, ly + 3, lp.z, BLOCK_DEFS.ROOF_SLATE);
      });

      // Arched wooden footbridge over scenic lake
      for (let bz = 5; bz <= 19; bz++) {
        const arch = Math.sin(((bz - 5) / 14) * Math.PI) * 1.5;
        const by = 7 + Math.floor(arch);
        for (let bx = -15; bx <= -13; bx++) {
          setStructBlock(bx, by, bz, BLOCK_DEFS.WOOD_PLANKS);
        }
        setStructBlock(-16, by + 1, bz, BLOCK_DEFS.WOOD_PLANKS);
        setStructBlock(-12, by + 1, bz, BLOCK_DEFS.WOOD_PLANKS);
      }
    }

    // Scenic Lakeside Pavilion (Vọng Cảnh Đình) at (-4, 22)
    if (cx === -1 && cz === 1) {
      const pavX = -4, pavZ = 22;
      const pavY = this.getTerrainHeight(pavX, pavZ);
      // Wooden deck floor (5x5)
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          setStructBlock(pavX + dx, pavY, pavZ + dz, BLOCK_DEFS.WOOD_PLANKS);
          for (let fy = pavY - 1; fy >= pavY - 3; fy--) {
            const b = this.getBlock(pavX + dx, fy, pavZ + dz);
            if (b === BLOCK_DEFS.AIR || b === BLOCK_DEFS.WATER) {
              setStructBlock(pavX + dx, fy, pavZ + dz, BLOCK_DEFS.STONE);
            } else break;
          }
        }
      }
      // Low wooden railing along 3 sides (open towards lake side dx=-2)
      for (let dz = -2; dz <= 2; dz++) setStructBlock(pavX + 2, pavY + 1, pavZ + dz, BLOCK_DEFS.WOOD_PLANKS);
      for (let dx = -1; dx <= 1; dx++) {
        setStructBlock(pavX + dx, pavY + 1, pavZ - 2, BLOCK_DEFS.WOOD_PLANKS);
        setStructBlock(pavX + dx, pavY + 1, pavZ + 2, BLOCK_DEFS.WOOD_PLANKS);
      }
      // 4 Corner Pillars
      [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([px, pz]) => {
        for (let h = 1; h <= 4; h++) setStructBlock(pavX + px, pavY + h, pavZ + pz, BLOCK_DEFS.TORII_RED);
      });
      // Slate Roof with eaves
      for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
          if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
            setStructBlock(pavX + dx, pavY + 4, pavZ + dz, BLOCK_DEFS.ROOF_SLATE);
          }
        }
      }
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          setStructBlock(pavX + dx, pavY + 5, pavZ + dz, BLOCK_DEFS.ROOF_SLATE);
        }
      }
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          setStructBlock(pavX + dx, pavY + 6, pavZ + dz, BLOCK_DEFS.ROOF_SLATE);
        }
      }
      setStructBlock(pavX, pavY + 7, pavZ, BLOCK_DEFS.ROOF_SLATE);
      // Lantern in center ceiling
      setStructBlock(pavX, pavY + 4, pavZ, BLOCK_DEFS.PAPER_LANTERN);
      // Stone Lanterns at pavilion entrance
      setStructBlock(pavX - 3, pavY, pavZ - 1, BLOCK_DEFS.STONE);
      setStructBlock(pavX - 3, pavY + 1, pavZ - 1, BLOCK_DEFS.LANTERN);
      setStructBlock(pavX - 3, pavY + 2, pavZ - 1, BLOCK_DEFS.ROOF_SLATE);
      setStructBlock(pavX - 3, pavY, pavZ + 1, BLOCK_DEFS.STONE);
      setStructBlock(pavX - 3, pavY + 1, pavZ + 1, BLOCK_DEFS.LANTERN);
      setStructBlock(pavX - 3, pavY + 2, pavZ + 1, BLOCK_DEFS.ROOF_SLATE);
    }
  }

  generateOrganicTree(wx, gy, wz, opt) {
    const { isWeeping, isLarge, isMedium, isSmall, seed, setBlock } = opt;

    // 1. Soft carpet of fallen petals on ground (pink speckled grass, denser near trunk)
    const carpetRadius = isLarge ? 5.5 : isWeeping ? 4.8 : isMedium ? 4.0 : 2.5;
    const radCeil = Math.ceil(carpetRadius);
    for (let dx = -radCeil; dx <= radCeil; dx++) {
      for (let dz = -radCeil; dz <= radCeil; dz++) {
        const dist = Math.hypot(dx, dz);
        if (dist > carpetRadius) continue;
        const prob = dist < 2.0 ? 0.90 : dist < 3.8 ? 0.65 : 0.32;
        const gHash = Math.sin((wx + dx) * 51.3 + (wz + dz) * 79.7) * 43758.5453;
        if (gHash - Math.floor(gHash) < prob) {
          const gx = wx + dx;
          const gz = wz + dz;
          const gyBlock = this.getTerrainHeight(gx, gz);
          if (gyBlock >= 7) {
            const pathCurve = Math.sin(gz * 0.07) * 7.0 - 4;
            if (Math.abs(gx - pathCurve) > 1.8 && !this.isOnVillageRoad(gx, gz, 1.8) && !this.isOnFujiRoad(gx, gz, 1.8) && !this.isInVillage(gx, gz)) {
              setBlock(gx, gyBlock, gz, BLOCK_DEFS.GROUND_PETALS_CARPET);
            }
          }
        }
      }
    }

    // 2. Organic Trunk with Curve and Lean
    const trunkH = isLarge ? (7 + Math.floor(seed * 3)) :
                   isWeeping ? (7 + Math.floor(seed * 2)) :
                   isMedium ? (5 + Math.floor(seed * 2)) : 4;

    const leanAngle = seed * Math.PI * 2;
    const leanDx = Math.cos(leanAngle);
    const leanDz = Math.sin(leanAngle);

    // Large trees have 2x2 base and root flares at ground
    if (isLarge) {
      for (let rx = 0; rx <= 1; rx++) {
        for (let rz = 0; rz <= 1; rz++) {
          setBlock(wx + rx, gy, wz + rz, BLOCK_DEFS.WOOD_LOG);
          setBlock(wx + rx, gy + 1, wz + rz, BLOCK_DEFS.WOOD_LOG);
        }
      }
      // Root buttresses
      setBlock(wx - 1, gy, wz, BLOCK_DEFS.WOOD_LOG);
      setBlock(wx + 2, gy, wz, BLOCK_DEFS.WOOD_LOG);
      setBlock(wx, gy, wz - 1, BLOCK_DEFS.WOOD_LOG);
      setBlock(wx + 1, gy, wz + 2, BLOCK_DEFS.WOOD_LOG);
    }

    // Ascend trunk with curve/lean
    let curX = wx;
    let curZ = wz;
    const trunkPath = [];

    for (let ty = 1; ty <= trunkH; ty++) {
      const tProgress = ty / trunkH;
      const shift = Math.floor(tProgress * 1.8);
      curX = wx + Math.round(leanDx * shift);
      curZ = wz + Math.round(leanDz * shift);

      if (isLarge && ty <= 3) {
        setBlock(curX, gy + ty, curZ, BLOCK_DEFS.WOOD_LOG);
        setBlock(curX + 1, gy + ty, curZ, BLOCK_DEFS.WOOD_LOG);
      } else {
        setBlock(curX, gy + ty, curZ, BLOCK_DEFS.WOOD_LOG);
      }
      trunkPath.push({ x: curX, y: gy + ty, z: curZ });
    }

    const trunkTop = trunkPath[trunkPath.length - 1];

    // 3. Branches Reaching Outward & Upward
    const branches = [];
    const numBranches = isLarge ? 5 : isWeeping ? 4 : isMedium ? 3 : 2;
    const baseAngle = seed * Math.PI * 2;
    const lanternSpots = [];

    for (let b = 0; b < numBranches; b++) {
      const bAngle = baseAngle + (b * (Math.PI * 2 / numBranches)) + (Math.sin(b * 3.7) * 0.35);
      const bLen = isLarge ? (4 + (b % 3)) : isWeeping ? (5 + (b % 2)) : (3 + (b % 2));
      const branchDirX = Math.cos(bAngle);
      const branchDirZ = Math.sin(bAngle);

      let bx = trunkTop.x;
      let by = trunkTop.y - (b === 0 ? 1 : 0);
      let bz = trunkTop.z;

      for (let step = 1; step <= bLen; step++) {
        bx = trunkTop.x + Math.round(branchDirX * step);
        bz = trunkTop.z + Math.round(branchDirZ * step);

        if (isWeeping) {
          // Arch up initially, then droop down gracefully at tips
          if (step <= 2) by += 1;
          else if (step >= 4) by -= 1;
        } else {
          if (step === 2 || step === 4) by += 1;
        }

        setBlock(bx, by, bz, BLOCK_DEFS.WOOD_LOG);

        // Potential lantern hang spot beneath mid bough
        if (step === 2 && (isLarge || (isMedium && b === 0))) {
          lanternSpots.push({ x: bx, y: by, z: bz });
        }
      }

      branches.push({ endX: bx, endY: by, endZ: bz, isWeeping });
    }

    // 4. Canopy Clusters (Rounded, Overlapping, Airy with Gaps)
    const addCluster = (ccx, ccy, ccz, rx, ry, rz, weeping) => {
      const rx2 = rx * rx;
      const ry2 = ry * ry;
      const rz2 = rz * rz;

      for (let cdy = -Math.ceil(ry); cdy <= Math.ceil(ry); cdy++) {
        for (let cdx = -Math.ceil(rx); cdx <= Math.ceil(rx); cdx++) {
          for (let cdz = -Math.ceil(rz); cdz <= Math.ceil(rz); cdz++) {
            const dNormSq = (cdx * cdx) / rx2 + (cdy * cdy) / ry2 + (cdz * cdz) / rz2;
            if (dNormSq > 1.05) continue;

            // Irregular edges and gaps for light, airy look
            const leafHash = Math.sin((ccx + cdx) * 31.7 + (ccy + cdy) * 59.3 + (ccz + cdz) * 83.1) * 43758.5453;
            const leafRand = leafHash - Math.floor(leafHash);
            if (dNormSq > 0.65 && leafRand < 0.14) continue;

            // Colour follows height and soft patches rather than per-block noise, so the
            // canopy reads as one mass: pale on top, deeper pink on the underside.
            const patch = this.noise.noise2D(
              (ccx + cdx) * 0.16 + (ccy + cdy) * 0.09,
              (ccz + cdz) * 0.16
            );
            const tone = (cdy / ry) * 0.6 + patch * 0.45 + (leafRand - 0.5) * 0.2;
            let leafType;
            if (tone > 0.45) leafType = BLOCK_DEFS.LEAVES_WHITE;
            else if (tone > -0.15) leafType = BLOCK_DEFS.LEAVES_LIGHT;
            else if (tone > -0.45) leafType = BLOCK_DEFS.LEAVES_SOFT;
            else if (tone > -0.8) leafType = BLOCK_DEFS.LEAVES_DEEP;
            else leafType = BLOCK_DEFS.LEAVES_MAGENTA;

            setBlock(ccx + cdx, ccy + cdy, ccz + cdz, leafType);

            // Hanging blossom blocks dangling below canopy edges
            if (cdy <= -Math.floor(ry * 0.5) && dNormSq > 0.45 && leafRand > 0.72) {
              const hangLen = weeping ? (2 + Math.floor(leafRand * 3)) : 1;
              for (let h = 1; h <= hangLen; h++) {
                setBlock(ccx + cdx, ccy + cdy - h, ccz + cdz, leafRand > 0.5 ? BLOCK_DEFS.LEAVES_WHITE : BLOCK_DEFS.LEAVES_LIGHT);
              }
            }
          }
        }
      }
    };

    // Central canopy puff
    addCluster(trunkTop.x, trunkTop.y + 1, trunkTop.z, isLarge ? 3.8 : 2.8, 2.4, isLarge ? 3.8 : 2.8, isWeeping);

    // Branch tip clusters
    branches.forEach(br => {
      const rad = isLarge ? 3.2 : isWeeping ? 2.8 : isMedium ? 2.6 : 2.0;
      addCluster(br.endX, br.endY, br.endZ, rad, isWeeping ? 2.6 : 2.2, rad, isWeeping);
    });

    // 5. Hanging Paper Lanterns at Night
    if ((isLarge || (isMedium && seed > 0.5)) && lanternSpots.length > 0) {
      const numLants = isLarge ? Math.min(2, lanternSpots.length) : 1;
      for (let li = 0; li < numLants; li++) {
        const spot = lanternSpots[li];
        setBlock(spot.x, spot.y - 1, spot.z, BLOCK_DEFS.PAPER_LANTERN);
        this.treeLanterns.push({ x: spot.x, y: spot.y - 1, z: spot.z });
      }
    }
  }

  buildChunkMesh(chunk) {
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      chunk.mesh = null;
    }

    const { cx, cz } = chunk;
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    const faceDirs = [
      [ 1,  0,  0], [-1,  0,  0],
      [ 0,  1,  0], [ 0, -1,  0],
      [ 0,  0,  1], [ 0,  0, -1]
    ];

    const faceVerts = [
      [[1,0,0], [1,1,0], [1,1,1], [1,0,1]],
      [[0,0,1], [0,1,1], [0,1,0], [0,0,0]],
      [[0,1,1], [1,1,1], [1,1,0], [0,1,0]],
      [[0,0,0], [1,0,0], [1,0,1], [0,0,1]],
      [[1,0,1], [1,1,1], [0,1,1], [0,0,1]],
      [[0,0,0], [0,1,0], [1,1,0], [1,0,0]]
    ];

    const blockBuckets = {};

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wz = startZ + lz;
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = startX + lx;
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const b = chunk.blocks[lx + lz * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE];
          if (b === BLOCK_DEFS.AIR) continue;

          for (let f = 0; f < 6; f++) {
            const [dx, dy, dz] = faceDirs[f];
            const nx = wx + dx;
            const ny = y + dy;
            const nz = wz + dz;
            const neighbor = this.getBlock(nx, ny, nz);

            let shouldRender = false;
            if (b === BLOCK_DEFS.WATER) {
              shouldRender = (neighbor === BLOCK_DEFS.AIR);
            } else if (this.isOpaque(b)) {
              shouldRender = !this.isOpaque(neighbor);
            } else if (b === BLOCK_DEFS.GLASS) {
              shouldRender = (neighbor !== BLOCK_DEFS.GLASS);
            } else {
              // Leaves and semi-transparent blocks
              shouldRender = (neighbor !== b);
            }

            if (shouldRender) {
              let subMatIdx = 0;
              if (b === BLOCK_DEFS.GRASS || b === BLOCK_DEFS.GROUND_PETALS_CARPET) {
                subMatIdx = f === 2 ? 2 : f === 3 ? 3 : 0;
              } else if (b === BLOCK_DEFS.WOOD_LOG) {
                subMatIdx = (f === 2 || f === 3) ? 2 : 0;
              }

              const bucketKey = `${b}_${subMatIdx}`;
              if (!blockBuckets[bucketKey]) {
                blockBuckets[bucketKey] = {
                  blockId: b,
                  subMatIdx,
                  positions: [],
                  normals: [],
                  uvs: [],
                  colors: []
                };
              }
              const bucket = blockBuckets[bucketKey];

              const verts = faceVerts[f];
              const norm = faceDirs[f];

              // Enhanced ambient occlusion inside canopies
              const computeAO = (vx, vy, vz) => {
                const cx1 = wx + vx;
                const cy1 = y + vy;
                const cz1 = wz + vz;
                let occ = 0;
                if (this.getBlock(cx1, cy1, wz) !== BLOCK_DEFS.AIR) occ++;
                if (this.getBlock(wx, cy1, cz1) !== BLOCK_DEFS.AIR) occ++;
                if (this.getBlock(cx1, cy1, cz1) !== BLOCK_DEFS.AIR) occ++;
                return 1.0 - Math.min(occ, 3) * 0.18;
              };

              const ao = [
                computeAO(verts[0][0], verts[0][1], verts[0][2]),
                computeAO(verts[1][0], verts[1][1], verts[1][2]),
                computeAO(verts[2][0], verts[2][1], verts[2][2]),
                computeAO(verts[3][0], verts[3][1], verts[3][2])
              ];

              const quadIndices = [0, 1, 2, 0, 2, 3];
              const quadUVs = [[0,0], [0,1], [1,1], [0,0], [1,1], [1,0]];

              for (let i = 0; i < 6; i++) {
                const vi = quadIndices[i];
                bucket.positions.push(wx + verts[vi][0], y + verts[vi][1], wz + verts[vi][2]);
                bucket.normals.push(norm[0], norm[1], norm[2]);
                bucket.uvs.push(quadUVs[i][0], quadUVs[i][1]);
                const shade = ao[vi];
                bucket.colors.push(shade, shade, shade);
              }
            }
          }
        }
      }
    }

    this.addFlowers(chunk, blockBuckets);

    const allPos = [];
    const allNorm = [];
    const allUV = [];
    const allCol = [];
    const matList = [];
    const groups = [];

    let vertOffset = 0;

    for (const bucketKey in blockBuckets) {
      const b = blockBuckets[bucketKey];
      let mat = this.materials[b.blockId];
      if (Array.isArray(mat)) mat = mat[b.subMatIdx];

      let matIdx = matList.indexOf(mat);
      if (matIdx === -1) {
        matIdx = matList.length;
        matList.push(mat);
      }

      const count = b.positions.length / 3;
      groups.push({ start: vertOffset, count, materialIndex: matIdx });
      vertOffset += count;

      for (let i = 0; i < b.positions.length; i++) allPos.push(b.positions[i]);
      for (let i = 0; i < b.normals.length; i++) allNorm.push(b.normals[i]);
      for (let i = 0; i < b.uvs.length; i++) allUV.push(b.uvs[i]);
      for (let i = 0; i < b.colors.length; i++) allCol.push(b.colors[i]);
    }

    if (allPos.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(allPos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(allNorm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(allUV, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(allCol, 3));

    groups.forEach(g => geo.addGroup(g.start, g.count, g.materialIndex));

    const mesh = new THREE.Mesh(geo, matList.length === 1 ? matList[0] : matList);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    chunk.mesh = mesh;
  }

  // Flowers are part of the chunk mesh, not blocks: they have no collision, stay in the same
  // spots across rebuilds, and vanish by themselves when their grass is dug or covered.
  addFlowers(chunk, blockBuckets) {
    const startX = chunk.cx * CHUNK_SIZE;
    const startZ = chunk.cz * CHUNK_SIZE;
    const layer = CHUNK_SIZE * CHUNK_SIZE;
    const bucket = {
      blockId: FLOWER_MATERIAL_KEY,
      subMatIdx: 0,
      positions: [],
      normals: [],
      uvs: [],
      colors: []
    };

    const pushQuad = (corners, normal, uv, color) => {
      for (const i of [0, 1, 2, 0, 2, 3]) {
        bucket.positions.push(corners[i][0], corners[i][1], corners[i][2]);
        bucket.normals.push(normal[0], normal[1], normal[2]);
        bucket.uvs.push(uv[i][0], uv[i][1]);
        bucket.colors.push(color[0], color[1], color[2]);
      }
    };
    const stemUV = [[0.75, 0.5], [0.75, 0.5], [0.75, 0.5], [0.75, 0.5]];
    const headUV = [[0, 0], [0.5, 0], [0.5, 1], [0, 1]];

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = startX + lx;
        const wz = startZ + lz;
        const random = (salt) => {
          const v = Math.sin(wx * 12.9898 + wz * 78.233 + salt * 37.719) * 43758.5453;
          return v - Math.floor(v);
        };
        if (random(0) >= QUALITY.flowerDensity || this.isInVillage(wx, wz)) continue;

        let groundY = -1;
        for (let y = CHUNK_HEIGHT - 2; y >= 0; y--) {
          const index = lx + lz * CHUNK_SIZE + y * layer;
          const b = chunk.blocks[index];
          if ((b === BLOCK_DEFS.GRASS || b === BLOCK_DEFS.GROUND_PETALS_CARPET) &&
              chunk.blocks[index + layer] === BLOCK_DEFS.AIR) {
            groundY = y + 1;
            break;
          }
        }
        if (groundY < 0) continue;

        const x = wx + 0.5 + (random(1) - 0.5) * 0.6;
        const z = wz + 0.5 + (random(2) - 0.5) * 0.6;
        const topY = groundY + 0.28 + random(3) * 0.27;
        const half = 0.2 + random(4) * 0.12;
        const angle = random(5) * Math.PI * 2;
        const tiltX = (random(6) - 0.5) * 0.3;
        const tiltZ = (random(7) - 0.5) * 0.3;
        const tint = FLOWER_TINTS[Math.floor(random(8) * FLOWER_TINTS.length)];
        const w = FLOWER_STEM_WIDTH / 2;

        pushQuad(
          [[x - w, groundY, z], [x + w, groundY, z], [x + w, topY, z], [x - w, topY, z]],
          [0, 0, 1], stemUV, FLOWER_STEM_COLOR
        );
        pushQuad(
          [[x, groundY, z - w], [x, groundY, z + w], [x, topY, z + w], [x, topY, z - w]],
          [-1, 0, 0], stemUV, FLOWER_STEM_COLOR
        );

        const cos = Math.cos(angle) * half;
        const sin = Math.sin(angle) * half;
        const corner = (u, v) => {
          const dx = u * cos - v * sin;
          const dz = u * sin + v * cos;
          return [x + dx, topY + dx * tiltX + dz * tiltZ, z + dz];
        };
        // Wound to face upward: the material is double-sided, so a downward-facing quad would be
        // lit as the underside when seen from above, and turn dark.
        pushQuad([corner(-1, 1), corner(1, 1), corner(1, -1), corner(-1, -1)], [0, 1, 0], headUV, tint);
      }
    }

    if (bucket.positions.length > 0) blockBuckets[`${FLOWER_MATERIAL_KEY}_0`] = bucket;
  }

  getStats() {
    let totalFaces = 0;
    let meshedChunks = 0;
    this.chunks.forEach(chunk => {
      if (chunk.mesh && chunk.mesh.geometry) {
        meshedChunks++;
        const pos = chunk.mesh.geometry.getAttribute('position');
        if (pos) totalFaces += pos.count / 6;
      }
    });
    return { chunks: this.chunks.size, meshedChunks, totalFaces };
  }

  logStats() {
    const stats = this.getStats();
    console.log(`[Terrain Engine] Loaded chunks: ${stats.chunks} (${stats.meshedChunks} meshed), Visible faces: ${stats.totalFaces.toLocaleString()}`);
    return stats;
  }

  // Loads the area right now. Blocks the main thread, so keep the radius small.
  updateAround(playerX, playerZ, radiusChunks) {
    this.scheduleAround(playerX, playerZ, radiusChunks);
    this.processStreamTasks(Infinity);
  }

  // Replaces the pending work with the chunks missing around this position, nearest first.
  scheduleAround(playerX, playerZ, radiusChunks) {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);

    // Block data stays in memory, but far meshes are freed and rebuilt when the player returns,
    // so a long walk cannot run a phone out of graphics memory.
    const keepRadius = radiusChunks + QUALITY.hiddenMargin;
    this.chunks.forEach(chunk => {
      if (chunk.mesh && Math.max(Math.abs(chunk.cx - pcx), Math.abs(chunk.cz - pcz)) > keepRadius) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        chunk.mesh = null;
      }
    });

    const tasks = [];
    for (let dz = -radiusChunks; dz <= radiusChunks; dz++) {
      for (let dx = -radiusChunks; dx <= radiusChunks; dx++) {
        const chunk = this.getLoadedChunk(pcx + dx, pcz + dz);
        if (!chunk || !chunk.mesh) {
          tasks.push({ cx: pcx + dx, cz: pcz + dz, dist: Math.hypot(dx, dz) });
        }
      }
    }
    tasks.sort((a, b) => a.dist - b.dist);
    this.streamTasks = tasks;
  }

  // Runs pending work until the time budget is spent; always does at least one step.
  processStreamTasks(budgetMs) {
    const deadline = performance.now() + budgetMs;
    // Changes by another player come first: they happen near where someone is looking
    while (this.dirtyChunks.size > 0 || this.streamTasks.length > 0) {
      if (this.dirtyChunks.size > 0) {
        const [chunk] = this.dirtyChunks;
        this.dirtyChunks.delete(chunk);
        if (chunk.mesh) this.buildChunkMesh(chunk);
      } else {
        const { cx, cz } = this.streamTasks[0];
        if (this.runStreamStep(cx, cz)) this.streamTasks.shift();
      }
      if (performance.now() >= deadline) break;
    }
  }

  // Does one small unit of work toward meshing a chunk; returns true once it is meshed.
  // Neighbours are decorated first because tree canopies can overhang into this chunk.
  runStreamStep(cx, cz) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!this.getLoadedChunk(cx + dx, cz + dz)) {
          this.getOrCreateChunk(cx + dx, cz + dz);
          return false;
        }
      }
    }

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${cx + dx},${cz + dz}`;
        if (!this.decoratedChunks.has(key)) {
          this.decoratedChunks.add(key);
          this.buildTreesAndLandmarks(cx + dx, cz + dz);
          return false;
        }
      }
    }

    const chunk = this.getOrCreateChunk(cx, cz);
    if (!chunk.mesh) this.buildChunkMesh(chunk);
    return true;
  }
}
