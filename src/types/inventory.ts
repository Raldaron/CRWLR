import type { AdditionalEffect as AmmoAdditionalEffect } from "./ammunition";
import type { AdditionalEffect as ExplosiveAdditionalEffect } from "./explosives";
import type { AdditionalEffect as TrapAdditionalEffect } from "./trap";
import type { ScrollScaling } from "./scroll";
import type { ArmorRarity } from "./armor";
import type { WeaponRarity } from "./weapon";
import type { AmmunitionRarity } from "./ammunition";
import type { PotionRarity } from "./potion";
import type { CraftingComponentRarity } from "./craftingcomponent";
import type { TrapRarity } from "./trap";
import type { ExplosiveRarity } from "./explosives";

// Combined Rarity type covering all possibilities
export type ItemRarity =
 | 'Ordinary'
 | ArmorRarity
 | WeaponRarity
 | AmmunitionRarity
 | PotionRarity
 | CraftingComponentRarity
 | TrapRarity
 | ExplosiveRarity
 | string; // Fallback for any unexpected values

// Combined ItemType type covering all possibilities
export type ItemType =
  | 'Weapon'
  | 'Armor'
  | 'Ammunition'
  | 'Potion'
  | 'Pharmaceutical'
  | 'Scroll'
  | 'CraftingComponent'
  | 'Trap'
  | 'Explosive'
  | 'Throwable'
  | 'Miscellaneous'
  | 'Recipe'
  | string; // Fallback for any unexpected values

// Shared nested interfaces
export interface StatBonus { [key: string]: number; }
export interface SkillBonus { [key: string]: number; }
export interface Scaling { [key: string]: string; } // Basic scaling
export interface NestedEffect { name: string; description: string; } // For additionaleffects

// BaseItem interface - Covers ALL possible fields from ALL CSVs and existing types
export interface BaseItem {
  id: string;
  name: string;
  description: string;
  itemType: ItemType; // Use combined type
  rarity: ItemRarity; // Use combined type

  // Common Optional Fields
  quantity?: number; // Primarily for inventory tracking, not base item usually
  buyValue?: number; // Added from CSVs
  sellValue?: number; // Added from CSVs
  weight?: number;
  icon?: string;
  image?: string;
  effect?: string; // Potions, Pharma, Crafting, Traps, Explosives, Ammo
  duration?: string | number; // Potions, Pharma, Ammo, Explosives, Traps, Scrolls
  range?: string | number; // Ammo, Explosives, Scrolls, Potions, Pharma
  createdAt?: any; // Firestore timestamp or number
  lastUpdated?: any; // Firestore timestamp or number

  // Bonus Fields (Mainly Weapon/Armor)
  hpBonus?: number; // Armor, Weapon
  mpBonus?: number; // Armor, Weapon
  statBonus?: StatBonus; // Armor, Weapon
  skillBonus?: SkillBonus; // Armor, Weapon
  armorRating?: number; // Armor
  tankModifier?: number; // Armor

  // Ability/Trait/Spell Fields (Armor, Weapon)
  abilities?: string[]; // Armor, Weapon, Ammo (optional)
  traits?: string[]; // Armor, Weapon
  spellsGranted?: string[]; // Armor, Weapon

  // Combat/Damage Fields (Ammunition, Explosives, Traps, Weapons, Scrolls)
  damage?: string; // Explosives, Traps
  damageAmount?: string; // Ammunition, Weapons, Scrolls
  damageType?: string; // All combat types
  blastRadius?: string | number; // Explosives, Traps, Ammo (optional)
  triggerMechanism?: string; // Ammo, Explosives, Traps
  operation?: string; // Specific to Traps
  additionalEffects?: string; // Ammo, Explosives, Traps (JSON string)
  uniqueAbilities?: string; // Explosives (JSON object string?)

  // Potion/Pharmaceutical Specific
  manaBack?: number | string; // Potions, Pharma
  healFor?: number | string; // Potions, Pharma

  // Scroll/Magic Specific
  castingTime?: string; // Scrolls
  cooldown?: string; // Scrolls
  manaPointCost?: string | number; // Scrolls (string), Spells (number)
  spellCastingModifier?: string; // Scrolls
  scaling?: Scaling | ScrollScaling; // Scrolls, Spells (potentially different structure)

  // Weapon Specific
  weaponType?: string;
  meleeRanged?: 'Melee' | 'Ranged' | string; // Changed from 'Melee' | 'Ranged'
  magicNonMagical?: 'Magical' | 'Non-Magical';
  handsRequired?: string;

  // Armor Specific
  armorType?: string;

  // Other potential fields from code/future use
  requiresLevel?: number;
  restrictedClasses?: string[];
  maxQuantity?: number; // Maybe for shop stock
  restockRate?: string; // Maybe for shop stock
  collectionName?: string; // Useful for catalog/shops

  // Allow additional unknown properties for future flexibility
  [key: string]: any;
}

// InventoryItem is now just the BaseItem type
export type InventoryItem = BaseItem;

// Interface for inventory items with quantity (remains the same)
export interface InventoryItemWithQuantity {
  item: InventoryItem;
  quantity: number;
}

// Default columns for inventory display
export const DEFAULT_COLUMNS = ['name', 'itemType', 'rarity', 'quantity']; // Added quantity

// Type-specific columns for different item types - UPDATED based on new fields
export const ITEM_TYPE_COLUMNS: Record<string, string[]> = {
  'Weapon': ['name', 'weaponType', 'damageAmount', 'damageType', 'rarity', 'buyValue', 'quantity'],
  'Armor': ['name', 'armorType', 'armorRating', 'rarity', 'buyValue', 'quantity'],
  'Ammunition': ['name', 'damageAmount', 'damageType', 'rarity', 'buyValue', 'quantity'],
  'Potion': ['name', 'effect', 'rarity', 'buyValue', 'quantity'],
  'Pharmaceutical': ['name', 'effect', 'rarity', 'buyValue', 'quantity'],
  'Scroll': ['name', 'effect', 'castingTime', 'rarity', 'buyValue', 'quantity'],
  'CraftingComponent': ['name', 'effect', 'rarity', 'buyValue', 'quantity'],
  'Trap': ['name', 'effect', 'damage', 'rarity', 'buyValue', 'quantity'],
  'Explosive': ['name', 'damage', 'blastRadius', 'rarity', 'buyValue', 'quantity'],
  'Throwable': ['name', 'damage', 'blastRadius', 'rarity', 'buyValue', 'quantity'],
  'Miscellaneous': ['name', 'rarity', 'buyValue', 'quantity'],
};