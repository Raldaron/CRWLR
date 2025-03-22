// types/armor.ts

export interface ArmorItem {
    name: string;
    description: string;
    itemType: 'Armor';
    armorType: string;
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Unique' | 'Heirloom' | 'Exceedingly Rare';
    armorRating: number;
    tankModifier: number;
    statBonus: {
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
    id: string; // Ensure this field is included
}
