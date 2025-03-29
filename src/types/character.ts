// types/character.ts

export interface CharacterStats {
  strength: number;
  dexterity: number;
  stamina: number;
  intelligence: number;
  wit: number;
  perception: number;
  charisma: number;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  description: string;
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

export interface Race {
  name: string;
  description: string;
  statbonus: StatBonus;
  skillbonus: SkillBonus;
  abilities: string[];
  traits: string[];
  lore: string;
  armorrating: number;
}