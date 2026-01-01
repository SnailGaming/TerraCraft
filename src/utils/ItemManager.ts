import { Item, Inventory, InventorySlot } from '../types';

export class ItemManager {
  private static items: Record<string, Item> = {
    apple: {
      id: 'apple',
      name: 'Apple',
      icon: '🍎',
      stackSize: 64,
      edible: true,
      hungerRestore: 20,
      thirstRestore: 5,
      healthRestore: 10
    },
    wood: {
      id: 'wood',
      name: 'Wood',
      icon: '🪵',
      stackSize: 64,
      edible: false
    }
  };

  static getItem(id: string): Item | undefined {
    return this.items[id];
  }

  static addItemToInventory(inventory: Inventory, itemId: string, count: number = 1): Inventory {
    const item = this.getItem(itemId);
    if (!item) return inventory;
    
    const newSlots = [...inventory.slots];
    
    for (let i = 0; i < newSlots.length; i++) {
      const slot = newSlots[i];
      if (slot && slot.item.id === itemId && slot.count < item.stackSize) {
        const spaceLeft = item.stackSize - slot.count;
        const toAdd = Math.min(count, spaceLeft);
        newSlots[i] = { ...slot, count: slot.count + toAdd };
        count -= toAdd;
        if (count === 0) break;
      }
    }

    while (count > 0) {
      const emptySlotIndex = newSlots.findIndex(slot => slot === null);
      if (emptySlotIndex === -1) break;
      const toAdd = Math.min(count, item.stackSize);
      newSlots[emptySlotIndex] = { item, count: toAdd };
      count -= toAdd;
    }

    return { ...inventory, slots: newSlots };
  }

  static removeItemFromInventory(inventory: Inventory, itemId: string, count: number = 1): Inventory {
    const newSlots = [...inventory.slots];
    let remaining = count;

    for (let i = newSlots.length - 1; i >= 0 && remaining > 0; i--) {
      const slot = newSlots[i];
      if (slot && slot.item.id === itemId) {
        if (slot.count <= remaining) {
          remaining -= slot.count;
          newSlots[i] = null;
        } else {
          newSlots[i] = { ...slot, count: slot.count - remaining };
          remaining = 0;
        }
      }
    }

    return { ...inventory, slots: newSlots };
  }

  static countItem(inventory: Inventory, itemId: string): number {
    return inventory.slots.reduce((total, slot) => {
      if (slot && slot.item.id === itemId) return total + slot.count;
      return total;
    }, 0);
  }

  static getTreeDrops(): { itemId: string; count: number }[] {
    const drops: { itemId: string; count: number }[] = [
      { itemId: 'wood', count: 1 }
    ];
    
    if (Math.random() < 0.3) {
      drops.push({ itemId: 'apple', count: 1 });
    }
    
    return drops;
  }
}
