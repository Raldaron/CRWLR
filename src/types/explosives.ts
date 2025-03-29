// types/explosives.ts

export interface ExplosiveItem {
    name: string;
    description: string;
    itemType: 'Explosive' | 'Throwable';
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Very Rare';
    effect: string;
    duration: string;
    damage: string;
    damageType: string;
    blastRadius: number | string;
    triggerMechanism: string;
    id: string;
}