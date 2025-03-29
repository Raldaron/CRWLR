// types/potion.ts

export interface PotionItem {
    id: string;
    name: string;
    description: string;
    itemType: 'Potion';
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
    effect: string;
    duration: string;
    range: string;
    statBonus: {
        [key: string]: number | string;
    };
    skillBonus: {
        [key: string]: number;
    };
    abilities: {
        [key: string]: boolean;
    } | {};
    hpBonus: number;
    mpBonus: number;
}