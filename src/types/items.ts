// types/items.ts

// Base item that all other items will build from
export interface Item {
    id: string;
    name: string;
    description: string;
    rarity: string;
    itemType: string;
}

// Scroll specific item type
export interface ScrollItem extends Item {
    itemType: 'Scroll';
    castingTime: string;
    manaPointCost: string;
    cooldown: string;
    range: string;
    effect: string;
    damageAmount: string;
    damageType: string;
    spellCastingModifier: string;
    scaling: {
        [key: string]: string;
    };
}

// Weapon specific item type
export interface WeaponItem extends Item {
    itemType: 'Weapon';
    weaponType: string;
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
    hpBonus: number;
    mpBonus: number;
}