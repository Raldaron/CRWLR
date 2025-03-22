import { Item, ScrollItem, WeaponItem } from '../types/items';

export const getRarityScheme = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'common': return 'gray';
      case 'uncommon': return 'green';
      case 'rare': return 'blue';
      case 'epic': return 'purple';
      case 'legendary': return 'orange';
      default: return 'gray';
    }
  };
  
  export const isScrollItem = (item: Item): item is ScrollItem => {
    return 'effect' in item && 'castingTime' in item && 'spellCastingModifier' in item;
  };
  
  export const isWeaponItem = (item: Item): item is WeaponItem => {
    return 'weaponType' in item && 'meleeRanged' in item;
  };