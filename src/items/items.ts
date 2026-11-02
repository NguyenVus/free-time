import { BLOCK_DEFS } from '../world/blocks';

export interface ItemDefinition {
  name: string;
  /** Shown when the item has no block texture. */
  emoji: string;
  /** The block this item places, if any. */
  block?: number;
  /** Key of the block texture used as its icon. */
  texture?: string;
}

export const ITEMS: Record<string, ItemDefinition> = {
  grass: { name: 'Cỏ xanh', emoji: '🟩', block: BLOCK_DEFS.GRASS, texture: 'grass_top' },
  dirt: { name: 'Đất', emoji: '🟫', block: BLOCK_DEFS.DIRT, texture: 'dirt' },
  stone: { name: 'Đá', emoji: '🪨', block: BLOCK_DEFS.STONE, texture: 'stone' },
  sand: { name: 'Cát', emoji: '🏖️', block: BLOCK_DEFS.SAND, texture: 'sand' },
  log: { name: 'Gỗ anh đào', emoji: '🪵', block: BLOCK_DEFS.WOOD_LOG, texture: 'log_side' },
  planks: { name: 'Ván gỗ', emoji: '🟧', block: BLOCK_DEFS.WOOD_PLANKS, texture: 'planks' },
  leaves_light: { name: 'Hoa hồng nhạt', emoji: '🌸', block: BLOCK_DEFS.LEAVES_LIGHT, texture: 'leaves_light' },
  leaves_deep: { name: 'Hoa hồng đậm', emoji: '🌺', block: BLOCK_DEFS.LEAVES_DEEP, texture: 'leaves_deep' },
  leaves_white: { name: 'Hoa trắng', emoji: '🤍', block: BLOCK_DEFS.LEAVES_WHITE, texture: 'leaves_white' },
  lantern: { name: 'Đèn lồng', emoji: '🏮', block: BLOCK_DEFS.LANTERN, texture: 'lantern' },
  glass: { name: 'Kính', emoji: '🪟', block: BLOCK_DEFS.GLASS, texture: 'glass' },
  snow: { name: 'Tuyết', emoji: '❄️', block: BLOCK_DEFS.SNOW, texture: 'snow' },
  volcanic_rock: { name: 'Đá núi lửa', emoji: '🌋', block: BLOCK_DEFS.VOLCANIC_ROCK, texture: 'volcanic_rock' },
  stick: { name: 'Que gỗ', emoji: '🥢' },
  petal: { name: 'Cánh hoa', emoji: '🌸' },
  arrow: { name: 'Mũi tên', emoji: '➶' },
  wooden_pickaxe: { name: 'Cuốc gỗ', emoji: '⛏️' },
  stone_pickaxe: { name: 'Cuốc đá', emoji: '⚒️' },
  fishing_rod: { name: 'Cần câu', emoji: '🎣' },
  bow: { name: 'Cung', emoji: '🏹' },
  carp: { name: 'Cá chép', emoji: '🐟' },
  silverfish: { name: 'Cá bạc', emoji: '🐠' },
  koi: { name: 'Cá koi quý', emoji: '🎏' },
  meat: { name: 'Thịt', emoji: '🍖' },
  hide: { name: 'Da thú', emoji: '🟤' },
  wool: { name: 'Len', emoji: '🧶' }
};

export type ItemStack = [itemId: string, count: number];

export interface Recipe {
  makes: ItemStack;
  needs: ItemStack[];
}

export const RECIPES: Recipe[] = [
  { makes: ['planks', 4], needs: [['log', 1]] },
  { makes: ['stick', 4], needs: [['planks', 2]] },
  { makes: ['wooden_pickaxe', 1], needs: [['planks', 3], ['stick', 2]] },
  { makes: ['stone_pickaxe', 1], needs: [['stone', 3], ['stick', 2]] },
  { makes: ['fishing_rod', 1], needs: [['stick', 3], ['petal', 2]] },
  { makes: ['bow', 1], needs: [['stick', 3], ['petal', 3]] },
  { makes: ['arrow', 4], needs: [['stick', 1], ['stone', 1]] },
  { makes: ['lantern', 1], needs: [['planks', 2], ['stick', 1]] },
  { makes: ['glass', 1], needs: [['sand', 2]] }
];

export const STARTING_ITEMS: ItemStack[] = [['planks', 8], ['lantern', 2]];

/** Pickaxe needed to dig a block: 1 is wooden or better, 2 is stone. Others need nothing. */
const REQUIRED_PICKAXE_TIER: Record<number, number> = {
  [BLOCK_DEFS.STONE]: 1,
  [BLOCK_DEFS.ROOF_SLATE]: 1,
  [BLOCK_DEFS.VOLCANIC_ROCK]: 2
};

export const getRequiredPickaxeTier = (blockId: number): number => REQUIRED_PICKAXE_TIER[blockId] || 0;

const LEAF_BLOCKS = new Set([
  BLOCK_DEFS.LEAVES_LIGHT, BLOCK_DEFS.LEAVES_DEEP, BLOCK_DEFS.LEAVES_WHITE,
  BLOCK_DEFS.LEAVES_SOFT, BLOCK_DEFS.LEAVES_MAGENTA
]);

/** What digging a block gives. `roll` is a random number from 0 to 1. */
export const getBlockDrops = (blockId: number, roll: number): ItemStack[] => {
  if (LEAF_BLOCKS.has(blockId)) {
    const drops: ItemStack[] = [['petal', 1]];
    if (roll < 0.2) drops.push(['stick', 1]);
    if (blockId === BLOCK_DEFS.LEAVES_LIGHT || blockId === BLOCK_DEFS.LEAVES_SOFT) drops.push(['leaves_light', 1]);
    else if (blockId === BLOCK_DEFS.LEAVES_WHITE) drops.push(['leaves_white', 1]);
    else drops.push(['leaves_deep', 1]);
    return drops;
  }
  switch (blockId) {
    case BLOCK_DEFS.GRASS: return [['dirt', 1]];
    case BLOCK_DEFS.GROUND_PETALS_CARPET: return [['dirt', 1], ['petal', 1]];
    case BLOCK_DEFS.DIRT: return [['dirt', 1]];
    case BLOCK_DEFS.STONE: return [['stone', 1]];
    case BLOCK_DEFS.SAND: return [['sand', 1]];
    case BLOCK_DEFS.WOOD_LOG:
    case BLOCK_DEFS.CHERRY_HEARTWOOD: return [['log', 1]];
    case BLOCK_DEFS.WOOD_PLANKS: return [['planks', 1]];
    case BLOCK_DEFS.GLASS: return [['glass', 1]];
    case BLOCK_DEFS.LANTERN:
    case BLOCK_DEFS.PAPER_LANTERN: return [['lantern', 1]];
    case BLOCK_DEFS.SNOW: return [['snow', 1]];
    case BLOCK_DEFS.VOLCANIC_ROCK: return [['volcanic_rock', 1]];
    case BLOCK_DEFS.TORII_RED: return [['planks', 1]];
    case BLOCK_DEFS.ROOF_SLATE: return [['stone', 1]];
    default: return [];
  }
};

/** Every block a player can place, which is also every block a shared edit may contain. */
export const PLACEABLE_BLOCKS = new Set(
  Object.values(ITEMS).filter(item => item.block !== undefined).map(item => item.block as number)
);

export const getItemForBlock = (blockId: number): string | undefined =>
  Object.keys(ITEMS).find(id => ITEMS[id].block === blockId);
