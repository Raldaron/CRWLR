// types/class.ts
export interface Class {
    name: string;
    description: string;
    archetype: string;
    primarystats: string[];
    statbonus: {
      [key: string]: number;
    };
    skillbonus: {
      [key: string]: number;
    };
    abilities: string[];
    traits: string[];
    armorrating: number;
  }