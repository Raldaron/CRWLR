export type TrapRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Epic' | 'Legendary'; // Added Very Rare

export interface AdditionalEffect {
  name: string;
  description: string;
}

export interface TrapItem {
    range: any;
    id: string;
    name: string;
    description: string;
    itemType: 'Trap'; // Consistent itemType
    rarity: TrapRarity;
    effect: string;
    duration: string; // Duration seems present
    operation?: string; // Added from CSV
    damage?: string; // Optional, e.g., "3d10"
    damageType?: string; // Optional
    triggerMechanism?: string;
    blastRadius?: string; // Added from CSV (e.g., empty or '10 ft radius')
    // Assuming additionaleffects is stored as a JSON string in the CSV and needs parsing
    additionaleffects?: string; // Optional, might need parsing
    sellValue?: number; // Changed sellvalue to sellValue
    buyValue?: number; // Changed buyvalue to buyValue
    // Removed range as it wasn't in traps.csv, but blastradius is
}