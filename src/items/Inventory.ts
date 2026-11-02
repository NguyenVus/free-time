import { ITEMS, STARTING_ITEMS, type Recipe } from './items';

const INVENTORY_STORAGE_KEY = 'cherry_inventory';
const CREATIVE_STORAGE_KEY = 'cherry_creative_mode';

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null; // private browsing can block storage
  }
};
const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Not saved, which only means starting over next time
  }
};

/** The player's items. In creative mode nothing is ever used up or needed. */
export class Inventory {
  private counts = new Map<string, number>();
  private listeners: Array<() => void> = [];
  creative: boolean;

  constructor() {
    this.creative = readStorage(CREATIVE_STORAGE_KEY) === '1';
    const saved = readStorage(INVENTORY_STORAGE_KEY);
    if (saved === null) {
      STARTING_ITEMS.forEach(([id, count]) => this.counts.set(id, count));
      return;
    }
    try {
      for (const [id, count] of Object.entries(JSON.parse(saved))) {
        if (ITEMS[id] && Number.isInteger(count) && (count as number) > 0) this.counts.set(id, count as number);
      }
    } catch (error) {
      console.warn('Could not read saved items:', error);
    }
  }

  onChange(listener: () => void) {
    this.listeners.push(listener);
  }

  private changed() {
    writeStorage(INVENTORY_STORAGE_KEY, JSON.stringify(Object.fromEntries(this.counts)));
    this.listeners.forEach(listener => listener());
  }

  setCreative(enabled: boolean) {
    this.creative = enabled;
    writeStorage(CREATIVE_STORAGE_KEY, enabled ? '1' : '0');
    this.listeners.forEach(listener => listener());
  }

  count(id: string): number {
    return this.counts.get(id) || 0;
  }

  has(id: string, amount = 1): boolean {
    return this.creative || this.count(id) >= amount;
  }

  add(id: string, amount = 1) {
    this.counts.set(id, this.count(id) + amount);
    this.changed();
  }

  /** Takes items away. Returns false, and takes nothing, if there are too few. */
  use(id: string, amount = 1): boolean {
    if (this.creative) return true;
    if (this.count(id) < amount) return false;
    const left = this.count(id) - amount;
    if (left > 0) this.counts.set(id, left);
    else this.counts.delete(id);
    this.changed();
    return true;
  }

  items(): Array<[string, number]> {
    return [...this.counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  canCraft(recipe: Recipe): boolean {
    return recipe.needs.every(([id, amount]) => this.has(id, amount));
  }

  /** Returns false, and changes nothing, if an ingredient is missing. */
  craft(recipe: Recipe): boolean {
    if (!this.canCraft(recipe)) return false;
    recipe.needs.forEach(([id, amount]) => this.use(id, amount));
    this.add(recipe.makes[0], recipe.makes[1]);
    return true;
  }

  pickaxeTier(): number {
    if (this.creative || this.count('stone_pickaxe') > 0) return 2;
    return this.count('wooden_pickaxe') > 0 ? 1 : 0;
  }
}

