'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { CharacterStats, Race } from '@/types/character';
import type { Class } from '@/types/class';
import type { WeaponItem } from '@/types/weapon';
import type { ArmorItem } from '@/types/armor';
import type { InventoryItem } from '@/types/inventory';
import type { Spell } from '@/types/spell';
import { Attack } from '@/components/ItemCards/AttackCard';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { useToast } from '@chakra-ui/react';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

// -------------------------------------------------------------------------
// Type: UtilitySlot
// -------------------------------------------------------------------------
// Utility Slot Type Definitions
interface UtilitySlot {
  id: string;
  name: string;
  stack: {
    item: InventoryItem;
    quantity: number;
  } | null;
}

// Utility Slot Interface (keep this outside)
interface UtilitySlot {
  id: string;
  name: string;
  stack: {
    item: InventoryItem;
    quantity: number;
  } | null;
}

// -------------------------------------------------------------------------
// Equipment Features Manager Class
// -------------------------------------------------------------------------
class FeatureManager {
  private abilities: Set<string> = new Set();
  private traits: Set<string> = new Set();
  private equippedItems: { [slot: string]: WeaponItem | ArmorItem | null } = {};

  equipItem(slot: string, item: WeaponItem | ArmorItem | null) {
    // If we have an existing item in this slot, remove its features
    if (this.equippedItems[slot]) {
      this.removeFeatures(this.equippedItems[slot]);
    }

    // Store the new item
    this.equippedItems[slot] = item;

    // If we have a new item, add its features
    if (item) {
      this.addFeatures(item);
    }
  }

  private addFeatures(item: WeaponItem | ArmorItem) {
    // Add abilities if the item has them
    if (item.abilities && Array.isArray(item.abilities)) {
      item.abilities.forEach((ability: string) => {
        this.abilities.add(ability);
      });
    }

    // Add traits if the item has them
    if (item.traits && Array.isArray(item.traits)) {
      item.traits.forEach((trait: string) => {
        this.traits.add(trait);
      });
    }
  }

  private removeFeatures(item: WeaponItem | ArmorItem | null) {
    if (!item) return;

    // Remove abilities if the item has them
    if (item.abilities && Array.isArray(item.abilities)) {
      item.abilities.forEach((ability: string) => {
        this.abilities.delete(ability);
      });
    }

    // Remove traits if the item has them
    if (item.traits && Array.isArray(item.traits)) {
      item.traits.forEach((trait: string) => {
        this.traits.delete(trait);
      });
    }
  }

  getAbilities(): string[] {
    return Array.from(this.abilities);
  }

  getTraits(): string[] {
    return Array.from(this.traits);
  }

  hasAbility(ability: string): boolean {
    return this.abilities.has(ability);
  }

  hasTrait(trait: string): boolean {
    return this.traits.has(trait);
  }

  reset() {
    this.abilities.clear();
    this.traits.clear();
    this.equippedItems = {};
  }
}

// Updated code for EquipmentBonusManager class
class EquipmentBonusManager {
  private statBonuses: { [key: string]: number } = {};
  private skillBonuses: { [key: string]: number } = {};
  private equippedItems: { [slot: string]: WeaponItem | ArmorItem | null } = {};

  equipItem(slot: string, item: WeaponItem | ArmorItem | null) {
    // First remove any existing item in that slot
    if (this.equippedItems[slot]) {
      this.removeItemBonuses(this.equippedItems[slot]);
    }

    // Store the new item
    this.equippedItems[slot] = item;

    // Add the new item's bonuses if an item was provided
    if (item) {
      this.addItemBonuses(item);
    }
  }

  // Remove an item and its bonuses
  unequipItem(slot: string) {
    const item = this.equippedItems[slot];
    if (item) {
      this.removeItemBonuses(item);
      delete this.equippedItems[slot];
    }
  }

  // Add bonuses from an item (private method)
  private addItemBonuses(item: WeaponItem | ArmorItem) {
    // Handle stat bonuses for weapons
    if ('vitalBonus' in item && item.vitalBonus) {
      Object.entries(item.vitalBonus).forEach(([stat, bonus]) => {
        this.statBonuses[stat] = (this.statBonuses[stat] || 0) + Number(bonus);
      });
    }

    // Handle stat bonuses for armor
    if ('statBonus' in item && item.statBonus) {
      Object.entries(item.statBonus).forEach(([stat, bonus]) => {
        this.statBonuses[stat] = (this.statBonuses[stat] || 0) + Number(bonus);
      });
    }

    // Handle skill bonuses
    if ('skillBonus' in item && item.skillBonus) {
      Object.entries(item.skillBonus).forEach(([skill, bonus]) => {
        this.skillBonuses[skill] = (this.skillBonuses[skill] || 0) + Number(bonus);
      });
    }
  }

  // Remove bonuses from an item (private method)
  private removeItemBonuses(item: WeaponItem | ArmorItem | null) {
    if (!item) return;

    // Remove stat bonuses for weapons
    if ('vitalBonus' in item && item.vitalBonus) {
      Object.entries(item.vitalBonus).forEach(([stat, bonus]) => {
        this.statBonuses[stat] = (this.statBonuses[stat] || 0) - Number(bonus);
        if (this.statBonuses[stat] === 0) {
          delete this.statBonuses[stat];
        }
      });
    }

    // Remove stat bonuses for armor
    if ('statBonus' in item && item.statBonus) {
      Object.entries(item.statBonus).forEach(([stat, bonus]) => {
        this.statBonuses[stat] = (this.statBonuses[stat] || 0) - Number(bonus);
        if (this.statBonuses[stat] === 0) {
          delete this.statBonuses[stat];
        }
      });
    }

    // Remove skill bonuses
    if ('skillBonus' in item && item.skillBonus) {
      Object.entries(item.skillBonus).forEach(([skill, bonus]) => {
        this.skillBonuses[skill] = (this.skillBonuses[skill] || 0) - Number(bonus);
        if (this.skillBonuses[skill] === 0) {
          delete this.skillBonuses[skill];
        }
      });
    }
  }

  // Get all stat bonuses as a new object
  getStatBonuses(): { [key: string]: number } {
    return { ...this.statBonuses };
  }

  // Get all skill bonuses as a new object
  getSkillBonuses(): { [key: string]: number } {
    return { ...this.skillBonuses };
  }

  // Get a specific stat bonus
  getStatBonus(stat: string): number {
    return this.statBonuses[stat] || 0;  // Return 0 if the stat has no bonus
  }

  // Get a specific skill bonus
  getSkillBonus(skill: string): number {
    return this.skillBonuses[skill] || 0;  // Return 0 if the skill has no bonus
  }

  // Reset all bonuses and equipped items to 0
  reset() {
    this.statBonuses = {};  // Clear stat bonuses
    this.skillBonuses = {};  // Clear skill bonuses
    this.equippedItems = {};  // Clear equipped items
  }
}

// -------------------------------------------------------------------------
// Types & Default Values
// -------------------------------------------------------------------------
interface InventoryItemWithQuantity {
  item: InventoryItem;
  quantity: number;
}

interface EquippedItems {
  // Weapon slots
  primaryWeapon: WeaponItem | null;
  secondaryWeapon: WeaponItem | null;

