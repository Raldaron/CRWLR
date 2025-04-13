// types/scroll.ts

export interface ScrollScaling {
  [key: string]: string;
}

export interface ScrollItem {
  id: string;
  name: string;
  description?: string;
  itemType: 'Scroll';
  effect?: string;
  castingTime?: string;
  manaPointCost: string | number;
  range?: string;
  duration?: string;
  cooldown: string;
  spellCastingModifier?: string;
  damageAmount?: string;
  damageType?: string;
  scaling?: ScrollScaling;
  buyValue?: string | number;
  sellValue?: string | number;
  rarity?: string;
}