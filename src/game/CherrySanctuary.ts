import { AnimalSystem } from '../creatures/AnimalSystem';
import { BLOCK_DEFS, BLOCK_NAMES, HOTBAR_ITEMS } from '../world/blocks';
import { BLOCK_REACH, CHUNK_HEIGHT, CHUNK_SIZE, FUJI, FULLSCREEN_HINT_MS, FULLSCREEN_REFUSED_MESSAGE, IS_TOUCH_DEVICE, LANTERN_REFRESH_MS, LOW_FPS_READINGS, LOW_FPS_THRESHOLD, MIN_RENDER_SCALE, OUT_OF_REACH_MESSAGE, QUALITY, STREAM_BUDGET_MS, SWIM_BUOYANCY, SWIM_DIVE_SPEED, SWIM_PITCH_DEADZONE, SWIM_VERTICAL_SPEED, TOUCH_LOOK_SPEED, UNDERWATER_FOG_COLOR, UNDERWATER_FOG_DENSITY, WATER_EXIT_SPEED, WATER_FLOW_SPEED, fogDensityForRadius, getFullscreenElement, getFullscreenHelp, isRunningAsHomeScreenApp } from '../config';
import { FujiBackdrop } from '../sky/FujiBackdrop';
import { Fishing, type FishingEvent } from '../activities/Fishing';
import { Hunting } from '../activities/Hunting';
import { getBlockDrops, getItemForBlock, getRequiredPickaxeTier, ITEMS } from '../items/items';
import { Inventory } from '../items/Inventory';
import { InventoryPanel } from '../ui/InventoryPanel';
import type { ArrowHit } from '../creatures/AnimalSystem';

const HOTBAR_STORAGE_KEY = 'cherry_hotbar';
import { BlockPlacementAnimator } from '../effects/BlockPlacementAnimator';
import { FishSystem } from '../creatures/FishSystem';
import { GroundPetalSystem } from '../effects/GroundPetalSystem';
import { MULTIPLAYER_STEP_ASIDE_DISTANCE, MULTIPLAYER_STEP_ASIDE_TRIES, MultiplayerClient, PLAYER_NAME_STORAGE_KEY, cleanPlayerName } from '../multiplayer/MultiplayerClient';
import { PetalSystem } from '../effects/PetalSystem';
import { ProceduralAudio } from '../audio/ProceduralAudio';
import { SkyBodies } from '../sky/SkyBodies';
import { TextureGenerator } from '../textures/TextureGenerator';
import { VoxelCharacter } from '../player/VoxelCharacter';
import { VoxelParticleSystem } from '../effects/VoxelParticleSystem';
import { VoxelWorld } from '../world/VoxelWorld';
import { WindSystem } from '../world/WindSystem';

// =========================================================================
// 9. MAIN ENGINE ORCHESTRATOR
// =========================================================================
export class CherrySanctuary {
  declare inventory: Inventory;
  declare inventoryPanel: InventoryPanel;
  declare hotbarItems: string[];
  declare fishing: Fishing;
  declare hunting: Hunting;
  declare fujiBackdrop: FujiBackdrop;
  declare viewportWidth: number;
  declare viewportHeight: number;
  declare _camOffset: any;
  declare _forward: any;
  declare _lookTarget: any;
  declare _moveDir: any;
  declare _right: any;
  declare _wishMove: any;
  declare activeSlot: any;
  declare ambientLight: any;
  declare animals: any;
  declare audio: any;
  declare blockParticles: any;
  declare blockPlacer: any;
  declare bobIntensity: any;
  declare camera: any;
  declare changeMusic: any;
  declare character: any;
  declare clock: any;
  declare currentAltitudeOffset: any;
  declare currentCamDist: any;
  declare currentFps: any;
  declare currentLanternInt: any;
  declare fireflies: any;
  declare fish: any;
  declare frameCount: any;
  declare groundPetals: any;
  declare headBobTimer: any;
  declare headBobX: any;
  declare headBobY: any;
  declare highlightBox: any;
  declare inputKeys: any;
  declare isCinematicTour: any;
  declare isDebugOverlayVisible: any;
  declare isFlyMode: any;
  declare isLocked: any;
  declare isThirdPerson: any;
  declare isUserLooking: any;
  declare landingDip: any;
  declare lastChunkX: any;
  declare lastChunkZ: any;
  declare lastFpsUpdate: any;
  declare lastLanternRefresh: any;
  declare lastMinimapUpdate: any;
  declare lowFpsReadings: any;
  declare mouseAim: any;
  declare multiplayer: any;
  declare petals: any;
  declare player: any;
  declare previousVelY: any;
  declare renderScale: any;
  declare renderer: any;
  declare scene: any;
  declare skyBodies: any;
  declare spawnPoint: any;
  declare sunLight: any;
  declare targetAmbCol: any;
  declare targetFfOpacity: any;
  declare targetFogCol: any;
  declare targetLanternInt: any;
  declare targetPitch: any;
  declare targetSkyCol: any;
  declare targetSunCol: any;
  declare targetSunInt: any;
  declare targetSunPos: any;
  declare targetSunsetGlow: any;
  declare targetYaw: any;
  declare textures: any;
  declare timeOfDay: any;
  declare toastTimer: any;
  declare tourActiveTimer: any;
  declare tourCurrentPitch: any;
  declare tourCurrentYaw: any;
  declare tourCurve: any;
  declare tourCurveLength: any;
  declare tourExitLandingPos: any;
  declare tourExitStartCamPos: any;
  declare tourExitStartPitch: any;
  declare tourExitStartTime: any;
  declare tourExitStartYaw: any;
  declare tourExitTargetCamPos: any;
  declare tourIsPaused: any;
  declare tourLastSteerTime: any;
  declare tourSpeedIndex: any;
  declare tourSpeedLabels: any;
  declare tourSpeedLevels: any;
  declare tourStartCamPitch: any;
  declare tourStartCamPos: any;
  declare tourStartCamYaw: any;
  declare tourState: any;
  declare tourSteerDown: any;
  declare tourSteerOffset: any;
  declare tourSteerUp: any;
  declare tourT: any;
  declare tourTargetEntryPitch: any;
  declare tourTargetEntryPos: any;
  declare tourTargetEntryYaw: any;
  declare tourTime: any;
  declare tourTopViewActive: any;
  declare tourTransitionDuration: any;
  declare tourTransitionStartTime: any;
  declare treeLanternPointLights: any;
  declare userAltitudeOffset: any;
  declare userLookPitchOffset: any;
  declare userLookYawOffset: any;
  declare viewRadius: any;
  declare viewport: any;
  declare wasGrounded: any;
  declare wind: any;
  declare world: any;

  constructor() {
    this.viewport = document.getElementById('viewport');
    this.clock = new THREE.Clock();

    this.audio = new ProceduralAudio();
    this.textures = TextureGenerator.generateAll();
    this.wind = new WindSystem();

    this.isThirdPerson = false;
    this.isFlyMode = false;
    this.isCinematicTour = false;
    this.timeOfDay = 'day';
    this.tourTime = 0;
    this.activeSlot = 0;

    // Cinematic Aerial Tour State & Systems
    this.tourState = 'INACTIVE'; // 'INACTIVE' | 'ENTERING' | 'ACTIVE' | 'EXITING'
    this.tourCurve = null;
    this.tourCurveLength = 0;
    this.tourT = 0;
    this.tourActiveTimer = 0;
    this.tourTransitionStartTime = 0;
    this.tourExitStartTime = 0;
    this.tourTransitionDuration = 1.8;
    this.tourStartCamPos = new THREE.Vector3();
    this.tourStartCamYaw = 0;
    this.tourStartCamPitch = 0;
    this.tourTargetEntryPos = new THREE.Vector3();
    this.tourTargetEntryYaw = 0;
    this.tourTargetEntryPitch = 0;
    this.tourExitStartCamPos = new THREE.Vector3();
    this.tourExitLandingPos = new THREE.Vector3();
    this.tourExitTargetCamPos = new THREE.Vector3();
    this.tourExitStartYaw = 0;
    this.tourExitStartPitch = 0;
    this.tourCurrentYaw = -2.2;
    this.tourCurrentPitch = -0.28;
    this.tourIsPaused = false;
    this.tourTopViewActive = false;
    this.tourSpeedLevels = [3.5, 6.5, 13.0];
    this.tourSpeedLabels = ['⚡ Tốc Độ: Chậm (0.5x)', '⚡ Tốc Độ: Chuẩn (1x)', '⚡ Tốc Độ: Nhanh (2x)'];
    this.tourSpeedIndex = 1; // Default: Normal (1x)
    this.tourSteerOffset = new THREE.Vector3();
    this.tourLastSteerTime = 0;
    this.tourSteerUp = false;
    this.tourSteerDown = false;
    this.userAltitudeOffset = 0;
    this.currentAltitudeOffset = 0;
    this.userLookYawOffset = 0;
    this.userLookPitchOffset = 0;
    this.isUserLooking = false;

    this.player = {
      pos: new THREE.Vector3(-2.5, 13.0, 5.5),
      vel: new THREE.Vector3(),
      yaw: -2.2,
      pitch: -0.05,
      isGrounded: true,
      isInWater: false,
      height: 1.8,
      radius: 0.35,
      speed: 6.0,
      runSpeed: 10.5
    };

    // Smooth camera controls & head-bob state
    this.targetYaw = -2.2;
    this.targetPitch = -0.05;
    this.headBobTimer = 0;
    this.bobIntensity = 0;
    this.headBobX = 0;
    this.headBobY = 0;
    this.landingDip = 0;
    this.currentCamDist = 0.0;
    this.previousVelY = 0;
    this.wasGrounded = true;

    // Reusable vectors for zero allocation in animate loop
    this._camOffset = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();
    this._moveDir = new THREE.Vector3();
    this._wishMove = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();

    this.treeLanternPointLights = [];
    this.currentLanternInt = 0.05;
    this.lastLanternRefresh = 0;

    this.isDebugOverlayVisible = false;
    this.frameCount = 0;
    this.currentFps = 60;
    this.lastFpsUpdate = 0;
    this.lastChunkX = null;
    this.lastChunkZ = null;

    this.inputKeys = {};
    this.mouseAim = new THREE.Vector2();

    this.initThree();
    this.initWorld();
    this.initCharacter();
    this.initPetalsAndLighting();
    this.inventory = new Inventory();
    this.hotbarItems = this.loadHotbar();
    this.inventory.onChange(() => this.refreshHotbarCounts());
    this.inventoryPanel = new InventoryPanel(this.inventory, this.textures, id => this.putInActiveSlot(id), message => this.showToast(message));
    this.fishing = new Fishing(this.scene, this.world, (event, item) => this.handleFishingEvent(event, item));
    this.hunting = new Hunting(this.scene, this.world, this.animals, (killed, hit) => this.handleArrowHit(killed, hit));
    this.initHotbarUI();
    this.initEventListeners();
    this.initHaikuCycler();
    this.multiplayer = new MultiplayerClient(this);

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.viewRadius = QUALITY.viewRadius;
    this.scene.fog = new THREE.FogExp2(0xfcd6df, fogDensityForRadius(this.viewRadius));

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 400);

