export interface BodyPartStats {
  health: number; // 0-100
  maxHealth: number;
  isBroken: boolean;
  name: string;
}

export interface BodyStats {
  head: BodyPartStats;
  torso: BodyPartStats;
  leftArm: BodyPartStats;
  rightArm: BodyPartStats;
  leftLeg: BodyPartStats;
  rightLeg: BodyPartStats;
  leftAnkle: BodyPartStats;
  rightAnkle: BodyPartStats;
}

export interface PlayerStats {
  body: BodyStats;
  hunger: number;
  thirst: number;
  food: number;
  wood: number;
  stamina: number;
  inventory: Inventory;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface TreeData {
  id: string;
  position: Position;
  rotation: Position;
  scale: number;
  type: 'oak' | 'pine';
}

export enum GameState {
  MENU,
  WORLD_SELECT,
  PLAYING,
  GAME_OVER
}

export interface WorldConfig {
  seed: number;
  radius: number;
  waterLevel: number;
  treeCount: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  stackSize: number;
  type: 'resource' | 'food' | 'consumable' | 'tool';
  edible: boolean;
  hungerRestore?: number;
  healthRestore?: number;
  thirstRestore?: number;
}

export interface InventorySlot {
  item: Item;
  count: number;
}

export interface Inventory {
  slots: (InventorySlot | null)[];
  maxSlots: number;
}