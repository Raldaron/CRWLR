// types/inventory.ts

export type ItemRarity = 'Ordinary' | 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Very Rare' | 'Unique' | 'Exceedingly Rare';
export type ItemType = 'Weapon' | 'Armor' | 'Ammunition' | 'Potion' | 'Scroll' | 'Crafting Component' | 'Trap' | 'Explosive' | 'Throwable';

// Shared interfaces
export interface AdditionalEffect {
  name: string;
  description: string;
}

export interface StatBonus {
  [key: string]: number;
}

export interface SkillBonus {
  [key: string]: number;
}

export interface VitalBonus {
  [key: string]: number;
}

export interface Scaling {
  [key: string]: string;
}

// Comprehensive inventory item that accommodates all possible item types
export interface InventoryItem {
  // Common properties
  id: string;
  name: string;
  description: string;
  itemType: ItemType | string;
  rarity: ItemRarity | string;
  
  // Weapon/Armor/Equipment properties
  armorType?: string;
  armorRating?: number;
  tankModifier?: number;
  weaponType?: string;
  meleeRanged?: 'Melee' | 'Ranged';
  handsRequired?: 'One-handed' | 'Two-handed';
  magicNonMagical?: 'Magical' | 'Non-Magical';
  
  // Combat-related properties
  damageAmount?: string;
  damageType?: string;
  damage?: string;
  range?: string | number;
  radius?: number;
  blastRadius?: number;
  triggerMechanism?: string;
  
  // Magic-related properties
  effect?: string;
  castingTime?: string;
  manaPointCost?: string;
  cooldown?: string;
  spellCastingModifier?: string;
  scaling?: Scaling;
  duration?: string;
  spellsGranted?: string[];
  
  // Bonus properties
  statBonus?: StatBonus;
  skillBonus?: SkillBonus;
  vitalbonus?: VitalBonus;
  hpBonus?: number;
  mpBonus?: number;
  
  // Special features
  abilities?: string[] | Record<string, any>;
  traits?: string[];
  additionaleffects?: AdditionalEffect[];
}

// Interface for inventory items with quantity
export interface InventoryItemWithQuantity {
  item: InventoryItem;
  quantity: number;
}

// Default columns for inventory display
export const DEFAULT_COLUMNS = ['name', 'itemType', 'rarity'];

// Type-specific columns for different item types
export const ITEM_TYPE_COLUMNS: Record<string, string[]> = {
  'Weapon': ['name', 'weaponType', 'damageAmount', 'damageType', 'rarity'],
  'Armor': ['name', 'armorType', 'armorRating', 'tankModifier', 'rarity'],
  'Ammunition': ['name', 'damageAmount', 'damageType', 'range', 'rarity'],
  'Potion': ['name', 'effect', 'duration', 'rarity'],
  'Scroll': ['name', 'effect', 'castingTime', 'cooldown', 'rarity'],
  'Crafting Component': ['name', 'effect', 'rarity'],
  'Trap': ['name', 'effect', 'duration', 'rarity'],
  'Explosive': ['name', 'damage', 'damageType', 'blastRadius', 'rarity'],
  'Throwable': ['name', 'damage', 'damageType', 'blastRadius', 'rarity']
};