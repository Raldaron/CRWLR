export type CraftingComponentRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Epic' | 'Legendary' | 'Celestial'; // Added 'Very Rare', 'Celestial'

// The main interface that defines what a crafting component item looks like
export interface CraftingComponentItem {
    id: string;
    name: string;
    description: string;
    itemType: 'CraftingComponent'; // Updated to match CSV exactly
    rarity: CraftingComponentRarity;
    effect: string;
    // Added optional sell/buy values based on other CSVs, even if not present in crafting_components.csv
    sellValue?: number;
    buyValue?: number;
}