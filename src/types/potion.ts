export type PotionRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Epic' | 'Legendary' | 'Celestial';

export interface PotionItem {
    id: string;
    name: string;
    description: string;
    itemType: 'Potion' | 'Pharmaceutical'; // Allow both
    rarity: PotionRarity;
    effect: string;
    duration?: string; // Optional, sometimes missing
    range?: string; // Optional, sometimes 'Self' or missing
    healfor?: number | string; // Optional, from pharma CSV
    manaback?: number | string; // Optional, from pharma CSV
    sellValue?: number; // Changed sellvalue to sellValue
    buyValue?: number; // Changed buyvalue to buyValue
}