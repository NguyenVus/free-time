// =========================================================================
// 1. PROCEDURAL 16x16 PIXEL-ART TEXTURE GENERATOR (NearestFilter)
// =========================================================================
export const BLOCK_DEFS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WOOD_LOG: 5,
  WOOD_PLANKS: 6,
  LEAVES_LIGHT: 7,
  LEAVES_DEEP: 8,
  LEAVES_WHITE: 9,
  GLASS: 10,
  LANTERN: 11,
  WATER: 12,
  TORII_RED: 13,
  ROOF_SLATE: 14,
  CHERRY_HEARTWOOD: 15,
  LEAVES_SOFT: 16,
  LEAVES_MAGENTA: 17,
  GROUND_PETALS_CARPET: 18,
  PAPER_LANTERN: 19,
  SNOW: 20,
  VOLCANIC_ROCK: 21
};

export const BLOCK_NAMES = {
  [BLOCK_DEFS.AIR]: 'Không khí (Air)',
  [BLOCK_DEFS.GRASS]: 'Cỏ xanh (Grass)',
  [BLOCK_DEFS.DIRT]: 'Đất nâu (Dirt)',
  [BLOCK_DEFS.STONE]: 'Đá cổ (Stone)',
  [BLOCK_DEFS.SAND]: 'Cát bờ hồ (Sand)',
  [BLOCK_DEFS.WOOD_LOG]: 'Gỗ anh đào (Log)',
  [BLOCK_DEFS.WOOD_PLANKS]: 'Ván gỗ mịn (Planks)',
  [BLOCK_DEFS.LEAVES_LIGHT]: 'Hoa hồng nhạt (Sakura)',
  [BLOCK_DEFS.LEAVES_DEEP]: 'Hoa hồng đậm (Deep)',
  [BLOCK_DEFS.LEAVES_WHITE]: 'Hoa trắng tinh (White)',
  [BLOCK_DEFS.GLASS]: 'Kính trong suốt (Glass)',
  [BLOCK_DEFS.LANTERN]: 'Đèn lồng đá (Lantern)',
  [BLOCK_DEFS.WATER]: 'Nước hồ trong (Water)',
  [BLOCK_DEFS.TORII_RED]: 'Cổng Torii Đỏ',
  [BLOCK_DEFS.ROOF_SLATE]: 'Ngói Slate Đen',
  [BLOCK_DEFS.CHERRY_HEARTWOOD]: 'Lõi gỗ anh đào',
  [BLOCK_DEFS.LEAVES_SOFT]: 'Hoa hồng phấn (Soft Pink)',
  [BLOCK_DEFS.LEAVES_MAGENTA]: 'Hoa anh đào thẫm (Magenta)',
  [BLOCK_DEFS.GROUND_PETALS_CARPET]: 'Thảm cánh hoa rơi (Carpet)',
  [BLOCK_DEFS.PAPER_LANTERN]: 'Đèn lồng cành cây (Paper Lantern)',
  [BLOCK_DEFS.SNOW]: 'Tuyết đỉnh núi (Snow)',
  [BLOCK_DEFS.VOLCANIC_ROCK]: 'Đá núi lửa (Volcanic Rock)'
};

export const HOTBAR_ITEMS = [
  { id: BLOCK_DEFS.GRASS, name: 'Cỏ Xanh (Grass)' },
  { id: BLOCK_DEFS.DIRT, name: 'Đất Nâu (Dirt)' },
  { id: BLOCK_DEFS.STONE, name: 'Đá Cổ (Stone)' },
  { id: BLOCK_DEFS.WOOD_LOG, name: 'Gỗ Anh Đào (Log)' },
  { id: BLOCK_DEFS.WOOD_PLANKS, name: 'Ván Gỗ Mịn (Planks)' },
  { id: BLOCK_DEFS.LEAVES_LIGHT, name: 'Hoa Hồng Nhạt (Sakura)' },
  { id: BLOCK_DEFS.LEAVES_DEEP, name: 'Hoa Hồng Đậm (Deep Pink)' },
  { id: BLOCK_DEFS.LEAVES_WHITE, name: 'Hoa Trắng Tinh (White)' },
  { id: BLOCK_DEFS.LANTERN, name: 'Đèn Lồng Phát Sáng (Lantern)' }
];
