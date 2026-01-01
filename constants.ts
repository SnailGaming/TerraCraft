// Planet Sizes
export const PLANET_RADIUS_SMALL = 30;
export const PLANET_RADIUS_MEDIUM = 60;
export const PLANET_RADIUS_LARGE = 120;
export const PLANET_RADIUS_HUGE = 350;

// World Gen
export const WORLD_RESOLUTION = 128; 
export const WATER_LEVEL_OFFSET = -0.5;
export const TREE_DENSITY = 0.5;

// Terrain Noise Config
export const TERRAIN_BASE_SCALE = 0.01;
export const TERRAIN_AMPLITUDE = 6.0;

// Player
export const PLAYER_SPEED = 6;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_HEIGHT_CROUCH = 1.4;

// Physics & Stamina
export const GRAVITY = 20.0;
export const JUMP_FORCE = 8.0;
export const SPRINT_MULTIPLIER = 1.8;
export const CROUCH_MULTIPLIER = 0.5;
export const STAMINA_MAX = 100;
export const STAMINA_DRAIN_SPRINT = 15.0;
export const STAMINA_DRAIN_JUMP = 20.0;
export const STAMINA_REGEN = 10.0;
export const FALL_DAMAGE_THRESHOLD = -15.0;
export const TREE_COLLISION_RADIUS = 0.8;

// Colors
export const COLORS = {
  GRASS: '#4ade80',
  WATER: '#3b82f6',
  DIRT: '#8d6e63',
  STONE: '#9ca3af',
  SKY: '#87CEEB',
  TREE_TRUNK: '#3e2723',
  TREE_LEAVES_OAK: '#2e7d32',
  TREE_LEAVES_PINE: '#1b5e20'
};

const createPart = (name: string) => ({ health: 100, maxHealth: 100, isBroken: false, name });

export const INITIAL_STATS = {
  body: {
    head: createPart("Head"),
    torso: createPart("Torso"),
    leftArm: createPart("Left Arm"),
    rightArm: createPart("Right Arm"),
    leftLeg: createPart("Left Leg"),
    rightLeg: createPart("Right Leg"),
    leftAnkle: createPart("Left Ankle"),
    rightAnkle: createPart("Right Ankle"),
  },
  hunger: 100,
  thirst: 100,
  food: 0,
  wood: 0,
  stamina: 100,
  inventory: {
    slots: Array(36).fill(null),
    maxSlots: 36
  }
};
