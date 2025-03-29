// types/weapon.ts

export interface WeaponItem {
    name: string;
    description: string;
    itemType: 'Weapon';
    weaponType: string;
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
    meleeRanged: 'Melee' | 'Ranged';
    magicNonMagical: 'Magical' | 'Non-Magical';
    handsRequired: 'One-handed' | 'Two-handed';
    damageType: string;
    damageAmount: string;
    vitalBonus: {
      [key: string]: number;
    };
    skillBonus: {
      [key: string]: number;
    };
    abilities: string[];
    traits: string[];
    spellsGranted: any;
    hpBonus: number;
    mpBonus: number;
    id: string; // Ensure this field is included
  }