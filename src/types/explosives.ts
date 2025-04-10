export type ExplosiveRarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Epic' | 'Legendary'; // Added Very Rare

export interface AdditionalEffect {
    name: string;
    description: string;
}

export interface ExplosiveItem {
    id: string;
    name: string;
    description: string;
    itemType: 'Explosive' | 'Throwable'; // Allow both based on CSV examples
    rarity: ExplosiveRarity;
    effect: string;
    duration?: string; // Optional
    damage?: string; // e.g., "10d6", "N/A"
    damageType?: string;
    blastRadius?: string | number; // Renamed from blastradius
    triggerMechanism?: string;
    // Assuming additionaleffects is stored as a JSON string in the CSV and needs parsing
    additionalEffects?: string; // Store as string initially, parse when needed
    range?: string | number; // Optional range
    sellValue?: number; // Changed sellvalue to sellValue
    buyValue?: number; // Changed buyvalue to buyValue
    uniqueAbilities?: string; // Assuming JSON object string "{}"
    // Removed 'radius' if 'blastRadius' is the intended field based on CSV
}