    // MSAA adds little on high-DPI screens but costs a lot of GPU time there.
    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 1.5,
      powerPreference: 'high-performance'
    });
    this.renderScale = Math.min(window.devicePixelRatio, QUALITY.maxPixelRatio);
    this.lowFpsReadings = 0;
    this.renderer.setPixelRatio(this.renderScale);
    this.syncViewportSize();
    this.renderer.shadowMap.enabled = QUALITY.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.viewport.appendChild(this.renderer.domElement);
  }

  resetWorldAndView(time) {
    this.world.resetWorld(time);
    this.world.updateAround(this.player.pos.x, this.player.pos.z, 1);
    this.world.scheduleAround(this.player.pos.x, this.player.pos.z, this.viewRadius);
    this.setupTreeLanternLights();
    this.groundPetals.spawnAround(this.player.pos.x, this.player.pos.z);
  }

  // Moves the player a few blocks away from a point, onto open ground, and turns to face it.
  stepAsideFrom(point, startAngle) {
    if (this.isCinematicTour || this.isFlyMode) return;
    const world = this.world;
    for (let i = 0; i < MULTIPLAYER_STEP_ASIDE_TRIES; i++) {
      const angle = startAngle + (i / MULTIPLAYER_STEP_ASIDE_TRIES) * Math.PI * 2;
      const x = Math.floor(point.x + Math.cos(angle) * MULTIPLAYER_STEP_ASIDE_DISTANCE) + 0.5;
      const z = Math.floor(point.z + Math.sin(angle) * MULTIPLAYER_STEP_ASIDE_DISTANCE) + 0.5;
      const y = world.getHighestSolidY(x, z);
      const ground = world.getBlock(Math.floor(x), y - 1, Math.floor(z));
      const isGround = ground === BLOCK_DEFS.GRASS || ground === BLOCK_DEFS.STONE ||
                       ground === BLOCK_DEFS.GROUND_PETALS_CARPET || ground === BLOCK_DEFS.SAND;
      if (!isGround || Math.abs(y - point.y) > 2 || this.checkAABB(x, y, z, this.player.radius, this.player.height)) continue;

      this.player.pos.set(x, y, z);
      this.player.vel.set(0, 0, 0);
      this.turnToward(point);
      return;
    }
  }

  // Sets the look target toward a point, taking the short way around. Returns the new target.
  turnToward(point) {
    const yaw = Math.atan2(this.player.pos.x - point.x, this.player.pos.z - point.z);
    const difference = Math.atan2(Math.sin(yaw - this.targetYaw), Math.cos(yaw - this.targetYaw));
    this.targetYaw += difference;
    return this.targetYaw;
  }

  // The canvas is stretched to its box by CSS, so it always covers the screen. This only keeps
  // the drawing resolution and camera shape matched to that box.
  syncViewportSize() {
    const width = this.viewport.clientWidth || window.innerWidth;
    const height = this.viewport.clientHeight || window.innerHeight;
    if (width === this.viewportWidth && height === this.viewportHeight) return;
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  findSpawnPosition() {
    const candidates = [];
    for (let wz = 2; wz <= 10; wz++) {
      const pathCurve = Math.sin(wz * 0.07) * 7.0 - 4;
      const wx = Math.round(pathCurve);

      let stoneY = -1;
      for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
        const b = this.world.getBlock(wx, y, wz);
        if (b === BLOCK_DEFS.STONE) {
          const above1 = this.world.getBlock(wx, y + 1, wz);
          const above2 = this.world.getBlock(wx, y + 2, wz);
          if (above1 === BLOCK_DEFS.AIR && above2 === BLOCK_DEFS.AIR) {
            stoneY = y;
            break;
          }
        }
      }

      if (stoneY > 0) {
        const lakeDist = Math.hypot(wx - this.world.lakeCenter.x, wz - this.world.lakeCenter.z);
        const score = 100 - Math.abs(lakeDist - 15);
        candidates.push({ x: wx + 0.5, y: stoneY + 1.0, z: wz + 0.5, block: BLOCK_DEFS.STONE, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    if (candidates.length > 0) {
      return candidates[0];
    }
    return { x: 1.5, y: 12.0, z: 10.5, block: BLOCK_DEFS.STONE };
  }

  teleportToSafeGround() {
    const px = this.player.pos.x;
    const pz = this.player.pos.z;

    let bestSpot = null;
    let minD = Infinity;

    for (let rad = 0; rad <= 8; rad++) {
      for (let dz = -rad; dz <= rad; dz++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== rad) continue;
          const wx = Math.round(px + dx);
          const wz = Math.round(pz + dz);

          for (let y = CHUNK_HEIGHT - 2; y >= 2; y--) {
            const b = this.world.getBlock(wx, y, wz);
            if (this.world.isCollidable(b)) {
              const above1 = this.world.getBlock(wx, y + 1, wz);
              const above2 = this.world.getBlock(wx, y + 2, wz);
              if (above1 === BLOCK_DEFS.AIR && above2 === BLOCK_DEFS.AIR) {
                const d = dx * dx + dz * dz;
                if (d < minD) {
                  minD = d;
                  bestSpot = { x: wx + 0.5, y: y + 1.0, z: wz + 0.5 };
                }
                break;
              }
            }
          }
          if (bestSpot && rad > 0) break;
        }
        if (bestSpot && rad > 0) break;
      }
      if (bestSpot) break;
    }

    if (!bestSpot) {
      bestSpot = this.spawnPoint || { x: 1.5, y: 12.0, z: 10.5 };
    }

    this.player.pos.set(bestSpot.x, bestSpot.y, bestSpot.z);
    this.player.vel.set(0, 0, 0);
    this.player.isGrounded = true;
    this.showToast('Đã đưa bạn về vị trí an toàn trên mặt đất!');
  }

  initWorld() {
    this.world = new VoxelWorld(this.scene, this.textures);

    const targetSpawnX = -2;
    const targetSpawnZ = 5;

    // Build only the ground around the player up front so the page opens quickly.
    // The rest of the view distance streams in across the following frames.
    this.world.updateAround(targetSpawnX, targetSpawnZ, 1);

    const spawn = this.findSpawnPosition();
    this.spawnPoint = { ...spawn };

    this.world.scheduleAround(spawn.x, spawn.z, this.viewRadius);
    this.lastChunkX = Math.floor(spawn.x / CHUNK_SIZE);
    this.lastChunkZ = Math.floor(spawn.z / CHUNK_SIZE);

    this.player.pos.set(spawn.x, spawn.y, spawn.z);
    this.player.vel.set(0, 0, 0);
    this.player.isGrounded = true;
    this.player.yaw = -2.2;
    this.player.pitch = -0.05;
    this.targetYaw = -2.2;
    this.targetPitch = -0.05;

    this.camera.position.set(spawn.x, spawn.y + 1.6, spawn.z);

    this.groundPetals = new GroundPetalSystem(this.scene, this.textures, this.world);
    this.groundPetals.spawnAround(this.player.pos.x, this.player.pos.z);

    this.blockPlacer = new BlockPlacementAnimator(this.scene, this.world.materials);
    this.blockParticles = new VoxelParticleSystem(this.scene);

    // Only the block's 12 edges; a wireframe material would also draw each face's diagonal
    const boxEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    this.highlightBox = new THREE.LineSegments(boxEdges, edgeMat);
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);
  }

  initCharacter() {
    this.character = new VoxelCharacter(this.scene);
  }

  initPetalsAndLighting() {
    this.petals = new PetalSystem(this.scene);
    this.fish = new FishSystem(this.scene, this.world);
    this.animals = new AnimalSystem(this.scene, this.world);
    this.skyBodies = new SkyBodies(this.scene);
    this.fujiBackdrop = new FujiBackdrop(this.scene);

    this.sunLight = new THREE.DirectionalLight(0xfff3db, 1.9);
    this.sunLight.castShadow = QUALITY.shadows;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0xffd4de, 0.75);
    this.scene.add(this.ambientLight);

    const ffGeo = new THREE.BufferGeometry();
    const ffPos = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      ffPos[i * 3] = (Math.random() - 0.5) * 50;
      ffPos[i * 3 + 1] = 6 + Math.random() * 6;
      ffPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    this.fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({
      color: 0x7ef29d,
      size: 0.45,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    }));
    this.scene.add(this.fireflies);

    // Setup point lights for hanging paper lanterns on trees
    this.setupTreeLanternLights();

    this.targetSkyCol = new THREE.Color(0xffe2ea);
    this.targetFogCol = new THREE.Color(0xfcd6df);
    this.targetSunCol = new THREE.Color(0xfff3db);
    this.targetAmbCol = new THREE.Color(0xffd4de);
    this.targetSunPos = new THREE.Vector3(65, 80, 45);
    this.targetSunInt = 1.9;
    this.targetFfOpacity = 0.0;
    this.targetSunsetGlow = 0.0;
    this.targetLanternInt = 0.05;

    this.setTimeOfDay('day', false);
  }

  // A fixed pool of lights follows the nearest lanterns. Every light adds cost to every pixel,
  // and changing the light count recompiles all shaders, so the pool size never changes.
  setupTreeLanternLights() {
    if (this.treeLanternPointLights.length === 0) {
      for (let i = 0; i < QUALITY.lanternLights; i++) {
        const pLight = new THREE.PointLight(0xffa33b, 0, 14);
        this.scene.add(pLight);
        this.treeLanternPointLights.push(pLight);
      }
    }
    this.refreshLanternLights(this.player.pos.x, this.player.pos.z);
  }

  refreshLanternLights(x, z) {
    const pool = this.treeLanternPointLights;
    const nearest = [];
    const consider = (pos, isPlaced) => {
      const dx = pos.x - x;
      const dz = pos.z - z;
      // Placed lanterns are much brighter, so they keep their light from twice as far away.
      const score = (dx * dx + dz * dz) * (isPlaced ? 0.25 : 1);
      if (nearest.length === pool.length && score >= nearest[nearest.length - 1].score) return;
      let i = nearest.length;
      while (i > 0 && nearest[i - 1].score > score) i--;
      nearest.splice(i, 0, { pos, isPlaced, score });
      if (nearest.length > pool.length) nearest.pop();
    };
    this.world.treeLanterns.forEach(pos => consider(pos, false));
    this.world.placedLanterns.forEach(pos => consider(pos, true));

    pool.forEach((light, i) => {
      const entry = nearest[i];
      light.userData.active = !!entry;
      if (!entry) return;
      light.userData.placed = entry.isPlaced;
      light.position.set(entry.pos.x + 0.5, entry.pos.y + 0.5, entry.pos.z + 0.5);
      light.color.setHex(entry.isPlaced ? 0xffa726 : 0xffa33b);
      light.distance = entry.isPlaced ? 18 : 14;
    });
    this.applyLanternIntensity();
  }

  applyLanternIntensity() {
    this.treeLanternPointLights.forEach(l => {
      if (!l.userData.active) l.intensity = 0;
      else l.intensity = l.userData.placed ? 2.2 : this.currentLanternInt;
    });
  }

  setTimeOfDay(mode, smooth = true) {
    this.timeOfDay = mode;
    this.audio.isNight = (mode === 'night');

    let skyCol, fogCol, sunCol, ambCol, sunInt, ffOpacity, sunsetGlow, lanternInt;
    const bloomEl = document.getElementById('bloom-overlay');

    if (mode === 'day') {
      // A blue sky gives the pink canopies something to contrast against; the warm pink
      // ambient light keeps faces in shade rosy instead of grey.
      skyCol = 0x4f9fe3;
      fogCol = 0xb4dff6;
      sunCol = 0xfff3db;
      ambCol = 0xffc0d4;
      sunInt = 1.45;
      ffOpacity = 0.0;
      sunsetGlow = 0.0;
      lanternInt = 0.05;
      this.targetSunPos.set(80, 46, 54); // low enough to see without looking straight up
      if (bloomEl) bloomEl.style.opacity = '0.35';
    } else if (mode === 'sunset') {
      // Orange at the horizon rising into dusky indigo, like a real sunset
      skyCol = 0x37397f;
      fogCol = 0xff9e5e;
      sunCol = 0xffb58a;
      ambCol = 0x663d5e;
      sunInt = 1.35;
      ffOpacity = 0.25;
      sunsetGlow = 0.45;
      lanternInt = 0.85;
      this.targetSunPos.set(120, 24, 40);
      if (bloomEl) bloomEl.style.opacity = '0.2';
    } else {
      // Night
      skyCol = 0x03050d;
      fogCol = 0x11162b;
      sunCol = 0xa5b4fc;
      ambCol = 0x1e2442;
      sunInt = 0.4;
      ffOpacity = 0.85;
      sunsetGlow = 0.0;
      lanternInt = 2.4;
      this.targetSunPos.set(-70, 48, -50); // the moon rises opposite the sun
      if (bloomEl) bloomEl.style.opacity = '0.12';
    }

    this.targetSkyCol.setHex(skyCol);
    this.targetFogCol.setHex(fogCol);
    this.targetSunCol.setHex(sunCol);
    this.targetAmbCol.setHex(ambCol);
    this.targetSunInt = sunInt;
    this.targetFfOpacity = ffOpacity;
    this.targetSunsetGlow = sunsetGlow;
    this.targetLanternInt = lanternInt;
    this.skyBodies.setMode(mode, smooth);

    if (!smooth) {
      this.scene.background = new THREE.Color(skyCol);
      this.scene.fog.color.setHex(fogCol);
      this.sunLight.color.setHex(sunCol);
      this.sunLight.intensity = sunInt;
      this.sunLight.position.copy(this.targetSunPos);
      this.ambientLight.color.setHex(ambCol);
      this.fireflies.material.opacity = ffOpacity;
      if (this.world && this.world.leafWindUniforms) {
        this.world.leafWindUniforms.uSunsetGlow.value = sunsetGlow;
      }
      this.currentLanternInt = lanternInt;
      this.applyLanternIntensity();
    }
  }

  updateTimeTransition(dt) {
    const rate = 1.0 - Math.exp(-2.2 * dt); // smooth 1.5s - 2.0s transition

    this.scene.background.lerp(this.targetSkyCol, rate);
    this.scene.fog.color.lerp(this.targetFogCol, rate);
    this.sunLight.color.lerp(this.targetSunCol, rate);
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, this.targetSunInt, rate);
    this.sunLight.position.lerp(this.targetSunPos, rate);
    this.ambientLight.color.lerp(this.targetAmbCol, rate);
    this.fireflies.material.opacity = THREE.MathUtils.lerp(this.fireflies.material.opacity, this.targetFfOpacity, rate);

    if (this.world && this.world.leafWindUniforms) {
      const curGlow = this.world.leafWindUniforms.uSunsetGlow.value;
      this.world.leafWindUniforms.uSunsetGlow.value = THREE.MathUtils.lerp(curGlow, this.targetSunsetGlow, rate);
    }

    this.currentLanternInt = THREE.MathUtils.lerp(this.currentLanternInt, this.targetLanternInt, rate);
    this.applyLanternIntensity();
  }

  // Each slot holds an item the player can place. The chosen items are remembered.
  initHotbarUI() {
    const bar = document.getElementById('hotbar');
    bar.innerHTML = '';
    this.hotbarItems.forEach((itemId, idx) => {
      const item = ITEMS[itemId];
      const slot = document.createElement('div');
      slot.className = `hotbar-slot ${idx === this.activeSlot ? 'active' : ''}`;
      slot.title = item.name;

      const key = document.createElement('div');
      key.className = 'slot-key';
      key.textContent = String(idx + 1);
      slot.appendChild(key);

      // cloneNode copies the canvas size but not its pixels
      const source = this.textures[item.texture].canvas;
      const icon = source.cloneNode();
      icon.getContext('2d').drawImage(source, 0, 0);
      slot.appendChild(icon);

      const count = document.createElement('div');
      count.className = 'slot-count';
      slot.appendChild(count);

      slot.addEventListener('click', () => this.selectSlot(idx));
      bar.appendChild(slot);
    });
    this.refreshHotbarCounts();
  }

  refreshHotbarCounts() {
    document.querySelectorAll('.hotbar-slot').forEach((slot, i) => {
      const itemId = this.hotbarItems[i];
      const owned = this.inventory.count(itemId);
      slot.querySelector('.slot-count').textContent = this.inventory.creative ? '∞' : owned > 0 ? String(owned) : '';
      slot.classList.toggle('is-empty', !this.inventory.has(itemId));
    });
  }

  putInActiveSlot(itemId: string) {
    this.hotbarItems[this.activeSlot] = itemId;
    try {
      localStorage.setItem(HOTBAR_STORAGE_KEY, JSON.stringify(this.hotbarItems));
    } catch (e) {
      // Not saved, which only means the default slots next time
    }
    this.initHotbarUI();
    this.showToast(`Ô ${this.activeSlot + 1}: ${ITEMS[itemId].name}`);
  }

  loadHotbar(): string[] {
    const defaults = HOTBAR_ITEMS.map(item => getItemForBlock(item.id));
    try {
      const saved = JSON.parse(localStorage.getItem(HOTBAR_STORAGE_KEY));
      if (Array.isArray(saved) && saved.length === defaults.length &&
          saved.every(id => ITEMS[id] && ITEMS[id].block !== undefined)) return saved;
    } catch (e) {
      // Damaged or unavailable: use the default slots
    }
    return defaults;
  }

  toggleInventory() {
    const open = !this.inventoryPanel.isOpen;
    this.inventoryPanel.setOpen(open);
    if (open) {
      if (document.exitPointerLock) document.exitPointerLock();
    } else {
      this.requestPointerLock();
    }
  }

  // The button for tools. What it does depends on what the player holds and looks at.
  useTool() {
    if (this.isCinematicTour) return;
    if (this.fishing.isActive) {
      this.fishing.react();
      return;
    }
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    if (this.inventory.has('fishing_rod')) {
      const water = this.fishing.findWater(this.camera.position, direction);
      if (water) {
        this.fishing.cast(water);
        return;
      }
    }
    if (this.inventory.has('bow')) {
      if (!this.hunting.canShoot) return;
      if (!this.inventory.use('arrow')) {
        this.showToast('Hết mũi tên. Chế tạo thêm từ que gỗ và đá');
        return;
      }
      this.hunting.shoot(this.camera.position, direction);
      this.audio.playBlockPlace();
      return;
    }
    this.showToast(this.inventory.has('fishing_rod')
      ? 'Hãy nhìn xuống mặt nước ở gần rồi thả câu'
      : 'Chế tạo Cần câu hoặc Cung trong Túi Đồ để dùng nút này');
  }

  handleFishingEvent(event: FishingEvent, item?: string) {
    if (event === 'cast') {
      this.showToast('Đã thả câu, chờ cá cắn...');
    } else if (event === 'bite') {
      this.showToast('🎣 Cá cắn câu! Bấm ngay!');
      this.audio.playBlockBreak();
    } else if (event === 'caught') {
      this.inventory.add(item);
      this.showToast(`Câu được: ${ITEMS[item].name}!`);
      this.audio.playBlockPlace();
    } else if (event === 'lost') {
      this.showToast('Cá chạy mất rồi...');
    } else if (event === 'too-far') {
      this.showToast('Đi quá xa, đã thu dây câu');
    }
  }

  handleArrowHit(killed: boolean, hit: ArrowHit) {
    if (!killed) {
      this.showToast('Trúng rồi! Nó đang bỏ chạy');
      return;
    }
    for (const [itemId, amount] of hit.species.drops) this.inventory.add(itemId, amount);
    this.blockParticles.burst(hit.position.x - 0.5, hit.position.y - 0.5, hit.position.z - 0.5, BLOCK_DEFS.WOOD_LOG, 14);
    this.showToast(`Săn được lợn rừng: ${hit.species.drops.map(([id, n]) => `+${n} ${ITEMS[id].name}`).join(', ')}`);
  }

  selectSlot(idx) {
    this.activeSlot = (idx + this.hotbarItems.length) % this.hotbarItems.length;
    document.querySelectorAll('.hotbar-slot').forEach((s, i) => {
      s.classList.toggle('active', i === this.activeSlot);
    });
    this.showToast(`Đã chọn: ${ITEMS[this.hotbarItems[this.activeSlot]].name}`);
  }

  initHaikuCycler() {
    const haikus = [
      { text: "Hoa anh đào rơi / Trên thềm cỏ xanh ngắt / Gió thoảng hương thiền...", author: "Matsuo Bashō" },
      { text: "Dưới bóng hoa đào / Người lạ cũng hóa / Thành bạn tri âm...", author: "Kobayashi Issa" },
      { text: "Gió xuân mơn man / Cánh hồng khẽ chạm / Tiếng chuông ngân vang...", author: "Yosa Buson" },
      { text: "Một cánh hoa bay / Đậu trên cầu gỗ / Chiều dần buông trôi...", author: "Kaga no Chiyo" },
      { text: "Bóng trăng qua hồ / Hoa đào rắc lối / Thảnh thơi tâm thiền...", author: "Ryōkan Taigu" }
    ];

    let hIdx = 0;
    const banner = document.getElementById('haiku-banner');
    const hText = document.getElementById('haiku-text');
    const hAuth = document.getElementById('haiku-author');

    const cycle = () => {
      banner.classList.remove('visible');
      setTimeout(() => {
        const h = haikus[hIdx % haikus.length];
        hText.textContent = `"${h.text}"`;
        hAuth.textContent = `— ${h.author}`;
        banner.classList.add('visible');
        hIdx++;
      }, 800);
    };

    cycle();
    setInterval(cycle, 45000);
  }

  initEventListeners() {
    const nameInput = document.getElementById('player-name') as HTMLInputElement;
    try {
      nameInput.value = localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || '';
    } catch (e) {
      // Private browsing can block storage; the player just types a name again
    }

    document.getElementById('btn-inventory').addEventListener('click', () => this.toggleInventory());
    document.getElementById('inventory-close').addEventListener('click', () => this.toggleInventory());

    document.getElementById('btn-online').addEventListener('click', () => {
      this.showToast(this.multiplayer.describePlayers());
    });

    document.getElementById('btn-enter').addEventListener('click', () => {
      document.getElementById('welcome-screen').classList.add('hidden');
      nameInput.blur();
      const name = cleanPlayerName(nameInput.value) || `Khách ${1000 + Math.floor(Math.random() * 9000)}`;
      try {
        localStorage.setItem(PLAYER_NAME_STORAGE_KEY, name);
      } catch (e) {
        // Not saved, which only means typing it again next time
      }
      if (IS_TOUCH_DEVICE && !isRunningAsHomeScreenApp()) this.enterFullscreen();
      this.multiplayer.connect(name);
      this.audio.init();
      this.requestPointerLock();
    });

    const musicButton = document.getElementById('btn-music');
    musicButton.textContent = this.audio.trackLabel;
    this.changeMusic = () => {
      this.audio.nextTrack();
      musicButton.textContent = this.audio.trackLabel;
      this.showToast(this.audio.trackLabel);
    };
    musicButton.addEventListener('click', this.changeMusic);

    document.getElementById('btn-audio').addEventListener('click', () => {
      const on = this.audio.toggleMute();
      document.getElementById('btn-audio').textContent = on ? '🔊 Nhạc: BẬT' : '🔇 Nhạc: TẮT';
    });

    document.getElementById('btn-tour').addEventListener('click', () => {
      this.toggleCinematicTour();
    });

    // Tour HUD Interactive Controls
    const btnTourPause = document.getElementById('btn-tour-pause');
    if (btnTourPause) {
      btnTourPause.addEventListener('click', () => {
        this.tourIsPaused = !this.tourIsPaused;
        btnTourPause.textContent = this.tourIsPaused ? '▶️ Tiếp Tục' : '⏸️ Tạm Dừng';
        this.showToast(this.tourIsPaused ? 'Đã tạm dừng tham quan' : 'Đã tiếp tục tham quan');
      });
    }

    const btnTourSpeed = document.getElementById('btn-tour-speed');
    if (btnTourSpeed) {
      btnTourSpeed.addEventListener('click', () => {
        this.tourSpeedIndex = (this.tourSpeedIndex + 1) % this.tourSpeedLevels.length;
        btnTourSpeed.textContent = this.tourSpeedLabels[this.tourSpeedIndex];
        this.showToast(this.tourSpeedLabels[this.tourSpeedIndex]);
      });
    }

    const btnTourTopview = document.getElementById('btn-tour-topview');
    if (btnTourTopview) {
      btnTourTopview.addEventListener('click', () => {
        this.tourTopViewActive = !this.tourTopViewActive;
        btnTourTopview.classList.toggle('active', this.tourTopViewActive);
        this.showToast(this.tourTopViewActive ? 'Góc nhìn thẳng từ trên xuống' : 'Góc nhìn tham quan chuẩn');
      });
    }

    const btnTourExit = document.getElementById('btn-tour-exit');
    if (btnTourExit) {
      btnTourExit.addEventListener('click', () => {
        this.exitCinematicTour();
      });
    }

    const bindPress = (elId, onDown, onUp) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('mousedown', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); onUp(); });
      el.addEventListener('mouseleave', (e) => { onUp(); });
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); }, { passive: false });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); }, { passive: false });
      el.addEventListener('touchcancel', (e) => { e.preventDefault(); onUp(); }, { passive: false });
    };
    bindPress('btn-tour-up', () => { this.tourSteerUp = true; }, () => { this.tourSteerUp = false; });
    bindPress('btn-tour-down', () => { this.tourSteerDown = true; }, () => { this.tourSteerDown = false; });

    document.getElementById('btn-cam').addEventListener('click', () => {
      this.isThirdPerson = !this.isThirdPerson;
      document.getElementById('btn-cam').classList.toggle('active', this.isThirdPerson);
      this.showToast(this.isThirdPerson ? 'Góc Nhìn Thứ 3 (Third Person)' : 'Góc Nhìn Thứ Nhất (FPS)');
    });

    document.getElementById('btn-fly').addEventListener('click', () => {
      this.isFlyMode = !this.isFlyMode;
      document.getElementById('btn-fly').textContent = this.isFlyMode ? '🕊️ Bay: BẬT' : '🕊️ Bay: TẮT';
      document.getElementById('btn-fly').classList.toggle('active', this.isFlyMode);
      this.showToast(this.isFlyMode ? 'Đã bật Chế Độ Bay' : 'Đã tắt Bay');
    });

    document.getElementById('btn-time').addEventListener('click', () => {
      const modes = ['day', 'sunset', 'night'];
      const labels = { day: '☀️ Ban Ngày', sunset: '🌅 Hoàng Hôn', night: '🌙 Ban Đêm' };
      const next = modes[(modes.indexOf(this.timeOfDay) + 1) % modes.length];
      this.setTimeOfDay(next);
      document.getElementById('btn-time').textContent = labels[next];
      const setSelect = document.getElementById('set-time') as HTMLSelectElement;
      if (setSelect) setSelect.value = next;
    });

    document.getElementById('btn-menu').addEventListener('click', () => {
      this.togglePauseMenu(true);
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      this.togglePauseMenu(false);
      this.requestPointerLock();
    });

    document.getElementById('btn-reset-world').addEventListener('click', () => {
      if (confirm('Đặt lại toàn bộ thế giới về nguyên bản, cho cả những người đang ở cùng phòng?')) {
        const time = Date.now();
        this.resetWorldAndView(time);
        this.multiplayer.shareReset(time);
        this.showToast('Đã làm mới thế giới!');
        this.togglePauseMenu(false);
      }
    });

    const fullscreenButtons = [
      document.getElementById('btn-fullscreen'),
      document.getElementById('btn-fullscreen-hud')
    ];
    fullscreenButtons.forEach(btn => btn.addEventListener('click', () => this.toggleFullscreen()));

    const syncFullscreenLabels = () => {
      const label = getFullscreenElement() ? '❌ Thoát Toàn Màn Hình' : '🔲 Toàn Màn Hình';
      fullscreenButtons.forEach(btn => { btn.textContent = label; });
    };
    document.addEventListener('fullscreenchange', syncFullscreenLabels);
    document.addEventListener('webkitfullscreenchange', syncFullscreenLabels);

    // Already without browser bars when opened from the iPhone Home Screen
    if (isRunningAsHomeScreenApp()) {
      fullscreenButtons.forEach(btn => { btn.style.display = 'none'; });
    }

    document.getElementById('set-time').addEventListener('change', (e) => {
      const mode = (e.target as HTMLSelectElement).value;
      this.setTimeOfDay(mode);
      const labels = { day: '☀️ Ban Ngày', sunset: '🌅 Hoàng Hôn', night: '🌙 Ban Đêm' };
      document.getElementById('btn-time').textContent = labels[mode];
    });
    document.getElementById('set-volume').addEventListener('input', (e) => this.audio.setVolume(Number((e.target as HTMLInputElement).value) / 100));

    const viewDistance = document.getElementById('set-chunks') as HTMLSelectElement;
    viewDistance.value = String(this.viewRadius);
    viewDistance.addEventListener('change', () => {
      this.viewRadius = Number(viewDistance.value);
      this.scene.fog.density = fogDensityForRadius(this.viewRadius);
      this.world.scheduleAround(this.player.pos.x, this.player.pos.z, this.viewRadius);
    });

    window.addEventListener('keydown', (e) => {
      // Typing a name must not walk, open the tour or switch camera
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;

      this.inputKeys[e.code] = true;

      if (this.isCinematicTour) {
        if (e.code === 'Space') {
          e.preventDefault();
          const pBtn = document.getElementById('btn-tour-pause');
          if (pBtn) pBtn.click();
          return;
        }
      } else if (this.isLocked && !e.repeat) {
        // Keyboard alternative for trackpads where right click is awkward
        if (e.code === 'KeyQ') this.handleBreakBlock();
        else if (e.code === 'KeyE') this.handlePlaceBlock();
      }

      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        this.selectSlot(parseInt(e.code.replace('Digit', '')) - 1);
      } else if (e.code === 'KeyF') {
        this.isFlyMode = !this.isFlyMode;
        document.getElementById('btn-fly').textContent = this.isFlyMode ? '🕊️ Bay: BẬT' : '🕊️ Bay: TẮT';
        this.showToast(this.isFlyMode ? 'Chế độ bay: BẬT' : 'Chế độ bay: TẮT');
      } else if (e.code === 'KeyM') {
        this.changeMusic();
      } else if (e.code === 'KeyI' && !e.repeat) {
        this.toggleInventory();
      } else if (e.code === 'KeyR' && !e.repeat && this.isLocked) {
        this.useTool();
      } else if (e.code === 'KeyC') {
        this.toggleCinematicTour();
      } else if (e.code === 'KeyV') {
        this.isThirdPerson = !this.isThirdPerson;
        document.getElementById('btn-cam').classList.toggle('active', this.isThirdPerson);
        this.showToast(this.isThirdPerson ? 'Góc Nhìn Thứ 3 (Third Person)' : 'Góc Nhìn Thứ Nhất (FPS)');
      } else if (e.code === 'F3') {
        e.preventDefault();
        this.isDebugOverlayVisible = !this.isDebugOverlayVisible;
        const dbg = document.getElementById('debug-overlay');
        if (dbg) dbg.classList.toggle('hidden', !this.isDebugOverlayVisible);
        if (this.isDebugOverlayVisible) this.updateDebugOverlay();
        this.showToast(this.isDebugOverlayVisible ? 'Bật Debug Overlay (F3)' : 'Tắt Debug Overlay');
      } else if (e.code === 'Escape') {
        if (this.inventoryPanel.isOpen) {
          this.inventoryPanel.setOpen(false);
        } else if (this.isCinematicTour) {
          this.exitCinematicTour();
        } else {
          this.togglePauseMenu();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.inputKeys[e.code] = false;
    });

    window.addEventListener('wheel', (e) => {
      if (this.isCinematicTour) {
        this.userAltitudeOffset -= Math.sign(e.deltaY) * 2.5;
        this.userAltitudeOffset = Math.max(-15, Math.min(35, this.userAltitudeOffset));
        return;
      }
      if (e.deltaY > 0) this.selectSlot(this.activeSlot + 1);
      else this.selectSlot(this.activeSlot - 1);
    }, { passive: true });

    this.viewport.addEventListener('click', () => {
      if (this.isCinematicTour) return;
      if (!document.getElementById('pause-menu').classList.contains('visible') &&
          document.getElementById('welcome-screen').classList.contains('hidden')) {
        this.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = (document.pointerLockElement === this.viewport);
    });

    let isTourDragging = false;
    let lastDragX = 0, lastDragY = 0;

    this.viewport.addEventListener('mousedown', (e) => {
      if (!this.isCinematicTour) return;
      if (e.button === 0) {
        isTourDragging = true;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        this.isUserLooking = true;
      }
    });

    // Smooth mouse look targets (walking) and mouse drag look (aerial tour)
    window.addEventListener('mousemove', (e) => {
      if (this.isLocked && !this.isCinematicTour) {
        this.targetYaw -= e.movementX * 0.0022;
        this.targetPitch -= e.movementY * 0.0022;
        this.targetPitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.targetPitch));
      } else if (this.isCinematicTour && isTourDragging) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        this.userLookYawOffset -= dx * 0.0035;
        this.userLookPitchOffset -= dy * 0.0035;
        this.userLookPitchOffset = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.userLookPitchOffset));
        this.isUserLooking = true;
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isCinematicTour && isTourDragging) {
        isTourDragging = false;
        this.isUserLooking = false;
      }
    });

    // Mobile touch swipe look & pinch zoom for tour
    let tourTouchId = null;
    let lastTouchX = 0, lastTouchY = 0;
    let tourPinchDist = null;

    this.viewport.addEventListener('touchstart', (e) => {
      if (!this.isCinematicTour) return;
      if (e.touches.length === 1) {
        const t = e.touches[0];
        tourTouchId = t.identifier;
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
        this.isUserLooking = true;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        tourPinchDist = Math.hypot(dx, dy);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.isCinematicTour) return;
      if (e.touches.length === 2 && tourPinchDist !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const curDist = Math.hypot(dx, dy);
        const delta = curDist - tourPinchDist;
        tourPinchDist = curDist;
        this.userAltitudeOffset -= delta * 0.08;
        this.userAltitudeOffset = Math.max(-15, Math.min(35, this.userAltitudeOffset));
        return;
      }
      if (e.touches.length === 1) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === tourTouchId) {
            const dx = t.clientX - lastTouchX;
            const dy = t.clientY - lastTouchY;
            lastTouchX = t.clientX;
            lastTouchY = t.clientY;
            this.userLookYawOffset -= dx * 0.005;
            this.userLookPitchOffset -= dy * 0.005;
            this.userLookPitchOffset = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.userLookPitchOffset));
            this.isUserLooking = true;
          }
        }
      }
    }, { passive: false });

    const endTourTouch = (e) => {
      if (!this.isCinematicTour) return;
      // Lifting a finger from the joystick must not end the look gesture
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === tourTouchId) return;
      }
      tourTouchId = null;
      tourPinchDist = null;
      this.isUserLooking = false;
    };
    window.addEventListener('touchend', endTourTouch);
    window.addEventListener('touchcancel', endTourTouch);

    window.addEventListener('mousedown', (e) => {
      if (!this.isLocked || this.isCinematicTour) return;
      // Ctrl + click is how a Mac trackpad or one-button mouse makes a right click
      if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
        this.handlePlaceBlock();
      } else if (e.button === 0) {
        this.handleBreakBlock();
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    this.setupMobileControls();

    // Phones do not always fire "resize" when browser bars hide or the screen rotates,
    // so the size of the box itself is watched as well.
    const onViewportChange = () => this.syncViewportSize();
    ['resize', 'orientationchange'].forEach(type => window.addEventListener(type, onViewportChange));
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(type => document.addEventListener(type, onViewportChange));
    if (window.ResizeObserver) new ResizeObserver(onViewportChange).observe(this.viewport);
  }

  // Must be called directly from a tap or click: browsers refuse fullscreen otherwise.
  // explainProblems is for when the player pressed the button and expects something to happen.
  enterFullscreen(explainProblems = false) {
    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!request) {
      if (explainProblems) this.showToast(getFullscreenHelp(), FULLSCREEN_HINT_MS);
      return;
    }
    // A refusal is harmless: the game simply keeps running with the browser bars visible
    Promise.resolve(request.call(root)).catch(error => {
      console.warn('Fullscreen refused:', error);
      if (explainProblems) this.showToast(FULLSCREEN_REFUSED_MESSAGE, FULLSCREEN_HINT_MS);
    });
  }

  toggleFullscreen() {
    if (getFullscreenElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      Promise.resolve(exit.call(document)).catch(error => console.warn('Fullscreen exit failed:', error));
      return;
    }
    this.enterFullscreen(true);
  }

  requestPointerLock() {
    if (IS_TOUCH_DEVICE) return;
    this.viewport.requestPointerLock =this.viewport.requestPointerLock || this.viewport.mozRequestPointerLock;
    if (this.viewport.requestPointerLock) this.viewport.requestPointerLock();
  }

  togglePauseMenu(forceOpen?: boolean) {
    const menu = document.getElementById('pause-menu');
    const show = forceOpen !== undefined ? forceOpen : !menu.classList.contains('visible');
    menu.classList.toggle('visible', show);
    if (show && document.exitPointerLock) document.exitPointerLock();
  }

  showToast(msg, durationMs = 2000) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), durationMs);
  }

  getTargetBlock(reach = BLOCK_REACH) {
    // Aim through the crosshair. Reach is measured from the player, so in third person the
    // distance between the camera and the character does not use it up.
    const dir = this.camera.getWorldDirection(new THREE.Vector3());
    const eyeY = this.player.pos.y + 1.6;
    const maxDist = reach + Math.hypot(
      this.camera.position.x - this.player.pos.x,
      this.camera.position.y - eyeY,
      this.camera.position.z - this.player.pos.z
    );

    let px = this.camera.position.x;
    let py = this.camera.position.y;
    let pz = this.camera.position.z;

    const step = 0.08;
    let traversed = 0;
    let lastEmpty = null;

    while (traversed < maxDist) {
      const bx = Math.floor(px);
      const by = Math.floor(py);
      const bz = Math.floor(pz);
      const b = this.world.getBlock(bx, by, bz);

      if (this.world.isCollidable(b)) {
        return {
          x: bx, y: by, z: bz,
          blockId: b,
          placePos: lastEmpty
        };
      }

      lastEmpty = { x: bx, y: by, z: bz };
      px += dir.x * step;
      py += dir.y * step;
      pz += dir.z * step;
      traversed += step;
    }
    return null;
  }

  handleBreakBlock() {
    const target = this.getTargetBlock();
    if (!target) {
      this.showToast(OUT_OF_REACH_MESSAGE);
      return;
    }

    const bId = target.blockId;
    const tierNeeded = getRequiredPickaxeTier(bId);
    if (this.inventory.pickaxeTier() < tierNeeded) {
      this.showToast(`Khối này cần ${tierNeeded === 2 ? 'Cuốc đá' : 'Cuốc gỗ'}. Chế tạo trong Túi Đồ`);
      return;
    }

    const isLeaves = (bId >= BLOCK_DEFS.LEAVES_LIGHT && bId <= BLOCK_DEFS.LEAVES_WHITE) ||
                     bId === BLOCK_DEFS.LEAVES_SOFT || bId === BLOCK_DEFS.LEAVES_MAGENTA ||
                     bId === BLOCK_DEFS.WOOD_LOG;
    if (isLeaves) {
      this.petals.burstAt(new THREE.Vector3(target.x + 0.5, target.y + 0.5, target.z + 0.5), 35);
    }

    // Spawn smooth block break debris particles
    this.blockParticles.burst(target.x, target.y, target.z, bId, 18);

    const editTime = this.world.setBlock(target.x, target.y, target.z, BLOCK_DEFS.AIR);
    this.multiplayer.shareEdit(target.x, target.y, target.z, BLOCK_DEFS.AIR, editTime);
    this.audio.playBlockBreak();

    if (!this.inventory.creative) {
      const drops = getBlockDrops(bId, Math.random());
      drops.forEach(([itemId, amount]) => this.inventory.add(itemId, amount));
      if (drops.length) this.showToast(drops.map(([id, n]) => `+${n} ${ITEMS[id].name}`).join(', '));
    }
  }

  handlePlaceBlock() {
    const target = this.getTargetBlock();
    if (!target || !target.placePos) {
      this.showToast(OUT_OF_REACH_MESSAGE);
      return;
    }

    const p = target.placePos;
    const playerMinX = this.player.pos.x - this.player.radius;
    const playerMaxX = this.player.pos.x + this.player.radius;
    const playerMinY = this.player.pos.y;
    const playerMaxY = this.player.pos.y + this.player.height;
    const playerMinZ = this.player.pos.z - this.player.radius;
    const playerMaxZ = this.player.pos.z + this.player.radius;

    if (p.x + 1 > playerMinX && p.x < playerMaxX &&
        p.y + 1 > playerMinY && p.y < playerMaxY &&
        p.z + 1 > playerMinZ && p.z < playerMaxZ) {
      this.showToast('Bạn đang đứng ở chỗ này, hãy lùi ra rồi đặt khối');
      return;
    }

    const itemId = this.hotbarItems[this.activeSlot];
    if (!this.inventory.use(itemId)) {
      this.showToast(`Hết ${ITEMS[itemId].name}. Đào hoặc chế tạo thêm nhé`);
      return;
    }
    const blockId = ITEMS[itemId].block;
    const editTime = this.world.setBlock(p.x, p.y, p.z, blockId);
    this.multiplayer.shareEdit(p.x, p.y, p.z, blockId, editTime);

    // Pop / scale animation on placed block
    this.blockPlacer.spawnPop(p.x, p.y, p.z, blockId);

    this.audio.playBlockPlace();
  }

  setupMobileControls() {
    const joystick = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    const JOYSTICK_RANGE = 40;
    let touchId = null;
    let originX = 0, originY = 0;
    let lookId = null;
    let lookX = 0, lookY = 0;

    // Each finger is tracked by id, so moving, looking and pressing buttons work together.
    const findTouch = (list, id) => {
      if (id === null) return null;
      for (let i = 0; i < list.length; i++) {
        if (list[i].identifier === id) return list[i];
      }
      return null;
    };

    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (touchId !== null) return;
      const t = e.changedTouches[0];
      touchId = t.identifier;
      const rect = joystick.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }, { passive: false });

    // Dragging anywhere on the 3D view turns the camera (the aerial tour has its own handler)
    this.viewport.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.isCinematicTour || lookId !== null) return;
      const t = e.changedTouches[0];
      lookId = t.identifier;
      lookX = t.clientX;
      lookY = t.clientY;
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      const stick = findTouch(e.changedTouches, touchId);
      if (stick) {
        const dx = stick.clientX - originX;
        const dy = stick.clientY - originY;
        const dist = Math.min(JOYSTICK_RANGE, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);

        thumb.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;

        this.inputKeys['KeyW'] = dy < -12;
        this.inputKeys['KeyS'] = dy > 12;
        this.inputKeys['KeyA'] = dx < -12;
        this.inputKeys['KeyD'] = dx > 12;
        this.inputKeys['ShiftLeft'] = dist >= JOYSTICK_RANGE;
      }

      const look = findTouch(e.changedTouches, lookId);
      if (look) {
        const dx = look.clientX - lookX;
        const dy = look.clientY - lookY;
        lookX = look.clientX;
        lookY = look.clientY;
        if (!this.isCinematicTour) {
          this.targetYaw -= dx * TOUCH_LOOK_SPEED;
          this.targetPitch -= dy * TOUCH_LOOK_SPEED;
          this.targetPitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.targetPitch));
        }
      }
    });

    const endTouch = (e) => {
      if (findTouch(e.changedTouches, lookId)) lookId = null;
      if (findTouch(e.changedTouches, touchId)) {
        touchId = null;
        thumb.style.transform = 'translate(-50%, -50%)';
        this.inputKeys['KeyW'] = false;
        this.inputKeys['KeyS'] = false;
        this.inputKeys['KeyA'] = false;
        this.inputKeys['KeyD'] = false;
        this.inputKeys['ShiftLeft'] = false;
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);

    const onPress = (id, handler) => {
      document.getElementById(id).addEventListener('touchstart', (e) => {
        e.preventDefault();
        handler();
      }, { passive: false });
    };
    const jump = document.getElementById('mob-jump');
    const releaseJump = () => { this.inputKeys['Space'] = false; };
    onPress('mob-jump', () => { this.inputKeys['Space'] = true; });
    jump.addEventListener('touchend', releaseJump);
    jump.addEventListener('touchcancel', releaseJump);
    onPress('mob-break', () => this.handleBreakBlock());
    onPress('mob-place', () => this.handlePlaceBlock());
    onPress('mob-use', () => this.useTool());

    // iOS ignores user-scalable=no, so block its page pinch-zoom here
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }

  // =========================================================================
  // SMOOTH ACCELERATION, DECELERATION & NATURAL INERTIA
  // =========================================================================
  updatePhysics(dt) {
    if (this.isCinematicTour) return;

    if (!this.isFlyMode) {
      if (this.player.pos.y < 1.0 || this.checkAABB(this.player.pos.x, this.player.pos.y, this.player.pos.z, this.player.radius, this.player.height)) {
        this.teleportToSafeGround();
        return;
      }
    }

    const isRunning = this.inputKeys['ShiftLeft'] || this.inputKeys['ShiftRight'];
    const maxSpeed = this.isFlyMode ? 14.0 : (isRunning ? this.player.runSpeed : this.player.speed);

    this._moveDir.set(0, 0, 0);
    if (this.inputKeys['KeyW']) this._moveDir.z -= 1;
    if (this.inputKeys['KeyS']) this._moveDir.z += 1;
    if (this.inputKeys['KeyA']) this._moveDir.x -= 1;
    if (this.inputKeys['KeyD']) this._moveDir.x += 1;

    const isMoving = this._moveDir.lengthSq() > 0;

    if (this.isFlyMode) {
      if (isMoving) {
        this._moveDir.normalize();
        this._forward.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
        this._right.set(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
        this._wishMove.set(0, 0, 0)
          .addScaledVector(this._forward, -this._moveDir.z)
          .addScaledVector(this._right, this._moveDir.x);
        this.player.pos.addScaledVector(this._wishMove, maxSpeed * dt);
      }
      if (this.inputKeys['Space']) this.player.pos.y += maxSpeed * dt;
      if (this.inputKeys['KeyC'] || this.inputKeys['ControlLeft']) this.player.pos.y -= maxSpeed * dt;
      return;
    }

    const waistBlock = this.world.getBlock(Math.floor(this.player.pos.x), Math.floor(this.player.pos.y + 0.8), Math.floor(this.player.pos.z));
    this.player.isInWater = (waistBlock === BLOCK_DEFS.WATER);

    // Smooth acceleration & deceleration with natural inertia
    const accel = this.player.isGrounded ? (isRunning ? 18.0 : 14.0) : 4.5;
    const friction = this.player.isGrounded ? 11.0 : 1.2;

    if (isMoving) {
      this._moveDir.normalize();
      this._forward.set(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
      this._right.set(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
      this._wishMove.set(0, 0, 0)
        .addScaledVector(this._forward, -this._moveDir.z)
        .addScaledVector(this._right, this._moveDir.x);

      const curSpeed = this.player.isInWater ? maxSpeed * 0.5 : maxSpeed;
      const targetVx = this._wishMove.x * curSpeed;
      const targetVz = this._wishMove.z * curSpeed;

      const blend = 1.0 - Math.exp(-accel * dt);
      this.player.vel.x = THREE.MathUtils.lerp(this.player.vel.x, targetVx, blend);
      this.player.vel.z = THREE.MathUtils.lerp(this.player.vel.z, targetVz, blend);

      if (this.player.isGrounded && Math.random() < 0.12) {
        const footB = this.world.getBlock(Math.floor(this.player.pos.x), Math.floor(this.player.pos.y - 0.2), Math.floor(this.player.pos.z));
        this.audio.playFootstep(footB);
      }
    } else {
      const blend = 1.0 - Math.exp(-friction * dt);
      this.player.vel.x = THREE.MathUtils.lerp(this.player.vel.x, 0, blend);
      this.player.vel.z = THREE.MathUtils.lerp(this.player.vel.z, 0, blend);
      if (Math.hypot(this.player.vel.x, this.player.vel.z) < 0.01) {
        this.player.vel.x = 0;
        this.player.vel.z = 0;
      }
    }

    // Natural Gravity Curve with apex float
    this.previousVelY = this.player.vel.y;
    this.wasGrounded = this.player.isGrounded;

    if (this.player.isInWater) {
      // Keyboard: hold Shift to dive. Everywhere: swim toward where you look, which is also how
      // to dive on a phone, where the joystick uses that same key for running.
      let targetVy = SWIM_BUOYANCY;
      if (!IS_TOUCH_DEVICE && isRunning) {
        targetVy = -SWIM_DIVE_SPEED;
      } else if (this._moveDir.z !== 0 && Math.abs(this.player.pitch) > SWIM_PITCH_DEADZONE) {
        targetVy = -this._moveDir.z * Math.sin(this.player.pitch) * SWIM_VERTICAL_SPEED;
      }
      this.player.vel.y = THREE.MathUtils.lerp(this.player.vel.y, targetVy, Math.min(1, dt * 4));
      if (this.inputKeys['Space']) this.player.vel.y = 3.5;
    } else {
      let gravity = 24.0;
      if (Math.abs(this.player.vel.y) < 1.8) {
        gravity = 17.5; // slight float at jump peak
      } else if (this.player.vel.y < 0) {
        gravity = 26.5; // firm descent
      }
      this.player.vel.y -= gravity * dt;
      if (this.player.vel.y < -35) this.player.vel.y = -35;

      const feetBlock = this.world.getBlock(
        Math.floor(this.player.pos.x),
        Math.floor(this.player.pos.y + 0.05),
        Math.floor(this.player.pos.z)
      );
      if (feetBlock === BLOCK_DEFS.WATER && this.inputKeys['Space']) {
        // Treading at the surface: a strong kick, enough to climb a bank one block high
        this.player.vel.y = WATER_EXIT_SPEED;
      } else if (this.player.isGrounded && this.inputKeys['Space']) {
        this.player.vel.y = 8.6;
        this.player.isGrounded = false;
      }
    }

    this.moveWithCollision(dt);

    // Tiny camera dip on landing
    if (!this.wasGrounded && this.player.isGrounded) {
      const impact = Math.abs(this.previousVelY);
      if (impact > 3.0) {
        this.landingDip = Math.min(impact * 0.016, 0.14);
      }
    }
  }

  moveWithCollision(dt) {
    const p = this.player;
    const r = p.radius;
    const h = p.height;

    // 1. Move horizontally in X
    const nextX = p.pos.x + p.vel.x * dt;
    if (!this.checkAABB(nextX, p.pos.y, p.pos.z, r, h)) {
      p.pos.x = nextX;
    } else {
      p.vel.x = 0;
    }

    // 2. Move horizontally in Z
    const nextZ = p.pos.z + p.vel.z * dt;
    if (!this.checkAABB(p.pos.x, p.pos.y, nextZ, r, h)) {
      p.pos.z = nextZ;
    } else {
      p.vel.z = 0;
    }

    // 3. Move vertically in Y with floor snapping
    const nextY = p.pos.y + p.vel.y * dt;
    if (!this.checkAABB(p.pos.x, nextY, p.pos.z, r, h)) {
      p.pos.y = nextY;
      p.isGrounded = false;
    } else {
      if (p.vel.y < 0) {
        let floorY = -1;
        const minX = Math.floor(p.pos.x - r + 0.001);
        const maxX = Math.floor(p.pos.x + r - 0.001);
        const minZ = Math.floor(p.pos.z - r + 0.001);
        const maxZ = Math.floor(p.pos.z + r - 0.001);
        const testYMin = Math.floor(nextY + 0.001);
        const testYMax = Math.floor(p.pos.y);

        for (let bx = minX; bx <= maxX; bx++) {
          for (let bz = minZ; bz <= maxZ; bz++) {
            for (let by = testYMax; by >= testYMin; by--) {
              const b = this.world.getBlock(bx, by, bz);
              if (this.world.isCollidable(b)) {
                floorY = Math.max(floorY, by + 1.0);
              }
            }
          }
        }

        if (floorY >= 0) {
          p.pos.y = floorY;
          p.vel.y = 0;
          p.isGrounded = true;
        } else {
          p.pos.y = nextY;
        }
      } else if (p.vel.y > 0) {
        p.vel.y = 0;
      }
    }

    if (!p.isGrounded && p.vel.y === 0) {
      if (this.checkAABB(p.pos.x, p.pos.y - 0.05, p.pos.z, r, h)) {
        p.isGrounded = true;
      }
    }

    if (p.pos.y < 1.0) {
      this.teleportToSafeGround();
    }
  }

  checkAABB(x, y, z, r, h) {
    const minX = Math.floor(x - r + 0.001);
    const maxX = Math.floor(x + r - 0.001);
    const minY = Math.floor(y + 0.001);
    const maxY = Math.floor(y + h - 0.001);
    const minZ = Math.floor(z - r + 0.001);
    const maxZ = Math.floor(z + r - 0.001);

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          const b = this.world.getBlock(bx, by, bz);
          if (this.world.isCollidable(b)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  initTourPath() {
    // Aerial circuit circling the sanctuary and all key landmarks:
    // Torii gate, cherry blossom groves, lake, arched wooden bridge, lakeside pavilion.
    const waypointsDef = [
      { x: 12,  z: 22,  clearance: 34 }, // South-East overview vista
      { x: 8,   z: 8,   clearance: 25 }, // Red Torii Gate landmark
      { x: 20,  z: -8,  clearance: 28 }, // East Cherry Blossom Grove hillside
      { x: 4,   z: -26, clearance: 38 }, // North Grand Panoramic overview
      { x: -16, z: -22, clearance: 28 }, // North-West hillside & weeping cherry trees
      { x: -26, z: -2,  clearance: 30 }, // West Lake Shore
      { x: -14, z: 12,  clearance: 25 }, // Arched Wooden Footbridge & Lake Center
      { x: -4,  z: 22,  clearance: 25 }, // Lakeside Pavilion landmark
      { x: 4,   z: 28,  clearance: 32 }  // South Shore sweep curving back to start
    ];

    // Ensure chunks along path are generated and decorated
    waypointsDef.forEach(wp => {
      this.world.getHighestSolidY(wp.x, wp.z);
    });

    const points = waypointsDef.map(wp => {
      const groundY = this.world.getHighestSolidY(wp.x, wp.z);
      return new THREE.Vector3(wp.x, groundY + wp.clearance, wp.z);
    });

    // Smooth closed Catmull-Rom 3D curve
    this.tourCurve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
    this.tourCurveLength = this.tourCurve.getLength();
  }

  startCinematicTour() {
    if (this.isCinematicTour && this.tourState !== 'EXITING') return;

    // Release pointer lock so cursor is free for tour controls and dragging
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    if (!this.tourCurve) {
      this.initTourPath();
    }

    this.isCinematicTour = true;
    this.tourState = 'ENTERING';
    this.tourIsPaused = false;
    this.tourTopViewActive = false;
    this.tourActiveTimer = 0.0;
    this.tourTransitionStartTime = performance.now();
    this.tourTransitionDuration = 1.8;

    this.tourSteerOffset.set(0, 0, 0);
    this.userAltitudeOffset = 0.0;
    this.currentAltitudeOffset = 0.0;
    this.userLookYawOffset = 0.0;
    this.userLookPitchOffset = 0.0;
    this.isUserLooking = false;

    // Smooth glide start from player's current position up to nearest tour spline point
    this.tourStartCamPos.copy(this.camera.position);
    this.tourStartCamYaw = this.player.yaw;
    this.tourStartCamPitch = this.player.pitch;

    let bestT = 0;
    let bestDist = Infinity;
    for (let i = 0; i < 80; i++) {
      const t = i / 80;
      const pt = this.tourCurve.getPointAt(t);
      const d = pt.distanceTo(this.tourStartCamPos);
      if (d < bestDist) {
        bestDist = d;
        bestT = t;
      }
    }
    this.tourT = bestT;
    this.tourTargetEntryPos = this.tourCurve.getPointAt(bestT);

    const tangent = this.tourCurve.getTangentAt(bestT).normalize();
    this.tourTargetEntryYaw = Math.atan2(-tangent.x, -tangent.z);
    this.tourTargetEntryPitch = -0.28;

    this.tourCurrentYaw = this.player.yaw;
    this.tourCurrentPitch = this.player.pitch;

    // Update UI
    const btnTour = document.getElementById('btn-tour');
    if (btnTour) btnTour.classList.add('active');
    const tourHud = document.getElementById('tour-hud');
    if (tourHud) tourHud.classList.remove('hidden');
    document.body.classList.add('touring');
    const hotbar = document.getElementById('hotbar');
    if (hotbar) hotbar.style.display = 'none';
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.style.display = 'none';
    const topviewBtn = document.getElementById('btn-tour-topview');
    if (topviewBtn) topviewBtn.classList.remove('active');
    const pauseBtn = document.getElementById('btn-tour-pause');
    if (pauseBtn) pauseBtn.textContent = '⏸️ Tạm Dừng';

    this.showToast('Bắt đầu chuyến tham quan trên không');
  }

  exitCinematicTour() {
    if (!this.isCinematicTour || this.tourState === 'EXITING') return;

    this.tourState = 'EXITING';
    this.tourExitStartTime = performance.now();
    this.tourTransitionDuration = 1.5;

    this.tourExitStartCamPos.copy(this.camera.position);
    this.tourExitStartYaw = this.tourCurrentYaw;
    this.tourExitStartPitch = this.tourCurrentPitch;

    // Find safe solid ground directly below current camera position
    const safeSpot = this.findSafeLandingSpot(this.tourExitStartCamPos.x, this.tourExitStartCamPos.z);
    this.tourExitLandingPos.set(safeSpot.x, safeSpot.y, safeSpot.z);

    // Target camera position: standing at player eye level
    this.tourExitTargetCamPos.set(
      safeSpot.x,
      safeSpot.y + this.player.height * 0.9,
      safeSpot.z
    );

    this.showToast('Đang hạ cánh an toàn...');
  }

  toggleCinematicTour() {
    if (this.isCinematicTour) {
      this.exitCinematicTour();
    } else {
      this.startCinematicTour();
    }
  }

  findSafeLandingSpot(targetX, targetZ) {
    const bx = Math.round(targetX);
    const bz = Math.round(targetZ);
    let best = null;
    let minD = Infinity;

    // Search spiral around landing point to guarantee dry, solid ground
    for (let r = 0; r <= 8; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const wx = bx + dx;
          const wz = bz + dz;
          const groundY = this.world.getHighestSolidY(wx, wz);
          const b = this.world.getBlock(wx, groundY - 1, wz);
          if (this.world.isCollidable(b) && b !== BLOCK_DEFS.WATER) {
            const above1 = this.world.getBlock(wx, groundY, wz);
            const above2 = this.world.getBlock(wx, groundY + 1, wz);
            if (above1 === BLOCK_DEFS.AIR && above2 === BLOCK_DEFS.AIR) {
              const d = dx * dx + dz * dz;
              if (d < minD) {
                minD = d;
                best = { x: wx + 0.5, y: groundY, z: wz + 0.5 };
              }
            }
          }
        }
      }
      if (best) break;
    }
    if (!best) {
      const fallbackY = this.world.getHighestSolidY(targetX, targetZ);
      best = { x: targetX, y: fallbackY, z: targetZ };
    }
    return best;
  }

  applyCameraOrientation(yaw, pitch) {
    const lookDist = 25.0;
    const lx = this.camera.position.x - Math.sin(yaw) * Math.cos(pitch) * lookDist;
    const ly = this.camera.position.y + Math.sin(pitch) * lookDist;
    const lz = this.camera.position.z - Math.cos(yaw) * Math.cos(pitch) * lookDist;
    this.camera.lookAt(lx, ly, lz);
  }

  enforceCameraGroundSafety() {
    const p = this.camera.position;
    const groundY = this.world.getMaxSolidYInRadius(p.x, p.z, 1.2);
    const minAllowedY = groundY + 5.0;
    if (p.y < minAllowedY) p.y = minAllowedY;
    const inside = this.world.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    if (this.world.isCollidable(inside)) {
      p.y = Math.floor(p.y) + 1.5;
    }
  }

  updateCinematicTour(dt) {
    if (!this.tourCurve) {
      this.initTourPath();
    }

    // =========================================================================
    // STATE 1: ENTERING (Glide smoothly from player position up into tour path)
    // =========================================================================
    if (this.tourState === 'ENTERING') {
      const elapsed = (performance.now() - this.tourTransitionStartTime) / 1000;
      const p = Math.min(1.0, elapsed / this.tourTransitionDuration);
      const ease = p * p * (3.0 - 2.0 * p); // smoothstep easing

      this.camera.position.lerpVectors(this.tourStartCamPos, this.tourTargetEntryPos, ease);

      // Interpolate yaw and pitch smoothly
      let diffYaw = ((this.tourTargetEntryYaw - this.tourStartCamYaw + Math.PI) % (Math.PI * 2));
      if (diffYaw < 0) diffYaw += Math.PI * 2;
      diffYaw -= Math.PI;
      this.tourCurrentYaw = this.tourStartCamYaw + diffYaw * ease;
      this.tourCurrentPitch = THREE.MathUtils.lerp(this.tourStartCamPitch, this.tourTargetEntryPitch, ease);

      this.applyCameraOrientation(this.tourCurrentYaw, this.tourCurrentPitch);
      this.enforceCameraGroundSafety();

      if (p >= 1.0) {
        this.tourState = 'ACTIVE';
        this.tourActiveTimer = 0.0;
      }
      return;
    }

    // =========================================================================
    // STATE 2: EXITING (Glide smoothly down and land player safely on ground)
    // =========================================================================
    if (this.tourState === 'EXITING') {
      const elapsed = (performance.now() - this.tourExitStartTime) / 1000;
      const p = Math.min(1.0, elapsed / this.tourTransitionDuration);
      const ease = p * p * (3.0 - 2.0 * p);

      this.camera.position.lerpVectors(this.tourExitStartCamPos, this.tourExitTargetCamPos, ease);

      // Ease pitch towards eye-level (0)
      this.tourCurrentPitch = THREE.MathUtils.lerp(this.tourExitStartPitch, 0.0, ease);
      this.applyCameraOrientation(this.tourCurrentYaw, this.tourCurrentPitch);

      if (p >= 1.0) {
        // Settle player position on top of the solid block
        this.player.pos.copy(this.tourExitLandingPos);
        this.player.vel.set(0, 0, 0);
        this.player.isGrounded = true;
        this.player.yaw = this.targetYaw = this.tourCurrentYaw;
        this.player.pitch = this.targetPitch = 0.0;

        this.isCinematicTour = false;
        this.tourState = 'INACTIVE';

        // Restore HUD
        const btnTour = document.getElementById('btn-tour');
        if (btnTour) btnTour.classList.remove('active');
        const tourHud = document.getElementById('tour-hud');
        if (tourHud) tourHud.classList.add('hidden');
        document.body.classList.remove('touring');
        const hotbar = document.getElementById('hotbar');
        if (hotbar) hotbar.style.display = 'flex';
        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';

        this.showToast('Đã thoát tham quan. Chúc bạn dạo chơi vui vẻ!');
      }
      return;
    }

    // =========================================================================
    // STATE 3: ACTIVE (Aerial flight along spline with user interaction)
    // =========================================================================
    if (this.tourState === 'ACTIVE') {
      this.tourActiveTimer += dt;

      // 1. Path progression with ease-in at start
      if (!this.tourIsPaused) {
        const baseSpeed = this.tourSpeedLevels[this.tourSpeedIndex];
        const startEase = Math.min(1.0, this.tourActiveTimer / 2.5);
        const easeFactor = startEase * startEase * (3.0 - 2.0 * startEase);
        const currentSpeed = baseSpeed * easeFactor;

        this.tourT = (this.tourT + (currentSpeed * dt) / this.tourCurveLength) % 1.0;
      }

      // 2. Base point on spline
      const basePoint = this.tourCurve.getPointAt(this.tourT);
      const tangent = this.tourCurve.getTangentAt(this.tourT).normalize();

      // 3. Handle free user steering (WASD, Arrows, Q/E, Mobile joystick & buttons)
      const isSteering = this.inputKeys['KeyW'] || this.inputKeys['KeyS'] ||
                         this.inputKeys['KeyA'] || this.inputKeys['KeyD'] ||
                         this.inputKeys['ArrowUp'] || this.inputKeys['ArrowDown'] ||
                         this.inputKeys['ArrowLeft'] || this.inputKeys['ArrowRight'] ||
                         this.inputKeys['KeyQ'] || this.inputKeys['KeyE'] ||
                         this.tourSteerUp || this.tourSteerDown;

      if (isSteering) {
        this.tourLastSteerTime = performance.now();
        const forwardX = -Math.sin(this.tourCurrentYaw);
        const forwardZ = -Math.cos(this.tourCurrentYaw);
        const rightX = Math.cos(this.tourCurrentYaw);
        const rightZ = -Math.sin(this.tourCurrentYaw);

        const steerSpeed = 14.0;
        if (this.inputKeys['KeyW'] || this.inputKeys['ArrowUp']) {
          this.tourSteerOffset.x += forwardX * steerSpeed * dt;
          this.tourSteerOffset.z += forwardZ * steerSpeed * dt;
        }
        if (this.inputKeys['KeyS'] || this.inputKeys['ArrowDown']) {
          this.tourSteerOffset.x -= forwardX * steerSpeed * dt;
          this.tourSteerOffset.z -= forwardZ * steerSpeed * dt;
        }
        if (this.inputKeys['KeyA'] || this.inputKeys['ArrowLeft']) {
          this.tourSteerOffset.x -= rightX * steerSpeed * dt;
          this.tourSteerOffset.z -= rightZ * steerSpeed * dt;
        }
        if (this.inputKeys['KeyD'] || this.inputKeys['ArrowRight']) {
          this.tourSteerOffset.x += rightX * steerSpeed * dt;
          this.tourSteerOffset.z += rightZ * steerSpeed * dt;
        }
        if (this.inputKeys['KeyE'] || this.tourSteerUp) {
          this.tourSteerOffset.y += steerSpeed * dt;
        }
        if (this.inputKeys['KeyQ'] || this.tourSteerDown) {
          this.tourSteerOffset.y -= steerSpeed * dt;
        }

        // Clamp max steer offset distance from path to 50 blocks
        const horizDist = Math.hypot(this.tourSteerOffset.x, this.tourSteerOffset.z);
        if (horizDist > 50.0) {
          const scale = 50.0 / horizDist;
          this.tourSteerOffset.x *= scale;
          this.tourSteerOffset.z *= scale;
        }
        this.tourSteerOffset.y = Math.max(-25, Math.min(35, this.tourSteerOffset.y));
      } else {
        // Easing back to path after 3 seconds of steering inactivity
        if (performance.now() - this.tourLastSteerTime > 3000) {
          const returnFactor = 1.0 - Math.exp(-1.4 * dt);
          this.tourSteerOffset.lerp(new THREE.Vector3(0, 0, 0), returnFactor);
          if (this.tourSteerOffset.lengthSq() < 0.005) {
            this.tourSteerOffset.set(0, 0, 0);
          }
        }
      }

      // 4. Smooth user zoom altitude offset
      const targetExtraAlt = this.tourTopViewActive ? 14.0 : 0.0;
      const totalTargetAlt = this.userAltitudeOffset + targetExtraAlt;
      this.currentAltitudeOffset = THREE.MathUtils.lerp(
        this.currentAltitudeOffset,
        totalTargetAlt,
        1.0 - Math.exp(-7.0 * dt)
      );

      // 5. Final camera position
      const finalCamPos = basePoint.clone().add(this.tourSteerOffset);
      finalCamPos.y += this.currentAltitudeOffset;

      // 6. Enforce safe camera height every frame (Never below terrain height + 5 blocks or inside block)
      const groundY = this.world.getMaxSolidYInRadius(finalCamPos.x, finalCamPos.z, 1.2);
      const minAllowedY = groundY + 5.0;
      if (finalCamPos.y < minAllowedY) {
        finalCamPos.y = minAllowedY;
      }
      const insideBlock = this.world.getBlock(Math.floor(finalCamPos.x), Math.floor(finalCamPos.y), Math.floor(finalCamPos.z));
      if (this.world.isCollidable(insideBlock)) {
        finalCamPos.y = Math.floor(finalCamPos.y) + 1.5;
      }

      this.camera.position.copy(finalCamPos);

      // Keep player ground position in sync below camera for audio & chunk loading
      const safeBelowY = this.world.getHighestSolidY(finalCamPos.x, finalCamPos.z);
      this.player.pos.set(finalCamPos.x, safeBelowY, finalCamPos.z);

      // 7. Camera Look Direction (Smooth flight orientation + user drag offset)
      let baseFlightYaw = Math.atan2(-tangent.x, -tangent.z);
      let baseFlightPitch = this.tourTopViewActive ? (-Math.PI / 2 + 0.05) : -0.28;

      // Ease user look offset back towards zero when not actively dragging
      if (!this.isUserLooking) {
        const easeFactor = 1.0 - Math.exp(-2.2 * dt);
        this.userLookYawOffset = THREE.MathUtils.lerp(this.userLookYawOffset, 0.0, easeFactor);
        this.userLookPitchOffset = THREE.MathUtils.lerp(this.userLookPitchOffset, 0.0, easeFactor);
      }

      let desiredYaw = baseFlightYaw + this.userLookYawOffset;
      let desiredPitch = baseFlightPitch + this.userLookPitchOffset;
      desiredPitch = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, desiredPitch));

      // Shortest angle wrap for yaw
      let diffYaw = ((desiredYaw - this.tourCurrentYaw + Math.PI) % (Math.PI * 2));
      if (diffYaw < 0) diffYaw += Math.PI * 2;
      diffYaw -= Math.PI;
      this.tourCurrentYaw += diffYaw * (1.0 - Math.exp(-6.0 * dt));

      this.tourCurrentPitch = THREE.MathUtils.lerp(this.tourCurrentPitch, desiredPitch, 1.0 - Math.exp(-7.0 * dt));

      this.applyCameraOrientation(this.tourCurrentYaw, this.tourCurrentPitch);
    }
  }

  // =========================================================================
  // CAMERA SYSTEM (Smooth Mouse Look, Head-Bob, Dynamic FOV, Smooth Orbit)
  // =========================================================================
  updateCamera(dt) {
    // Smooth mouse look interpolation (no jitter)
    const lookSmooth = 1.0 - Math.exp(-32.0 * dt);
    this.player.yaw = THREE.MathUtils.lerp(this.player.yaw, this.targetYaw, lookSmooth);
    this.player.pitch = THREE.MathUtils.lerp(this.player.pitch, this.targetPitch, lookSmooth);

    // Smooth landing dip spring recovery
    this.landingDip = THREE.MathUtils.lerp(this.landingDip, 0, 1.0 - Math.exp(-12.0 * dt));

    // Subtle head-bob while walking that fades out smoothly when stopping
    const horizSpeed = Math.hypot(this.player.vel.x, this.player.vel.z);
    const isRunning = (this.inputKeys['ShiftLeft'] || this.inputKeys['ShiftRight']) && horizSpeed > 1.0;
    const targetBobIntensity = (this.player.isGrounded && horizSpeed > 0.5) ? Math.min(horizSpeed / this.player.speed, 1.0) : 0.0;
    this.bobIntensity = THREE.MathUtils.lerp(this.bobIntensity, targetBobIntensity, 1.0 - Math.exp(-7.0 * dt));

    if (this.bobIntensity > 0.001) {
      this.headBobTimer += dt * (isRunning ? 13.5 : 9.0);
      this.headBobY = Math.sin(this.headBobTimer * 2.0) * 0.04 * this.bobIntensity;
      this.headBobX = Math.cos(this.headBobTimer) * 0.02 * this.bobIntensity;
    } else {
      this.headBobY = 0;
      this.headBobX = 0;
    }

    // Gentle FOV increase when running
    const targetFov = isRunning ? 73.0 : 65.0;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 1.0 - Math.exp(-6.0 * dt));
      this.camera.updateProjectionMatrix();
    }

    // Smooth first-to-third person camera zoom transition
    const targetCamDist = this.isThirdPerson ? 3.8 : 0.0;
    this.currentCamDist = THREE.MathUtils.lerp(this.currentCamDist, targetCamDist, 1.0 - Math.exp(-9.0 * dt));

    if (this.currentCamDist > 0.1) {
      this.character.visible = true;
      const dist = this.currentCamDist;
      this._camOffset.set(
        Math.sin(this.player.yaw) * dist * Math.cos(this.player.pitch) + this.headBobX,
        1.6 + Math.sin(this.player.pitch) * dist + this.headBobY - this.landingDip,
        Math.cos(this.player.yaw) * dist * Math.cos(this.player.pitch)
      );
      this.camera.position.copy(this.player.pos).add(this._camOffset);
      this.camera.lookAt(
        this.player.pos.x,
        this.player.pos.y + 1.4,
        this.player.pos.z
      );
    } else {
      this.character.visible = false;
      this.camera.position.set(
        this.player.pos.x + this.headBobX,
        this.player.pos.y + 1.6 + this.headBobY - this.landingDip,
        this.player.pos.z
      );
      this._lookTarget.set(
        this.camera.position.x - Math.sin(this.player.yaw) * Math.cos(this.player.pitch),
        this.camera.position.y + Math.sin(this.player.pitch),
        this.camera.position.z - Math.cos(this.player.yaw) * Math.cos(this.player.pitch)
      );
      this.camera.lookAt(this._lookTarget);
    }
  }

  updateMinimap() {
    const now = performance.now();
    if (this.lastMinimapUpdate && now - this.lastMinimapUpdate < 150) return;
    this.lastMinimapUpdate = now;

    const canvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#1e1422';
    ctx.fillRect(0, 0, w, h);

    const px = this.isCinematicTour ? this.camera.position.x : this.player.pos.x;
    const pz = this.isCinematicTour ? this.camera.position.z : this.player.pos.z;
    const curYaw = this.isCinematicTour ? this.tourCurrentYaw : this.player.yaw;
    const range = 64;
    const cellSize = 4;
    const scale = w / (range * 2);

    for (let rz = -range; rz <= range; rz += cellSize) {
      for (let rx = -range; rx <= range; rx += cellSize) {
        const bx = Math.floor(px + rx);
        const bz = Math.floor(pz + rz);
        const b = this.world.getLoadedTopBlock(bx, bz);
        if (b === null) continue;

        if (b === BLOCK_DEFS.WATER) ctx.fillStyle = '#0288d1';
        else if (b === BLOCK_DEFS.GRASS) ctx.fillStyle = '#65ab27';
        else if (b === BLOCK_DEFS.GROUND_PETALS_CARPET) ctx.fillStyle = '#d946ef';
        else if (b >= BLOCK_DEFS.LEAVES_LIGHT && b <= BLOCK_DEFS.LEAVES_WHITE) ctx.fillStyle = '#f472b6';
        else if (b === BLOCK_DEFS.LEAVES_SOFT || b === BLOCK_DEFS.LEAVES_MAGENTA) ctx.fillStyle = '#ec4899';
        else if (b === BLOCK_DEFS.TORII_RED) ctx.fillStyle = '#ef4444';
        else if (b === BLOCK_DEFS.WOOD_PLANKS) ctx.fillStyle = '#d4a264';
        else if (b === BLOCK_DEFS.SNOW) ctx.fillStyle = '#f4f7fc';
        else if (b === BLOCK_DEFS.VOLCANIC_ROCK) ctx.fillStyle = '#3b3a44';
        else ctx.fillStyle = '#5d5f67';

        ctx.fillRect((rx + range) * scale, (rz + range) * scale, scale * cellSize, scale * cellSize);
      }
    }

    // The mountain, pinned to the edge of the map until it is in range, shows which way to walk
    const fujiDx = (FUJI.x - px) * scale;
    const fujiDz = (FUJI.z - pz) * scale;
    const fujiPin = Math.min(1, (w / 2 - 5) / Math.max(1, Math.hypot(fujiDx, fujiDz)));
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b3a44';
    ctx.beginPath();
    ctx.moveTo(w / 2 + fujiDx * fujiPin, h / 2 + fujiDz * fujiPin - 4);
    ctx.lineTo(w / 2 + fujiDx * fujiPin + 4, h / 2 + fujiDz * fujiPin + 3);
    ctx.lineTo(w / 2 + fujiDx * fujiPin - 4, h / 2 + fujiDz * fujiPin + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this.multiplayer.drawOnMinimap(ctx, w, px, pz, range);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-curYaw);
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Single Unified RequestAnimationFrame Loop
  animate() {
    requestAnimationFrame(this.animate);

    // Clamp delta time to avoid physics/visual jumps after tab inactivity
    const dt = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Wind System & Vertex Shaders
    this.wind.update(dt);
    this.textures['water'].texture.offset.y = (this.wind.time * WATER_FLOW_SPEED) % 1;

    // 2. Smooth Time of Day Transitions
    this.updateTimeTransition(dt);

    // 3. Player Movement & Physics
    this.updatePhysics(dt);

    // 4. Camera Look & Follow
    if (!this.isCinematicTour) {
      this.updateCamera(dt);
    } else {
      this.updateCinematicTour(dt);
    }

    // 5. Character Animation
    const isMoving = this.inputKeys['KeyW'] || this.inputKeys['KeyS'] || this.inputKeys['KeyA'] || this.inputKeys['KeyD'];
    this.character.update(this.player.pos, this.player.yaw, isMoving, dt);

    // 6. Block Pop & Break Particle Systems
    this.blockPlacer.update(dt);
    this.blockParticles.update(dt);

    // 7. Dynamic Chunk Management & Streaming
    const streamX = this.isCinematicTour ? this.camera.position.x : this.player.pos.x;
    const streamZ = this.isCinematicTour ? this.camera.position.z : this.player.pos.z;
    const pcx = Math.floor(streamX / CHUNK_SIZE);
    const pcz = Math.floor(streamZ / CHUNK_SIZE);
    if (pcx !== this.lastChunkX || pcz !== this.lastChunkZ) {
      this.lastChunkX = pcx;
      this.lastChunkZ = pcz;
      this.world.scheduleAround(streamX, streamZ, this.viewRadius);
    }

    // Terrain, trees and meshes share a per-frame time budget so walking never hitches
    this.world.processStreamTasks(STREAM_BUDGET_MS);

    const lanternNow = performance.now();
    if (lanternNow - this.lastLanternRefresh >= LANTERN_REFRESH_MS) {
      this.lastLanternRefresh = lanternNow;
      this.refreshLanternLights(streamX, streamZ);
    }

    // 8. Petal Particle Flutter
    this.petals.update(dt, this.isCinematicTour ? this.camera.position : this.player.pos, this.wind);

    this.fish.update(dt, this.isCinematicTour ? this.camera.position : this.player.pos);
    this.animals.update(dt, this.isCinematicTour ? this.camera.position : this.player.pos, this.viewRadius);
    this.fishing.update(dt, this.camera.position);
    this.hunting.update(dt);
    this.multiplayer.update(dt, this.player, isMoving);

    // 9. Highlight Box on Look Target
    const target = this.getTargetBlock();
    if (target && !this.isCinematicTour) {
      this.highlightBox.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
      this.highlightBox.visible = true;
    } else {
      this.highlightBox.visible = false;
    }

    // 10. Minimap & Debug Overlay
    this.updateMinimap();

    this.frameCount = (this.frameCount || 0) + 1;
    const now = performance.now();
    if (!this.lastFpsUpdate) this.lastFpsUpdate = now;
    if (now - this.lastFpsUpdate >= 250) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      this.adaptRenderScale();

      if (this.isDebugOverlayVisible) {
        this.updateDebugOverlay();
      }
    }

    // After the camera has moved this frame, so the sun and moon do not jitter
    this.skyBodies.update(this.camera, this.sunLight.position, dt);
    this.fujiBackdrop.update(this.camera, this.scene.fog.color, this.sunLight.intensity);
    this.updateUnderwaterView();

    this.renderer.render(this.scene, this.camera);
  }

  updateUnderwaterView() {
    const p = this.camera.position;
    const isUnderwater = this.world.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)) === BLOCK_DEFS.WATER;
    if (isUnderwater) this.scene.fog.color.setHex(UNDERWATER_FOG_COLOR); // eases back on surfacing
    this.scene.fog.density = isUnderwater ? UNDERWATER_FOG_DENSITY : fogDensityForRadius(this.viewRadius);
    document.body.classList.toggle('underwater', isUnderwater);
  }

  // Weak GPUs: lower the render resolution after ~2s of sustained low FPS.
  // Never raises it again, which avoids flickering between quality levels.
  adaptRenderScale() {
    if (this.world.streamTasks.length > 0) return; // loading dips are expected
    this.lowFpsReadings = this.currentFps < LOW_FPS_THRESHOLD ? this.lowFpsReadings + 1 : 0;
    if (this.lowFpsReadings < LOW_FPS_READINGS || this.renderScale <= MIN_RENDER_SCALE) return;

    this.lowFpsReadings = 0;
    this.renderScale = Math.max(MIN_RENDER_SCALE, this.renderScale - 0.25);
    this.renderer.setPixelRatio(this.renderScale);
  }

  updateDebugOverlay() {
    if (!this.isDebugOverlayVisible) return;
    const p = this.player;
    const dbgPos = document.getElementById('dbg-pos');
    if (dbgPos) {
      dbgPos.textContent = `${p.pos.x.toFixed(2)} / ${p.pos.y.toFixed(2)} / ${p.pos.z.toFixed(2)}`;
    }

    const bx = Math.floor(p.pos.x);
    const by = Math.floor(p.pos.y - 0.1);
    const bz = Math.floor(p.pos.z);
    const underBlock = this.world.getBlock(bx, by, bz);
    const blockName = BLOCK_NAMES[underBlock] || `ID: ${underBlock}`;
    const dbgBlock = document.getElementById('dbg-block');
    if (dbgBlock) {
      dbgBlock.textContent = `${blockName} [${bx}, ${by}, ${bz}]`;
    }

    const stats = this.world.getStats();
    const dbgChunks = document.getElementById('dbg-chunks');
    if (dbgChunks) dbgChunks.textContent = `${stats.chunks}`;
    const dbgFaces = document.getElementById('dbg-faces');
    if (dbgFaces) dbgFaces.textContent = `${stats.totalFaces.toLocaleString()}`;
    const dbgFps = document.getElementById('dbg-fps');
    if (dbgFps) dbgFps.textContent = `${this.currentFps}`;
    const dbgFly = document.getElementById('dbg-fly');
    if (dbgFly) dbgFly.textContent = this.isFlyMode ? 'ON' : 'OFF';
    const dbgGrounded = document.getElementById('dbg-grounded');
    if (dbgGrounded) dbgGrounded.textContent = p.isGrounded ? 'YES' : 'NO';
  }
}
