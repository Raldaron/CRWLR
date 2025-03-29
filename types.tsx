// Base item properties that all items share
export interface BaseItem {
  name: string;
  description: string;
  rarity: string;
  itemType: string;
}

export interface ScrollItem extends BaseItem {
  effect: string;
  range: string;
  damage: string;
  damageType: string;
  castingTime: string;
  abilityPointCost: string;
  cooldown: string;
  scaling: string;
  spellCastingModifier: string;
}

export interface WeaponItem extends BaseItem {
  weaponType: string;
  meleeRanged: string;
  magicNonMagical: string;
  handsRequired: string;
  damageType: string;
  damageAmount: string;
  statBonus: {
    [key: string]: number;
  };
  skillBonus: {
    [key: string]: number;
  };
  abilities: string[];
  traits: string[];
  spellsGranted: {
    [key: string]: string;
  };
  hpBonus: number;
  mpBonus: number;
}

export interface ArmorItem extends BaseItem {
  armorType: string;
  armorRating: number;
  tankModifier: number;
  vitalBonus: {
    [key: string]: number;
  };
  skillBonus: {
    [key: string]: number;
  };
  abilities: string[];
  traits: string[];
  spellsGranted: string[];
  hpBonus: number;
  mpBonus: number;
}

export interface ExplosiveItem extends BaseItem {
  effect: string;
  duration: string;
  damage: string;
  damageType: string;
  blastRadius: number;
  triggerMechanism: string;
}

export interface PotionItem extends BaseItem {
  effect: string;
  duration: string;
  range: string;
  vitalBonus: {
    [key: string]: number;
  };
  skillBonus: {
    [key: string]: number;
  };
  abilities: {
    [key: string]: any;
  };
  hpBonus: number;
  mpBonus: number;
}

export interface TrapItem extends BaseItem {
  effect: string;
  duration: string;
  range: string;
  vitalBonus: {
    [key: string]: number;
  };
  skillBonus: {
    [key: string]: number;
  };
  abilities: {
    [key: string]: any;
  };
  hpBonus: number;
  mpBonus: number;
}

export interface CraftingComponentItem extends BaseItem {
  effect: string;
  duration: string;
  range: string;
}

// Union type for all possible item types
export type Item = 
  | ScrollItem 
  | WeaponItem 
  | ArmorItem 
  | ExplosiveItem 
  | PotionItem 
  | TrapItem 
  | CraftingComponentItem;

// Player inventory type
export interface PlayerInventory {
  armor: ArmorItem[];
  ammunition: Item[];
  crafting_components: CraftingComponentItem[];
  explosives: ExplosiveItem[];
  potions: PotionItem[];
  scrolls: ScrollItem[];
  traps: TrapItem[];
  weapons: WeaponItem[];
}