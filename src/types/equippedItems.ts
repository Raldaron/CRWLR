import type { WeaponItem } from './weapon';
import type { ArmorItem } from './armor';

export interface EquippedItems {
  primaryWeapon: WeaponItem | null;
  secondaryWeapon: WeaponItem | null;
  head: ArmorItem | null;
  face0: ArmorItem | null;
  face1: ArmorItem | null;
  neck: ArmorItem | null;
  shoulders: ArmorItem | null;
  torso: ArmorItem | null;
  arm0: ArmorItem | null;
  arm1: ArmorItem | null;
  wrist0: ArmorItem | null;
  wrist1: ArmorItem | null;
  finger0: ArmorItem | null;
  finger1: ArmorItem | null;
  finger2: ArmorItem | null;
  finger3: ArmorItem | null;
  waist: ArmorItem | null;
  thighs: ArmorItem | null;
  knees: ArmorItem | null;
  shins: ArmorItem | null;
  ankle0: ArmorItem | null;
  ankle1: ArmorItem | null;
  feet: ArmorItem | null;
  toes0: ArmorItem | null;
  toes1: ArmorItem | null;
  toes2: ArmorItem | null;
  toes3: ArmorItem | null;
}