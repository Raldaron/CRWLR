// --- START OF FILE types/spell.ts ---

// ... other imports ...

export interface Spell {
  id: string;
  name: string;
  spelldescription?: string;
  effectdescription?: string;
  archetype?: string;
  school?: string;
  damage?: string;
  damageType?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  manaPointCost?: number;
  spellAttackStat?: string;
  spellSaveStat?: string; // Existing save stat
  spellDC?: number;
  requiresConcentration?: boolean;
  isRitual?: boolean;
  hasVerbalComponent?: boolean;
  hasSomaticComponent?: boolean;
  hasMaterialComponent?: boolean;
  materialComponentDescription?: string;
  scaling?: any; // Keep existing or define specific scaling type
  cooldown?: string;

  // --- ADD/MODIFY THESE FIELDS ---
  spellModifier?: string;       // Renamed from spellCastingModifier for consistency? Check your data source.
  spellCastingModifier?: string; // Or keep this if it's the actual field name
  savingThrow?: string;        // Add savingThrow if it exists
  keywords?: string[];         // Add keywords as an array of strings
  // --- END ADD/MODIFY ---

  // Add any other fields from your definition
}

// --- END OF FILE types/spell.ts ---