  // Head region
  head: ArmorItem | null;
  face0: ArmorItem | null;
  face1: ArmorItem | null;
  neck: ArmorItem | null;

  // Upper body
  shoulders: ArmorItem | null;
  torso: ArmorItem | null;

  // Arms
  arm0: ArmorItem | null;
  arm1: ArmorItem | null;
  wrist0: ArmorItem | null;
  wrist1: ArmorItem | null;

  // Hands and fingers
  finger0: ArmorItem | null;
  finger1: ArmorItem | null;
  finger2: ArmorItem | null;
  finger3: ArmorItem | null;

  // Lower body
  waist: ArmorItem | null;
  legs: ArmorItem | null;
  thighs: ArmorItem | null;
  knees: ArmorItem | null;
  shins: ArmorItem | null;

  // Feet
  ankle0: ArmorItem | null;
  ankle1: ArmorItem | null;
  feet: ArmorItem | null;
  toes0: ArmorItem | null;
  toes1: ArmorItem | null;
  toes2: ArmorItem | null;
  toes3: ArmorItem | null;
}

interface AbilityLevels {
  [key: string]: number;
}

interface CharacterSkills {
  [key: string]: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  lastEdited: number; // timestamp
}

interface NoteCategory {
  id: string;
  name: string;
  notes: Note[];
}

type NotesState = NoteCategory[];

// -------------------------------------------------------------------------
// Consolidated Character State Interface
// -------------------------------------------------------------------------
interface CharacterState {
  baseStats: CharacterStats;
  selectedRace: Race | null;
  selectedClass: Class | null;
  abilityLevels: AbilityLevels;
  inventory: InventoryItemWithQuantity[];
  equippedItems: EquippedItems;
  learnedSpells: Spell[];
  characterName: string;
  currentHp: number;
  currentMp: number;
  currentAp: number;
  characterLevel: number;
  baseSkills: CharacterSkills;
  utilitySlots: UtilitySlot[];
  availableStatPoints: number;
  availableSkillPoints: number;
  lastUpdated: number;
  notes: NotesState;
}

const defaultStats: CharacterStats = {
  strength: 0,
  dexterity: 0,
  stamina: 0,
  intelligence: 0,
  perception: 0,
  wit: 0,
  charisma: 0,
};

const defaultEquippedItems: EquippedItems = {
  primaryWeapon: null,
  secondaryWeapon: null,
  head: null,
  face0: null,
  face1: null,
  neck: null,
  shoulders: null,
  torso: null,
  arm0: null,
  arm1: null,
  wrist0: null,
  wrist1: null,
  finger0: null,
  finger1: null,
  finger2: null,
  finger3: null,
  waist: null,
  legs: null,
  thighs: null,
  knees: null,
  shins: null,
  ankle0: null,
  ankle1: null,
  feet: null,
  toes0: null,
  toes1: null,
  toes2: null,
  toes3: null,
};

const defaultNotes: NotesState = [
  {
    id: 'general-' + Date.now(),
    name: 'General',
    notes: [
      {
        id: 'welcome-' + Date.now(),
        title: 'Welcome to Notes',
        content: 'Use this tab to keep track of important information during your adventures. You can create different categories to organize your notes!',
        lastEdited: Date.now()
      }
    ]
  },
  {
    id: 'quests-' + Date.now(),
    name: 'Quests',
    notes: []
  },
  {
    id: 'npcs-' + Date.now(),
    name: 'NPCs',
    notes: []
  }
];

const defaultUtilitySlots: UtilitySlot[] = Array.from({ length: 10 }, (_, i) => ({
  id: `utility${i}`,
  name: `Utility Slot ${i + 1}`,
  stack: null,
}));

// -------------------------------------------------------------------------
// Context Interface (exposing both consolidated state & derived values)
// -------------------------------------------------------------------------
export interface CharacterContextType {
  baseStats: CharacterStats;
  currentStats: CharacterStats;
  setBaseStats: (stats: CharacterStats) => void;
  selectedRace: Race | null;
  setSelectedRace: (race: Race | null) => void;
  selectedClass: Class | null;
  setSelectedClass: (cls: Class | null) => void;
  abilityLevels: AbilityLevels;
  setAbilityLevel: (abilityName: string, level: number) => void;
  inventory: InventoryItemWithQuantity[];
  addToInventory: (item: InventoryItem) => void;
  removeFromInventory: (itemId: string) => void;
  updateInventoryItemQuantity: (itemId: string, quantity: number) => void;
  getInventoryByType: (itemType: string) => InventoryItemWithQuantity[];
  getItemQuantity: (itemId: string) => number;
  hasItem: (itemId: string) => boolean;
  equippedItems: EquippedItems;
  equipItem: (slot: keyof EquippedItems, item: InventoryItem | null) => void;
  getEquippedItem: (slot: keyof EquippedItems) => WeaponItem | ArmorItem | null;
  equipMultipleItems: (equipmentUpdates: Partial<Record<keyof EquippedItems, InventoryItem | null>>) => void;
  getStatBonus: (stat: string) => number;
  getSkillBonus: (skill: string) => number;
  getEquipmentAbilities: () => string[];
  getEquipmentTraits: () => string[];
  hasAbility: (ability: string) => boolean;
  hasTrait: (trait: string) => boolean;
  resetCharacter: () => void;
  deleteCharacter: () => Promise<void>;
  currentSkills: CharacterSkills;
  baseSkills: CharacterSkills;
  spellList: Spell[];
  learnedSpells: Spell[];
  addToLearnedSpells: (spell: Spell) => void;
  characterLevel: number;
  setCharacterLevel: (level: number) => void;
  getMaxHp: () => number;
  getMaxMp: () => number;
  getMaxAp: () => number;
  availableStatPoints: number;
  incrementStat: (stat: keyof CharacterStats) => void;
  decrementStat: (stat: keyof CharacterStats) => void;
  availableSkillPoints: number;
  increaseSkill: (skillName: string) => void;
  decreaseSkill: (skillName: string) => void;
  attacks: Attack[];
  getAttacksFromEquipment: () => Attack[];
  executeAttack: (attackId: string) => void;
  characterName: string;
  setCharacterName: (name: string) => void;
  currentHp: number;
  setCurrentHp: (hp: number) => void;
  currentMp: number;
  setCurrentMp: (mp: number) => void;
  currentAp: number;
  setCurrentAp: (ap: number) => void;
  utilitySlots: UtilitySlot[];
  setUtilitySlots: (slots: UtilitySlot[]) => void;
  addItemToUtilitySlot: (slotId: string, item: InventoryItem, quantity: number) => void;
  removeItemFromUtilitySlot: (slotId: string) => void;
  updateUtilitySlotQuantity: (slotId: string, quantityChange: number) => void;
  isDirty: boolean;
  isSaving: boolean;
  saveCharacterManually: () => Promise<void>;
  lastSaveTime: number;
  notes: NotesState;
  updateNotes: (notes: NotesState) => void;
  addNoteCategory: (category: NoteCategory) => void;
  updateNoteCategory: (categoryId: string, updates: Partial<NoteCategory>) => void;
  deleteNoteCategory: (categoryId: string) => void;
  addNote: (categoryId: string, note: Note) => void;
  updateNote: (categoryId: string, noteId: string, updates: Partial<Note>) => void;
  deleteNote: (categoryId: string, noteId: string) => void;
}

