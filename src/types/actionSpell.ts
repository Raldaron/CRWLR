// types/actionSpell.ts
import type { Spell } from './spell';

// ActionSpell extends Spell with source information and level
export interface ActionSpell extends Spell {
  source: 'class' | 'race' | 'item' | 'scroll' | 'learned';
  level?: number;
  sourceItem?: string; // Name of item that grants this spell
}