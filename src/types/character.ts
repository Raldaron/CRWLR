export interface CharacterStats {
  strength: number;
  dexterity: number;
  stamina: number;
  intelligence: number;
  wit: number;
  perception: number;
  charisma: number;
}

// Updated Skill interface to include attribute
export interface Skill {
  name: string; // Keep name as primary identifier if used as keys
  attribute: keyof CharacterStats; // Link to a specific stat
  level: number; // Current allocated points
  // Description removed as it's not used in context logic, keep if needed elsewhere
}


export interface Trait {
  id: string;
  name: string;
  description: string;
  effect: string;
}

export interface StatBonus {
  [key: string]: number;
}

export interface SkillBonus {
  [key: string]: number;
}

// Race interface remains the same conceptually, but ensure `statbonus` keys match CharacterStats keys
export interface Race {
  name: string;
  description: string;
  statbonus: Partial<Record<keyof CharacterStats, number>>; // Use partial record for clarity
  skillbonus: SkillBonus;
  abilities: string[];
  traits: string[];
  lore: string;
  armorrating: number; // Keep armorrating if it's used
  hpbonus?: number; // Added for consistency
  mpbonus?: number; // Added for consistency
}