// types/scroll.ts

export interface ScrollScaling {
  [key: string]: string;
}

// types/scroll.ts

export interface ScrollItem {
  id: string;
  name: string;
  description: string;
  itemType: 'Scroll';
  rarity: string;  // This might be missing in some scrolls
  duration: string;  // This might be missing in some scrolls
  effect: string;
  range: string;
  damageAmount: string;
  damageType: string;
  castingTime: string;
  manaPointCost: string;
  cooldown: string;
  scaling: ScrollScaling;
  spellCastingModifier: string;
}