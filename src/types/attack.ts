// src/types/attack.ts
export interface Attack {
    id: string;
    name: string;
    weaponId: string;
    slot: 'primaryWeapon' | 'secondaryWeapon';
    damageAmount: string;
    damageType: string;
    description: string;
    weaponType: string;
    meleeRanged: 'Melee' | 'Ranged';
    handsRequired: string;
    range?: string;
    // Removed: apCost?: number;
    sourceItem?: string;
    abilities?: string[];
    traits?: string[];
    magicNonMagical?: 'Magical' | 'Non-Magical';
    statBonus?: Record<string, number>;
    skillBonus?: Record<string, number>;
    isCustom?: boolean;
  }
  
  // Optional utility functions that may be helpful
  export function calculateDamageForDisplay(damageAmount: string): string {
    // Format damage string for display (if needed)
    return damageAmount;
  }
  
  export function getWeaponDisplayName(slot: 'primaryWeapon' | 'secondaryWeapon'): string {
    return slot === 'primaryWeapon' ? 'Primary Weapon' : 'Secondary Weapon';
  }
  