// Create the context
const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

// -------------------------------------------------------------------------
// CharacterProvider Component
// -------------------------------------------------------------------------

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCharacterId = searchParams?.get('characterId') || null;

  // Local storage utilities
  const LOCAL_STORAGE_KEY = 'dcw-character-state';

  const saveToLocalStorage = (characterData: any) => {
    if (typeof window === 'undefined') return;
    try {
      const dataToSave = {
        ...characterData,
        localSaveTime: Date.now()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  };

  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!savedData) return null;
      return JSON.parse(savedData);
    } catch (error) {
      console.error('Error loading from local storage:', error);
      return null;
    }
  };

  // New state variables for save tracking
  const [pendingSave, setPendingSave] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track which parts of the character state have changed
  interface DirtyFields {
    inventory: boolean;
    equippedItems: boolean;
    baseStats: boolean;
    race: boolean;
    class: boolean;
    abilities: boolean;
    spells: boolean;
    characterInfo: boolean; // name, level, HP, MP, AP
    skills: boolean;
    utilitySlots: boolean;
  }

  const [dirtyFields, setDirtyFields] = useState<DirtyFields>({
    inventory: false,
    equippedItems: false,
    baseStats: false,
    race: false,
    class: false,
    abilities: false,
    spells: false,
    characterInfo: false,
    skills: false,
    utilitySlots: false
  });

  const defaultNotes: NotesState = [
    {
      id: 'general-' + Date.now(),
      name: 'General',
      notes: [
        {
          id: 'welcome-' + Date.now(),
          title: 'Welcome to Notes',
          content: 'Use this tab to keep track of important information during your adventures. You can create different categories to organize your notes!',
          lastEdited: Date.now()
        }
      ]
    },
    {
      id: 'quests-' + Date.now(),
      name: 'Quests',
      notes: []
    },
    {
      id: 'npcs-' + Date.now(),
      name: 'NPCs',
      notes: []
    }
  ];

  // Consolidated character state
  const [characterState, setCharacterState] = useState<CharacterState>({
    baseStats: defaultStats,
    selectedRace: null,
    selectedClass: null,
    abilityLevels: {},
    inventory: [],
    equippedItems: defaultEquippedItems,
    learnedSpells: [],
    characterName: '',
    currentHp: 8,
    currentMp: 5,
    currentAp: 2,
    characterLevel: 1,
    baseSkills: {},
    utilitySlots: defaultUtilitySlots,
    availableStatPoints: 7,
    availableSkillPoints: 16,
    lastUpdated: Date.now(),
    notes: defaultNotes,
  });

  // Other non-persistent states
  const [loaded, setLoaded] = useState(false);
  const [docId, setDocId] = useState<string | null>(initialCharacterId);
  const [previousLevel, setPreviousLevel] = useState<number>(characterState.characterLevel);
  const [attacks, setAttacks] = useState<Attack[]>([]);

  // Equipment managers
  const [featureManager] = useState(() => new FeatureManager());
  const [equipmentBonuses] = useState(() => new EquipmentBonusManager());

  // Updater function for the consolidated state
  const updateCharacterState = (updates: Partial<CharacterState>) => {
    const newDirtyFields = { ...dirtyFields };
    if (updates.inventory) newDirtyFields.inventory = true;
    if (updates.equippedItems) newDirtyFields.equippedItems = true;
    if (updates.baseStats) newDirtyFields.baseStats = true;
    if (updates.selectedRace) newDirtyFields.race = true;
    if (updates.selectedClass) newDirtyFields.class = true;
    if (updates.abilityLevels) newDirtyFields.abilities = true;
    if (updates.learnedSpells) newDirtyFields.spells = true;
    if (
      updates.characterName ||
      updates.characterLevel ||
      updates.currentHp ||
      updates.currentMp ||
      updates.currentAp ||
      updates.availableStatPoints ||
      updates.availableSkillPoints
    ) {
      newDirtyFields.characterInfo = true;
    }
    if (updates.baseSkills) newDirtyFields.skills = true;
    if (updates.utilitySlots) newDirtyFields.utilitySlots = true;

    setDirtyFields(newDirtyFields);
    setIsDirty(true);

    setCharacterState((prev) => ({
      ...prev,
      ...updates,
      lastUpdated: Date.now(),
    }));
  };


  // -----------------------------------------------------------------------
  // Derived Values (currentStats and currentSkills) computed via memoization
  // -----------------------------------------------------------------------
  const currentStats = useMemo(() => {
    let stats = { ...characterState.baseStats };
    if (characterState.selectedRace) {
      Object.entries(characterState.selectedRace.statbonus).forEach(([stat, bonus]) => {
        if (stat in stats) {
          stats[stat as keyof CharacterStats] += bonus;
        }
      });
    }
    if (characterState.selectedClass) {
      Object.entries(characterState.selectedClass.statbonus).forEach(([stat, bonus]) => {
        if (stat in stats) {
          stats[stat as keyof CharacterStats] += bonus;
        }
      });
    }
    const eqStatBonuses = equipmentBonuses.getStatBonuses();
    Object.entries(eqStatBonuses).forEach(([stat, bonus]) => {
      if (stat in stats) {
        stats[stat as keyof CharacterStats] += bonus;
      }
    });
    return stats;
  }, [
    characterState.baseStats,
    characterState.selectedRace,
    characterState.selectedClass,
    characterState.equippedItems,
    equipmentBonuses,
  ]);

  const currentSkills = useMemo(() => {
    let skills = { ...characterState.baseSkills };
    if (characterState.selectedRace) {
      Object.entries(characterState.selectedRace.skillbonus).forEach(([skill, bonus]) => {
        skills[skill] = (skills[skill] || 0) + bonus;
      });
    }
    if (characterState.selectedClass) {
      Object.entries(characterState.selectedClass.skillbonus).forEach(([skill, bonus]) => {
        skills[skill] = (skills[skill] || 0) + bonus;
      });
    }
    const eqSkillBonuses = equipmentBonuses.getSkillBonuses();
    Object.entries(eqSkillBonuses).forEach(([skill, bonus]) => {
      skills[skill] = (skills[skill] || 0) + bonus;
    });
    return skills;
  }, [
    characterState.baseSkills,
    characterState.selectedRace,
    characterState.selectedClass,
    characterState.equippedItems,
    equipmentBonuses,
  ]);

  // -----------------------------------------------------------------------
  // Derived Getters
  // -----------------------------------------------------------------------
  const getMaxHp = () => 8 * currentStats.stamina + characterState.characterLevel;
  const getMaxMp = () => 5 * currentStats.intelligence + characterState.characterLevel;
  const getMaxAp = () => characterState.characterLevel * 2;

  // -----------------------------------------------------------------------
  // Save Function (extracted so that it can be debounced)
  // -----------------------------------------------------------------------
  const saveCharacterData = async () => {
    if (!loaded || !currentUser) return false;
    try {
      setIsSaving(true);
      const updates: Record<string, any> = {
        userId: currentUser.uid,
        lastUpdated: Date.now(),
      };

      if (dirtyFields.inventory) {
        updates.inventory = characterState.inventory;
      }
      if (dirtyFields.equippedItems) {
        updates.equippedItems = characterState.equippedItems;
      }
      if (dirtyFields.baseStats) {
        updates.baseStats = characterState.baseStats;
      }
      if (dirtyFields.race) {
        updates.selectedRace = characterState.selectedRace;
      }
      if (dirtyFields.class) {
        updates.selectedClass = characterState.selectedClass;
      }
      if (dirtyFields.abilities) {
        updates.abilityLevels = characterState.abilityLevels;
      }
      if (dirtyFields.spells) {
        updates.learnedSpells = characterState.learnedSpells;
      }
      if (dirtyFields.characterInfo) {
        updates.characterName = characterState.characterName;
        updates.characterLevel = characterState.characterLevel;
        updates.currentHp = characterState.currentHp;
        updates.currentMp = characterState.currentMp;
        updates.currentAp = characterState.currentAp;
        updates.availableStatPoints = characterState.availableStatPoints;
        updates.availableSkillPoints = characterState.availableSkillPoints;
      }
      if (dirtyFields.skills) {
        updates.baseSkills = characterState.baseSkills;
      }
      if (dirtyFields.utilitySlots) {
        updates.utilitySlots = characterState.utilitySlots;
      }

      // If only the default keys exist, no real changes have been made.
      if (Object.keys(updates).length <= 2) {
        console.log('No changes to save');
        setIsSaving(false);
        return true;
      }

      const isNewCharacterMode = searchParams?.get('new') === 'true';
      if (isNewCharacterMode) {
        const newDocRef = await addDoc(collection(db, 'characters'), {
          ...characterState,
          ...updates,
          lastUpdated: new Date().getTime(),
        });
        setDocId(newDocRef.id);
        router.replace(`/game?characterId=${newDocRef.id}`);
        console.log('Created new character with ID:', newDocRef.id);
      } else {
        const currentDocId = docId || currentUser.uid;
        if (!docId) setDocId(currentUser.uid);
        await setDoc(doc(db, 'characters', currentDocId), updates, { merge: true });
        console.log(`Saved character in document: ${currentDocId}`);
      }

      // Reset dirty flags after successful save
      setDirtyFields({
        inventory: false,
        equippedItems: false,
        baseStats: false,
        race: false,
        class: false,
        abilities: false,
        spells: false,
        characterInfo: false,
        skills: false,
        utilitySlots: false,
      });
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Error saving character data:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };


  // -----------------------------------------------------------------------
  // Debounced Save Function
  // -----------------------------------------------------------------------
  const SAVE_DELAY = 5000; // 5 seconds between saves
  const debouncedSaveCharacter = useCallback(() => {
    // Only save if there are changes
    if (!isDirty) return;

    const currentTime = Date.now();
    if (pendingSave) return;

    const timeSinceLastSave = currentTime - lastSaveTime;
    if (timeSinceLastSave < SAVE_DELAY) {
      setPendingSave(true);
      setTimeout(() => {
        saveCharacterData().then(() => {
          setPendingSave(false);
          setLastSaveTime(Date.now());
        });
      }, SAVE_DELAY - timeSinceLastSave);
    } else {
      // Save immediately if enough time has elapsed
      saveCharacterData().then(() => {
        setLastSaveTime(currentTime);
      });
    }
  }, [pendingSave, lastSaveTime, isDirty, currentUser, loaded, dirtyFields]);

  const toast = useToast();
  const saveCharacterManually = async () => {
    if (!currentUser || !loaded) return;
    try {
      setIsSaving(true);
      await saveCharacterData();
      setLastSaveTime(Date.now());

      // Show success message using Chakra UI toast
      toast({
        title: 'Character Saved',
        description: 'Your character data has been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving character:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save your character. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };


  // -----------------------------------------------------------------------
  // Load Character Data Effect: Loads character data based on URL parameters
  // -----------------------------------------------------------------------
  useEffect(() => {
    const loadCharacterData = async () => {
      if (!currentUser) return;

      try {
        // First check if we have a specified character ID or a flag for a new character
        const characterId = searchParams?.get('characterId');
        const isNewCharacter = searchParams?.get('new') === 'true';

        // If it's a new character or we have no ID, use default state
        if (isNewCharacter) {
          resetCharacter();
          setDocId(null);
          setLoaded(true);
          return;
        }

        // Try to load from Firestore if we have a specific ID
        if (characterId) {
          const characterDoc = await getDoc(doc(db, 'characters', characterId));

          if (characterDoc.exists()) {
            // Set the document ID for future saves
            setDocId(characterId);

            // Get the data from Firestore
            const data = characterDoc.data();

            // Make sure this character belongs to this user
            if (data.userId !== currentUser.uid) {
              console.error("Tried to load character belonging to another user");
              resetCharacter();
              router.push('/character-manager');
              return;
            }

            // Update our state with the loaded data
            setCharacterState({
              baseStats: data.baseStats || defaultStats,
              selectedRace: data.selectedRace || null,
              selectedClass: data.selectedClass || null,
              abilityLevels: data.abilityLevels || {},
              inventory: data.inventory || [],
              equippedItems: data.equippedItems || defaultEquippedItems,
              learnedSpells: data.learnedSpells || [],
              characterName: data.characterName || '',
              currentHp: data.currentHp || 8,
              currentMp: data.currentMp || 5,
              currentAp: data.currentAp || 2,
              characterLevel: data.characterLevel || 1,
              baseSkills: data.baseSkills || {},
              utilitySlots: data.utilitySlots || defaultUtilitySlots,
              availableStatPoints: data.availableStatPoints || 1,
              availableSkillPoints: data.availableSkillPoints || 10,
              lastUpdated: data.lastUpdated || Date.now(),
              notes: data.notes || defaultNotes,
            });

            // Initialize equipment managers
            if (data.equippedItems) {
              Object.entries(data.equippedItems).forEach(([slot, item]) => {
                if (item) {
                  featureManager.equipItem(slot, item as WeaponItem | ArmorItem);
                  equipmentBonuses.equipItem(slot, item as WeaponItem | ArmorItem);
                }
              });
            }

            console.log(`Loaded character: ${data.characterName || 'Unnamed Character'}`);
          } else {
            console.log('No character document found with ID:', characterId);
            resetCharacter();
          }
        } else {
          // If we don't have a specific ID, fall back to the user's default character
          const characterDoc = await getDoc(doc(db, 'characters', currentUser.uid));

          if (characterDoc.exists()) {
            setDocId(currentUser.uid);
            const data = characterDoc.data();

            setCharacterState({
              baseStats: data.baseStats || defaultStats,
              selectedRace: data.selectedRace || null,
              selectedClass: data.selectedClass || null,
              abilityLevels: data.abilityLevels || {},
              inventory: data.inventory || [],
              equippedItems: data.equippedItems || defaultEquippedItems,
              learnedSpells: data.learnedSpells || [],
              characterName: data.characterName || '',
              currentHp: data.currentHp || 8,
              currentMp: data.currentMp || 5,
              currentAp: data.currentAp || 2,
              characterLevel: data.characterLevel || 1,
              baseSkills: data.baseSkills || {},
              utilitySlots: data.utilitySlots || defaultUtilitySlots,
              availableStatPoints: data.availableStatPoints || 1,
              availableSkillPoints: data.availableSkillPoints || 10,
              lastUpdated: data.lastUpdated || Date.now(),
              notes: data.notes || defaultNotes,
            });

            // Initialize equipment managers
            if (data.equippedItems) {
              Object.entries(data.equippedItems).forEach(([slot, item]) => {
                if (item) {
                  featureManager.equipItem(slot, item as WeaponItem | ArmorItem);
                  equipmentBonuses.equipItem(slot, item as WeaponItem | ArmorItem);
                }
              });
            }
          } else {
            // No character exists, use default state
            resetCharacter();
          }
        }
      } catch (error) {
        console.error('Error loading character data:', error);
        resetCharacter();
      } finally {
        setLoaded(true);
      }
    };

    loadCharacterData();
  }, [currentUser, searchParams, router]);

  // -----------------------------------------------------------------------
  // Load Character Data using docId if available
  // -----------------------------------------------------------------------
  useEffect(() => {
    const loadCharacterById = async () => {
      if (!currentUser) return;
      if (!docId) {
        resetCharacter();
        setLoaded(true);
        return;
      }
      try {
        const characterDoc = await getDoc(doc(db, 'characters', docId));
        if (characterDoc.exists()) {
          const data = characterDoc.data();
          updateCharacterState({
            inventory: data.inventory ?? [],
            // Optionally update other properties if needed
          });
          console.log(`Successfully loaded character: ${data.characterName || 'Unnamed'}`);
        } else {
          console.log('No character document found, initializing new character');
          resetCharacter();
        }
      } catch (error) {
        console.error('Error loading character data:', error);
        resetCharacter();
      } finally {
        setLoaded(true);
      }
    };
    loadCharacterById();
  }, [currentUser, docId]);

  // -----------------------------------------------------------------------
  // Auto-save Effect: Trigger debounced save on any change to the characterState
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!loaded || !currentUser) return;

    // Always save to local storage immediately (cheap operation)
    saveToLocalStorage({
      userId: currentUser.uid,
      ...characterState,
    });

    // But only save to Firebase occasionally with debounce
    debouncedSaveCharacter();
  }, [characterState, currentUser, loaded, debouncedSaveCharacter]);

  // -----------------------------------------------------------------------
  // Visibility & Unload Save Effect: Force immediate save on page hide/close
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || !loaded) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirty) {
        // Force immediate save when page is hidden
        saveCharacterData();
        setLastSaveTime(Date.now());
        setIsDirty(false);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        saveCharacterData();
        setIsDirty(false);
        // Standard way to show a confirmation dialog when leaving
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser, loaded, isDirty]);

  // -----------------------------------------------------------------------
  // Periodic Save Effect: Auto-save every 5 minutes if conditions are met
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || !loaded) return;

    const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const intervalId = setInterval(() => {
      const currentTime = Date.now();
      const timeSinceLastSave = currentTime - lastSaveTime;

      // Only save if there's been no save in the last minute and there are changes
      if (timeSinceLastSave > 60000 && isDirty) {
        saveCharacterData();
        setLastSaveTime(currentTime);
        setIsDirty(false);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [currentUser, loaded, lastSaveTime, isDirty]);


  // -----------------------------------------------------------------------
  // Update Attacks based on equipped items
  // -----------------------------------------------------------------------
  useEffect(() => {
    const newAttacks = getAttacksFromEquipment();
    setAttacks(newAttacks);
  }, [characterState.equippedItems]);

  // -----------------------------------------------------------------------
  // Update available stat and skill points when character level changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (characterState.characterLevel > previousLevel) {
      const statPointsToAdd = (characterState.characterLevel <= 10)
        ? 1
        : (characterState.characterLevel <= 20)
          ? 2
          : (characterState.characterLevel <= 30)
            ? 3
            : (characterState.characterLevel <= 40)
              ? 4
              : (characterState.characterLevel <= 50)
                ? 5
                : (characterState.characterLevel <= 60)
                  ? 6
                  : (characterState.characterLevel <= 70)
                    ? 7
                    : (characterState.characterLevel <= 80)
                      ? 8
                      : (characterState.characterLevel <= 90)
                        ? 9
                        : 10;
      updateCharacterState({
        availableStatPoints: characterState.availableStatPoints + statPointsToAdd,
        availableSkillPoints: characterState.availableSkillPoints +
          ((characterState.characterLevel <= 10)
            ? 2
            : (characterState.characterLevel <= 20)
              ? 4
              : (characterState.characterLevel <= 30)
                ? 6
                : (characterState.characterLevel <= 40)
                  ? 8
                  : (characterState.characterLevel <= 50)
                    ? 10
                    : (characterState.characterLevel <= 60)
                      ? 12
                      : (characterState.characterLevel <= 70)
                        ? 14
                        : (characterState.characterLevel <= 80)
                          ? 16
                          : (characterState.characterLevel <= 90)
                            ? 18
                            : 20),
      });
    } else if (characterState.characterLevel < previousLevel) {
      const statPointsToRemove = (previousLevel <= 10)
        ? 1
        : (previousLevel <= 20)
          ? 2
          : (previousLevel <= 30)
            ? 3
            : (previousLevel <= 40)
              ? 4
              : (previousLevel <= 50)
                ? 5
                : (previousLevel <= 60)
                  ? 6
                  : (previousLevel <= 70)
                    ? 7
                    : (previousLevel <= 80)
                      ? 8
                      : (previousLevel <= 90)
                        ? 9
                        : 10;
      updateCharacterState({
        availableStatPoints: Math.max(0, characterState.availableStatPoints - statPointsToRemove),
        availableSkillPoints: Math.max(
          0,
          characterState.availableSkillPoints -
          ((previousLevel <= 10)
            ? 2
            : (previousLevel <= 20)
              ? 4
              : (previousLevel <= 30)
                ? 6
                : (previousLevel <= 40)
                  ? 8
                  : (previousLevel <= 50)
                    ? 10
                    : (previousLevel <= 60)
                      ? 12
                      : (previousLevel <= 70)
                        ? 14
                        : (previousLevel <= 80)
                          ? 16
                          : (previousLevel <= 90)
                            ? 18
                            : 20)
        ),
      });
    }
    setPreviousLevel(characterState.characterLevel);
  }, [characterState.characterLevel]);

  // -----------------------------------------------------------------------
  // Reset and Delete Functions
  // -----------------------------------------------------------------------
  const resetCharacter = () => {
    updateCharacterState({
      baseStats: defaultStats,
      selectedRace: null,
      selectedClass: null,
      abilityLevels: {},
      inventory: [],
      equippedItems: defaultEquippedItems,
      learnedSpells: [],
      characterName: '',
      currentHp: 8,
      currentMp: 5,
      currentAp: 2,
      characterLevel: 1,
      baseSkills: {},
      utilitySlots: defaultUtilitySlots,
      availableStatPoints: 7,
      availableSkillPoints: 16,
    });
    featureManager.reset();
    equipmentBonuses.reset();
  };

  const deleteCharacter = async () => {
    if (!currentUser || !docId) return;
    try {
      await deleteDoc(doc(db, 'characters', docId));
      resetCharacter();
      setDocId(null);
      console.log(`Deleted character: ${docId}`);
      router.push('/character-manager');
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  // -----------------------------------------------------------------------
  // Utility Slot Management Functions
  // -----------------------------------------------------------------------
  const addItemToUtilitySlot = (slotId: string, item: InventoryItem, quantity: number) => {
    const newSlots = characterState.utilitySlots.map((slot) =>
      slot.id === slotId ? { ...slot, stack: { item, quantity } } : slot
    );
    updateCharacterState({ utilitySlots: newSlots });
  };

  const removeItemFromUtilitySlot = (slotId: string) => {
    const slot = characterState.utilitySlots.find((slot) => slot.id === slotId);
    if (!slot || !slot.stack) return;
    const { item, quantity } = slot.stack;
    // Return the item to inventory
    const existing = characterState.inventory.find((invItem) => invItem.item.id === item.id);
    let newInventory;
    if (existing) {
      newInventory = characterState.inventory.map((invItem) =>
        invItem.item.id === item.id
          ? { ...invItem, quantity: invItem.quantity + quantity }
          : invItem
      );
    } else {
      newInventory = [...characterState.inventory, { item, quantity }];
    }
    updateCharacterState({ inventory: newInventory });
    const newSlots = characterState.utilitySlots.map((s) =>
      s.id === slotId ? { ...s, stack: null } : s
    );
    updateCharacterState({ utilitySlots: newSlots });
  };

  const updateUtilitySlotQuantity = (slotId: string, quantityChange: number) => {
    const slot = characterState.utilitySlots.find((slot) => slot.id === slotId);
    if (!slot || !slot.stack) return;
    const { item, quantity } = slot.stack;
    const newQuantity = quantity + quantityChange;
    if (newQuantity <= 0) {
      removeItemFromUtilitySlot(slotId);
    } else {
      const newSlots = characterState.utilitySlots.map((s) =>
        s.id === slotId ? { ...s, stack: { item, quantity: newQuantity } } : s
      );
      updateCharacterState({ utilitySlots: newSlots });
      if (quantityChange > 0) {
        const newInventory = characterState.inventory.map((invItem) => {
          if (invItem.item.id === item.id) {
            return invItem.quantity === 1
              ? null
              : { ...invItem, quantity: invItem.quantity - 1 };
          }
          return invItem;
        }).filter(Boolean) as InventoryItemWithQuantity[];
        updateCharacterState({ inventory: newInventory });
      }
    }
  };

  // -----------------------------------------------------------------------
  // Stat Increment/Decrement and Skill Adjustment Functions
  // -----------------------------------------------------------------------
  const incrementStat = (stat: keyof CharacterStats) => {
    if (characterState.availableStatPoints > 0) {
      updateCharacterState({
        baseStats: {
          ...characterState.baseStats,
          [stat]: characterState.baseStats[stat] + 1,
        },
        availableStatPoints: characterState.availableStatPoints - 1,
      });
    }
  };

  const decrementStat = (stat: keyof CharacterStats) => {
    if (characterState.baseStats[stat] > 0) {
      updateCharacterState({
        baseStats: {
          ...characterState.baseStats,
          [stat]: characterState.baseStats[stat] - 1,
        },
        availableStatPoints: characterState.availableStatPoints + 1,
      });
    }
  };

  const increaseSkill = (skillName: string) => {
    if (characterState.availableSkillPoints > 0) {
      updateCharacterState({
        baseSkills: {
          ...characterState.baseSkills,
          [skillName]: (characterState.baseSkills[skillName] || 0) + 1,
        },
        availableSkillPoints: characterState.availableSkillPoints - 1,
      });
    }
  };

  const decreaseSkill = (skillName: string) => {
    if (characterState.baseSkills[skillName] > 0) {
      updateCharacterState({
        baseSkills: {
          ...characterState.baseSkills,
          [skillName]: characterState.baseSkills[skillName] - 1,
        },
        availableSkillPoints: characterState.availableSkillPoints + 1,
      });
    }
  };

  const setCharacterNameHandler = (name: string) => {
    updateCharacterState({ characterName: name });
  };

  // -----------------------------------------------------------------------
  // Equipment Attack Generation
  // -----------------------------------------------------------------------
  const createAttackFromWeapon = (weapon: WeaponItem, slot: string): Attack => {
    // Calculate range based on weapon type
    const range = weapon.meleeRanged === 'Ranged'
      ? (weapon.weaponType.toLowerCase().includes('bow') ? '60 ft' :
        weapon.weaponType.toLowerCase().includes('gun') ? '90 ft' : '30 ft')
      : 'Melee';

    // Create a type-safe attack object
    return {
      id: `${weapon.id}-attack`,
      name: `${weapon.name} Attack`,
      description: `Attack with your ${weapon.name}`,
      damageAmount: weapon.damageAmount,
      damageType: weapon.damageType,
      range: range,
      weaponType: weapon.weaponType,
      weaponId: weapon.id,
      apCost: 1, // Default AP cost
      sourceItem: `${slot} Weapon: ${weapon.name}`,
      // Add the traits and abilities with null checks
      traits: Array.isArray(weapon.traits) ? [...weapon.traits] : [],
      abilities: Array.isArray(weapon.abilities) ? [...weapon.abilities] : []
    };
  };

  // Get attacks from equipment with better type safety
  const getAttacksFromEquipment = (): Attack[] => {
    const weaponAttacks: Attack[] = [];

    if (characterState.equippedItems.primaryWeapon) {
      weaponAttacks.push(createAttackFromWeapon(characterState.equippedItems.primaryWeapon, 'Primary'));
    }

    if (characterState.equippedItems.secondaryWeapon) {
      weaponAttacks.push(createAttackFromWeapon(characterState.equippedItems.secondaryWeapon, 'Secondary'));
    }

    return weaponAttacks;
  };

  const executeAttack = (attackId: string) => {
    const attack = attacks.find((a) => a.id === attackId);
    if (!attack) return;
    console.log(`Executing attack: ${attack.name}`);
  };

  // -----------------------------------------------------------------------
  // Context Value Object
  // -----------------------------------------------------------------------
  const value: CharacterContextType = {
    baseStats: characterState.baseStats,
    currentStats: currentStats,
    setBaseStats: (stats: CharacterStats) => updateCharacterState({ baseStats: stats }),
    selectedRace: characterState.selectedRace,
    setSelectedRace: (race: Race | null) => updateCharacterState({ selectedRace: race }),
    selectedClass: characterState.selectedClass,
    setSelectedClass: (cls: Class | null) => updateCharacterState({ selectedClass: cls }),
    abilityLevels: characterState.abilityLevels,
    setAbilityLevel: (abilityName: string, level: number) =>
      updateCharacterState({
        abilityLevels: { ...characterState.abilityLevels, [abilityName]: level },
      }),
    inventory: characterState.inventory,
    addToInventory: (item: InventoryItem) => {
      const existing = characterState.inventory.find(
        (invItem) => invItem.item.id === item.id
      );
      let newInventory;
      if (existing) {
        newInventory = characterState.inventory.map((invItem) =>
          invItem.item.id === item.id
            ? { ...invItem, quantity: invItem.quantity + 1 }
            : invItem
        );
      } else {
        newInventory = [...characterState.inventory, { item, quantity: 1 }];
      }
      updateCharacterState({ inventory: newInventory });
    },
    removeFromInventory: (itemId: string) => {
      const existing = characterState.inventory.find(
        (invItem) => invItem.item.id === itemId
      );
      let newInventory;
      if (existing) {
        if (existing.quantity === 1) {
          newInventory = characterState.inventory.filter(
            (invItem) => invItem.item.id !== itemId
          );
        } else {
          newInventory = characterState.inventory.map((invItem) =>
            invItem.item.id === itemId
              ? { ...invItem, quantity: invItem.quantity - 1 }
              : invItem
          );
        }
        updateCharacterState({ inventory: newInventory });
      }
    },
    updateInventoryItemQuantity: (itemId: string, quantity: number) => {
      let newInventory;
      if (quantity <= 0) {
        newInventory = characterState.inventory.filter(
          (invItem) => invItem.item.id !== itemId
        );
      } else {
        newInventory = characterState.inventory.map((invItem) =>
          invItem.item.id === itemId ? { ...invItem, quantity } : invItem
        );
      }
      updateCharacterState({ inventory: newInventory });
    },
    getInventoryByType: (itemType: string) =>
      characterState.inventory.filter((invItem) => invItem.item.itemType === itemType),
    getItemQuantity: (itemId: string) => {
      const item = characterState.inventory.find((invItem) => invItem.item.id === itemId);
      return item ? item.quantity : 0;
    },
    hasItem: (itemId: string) =>
      characterState.inventory.some((invItem) => invItem.item.id === itemId),
    equippedItems: characterState.equippedItems,
    equipItem: (slot: keyof EquippedItems, item: InventoryItem | null) => {
      // Handle null case (unequipping)
      if (item === null) {
        const newEquipped = { ...characterState.equippedItems };

        // Remove the previously equipped item from the slot
        newEquipped[slot] = null;

        // Update equipment managers
        featureManager.equipItem(String(slot), null);
        equipmentBonuses.equipItem(String(slot), null);

        // Update state
        updateCharacterState({ equippedItems: newEquipped });
        return;
      }

      // For equipping items, validate the item type against the slot
      let validEquip = false;
      let typedItem: any = null;

      // Check weapon slots
      if ((slot === 'primaryWeapon' || slot === 'secondaryWeapon') && item && typeof item === 'object' && 'itemType' in item && item.itemType === 'Weapon') {
        validEquip = true;
        typedItem = item as unknown as WeaponItem;
      }
      // Check armor slots
      else if (
        // List all armor slots here
        slot === 'head' || slot === 'shoulders' || slot === 'torso' ||
        slot === 'arm0' || slot === 'arm1' || slot === 'wrist0' ||
        slot === 'wrist1' || slot === 'finger0' || slot === 'finger1' ||
        slot === 'finger2' || slot === 'finger3' || slot === 'waist' ||
        slot === 'legs' || slot === 'thighs' || slot === 'knees' ||
        slot === 'shins' || slot === 'ankle0' || slot === 'ankle1' ||
        slot === 'feet' || slot === 'face0' || slot === 'face1' ||
        slot === 'neck' || slot === 'toes0' || slot === 'toes1' ||
        slot === 'toes2' || slot === 'toes3'
      ) {
        if (item.itemType === 'Armor') {
          validEquip = true;
          typedItem = item as ArmorItem;
        }
      }

      if (!validEquip) {
        console.warn(`Cannot equip ${item.itemType} to slot ${String(slot)}`);
        return;
      }

      // If we got here, the item can be equipped to the slot
      const newEquipped = { ...characterState.equippedItems };
      newEquipped[slot] = typedItem;

      // Update equipment managers
      featureManager.equipItem(String(slot), typedItem);
      equipmentBonuses.equipItem(String(slot), typedItem);

      // Update state
      updateCharacterState({ equippedItems: newEquipped });
    },

    getEquippedItem: (slot: keyof EquippedItems) => characterState.equippedItems[slot],

    equipMultipleItems: (equipmentUpdates: Partial<Record<keyof EquippedItems, InventoryItem | null>>) => {
      // Create a new equipped items object
      const newEquippedItems = { ...characterState.equippedItems };

      // Process each update
      Object.entries(equipmentUpdates).forEach(([slotKey, item]) => {
        const slot = slotKey as keyof EquippedItems;

        // If the item is null, handle unequipping
        if (item === null) {
          newEquippedItems[slot] = null;
          featureManager.equipItem(slotKey, null);
          equipmentBonuses.equipItem(slotKey, null);
          return; // Continue to next item
        }

        // For equipping items, validate the item type against the slot
        let validEquip = false;
        let typedItem: any = null;

        // Check weapon slots
        if ((slot === 'primaryWeapon' || slot === 'secondaryWeapon') && 'itemType' in item && item.itemType === 'Weapon') {
          validEquip = true;
          typedItem = item as WeaponItem;
        }
        // Check armor slots
        else if (
          // List all armor slots here (same as in equipItem)
          slot === 'head' || slot === 'shoulders' || slot === 'torso' ||
          slot === 'arm0' || slot === 'arm1' || slot === 'wrist0' ||
          slot === 'wrist1' || slot === 'finger0' || slot === 'finger1' ||
          slot === 'finger2' || slot === 'finger3' || slot === 'waist' ||
          slot === 'legs' || slot === 'thighs' || slot === 'knees' ||
          slot === 'shins' || slot === 'ankle0' || slot === 'ankle1' ||
          slot === 'feet' || slot === 'face0' || slot === 'face1' ||
          slot === 'neck' || slot === 'toes0' || slot === 'toes1' ||
          slot === 'toes2' || slot === 'toes3'
        ) {
          if (item.itemType === 'Armor') {
            validEquip = true;
            typedItem = item as ArmorItem;
          }
        }

        if (!validEquip) {
          console.warn(`Cannot equip ${item.itemType} to slot ${slotKey}`);
          return; // Skip this item and continue with the next
        }

        // Apply the equipped item
        newEquippedItems[slot] = typedItem;

        // Update equipment managers
        featureManager.equipItem(slotKey, typedItem);
        equipmentBonuses.equipItem(slotKey, typedItem);
      });

      // Update state with all equipped items at once
      updateCharacterState({ equippedItems: newEquippedItems });
    },
    getStatBonus: (stat: string) => equipmentBonuses.getStatBonus(stat),
    getSkillBonus: (skill: string) => equipmentBonuses.getSkillBonus(skill),
    getEquipmentAbilities: () => featureManager.getAbilities(),
    getEquipmentTraits: () => featureManager.getTraits(),
    hasAbility: (ability: string) => featureManager.hasAbility(ability),
    hasTrait: (trait: string) => featureManager.hasTrait(trait),
    resetCharacter,
    deleteCharacter,
    currentSkills: currentSkills,
    baseSkills: characterState.baseSkills,
    spellList: characterState.learnedSpells,
    learnedSpells: characterState.learnedSpells,
    addToLearnedSpells: (spell: Spell) => {
      if (characterState.learnedSpells.some((s) => s.name === spell.name)) return;
      updateCharacterState({
        learnedSpells: [...characterState.learnedSpells, spell],
      });
    },
    characterLevel: characterState.characterLevel,
    setCharacterLevel: (level: number) => updateCharacterState({ characterLevel: level }),
    getMaxHp,
    getMaxMp,
    getMaxAp,
    availableStatPoints: characterState.availableStatPoints,
    incrementStat,
    decrementStat,
    availableSkillPoints: characterState.availableSkillPoints,
    increaseSkill,
    decreaseSkill,
    attacks,
    getAttacksFromEquipment,
    executeAttack,
    characterName: characterState.characterName,
    setCharacterName: setCharacterNameHandler,
    currentHp: characterState.currentHp,
    setCurrentHp: (hp: number) => updateCharacterState({ currentHp: hp }),
    currentMp: characterState.currentMp,
    setCurrentMp: (mp: number) => updateCharacterState({ currentMp: mp }),
    currentAp: characterState.currentAp,
    setCurrentAp: (ap: number) => updateCharacterState({ currentAp: ap }),
    utilitySlots: characterState.utilitySlots,
    setUtilitySlots: (slots: UtilitySlot[]) => updateCharacterState({ utilitySlots: slots }),
    addItemToUtilitySlot: (slotId: string, item: InventoryItem, quantity: number) => {
      const newSlots = characterState.utilitySlots.map((slot) =>
        slot.id === slotId
          ? { ...slot, stack: { item, quantity } }
          : slot
      );

      updateCharacterState({ utilitySlots: newSlots });
    },

    removeItemFromUtilitySlot: (slotId: string) => {
      // Find the slot we're removing from
      const slot = characterState.utilitySlots.find((slot) => slot.id === slotId);
      if (!slot || !slot.stack) return;

      // Get the item and quantity from the slot
      const { item, quantity } = slot.stack;

      // Add the items back to the inventory
      const existing = characterState.inventory.find((invItem) => invItem.item.id === item.id);
      let newInventory;

      if (existing) {
        // If we already have this item in inventory, increase the quantity
        newInventory = characterState.inventory.map((invItem) =>
          invItem.item.id === item.id
            ? { ...invItem, quantity: invItem.quantity + quantity }
            : invItem
        );
      } else {
        // Otherwise add a new inventory entry
        newInventory = [...characterState.inventory, { item, quantity }];
      }

      // Clear the slot
      const newSlots = characterState.utilitySlots.map((s) =>
        s.id === slotId ? { ...s, stack: null } : s
      );

      // Update both inventory and slots in one state update
      updateCharacterState({
        inventory: newInventory,
        utilitySlots: newSlots
      });
    },

    updateUtilitySlotQuantity: (slotId: string, quantityChange: number) => {
      // Find the slot we're updating
      const slot = characterState.utilitySlots.find((slot) => slot.id === slotId);
      if (!slot || !slot.stack) return;

      const { item, quantity } = slot.stack;
      const newQuantity = quantity + quantityChange;

      // If the new quantity would be zero or less, remove the item completely
      if (newQuantity <= 0) {
        removeItemFromUtilitySlot(slotId);
        return;
      }

      // Otherwise, update the quantity
      const newSlots = characterState.utilitySlots.map((s) =>
        s.id === slotId ? { ...s, stack: { item, quantity: newQuantity } } : s
      );

      // If we're increasing the quantity, we need to decrease it from inventory
      if (quantityChange > 0) {
        const newInventory = characterState.inventory.map((invItem) => {
          if (invItem.item.id === item.id) {
            return invItem.quantity === 1
              ? null  // Remove if this was the last one
              : { ...invItem, quantity: invItem.quantity - 1 };
          }
          return invItem;
        }).filter(Boolean) as InventoryItemWithQuantity[];

        // Update both inventory and slots
        updateCharacterState({
          inventory: newInventory,
          utilitySlots: newSlots
        });
      } else {
        // If we're just decreasing quantity in the slot, no inventory update needed
        updateCharacterState({ utilitySlots: newSlots });
      }
    },
    isDirty,
    isSaving,
    saveCharacterManually,
    lastSaveTime,
    notes: characterState.notes,
    updateNotes: (notes: NotesState) => updateCharacterState({ notes }),
    
    addNoteCategory: (category: NoteCategory) => {
      updateCharacterState({
        notes: [...characterState.notes, category]
      });
    },
    
    updateNoteCategory: (categoryId: string, updates: Partial<NoteCategory>) => {
      updateCharacterState({
        notes: characterState.notes.map(cat => 
          cat.id === categoryId ? { ...cat, ...updates } : cat
        )
      });
    },
    
    deleteNoteCategory: (categoryId: string) => {
      updateCharacterState({
        notes: characterState.notes.filter(cat => cat.id !== categoryId)
      });
    },
    
    addNote: (categoryId: string, note: Note) => {
      updateCharacterState({
        notes: characterState.notes.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              notes: [...cat.notes, note]
            };
          }
          return cat;
        })
      });
    },
    
    updateNote: (categoryId: string, noteId: string, updates: Partial<Note>) => {
      updateCharacterState({
        notes: characterState.notes.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              notes: cat.notes.map(note => 
                note.id === noteId ? { ...note, ...updates } : note
              )
            };
          }
          return cat;
        })
      });
    },
    
    deleteNote: (categoryId: string, noteId: string) => {
      updateCharacterState({
        notes: characterState.notes.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              notes: cat.notes.filter(note => note.id !== noteId)
            };
          }
          return cat;
        })
      });
    },
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
}

