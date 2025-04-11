export interface AbilityData {
  id?: string;
  name: string;
  description: string;
  effect: string;
  range: string;
  damage: string;
  damageType: string; // <--- Ensure this is camelCase
  scaling: { [key: string]: string };
  abilitypointcost: number;
  cooldown: string;
  specialrules?: Record<string, string>;
}

// Keep Ability interface consistent if used elsewhere
export interface Ability {
  id?: string;
  name: string;
  description: string;
  effect: string;
  range: string;
  damage: string;
  damageType: string; // <--- Ensure this is camelCase
  scaling: { [key: string]: string };
  abilitypointcost: number;
  cooldown: string;
  specialrules?: { [key: string]: string };
}