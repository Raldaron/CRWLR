export interface ScrollScaling {
  [key: string]: string;
}

// Interface for Scroll Item type based on observation (no CSV provided)
export interface ScrollItem {
  id: string;
  name: string;
  description: string;
  itemType: 'Scroll'; // Assuming this itemType
  rarity: string; // Assuming string, adjust if needed
  effect: string;
  duration: string;
  range: string;
  damageAmount?: string; // Optional damage
  damageType?: string; // Optional damage type
  castingTime: string;
  manaPointCost: string;
  cooldown: string;
  scaling?: ScrollScaling; // Made optional
  spellCastingModifier: string;
  sellValue?: number; // Added optional value fields
  buyValue?: number;
}