// -------------------------------------------------------------------------
// Additional exported functions for character management
// -------------------------------------------------------------------------
export async function getAllCharactersForUser(userId: string) {
  try {
    const charactersRef = collection(db, 'characters');
    const q = query(charactersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const characters = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        characterName: data.characterName || 'Unnamed Character',
        characterLevel: data.characterLevel || 1,
        selectedRace: data.selectedRace || null,
        selectedClass: data.selectedClass || null,
        ...data,
      };
    });
    return characters;
  } catch (error) {
    console.error('Error fetching characters:', error);
    return [];
  }
}

export async function saveCharacter(userId: string, characterData: any) {
  try {
    if (characterData.id) {
      const characterRef = doc(db, 'users', userId, 'characters', characterData.id);
      await setDoc(characterRef, characterData, { merge: true });
      return characterData.id;
    }
    const charactersRef = collection(db, 'users', userId, 'characters');
    const newCharacterRef = await addDoc(charactersRef, characterData);
    return newCharacterRef.id;
  } catch (error) {
    console.error('Error saving character:', error);
    throw error;
  }
}

export async function deleteCharacterById(userId: string, characterId: string) {
  try {
    const characterRef = doc(db, 'characters', characterId);
    await deleteDoc(characterRef);
    return true;
  } catch (error) {
    console.error('Error deleting character:', error);
    return false;
  }
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}
