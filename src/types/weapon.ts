export type WeaponRarity = 'Ordinary' | 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Epic' | 'Legendary' | 'Unique' | 'Artifact'; // Added Artifact

export interface WeaponItem {
    id: string;
    name: string;
    description: string;
    itemType: 'Weapon';
    weaponType: string; // Changed to string to match CSV
    rarity: WeaponRarity;
    meleeRanged: 'Melee' | 'Ranged'; // Make this specific
    magicNonMagical: 'Magical' | 'Non-Magical';
    handsRequired: 'One-handed' | 'Two-handed' | 'One-handed (Versatile)' | 'Two-handed (Versatile)'; // Added versatile options
    damageType: string;
    damageAmount: string;
    statBonus: Record<string, number>; // Unified to statBonus based on CSV
    skillBonus: Record<string, number>; // Unified to skillBonus based on CSV JSON string format
    abilities: string[]; // Assuming JSON array "[]"
    traits: string[]; // Assuming JSON array "[]"
    spellsGranted: string[]; // Assuming JSON array "[]"
    hpBonus: number;
    mpBonus: number;
    sellValue: number; // Added from CSV
    buyValue: number; // Added from CSV
}