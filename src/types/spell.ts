// types/spell.ts

export interface Scaling {
  [key: string]: string;
}

// Base interface for items that grant spells
export interface SpellGrantingItem {
  id: string;
  name: string;
  // other item properties...
  spellsGranted?: string[]; // Names or IDs of spells granted
}

// Main Spell interface
export interface Spell {
  cooldown: any;
  id?: string; // Optional: Firestore document ID
  name: string;
  spelldescription?: string;
  archetype?: string;
  damage?: string; // Keep as string if it includes dice like "2d6"
  damageType?: string;
  manaPointCost?: number | string; // Can be number or "N/A"
  castingTime?: string;
  spellCastingModifier?: string; // Keep as string if it can be "Self" or "N/A"
  savingThrow?: string; // Keep as string if it can be "Self" or "N/A"
  keywords?: string[]; // Array of keywords or tags
  range?: string;
  duration?: string;
  radius?: string; // Keep as string if it can be "Self" or "N/A"
  effectdescription?: string;
  target?: string;
  spellsaveDCMod?: string; // Keep as string
  scaling?: Scaling;
  traits?: string[]; // Array of trait names or IDs
  abilities?: string[]; // Array of ability names or IDs granted/related
  createdAt?: any; // Firestore Timestamp or number
  updatedAt?: any; // Firestore Timestamp or number
}

// Corrected export for Scaling interface
export { type Scaling as SpellScaling }; // Exporting with an alias if needed, or just `export { Scaling };`

// Example function (if needed elsewhere)
// export function getSpellDamage(spell: Spell): string {
//     return spell.damage || "N/A";
// }