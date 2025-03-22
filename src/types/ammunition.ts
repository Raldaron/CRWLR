// types/ammunition.ts

export interface AdditionalEffect {
    name: string;
    description: string;
  }
  
  export interface AmmunitionItem {
    id: string;
    name: string;
    description: string;
    itemType: 'Ammunition';
    rarity: 'Ordinary' | 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
    effect: string;
    additionaleffects?: AdditionalEffect[];
    range: number;
    damageAmount: string;
    damageType: string;
    radius?: number;
    triggerMechanism?: string;
    duration?: string;
    statBonus: {
      [key: string]: number;
    };
    skillBonus: {
      [key: string]: number;
    };
    abilities: string[];
  }