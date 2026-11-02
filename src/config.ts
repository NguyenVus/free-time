// =========================================================================
// 4. VOXEL WORLD ENGINE (Greedy Face Culling & Vertex Sway Shader)
// =========================================================================
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 32;
export const VILLAGE = { x: 78, z: 13, radius: 38, blend: 16, groundY: 12 };
export const VILLAGE_ROAD = { z: 13, startX: -1, halfWidth: 1.6, bankWidth: 6, treeClearance: 3.5, clearWidth: 2.6, clearHeight: 4 };
export const VILLAGE_TREE_CLEARANCE = 11; // tree canopies spread this far, and must not cover the field
// Around an open field in the middle; each door faces the centre. No house reaches the
// terrain blend ring, and each one fits inside its chunk and that chunk's neighbours.
export const VILLAGE_HOUSES = [
  { dx: -21, dz: -21, width: 9, depth: 7, door: 'south' },
  { dx: 0, dz: -28, width: 11, depth: 7, door: 'south' },
  { dx: 21, dz: -21, width: 9, depth: 7, door: 'south' },
  { dx: 28, dz: 0, width: 7, depth: 9, door: 'west' },
  { dx: 21, dz: 21, width: 9, depth: 7, door: 'north' },
  { dx: 0, dz: 28, width: 11, depth: 7, door: 'north' },
  { dx: -21, dz: 21, width: 9, depth: 7, door: 'north' }
];
export const HOUSE_WALL_HEIGHT = 3;
export const WATER_LEVEL = 6;
export const EDITS_STORAGE_KEY = 'cherry_blossom_voxel_edits';
export const EDIT_TIMES_STORAGE_KEY = 'cherry_blossom_voxel_edit_times';
export const LAST_RESET_STORAGE_KEY = 'cherry_blossom_voxel_last_reset';
export const RIVER_BANK_WIDTH = 9;
export const RIVER_DEPTH = 3;
export const RIVER_SAND_WIDTH = 3;
export const RIVER_TREE_CLEARANCE = 2;
export const RIVER_BRIDGE_SPACING = 64;
export const RIVER_BRIDGE_OFFSET = 8;
export const RIVER_BRIDGE_LAKE_CLEARANCE = 26; // no bridges where the river runs through the lake
export const WATER_FLOW_SPEED = 0.05;
export const WATER_EXIT_SPEED = 7.5;
export const SWIM_BUOYANCY = 0.4;
export const SWIM_DIVE_SPEED = 2.8;
export const SWIM_VERTICAL_SPEED = 3.2;
export const SWIM_PITCH_DEADZONE = 0.15;
export const UNDERWATER_FOG_DENSITY = 0.09;
export const UNDERWATER_FOG_COLOR = 0x0d5f9e;

// Thick enough that the edge of the loaded world stays hidden at any view distance
export const fogDensityForRadius = (radiusChunks) => 0.85 / (radiusChunks * 16);
export const STREAM_BUDGET_MS = 4;
export const FLOWER_MATERIAL_KEY = 'flower';
export const FLOWER_TINTS = [
  [1.0, 0.55, 0.72],
  [1.0, 0.42, 0.62],
  [1.0, 0.8, 0.88],
  [0.95, 0.35, 0.55]
];
export const FLOWER_STEM_COLOR = [0.22, 0.5, 0.16];
export const FLOWER_STEM_WIDTH = 0.06;
export const BLOCK_REACH = 6.5;
export const OUT_OF_REACH_MESSAGE = 'Khối ở quá xa, hãy nhìn vào khối ở gần hơn';
export const FULLSCREEN_HINT_MS = 6000;
export const FULLSCREEN_REFUSED_MESSAGE = 'Trình duyệt chưa cho toàn màn hình. Hãy thử mở web bằng Chrome rồi bấm lại';
// No fullscreen API: iPhones never have it, and on Android it usually means a browser inside an
// app such as Zalo or Facebook.
export const getFullscreenHelp = () => (/iPhone|iPod/.test(window.navigator.userAgent)
  ? 'iPhone không hỗ trợ nút này. Hãy bấm Chia sẻ, chọn "Thêm vào MH chính", rồi mở game từ đó'
  : 'Trình duyệt này không hỗ trợ toàn màn hình. Hãy mở web bằng Chrome');
export const getFullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
export const isRunningAsHomeScreenApp = () =>
  window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
export const TOUCH_LOOK_SPEED = 0.005;
export const IS_TOUCH_DEVICE = window.matchMedia('(pointer: coarse)').matches;

// Phones get the same world with less GPU work per frame.
export const QUALITY = IS_TOUCH_DEVICE
  ? {
      maxPixelRatio: 1.25,
      shadows: false,
      lanternLights: 2,
      flyingPetals: 500,
      fish: 25,
      animals: { deer: 3, sheep: 8, rabbit: 6 },
      stars: 800,
      groundPetals: 400,
      flowerDensity: 0.09,
      viewRadius: 3,
      hiddenMargin: 1
    }
  : {
      maxPixelRatio: 1.5,
      shadows: true,
      lanternLights: 4,
      flyingPetals: 1400,
      fish: 60,
      animals: { deer: 9, sheep: 16, rabbit: 12 },
      stars: 1600,
      groundPetals: 900,
      flowerDensity: 0.2, // share of grass columns with a flower
      viewRadius: 4,
      hiddenMargin: 1
    };
export const LANTERN_REFRESH_MS = 300;
export const LOW_FPS_THRESHOLD = 35;
export const LOW_FPS_READINGS = 8; // sampled every 250ms
export const MIN_RENDER_SCALE = 0.75;
