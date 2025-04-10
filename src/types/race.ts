export interface Race {
    name: string;
    description: string;
    statbonus: {
      [key: string]: number;
    };
    skillbonus: {
      [key: string]: number;
    };
    abilities: string[];
    traits: string[];
    lore: string;
    armorrating: number;
    hpbonus: number;
    mpbonus: number;
  }