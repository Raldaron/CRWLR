// types/craftingcomponent.ts

// Define possible rarities for crafting components
export type CraftingComponentRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Very Rare';

// The main interface that defines what a crafting component item looks like
export interface CraftingComponentItem {
    id: string;
    name: string;
    description: string;
    itemType: 'Crafting Component';
    rarity: CraftingComponentRarity;
    effect: string;
    duration: string;
    range: string;
}

// Interface for tracking components in inventory with quantity
export interface InventoryCraftingComponent {
    component: CraftingComponentItem;
    quantity: number;
}