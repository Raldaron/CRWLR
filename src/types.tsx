// types.ts

/**
 * Interface for an item's additional effect.
 * Example: Explosive Impact, Shrapnel Spread, etc.
 */
export interface AdditionalEffect {
  name: string;
  description: string;
}

/**
 * Interface for a dictionary that maps levels to their effects
 * Example: { "Level 5": "Adds fire damage" }
 */
export interface Scaling {
  [level: string]: string;
}

/**
 * Interface for character abilities
 */
export interface Ability {
  name: string;
  description: string;
  effect?: string;
  cooldown?: string;
  cost?: number;
}

/**
 * Interface for spells that can be granted by items
 */
export interface Spell {
  name: string;
  description: string;
  manaCost: number;
  castingTime: string;
  effect: string;
}

/**
 * Map-like interface for numeric stat bonuses
 */
export interface StatBonus {
  [statName: string]: number;
}

/**
 * Map-like interface for numeric skill bonuses
 */
export interface SkillBonus {
  [skillName: string]: number;
}

/**
 * Interface for weapon-specific properties
 */
export interface WeaponProperties {
  meleeranged: string;           // e.g. "Melee", "Ranged"
  magicnonmagical: string;       // e.g. "Magical" or "Non-Magical"
  handsrequired: string;         // e.g. "One-handed", "Two-handed"
  damagetype?: string;
  damageamount?: string;         // e.g. "5d6" or "1d8"
}

/**
 * Interface for armor-specific properties
 */
export interface ArmorProperties {
  armortype: string;             // e.g. "Head", "Chest"
  armorrating: number;
  tankmodifier: number;
}

/**
 * Interface for magic item properties
 */
export interface MagicProperties {
  castingtime?: string;
  manapointcost?: string;
  cooldown?: string;
  spellcastingmodifier?: string;
  spellsgranted?: Spell[];
}

/**
 * Interface for combat-related properties
 */
export interface CombatProperties {
  range?: number | string;      // Some items have numeric, some have string (e.g. "Line of sight")
  duration?: string;            // e.g. "Instantaneous", "15 seconds", etc.
  damage?: string;              // Some items (e.g., explosives) use a 'damage' field differently
  blastradius?: number;
  triggermechanism?: string;
}

/**
 * Master interface for inventory items
 */
export interface InventoryItem {
  // Basic fields
  id: string;                   // Unique identifier for the item
  name: string;
  description: string;
  itemtype?: string;
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

  // Core effects
  effect?: string;
  additionaleffects?: AdditionalEffect[];
  scaling?: Scaling;
  abilities?: Ability[];
  traits?: string[];

  // Bonuses
  statbonus?: StatBonus;
  skillbonus?: SkillBonus;
  hpbonus?: number;
  mpbonus?: number;

  // Specialized properties - only one of these should be present
  weaponProperties?: WeaponProperties;
  armorProperties?: ArmorProperties;
  magicProperties?: MagicProperties;
  combatProperties?: CombatProperties;
}

/**
 * Enum for valid item types
 */
export enum ItemType {
  Weapon = 'weapon',
  Armor = 'armor',
  Consumable = 'consumable',
  Scroll = 'scroll',
  Material = 'material',
  Quest = 'quest'
}

/**
 * Type guard to check if item is a weapon
 */
export function isWeapon(item: InventoryItem): boolean {
  return item.weaponProperties !== undefined;
}

/**
 * Type guard to check if item is armor
 */
export function isArmor(item: InventoryItem): boolean {
  return item.armorProperties !== undefined;
}

/**
 * Type guard to check if item has magic properties
 */
export function isMagical(item: InventoryItem): boolean {
  return item.magicProperties !== undefined;
}