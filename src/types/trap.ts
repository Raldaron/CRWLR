// types/trap.ts

export interface TrapItem {
    name: string;
    description: string;
    itemType: 'Trap';
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
    effect: string;
    duration: string;
    range: string;
    vitalbonus: {
      [key: string]: number;
    };
    skillBonus: {
      [key: string]: number;
    };
    abilities: string[];
    hpBonus: number;
    mpBonus: number;
    id: string;
}
