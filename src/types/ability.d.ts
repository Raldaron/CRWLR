export interface Ability {
  id?: string;  // Make id optional
    name: string;
    description: string;
    effect: string;
    range: string;
    damage: string;
    damagetype: string;
    scaling: {
      [key: string]: string;
    };
    abilitypointcost: number;
    cooldown: string;
    specialrules?: Record<string, string>;
  }
  
  export interface AbilitiesData {
    abilities: {
      [key: string]: Ability;
    };
  }