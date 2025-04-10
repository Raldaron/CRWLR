export type AmmunitionRarity = 'Ordinary' | 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Very Rare'; // Added Very Rare

export interface AdditionalEffect {
  name: string;
  description: string;
}

export interface AmmunitionItem {
  id: string;
  name: string;
  description: string;
  itemType: 'Ammunition';
  rarity: AmmunitionRarity;
  effect: string;
  // Assuming additionaleffects is stored as a JSON string in the CSV and needs parsing
  additionaleffects?: string; // Store as string initially, parse when needed
  range?: string | number; // Can be number or string like "Self"
  damageAmount: string; // e.g., "2d6"
  damageType: string;
  blastRadius?: string | number; // Keep as optional based on CSV
  triggerMechanism?: string; // Added from CSV
  duration?: string; // Added from CSV
  abilities?: string[]; // CSV shows "[]", assuming string array if used
  sellValue?: number; // Changed sellvalue to sellValue
  buyValue?: number; // Changed buyvalue to buyValue
}