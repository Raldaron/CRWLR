export type ArmorRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Epic' | 'Legendary' | 'Unique' | 'Heirloom' | 'Exceedingly Rare' | 'Artifact'; // Added Very Rare, Artifact, Heirloom

export interface ArmorItem {
    id: string; // Ensure this field is included
    name: string;
    description: string;
    itemType: 'Armor'; // Consistent itemType
    armorType: string; // e.g., head, shoulders, wrist
    rarity: ArmorRarity;
    armorRating: number;
    tankModifier: number;
    statBonus: Record<string, number>; // Using Record for flexibility based on CSV JSON string "{}" or "{"stat": val}"
    skillBonus: Record<string, number>; // Using Record for flexibility based on CSV JSON string "{}"
    abilities: string[]; // Assuming JSON array of strings "[]"
    traits: string[]; // Assuming JSON array of strings "[]"
    spellsGranted: string[]; // Assuming JSON array of strings "[]"
    hpBonus: number;
    mpBonus: number;
    sellValue: number; // Added from CSV
    buyValue: number; // Added from CSV
}