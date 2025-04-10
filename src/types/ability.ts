export interface AbilityData {
  id?: string;
  name: string;
  description: string;
  effect: string;
  range: string;         // Keep this required for consistency
  damage: string;
  damagetype: string;
  scaling: { [key: string]: string };
  abilitypointcost: number;
  cooldown: string;
  specialrules?: Record<string, string>;
}

export interface Ability {
  id?: string;
  name: string;
  description: string;
  effect: string;
  range: string;
  damage: string;
  damagetype: string;
  scaling: { [key: string]: string };
  abilitypointcost: number;
  cooldown: string;
  specialrules?: { [key: string]: string };
}