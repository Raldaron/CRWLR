// types/spell.ts

export interface SpellScaling {
    [key: string]: string;
  }
  
  export interface Spell {
    name: string;
    description: string;
    effect: string;
    range: string;
    damage: string;
    damageType: string;
    castingTime: string;
    abilityPointCost: string;
    cooldown: string;
    spellCastingModifier: string;
    archetype: string;
    scaling: SpellScaling;
    id: string;
  }
  
  export interface SpellsData {
    spells: {
      [key: string]: Spell;
    };
  }