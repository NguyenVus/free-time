import { ITEMS, RECIPES, type Recipe } from '../items/items';
import type { Inventory } from '../items/Inventory';

const createIcon = (itemId: string, textures: Record<string, { canvas?: HTMLCanvasElement }>): HTMLElement => {
  const item = ITEMS[itemId];
  const source = item.texture ? textures[item.texture]?.canvas : undefined;
  if (source) {
    const icon = source.cloneNode() as HTMLCanvasElement; // copies the size but not the pixels
    icon.getContext('2d').drawImage(source, 0, 0);
    icon.className = 'item-icon';
    return icon;
  }
  const icon = document.createElement('span');
  icon.className = 'item-icon item-emoji';
  icon.textContent = item.emoji;
  return icon;
};

/** The bag and crafting window. Everything is written with textContent, never as HTML. */
export class InventoryPanel {
  private root = document.getElementById('inventory-panel') as HTMLElement;
  private bag = document.getElementById('inventory-items') as HTMLElement;
  private recipes = document.getElementById('inventory-recipes') as HTMLElement;
  private creative = document.getElementById('inventory-creative') as HTMLInputElement;

  constructor(
    private inventory: Inventory,
    private textures: Record<string, { canvas?: HTMLCanvasElement }>,
    private onChooseForHotbar: (itemId: string) => void,
    private onChooseTool: (itemId: string) => boolean,
    private onToast: (message: string) => void
  ) {
    inventory.onChange(() => {
      if (this.isOpen) this.render();
    });
    this.creative.addEventListener('change', () => inventory.setCreative(this.creative.checked));
  }

  get isOpen(): boolean {
    return this.root.classList.contains('visible');
  }

  setOpen(open: boolean) {
    this.root.classList.toggle('visible', open);
    if (open) this.render();
  }

  private render() {
    this.creative.checked = this.inventory.creative;
    this.bag.textContent = '';
    const items = this.inventory.items();
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'inventory-empty';
      empty.textContent = 'Túi đang trống. Đào cây để lấy gỗ nhé!';
      this.bag.appendChild(empty);
    }
    for (const [id, count] of items) {
      const cell = document.createElement('button');
      cell.className = 'inventory-cell';
      cell.title = ITEMS[id].name;
      cell.appendChild(createIcon(id, this.textures));
      const label = document.createElement('span');
      label.className = 'inventory-cell-name';
      label.textContent = `${ITEMS[id].name} ×${count}`;
      cell.appendChild(label);
      cell.addEventListener('click', () => {
        if (ITEMS[id].block !== undefined) this.onChooseForHotbar(id);
        else if (!this.onChooseTool(id)) this.onToast(ITEMS[id].name);
      });
      this.bag.appendChild(cell);
    }

    this.recipes.textContent = '';
    RECIPES.forEach(recipe => this.recipes.appendChild(this.createRecipeRow(recipe)));
  }

  private createRecipeRow(recipe: Recipe): HTMLElement {
    const row = document.createElement('div');
    row.className = 'recipe-row';
    const [madeId, madeCount] = recipe.makes;
    row.appendChild(createIcon(madeId, this.textures));

    const text = document.createElement('div');
    text.className = 'recipe-text';
    const title = document.createElement('div');
    title.className = 'recipe-title';
    title.textContent = madeCount > 1 ? `${ITEMS[madeId].name} ×${madeCount}` : ITEMS[madeId].name;
    const needs = document.createElement('div');
    needs.className = 'recipe-needs';
    needs.textContent = recipe.needs.map(([id, amount]) => `${ITEMS[id].name} ${this.inventory.count(id)}/${amount}`).join(' · ');
    text.append(title, needs);
    row.appendChild(text);

    const button = document.createElement('button');
    button.className = 'recipe-craft';
    button.textContent = 'Chế tạo';
    button.disabled = !this.inventory.canCraft(recipe);
    button.addEventListener('click', () => {
      if (this.inventory.craft(recipe)) this.onToast(`Đã chế tạo: ${ITEMS[madeId].name}`);
    });
    row.appendChild(button);
    return row;
  }
}
