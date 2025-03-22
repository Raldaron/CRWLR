// types/inventoryTypes.ts

// Columns for different item types
export type ItemTypeColumns = {
    [key: string]: string[];
  };
  
  // Default columns for all items
  export const DEFAULT_COLUMNS = ['name', 'itemType', 'rarity'];
  
  // Weapon columns
  export const WEAPON_COLUMNS = [
    'name',
    'weaponType',
    'damageAmount',
    'damageType',
    'meleeRanged',
    'handsRequired',
    'rarity'
  ];
  
  // Armor columns
  export const ARMOR_COLUMNS = [
    'name',
    'armorType',
    'armorRating',
    'tankModifier',
    'rarity'
  ];
  
  // Ammunition columns
  export const AMMUNITION_COLUMNS = [
    'name',
    'damageAmount',
    'damageType',
    'range',
    'rarity'
  ];
  
  // Potion columns
  export const POTION_COLUMNS = [
    'name',
    'effect',
    'duration',
    'rarity'
  ];
  
  // Scroll columns
  export const SCROLL_COLUMNS = [
    'name',
    'effect',
    'castingTime',
    'cooldown',
    'rarity'
  ];
  
  // Crafting component columns
  export const CRAFTING_COLUMNS = [
    'name',
    'effect',
    'rarity'
  ];
  
  // Trap columns
  export const TRAP_COLUMNS = [
    'name',
    'effect',
    'duration',
    'rarity'
  ];
  
  // Explosive columns
  export const EXPLOSIVE_COLUMNS = [
    'name',
    'damage',
    'damageType',
    'blastRadius',
    'rarity'
  ];
  
  // All columns by item type
  export const ITEM_TYPE_COLUMNS: ItemTypeColumns = {
    'Weapon': WEAPON_COLUMNS,
    'Armor': ARMOR_COLUMNS,
    'Ammunition': AMMUNITION_COLUMNS,
    'Potion': POTION_COLUMNS,
    'Scroll': SCROLL_COLUMNS,
    'Crafting Component': CRAFTING_COLUMNS,
    'Trap': TRAP_COLUMNS,
    'Explosive': EXPLOSIVE_COLUMNS,
    'Throwable': EXPLOSIVE_COLUMNS,
  };