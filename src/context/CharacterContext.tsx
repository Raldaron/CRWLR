// --- START OF FILE CharacterContext.tsx ---
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
// Updated import for Skill interface
import type { CharacterStats, Skill, Race } from '@/types/character';
import type { Class } from '@/types/class';
import type { WeaponItem } from '@/types/weapon';
import type { ArmorItem } from '@/types/armor';
import type { InventoryItem, InventoryItemWithQuantity } from '@/types/inventory';
import type { Spell } from '@/types/spell';
import AttackCard from '@/components/ItemCards/AttackCard'; // Import the component
import type { Attack } from '@/types/attack'; // Import the TYPE from the correct types file
import type { ScrollItem } from '@/types/scroll'; // Import ScrollItem type
// Removed Race import as it's now included in character types
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc, // Keep updateDoc
  query,
  where,
  serverTimestamp, // Use server timestamp for saves
  Timestamp,
  limit,
  orderBy,       // For handling loaded timestamps
} from 'firebase/firestore';
import { Center, Spinner, useToast } from '@chakra-ui/react';
import { db } from '@/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDM } from '@/context/DMContext';
import { EquipmentBonusManager } from '@/types/equipmentBonuses'; // Keep this import

// -------------------------------------------------------------------------
// Base Skill List with Attributes (Crucial for the new logic)
// -------------------------------------------------------------------------
export const baseSkillList: Skill[] = [
    { name: "Acrobatics", attribute: "dexterity", level: 0 },
    { name: "Alchemy", attribute: "intelligence", level: 0 },
    { name: "Animal Ken", attribute: "charisma", level: 0 },
    { name: "Arcana", attribute: "intelligence", level: 0 },
    { name: "Archery", attribute: "dexterity", level: 0 },
    { name: "Artillery", attribute: "intelligence", level: 0 },
    { name: "Athletics", attribute: "strength", level: 0 },
    { name: "Awareness", attribute: "perception", level: 0 },
    { name: "Bare Knuckle", attribute: "strength", level: 0 },
    { name: "Block", attribute: "strength", level: 0 },
    { name: "Deception", attribute: "wit", level: 0 },
    { name: "Detect Trap", attribute: "perception", level: 0 },
    { name: "Disguise", attribute: "charisma", level: 0 },
    { name: "Dodge", attribute: "dexterity", level: 0 },
    { name: "Endurance", attribute: "stamina", level: 0 },
    { name: "Engineering", attribute: "intelligence", level: 0 },
    { name: "Explosives Handling", attribute: "wit", level: 0 },
    { name: "Firearms", attribute: "dexterity", level: 0 },
    { name: "Grit", attribute: "stamina", level: 0 },
    { name: "Hold Breath", attribute: "stamina", level: 0 },
    { name: "Insight", attribute: "perception", level: 0 },
    { name: "Intimidation", attribute: "charisma", level: 0 },
    { name: "Investigation", attribute: "wit", level: 0 },
    { name: "Lockpick", attribute: "dexterity", level: 0 },
    { name: "Lore", attribute: "intelligence", level: 0 },
    { name: "Medicine", attribute: "intelligence", level: 0 },
    { name: "Melee", attribute: "strength", level: 0 },
    { name: "Nature", attribute: "wit", level: 0 },
    { name: "Parry", attribute: "strength", level: 0 },
    { name: "Performance", attribute: "charisma", level: 0 },
    { name: "Persuasion", attribute: "charisma", level: 0 },
    { name: "Resilience", attribute: "stamina", level: 0 },
    { name: "Scrounge", attribute: "perception", level: 0 },
    { name: "Seduction", attribute: "charisma", level: 0 },
    { name: "Sense Deception", attribute: "perception", level: 0 },
    { name: "Sleight of Hand", attribute: "dexterity", level: 0 },
    { name: "Stealth", attribute: "dexterity", level: 0 },
    { name: "Survival", attribute: "wit", level: 0 },
    { name: "Tactics", attribute: "wit", level: 0 },
    { name: "Tracking", attribute: "perception", level: 0 }
  ];

// Helper to get attribute for a skill name
const getAttributeForSkill = (skillName: string): keyof CharacterStats | null => {
    const skillInfo = baseSkillList.find(s => s.name.toLowerCase() === skillName.toLowerCase());
    return skillInfo ? skillInfo.attribute : null;
};

// Helper to initialize base skills from the list
const initializeBaseSkills = (): CharacterSkills => {
    return baseSkillList.reduce((acc, skill) => {
        acc[skill.name] = 0; // Initialize all skills at level 0
        return acc;
    }, {} as CharacterSkills);
};

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

  addFeatures(item: WeaponItem | ArmorItem) { // Make public if needed by equipMultipleItems logic
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

  removeFeatures(item: WeaponItem | ArmorItem | null) { // Make public if needed by equipMultipleItems logic
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


// -------------------------------------------------------------------------
// Interfaces & Types
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

// Gold Transaction Interface
interface GoldTransaction {
  amount: number; // Positive for gain, negative for loss
  reason: string;
  timestamp: number; // Store as milliseconds timestamp
  by?: string; // Optional: DM ID or 'system' or 'player'
}

// Equipped Items Interface (Simplified for example, use your full definition)
interface EquippedItems {
  primaryWeapon: WeaponItem | null;
  secondaryWeapon: WeaponItem | null;
  head: ArmorItem | null;
  face0: ArmorItem | null; face1: ArmorItem | null;
  neck: ArmorItem | null; shoulders: ArmorItem | null; torso: ArmorItem | null;
  arm0: ArmorItem | null; arm1: ArmorItem | null; wrist0: ArmorItem | null; wrist1: ArmorItem | null;
  finger0: ArmorItem | null; finger1: ArmorItem | null; finger2: ArmorItem | null; finger3: ArmorItem | null;
  waist: ArmorItem | null; legs: ArmorItem | null; thighs: ArmorItem | null;
  knees: ArmorItem | null; shins: ArmorItem | null; ankle0: ArmorItem | null;
  ankle1: ArmorItem | null; feet: ArmorItem | null; toes0: ArmorItem | null;
  toes1: ArmorItem | null; toes2: ArmorItem | null; toes3: ArmorItem | null;
  [key: string]: WeaponItem | ArmorItem | null; // Index signature
}

// Other Interfaces
interface AbilityLevels { [key: string]: number; }
interface CharacterSkills { [key: string]: number; } // Keys are skill names, values are levels
interface Note { id: string; title: string; content: string; lastEdited: number; } // timestamp
interface NoteCategory { id: string; name: string; notes: Note[]; }
type NotesState = NoteCategory[];

// Consolidated Character State Interface (Combined)
interface CharacterState {
  baseStats: CharacterStats; // Base stats are now ONLY increased by skill allocation
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
  baseSkills: CharacterSkills; // Stores the points allocated by the player
  utilitySlots: UtilitySlot[];
  availableSkillPoints: number;
  lastUpdated: number; // Store as milliseconds timestamp
  notes: NotesState;
  gold: number;
  goldTransactionHistory: GoldTransaction[];
}

// Define a type for the combined list, potentially adding source info
export interface ActionSpell extends Spell {
    source?: 'learned' | 'scroll'; // Indicate the origin
    sourceId?: string; // ID of the scroll item or spell
    sourceSlotId?: string; // Utility slot ID if source is 'scroll'
}

// -------------------------------------------------------------------------
// Default Values
// -------------------------------------------------------------------------
const defaultStats: CharacterStats = { strength: 0, dexterity: 0, stamina: 0, intelligence: 0, perception: 0, wit: 0, charisma: 0 }; // Start stats at 0, they increase via skills
const defaultEquippedItems: EquippedItems = { /* ... your existing default slots ... */ primaryWeapon: null, secondaryWeapon: null, head: null, face0: null, face1: null, neck: null, shoulders: null, torso: null, arm0: null, arm1: null, wrist0: null, wrist1: null, finger0: null, finger1: null, finger2: null, finger3: null, waist: null, legs: null, thighs: null, knees: null, shins: null, ankle0: null, ankle1: null, feet: null, toes0: null, toes1: null, toes2: null, toes3: null };
const defaultNotes: NotesState = [ { id: 'general-' + Date.now(), name: 'General', notes: [ { id: 'welcome-' + Date.now(), title: 'Welcome to Notes', content: 'Use this tab to keep track of important information during your adventures. You can create different categories to organize your notes!', lastEdited: Date.now() } ] }, { id: 'quests-' + Date.now(), name: 'Quests', notes: [] }, { id: 'npcs-' + Date.now(), name: 'NPCs', notes: [] } ];
const defaultUtilitySlots: UtilitySlot[] = Array.from({ length: 10 }, (_, i) => ({ id: `utility${i}`, name: `Utility Slot ${i + 1}`, stack: null }));
const defaultBaseSkills = initializeBaseSkills(); // Initialize with all skills at 0

// -------------------------------------------------------------------------
// Context Interface (Combined & Fully Typed)
// -------------------------------------------------------------------------
export interface CharacterContextType {
  // Basic Info
  characterName: string; setCharacterName: (name: string) => void;
  characterLevel: number; setCharacterLevel: (level: number) => void;
  // Core Attributes
  baseStats: CharacterStats; // Expose baseStats for viewing if needed
  setBaseStats: (stats: CharacterStats) => void; // Keep for potential DM edits or initialization
  currentStats: CharacterStats; // Derived total stats
  selectedRace: Race | null; setSelectedRace: (race: Race | null) => void;
  selectedClass: Class | null; setSelectedClass: (cls: Class | null) => void;
  // Vitals
  docId: string | null;
  currentHp: number; setCurrentHp: (hp: number) => void;
  getMaxHp: () => number; // Derived
  currentMp: number; setCurrentMp: (mp: number) => void;
  getMaxMp: () => number; // Derived
  currentAp: number; setCurrentAp: (ap: number) => void;
  getMaxAp: () => number; // Derived
  // Skills & Abilities
  baseSkills: CharacterSkills; // Base skill points allocated
  currentSkills: CharacterSkills; // Derived total skills including bonuses
  abilityLevels: AbilityLevels; setAbilityLevel: (abilityName: string, level: number) => void;
  getEquipmentAbilities: () => string[]; // Derived from manager
  getEquipmentTraits: () => string[]; // Derived from manager
  hasAbility: (ability: string) => boolean; // Derived from manager
  hasTrait: (trait: string) => boolean; // Derived from manager
  // Equipment & Inventory
  inventory: InventoryItemWithQuantity[];
  addToInventory: (item: InventoryItem) => void;
  addItemsWithQuantity: (item: InventoryItem, quantity: number) => void;
  addMultipleItemsToInventory: (items: InventoryItem[]) => void;
  removeFromInventory: (itemId: string) => void;
  updateInventoryItemQuantity: (itemId: string, quantity: number) => void;
  getInventoryByType: (itemType: string) => InventoryItemWithQuantity[];
  getItemQuantity: (itemId: string) => number; // Correct return type: number
  hasItem: (itemId: string) => boolean; // Correct return type: boolean
  equippedItems: EquippedItems;
  equipItem: (slot: keyof EquippedItems, item: InventoryItem | null) => void;
  getEquippedItem: (slot: keyof EquippedItems) => WeaponItem | ArmorItem | null;
  equipMultipleItems: (equipmentUpdates: Partial<Record<keyof EquippedItems, InventoryItem | null>>) => void;
  getStatBonus: (stat: string) => number; // Derived from manager
  getSkillBonus: (skill: string) => number; // Derived from manager
  removeItems: (items: { itemId: string; quantity: number }[]) => Promise<void>;
  utilitySlots: UtilitySlot[]; setUtilitySlots: (slots: UtilitySlot[]) => void;
  addItemToUtilitySlot: (slotId: string, item: InventoryItem, quantity: number) => void;
  removeItemFromUtilitySlot: (slotId: string) => void;
  updateUtilitySlotQuantity: (slotId: string, quantityChange: number) => void;
  // Points & Advancement
  availableSkillPoints: number;
  increaseSkill: (skillName: string) => void; // MODIFIED
  decreaseSkill: (skillName: string) => void; // MODIFIED
  // Combat
  attacks: Attack[]; // Derived
  getAttacksFromEquipment: () => Attack[]; executeAttack: (attackId: string) => void;
  // Spells
  learnedSpells: Spell[]; addToLearnedSpells: (spell: Spell) => void;
  allCharacterSpells: ActionSpell[]; // Combined list of learned and scroll-based spells
  spellList: Spell[]; // Kept for compatibility, same as learnedSpells
  // Notes
  notes: NotesState; updateNotes: (notes: NotesState) => void;
  addNoteCategory: (category: NoteCategory) => void; updateNoteCategory: (categoryId: string, updates: Partial<NoteCategory>) => void;
  deleteNoteCategory: (categoryId: string) => void; addNote: (categoryId: string, note: Note) => void;
  updateNote: (categoryId: string, noteId: string, updates: Partial<Note>) => void; deleteNote: (categoryId: string, noteId: string) => void;
  // Gold & Economy
  gold: number; setGold: (amount: number, reason: string) => void;
  goldTransactionHistory: GoldTransaction[];
  addGold: (amount: number, reason: string) => void;
  subtractGold: (amount: number, reason: string) => void;
  processTransaction: (details: {
    itemId: string;
    item?: InventoryItem; // Required for 'buy'
    quantity: number;
    goldChange: number;
    transactionType: 'buy' | 'sell';
    reason: string
  }) => Promise<void>;
  // Crafting
  craftItem: (componentsToRemove: { itemId: string; quantity: number }[], itemToAdd: InventoryItem) => Promise<boolean>;
  // Save & Reset
  isDirty: boolean; isSaving: boolean; lastSaveTime: number; // lastSaveTime tracks local JS time of last *successful* save
  saveCharacterManually: () => Promise<void>;
  resetCharacter: () => void; deleteCharacter: () => Promise<void>;
}

// Create the context
const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

// -------------------------------------------------------------------------
// CharacterProvider Component (Merged Logic)
// -------------------------------------------------------------------------
export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCharacterId = searchParams?.get('characterId') || null;
  const isNewCharacterMode = searchParams?.get('new') === 'true';
  const { isDM } = useDM();
  const toast = useToast();

  // Equipment Managers
  const equipmentBonuses = useMemo(() => new EquipmentBonusManager(), []);
  const featureManager = useMemo(() => new FeatureManager(), []);

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
    baseSkills: defaultBaseSkills,
    utilitySlots: defaultUtilitySlots,
    availableSkillPoints: 16,
    lastUpdated: 0,
    notes: defaultNotes,
    gold: 0,
    goldTransactionHistory: [],
  });

  // Other non-persistent states
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [docId, setDocId] = useState<string | null>(null);
  const [previousLevel, setPreviousLevel] = useState<number>(0);
  const [attacks, setAttacks] = useState<Attack[]>([]);

  // Save tracking states
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dirtyFieldsRef = useRef<{ [key: string]: boolean }>({});

  // --- Derived Values ---
  const currentStats = useMemo(() => {
    let calculatedStats = { ...characterState.baseStats };
    if (characterState.selectedRace) {
        Object.entries(characterState.selectedRace.statbonus).forEach(([statKey, bonus]) => {
            const key = statKey as keyof CharacterStats;
            calculatedStats[key] = (calculatedStats[key] || 0) + (bonus || 0);
        });
    }
    if (characterState.selectedClass) {
        Object.entries(characterState.selectedClass.statbonus).forEach(([statKey, bonus]) => {
             const key = statKey as keyof CharacterStats;
            calculatedStats[key] = (calculatedStats[key] || 0) + (bonus || 0);
        });
    }
    const eqStatBonuses = equipmentBonuses.getStatBonuses();
    Object.entries(eqStatBonuses).forEach(([statKey, bonus]) => {
        const key = statKey as keyof CharacterStats;
        calculatedStats[key] = (calculatedStats[key] || 0) + (bonus || 0);
    });
    Object.keys(calculatedStats).forEach(key => {
        const stat = key as keyof CharacterStats;
        calculatedStats[stat] = Math.max(0, calculatedStats[stat]);
    });
    return calculatedStats;
  }, [characterState.baseStats, characterState.selectedRace, characterState.selectedClass, equipmentBonuses]);

  const currentSkills = useMemo(() => {
    let calculatedSkills = { ...characterState.baseSkills };
    if (characterState.selectedRace) {
        Object.entries(characterState.selectedRace.skillbonus || {}).forEach(([skillName, bonus]) => {
            calculatedSkills[skillName] = (calculatedSkills[skillName] || 0) + (bonus || 0);
        });
    }
    if (characterState.selectedClass) {
        Object.entries(characterState.selectedClass.skillbonus || {}).forEach(([skillName, bonus]) => {
            calculatedSkills[skillName] = (calculatedSkills[skillName] || 0) + (bonus || 0);
        });
    }
    const eqSkillBonuses = equipmentBonuses.getSkillBonuses();
    Object.entries(eqSkillBonuses).forEach(([skillName, bonus]) => {
        calculatedSkills[skillName] = (calculatedSkills[skillName] || 0) + (bonus || 0);
    });
     Object.keys(calculatedSkills).forEach(key => {
        calculatedSkills[key] = Math.max(0, calculatedSkills[key]);
    });
    return calculatedSkills;
  }, [characterState.baseSkills, characterState.selectedRace, characterState.selectedClass, equipmentBonuses]);

  // --- Derived Getters (HP/MP/AP based on *current* stats) ---
  const getMaxHp = useCallback(() => (currentStats.stamina || 0) * 8 + (characterState.characterLevel || 0) + (characterState.selectedRace?.hpbonus || 0) + (characterState.selectedClass?.hpbonus || 0), [currentStats.stamina, characterState.characterLevel, characterState.selectedRace, characterState.selectedClass]);
  const getMaxMp = useCallback(() => (currentStats.intelligence || 0) * 5 + (characterState.characterLevel || 0) + (characterState.selectedRace?.mpbonus || 0) + (characterState.selectedClass?.mpbonus || 0), [currentStats.intelligence, characterState.characterLevel, characterState.selectedRace, characterState.selectedClass]);
  const getMaxAp = useCallback(() => (characterState.characterLevel || 0) * 2, [characterState.characterLevel]);

  // Updater function for consolidated state (remains the same)
  const updateCharacterState = useCallback((updates: Partial<CharacterState>) => {
     let hasChanges = false;
     const newState = { ...characterState, ...updates, lastUpdated: Date.now() }; // Calculate new state first
     Object.keys(updates).forEach(key => {
         const typedKey = key as keyof CharacterState;
         const oldValue = characterState[typedKey];
         const newValue = newState[typedKey];
         // More robust comparison for objects/arrays
         if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
             dirtyFieldsRef.current[key] = true;
             hasChanges = true;
         }
     });
     if (hasChanges) { setIsDirty(true); setCharacterState(newState); }
   }, [characterState]);


  // --- Save Character Data Function ---
  const saveCharacterData = useCallback(async (isManualSave = false): Promise<boolean> => {
    if (!loaded || !currentUser || isSaving) return false;
    if (!isDirty && !isManualSave) return true;
    const currentDocId = docId;
    const needsCreation = isNewCharacterMode && !currentDocId;
    if (!currentDocId && !needsCreation) { console.error("Cannot save: No document ID available and not in new character mode."); toast({ title: "Save Error", description: "Character ID missing.", status: "error" }); return false; }
    setIsSaving(true);
    if (!isManualSave) console.log(`Auto-saving character ID: ${currentDocId || '(new)'}`);
    try {
      const dataToSave: Record<string, any> = {
        userId: currentUser.uid,
        baseStats: characterState.baseStats,
        baseSkills: characterState.baseSkills,
        selectedRace: characterState.selectedRace,
        selectedClass: characterState.selectedClass,
        characterName: characterState.characterName,
        characterLevel: characterState.characterLevel,
        currentHp: characterState.currentHp,
        currentMp: characterState.currentMp,
        currentAp: characterState.currentAp,
        availableSkillPoints: characterState.availableSkillPoints,
        gold: characterState.gold,
        lastUpdated: serverTimestamp(),
        inventory: characterState.inventory,
        equippedItems: characterState.equippedItems,
        learnedSpells: characterState.learnedSpells,
        abilityLevels: characterState.abilityLevels,
        utilitySlots: characterState.utilitySlots,
        notes: characterState.notes,
        goldTransactionHistory: characterState.goldTransactionHistory,
      };
      const fieldsToSave = (isManualSave || needsCreation) ? Object.keys(dataToSave) : Object.keys(dirtyFieldsRef.current).filter(key => dirtyFieldsRef.current[key]);
      const finalDataToSave: Record<string, any> = { userId: currentUser.uid, lastUpdated: serverTimestamp() };
      fieldsToSave.forEach(key => { if (key in dataToSave && key !== 'userId' && key !== 'lastUpdated') { finalDataToSave[key] = dataToSave[key]; } });
      Object.keys(finalDataToSave).forEach(key => { if (finalDataToSave[key] === undefined) { finalDataToSave[key] = null; } if (['inventory', 'learnedSpells', 'utilitySlots', 'notes', 'goldTransactionHistory', 'abilities', 'traits', 'spellsGranted'].includes(key) && !Array.isArray(finalDataToSave[key])) { finalDataToSave[key] = []; } if (['baseStats', 'baseSkills', 'equippedItems', 'abilityLevels', 'statBonus', 'skillBonus', 'scaling'].includes(key) && (finalDataToSave[key] === null || typeof finalDataToSave[key] !== 'object' || Array.isArray(finalDataToSave[key]))) { finalDataToSave[key] = {}; } });
      const removeUndefined = (obj: any): any => { if (obj === undefined) return null; if (obj === null) return null; if (typeof obj !== 'object') return obj; if (Array.isArray(obj)) return obj.map(item => removeUndefined(item)); const cleanedObj: any = {}; Object.entries(obj).forEach(([key, value]) => { cleanedObj[key] = removeUndefined(value); }); return cleanedObj; };
      const cleanedDataToSave = removeUndefined(finalDataToSave);
      if (needsCreation) {
        type CreationDataType = { userId: string; lastUpdated: ReturnType<typeof serverTimestamp>; [key: string]: any; };
        const creationData: CreationDataType = { ...dataToSave, userId: currentUser.uid, lastUpdated: serverTimestamp() };
        Object.keys(creationData).forEach(key => { if (creationData[key] === undefined) creationData[key] = null; if (['inventory', 'learnedSpells', 'utilitySlots', 'notes', 'goldTransactionHistory', 'abilities', 'traits', 'spellsGranted'].includes(key) && !Array.isArray(creationData[key])) { creationData[key] = []; } if (['baseStats', 'baseSkills', 'equippedItems', 'abilityLevels', 'statBonus', 'skillBonus', 'scaling'].includes(key) && (creationData[key] === null || typeof creationData[key] !== 'object' || Array.isArray(creationData[key]))) { creationData[key] = {}; } });
        const newDocRef = await addDoc(collection(db, 'characters'), creationData);
        setDocId(newDocRef.id); console.log(`Created new character with ID: ${newDocRef.id}`); router.replace(`/game?characterId=${newDocRef.id}`, { scroll: false });
      } else if (currentDocId && Object.keys(cleanedDataToSave).length > 2) { const characterRef = doc(db, 'characters', currentDocId); await setDoc(characterRef, cleanedDataToSave, { merge: true }); console.log(`Saved character changes to document: ${currentDocId}. Fields:`, Object.keys(cleanedDataToSave)); } else if (currentDocId) { console.log(`No changes detected for auto-save for character: ${currentDocId}`); }
      setIsDirty(false); dirtyFieldsRef.current = {}; setLastSaveTime(Date.now());
      if (isManualSave) { toast({ title: "Character Saved", status: "success", duration: 2000, isClosable: true }); }
      return true;
    } catch (error: any) { console.error('Error saving character data:', error); toast({ title: "Save Failed", description: error.message || "Could not save character data.", status: "error" }); return false; } finally { setIsSaving(false); }
  }, [characterState, currentUser, docId, loaded, isDirty, isSaving, toast, router, isNewCharacterMode]);


  // --- Manual Save Function ---
  const saveCharacterManually = useCallback(async () => {
     if (!loaded || !currentUser) { toast({ title: "Cannot Save", description: "Character not loaded or user not logged in.", status: "warning"}); return; }
     dirtyFieldsRef.current = Object.keys(characterState).reduce((acc, key) => { acc[key] = true; return acc; }, {} as Record<string, boolean>);
     setIsDirty(true);
     await saveCharacterData(true);
  }, [currentUser, loaded, saveCharacterData, toast, characterState]);


  // --- Reset Character ---
  const resetCharacter = useCallback(() => {
    setCharacterState({
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
      baseSkills: defaultBaseSkills,
      utilitySlots: defaultUtilitySlots,
      availableSkillPoints: 16,
      lastUpdated: Date.now(),
      notes: defaultNotes,
      gold: 0,
      goldTransactionHistory: [],
    });
    equipmentBonuses.reset(); featureManager.reset(); setPreviousLevel(1); setIsDirty(false); dirtyFieldsRef.current = {};
    console.log("Character state reset to defaults.");
  }, [equipmentBonuses, featureManager]); // Keep managers as dependencies


  // --- Load Character Data ---
  useEffect(() => {
    const loadCharacterData = async () => {
         if (!currentUser) { setIsLoading(false); return; }
         setLoaded(false); setIsLoading(true); setIsDirty(false); dirtyFieldsRef.current = {};
         let tempEquipped: EquippedItems = { ...defaultEquippedItems };
        try {
            let characterIdToLoad: string | null = initialCharacterId;
            let characterDocRef;
            if (isNewCharacterMode) { console.log("Initializing new character state."); resetCharacter(); setDocId(null); setLoaded(true); setIsLoading(false); setIsDirty(true); dirtyFieldsRef.current = Object.keys(characterState).reduce((acc, key) => { acc[key] = true; return acc; }, {} as Record<string, boolean>); return; }
            if (!characterIdToLoad) { console.log("No characterId in URL, attempting to find latest character for user:", currentUser.uid); const q = query(collection(db, 'characters'), where('userId', '==', currentUser.uid), orderBy('lastUpdated', 'desc'), limit(1)); const querySnapshot = await getDocs(q); if (!querySnapshot.empty) { const firstDoc = querySnapshot.docs[0]; characterIdToLoad = firstDoc.id; console.log(`Found latest character ID ${characterIdToLoad} for user.`); router.replace(`/game?characterId=${characterIdToLoad}`, { scroll: false }); } else { console.log("No existing characters found for user. Redirecting to create new."); router.replace('/game?new=true'); return; } }
            if (!characterIdToLoad) { throw new Error("Failed to determine character ID to load."); }
            setDocId(characterIdToLoad);
            characterDocRef = doc(db, 'characters', characterIdToLoad);
            const characterDoc = await getDoc(characterDocRef);
            if (characterDoc.exists()) {
                const data = characterDoc.data();
                 if (data.userId !== currentUser.uid) { console.error(`Access Denied: User ${currentUser.uid} attempted to load character ${characterIdToLoad} owned by ${data.userId}`); toast({ title: "Access Denied", description: "You do not own this character.", status: "error" }); resetCharacter(); setDocId(null); router.push('/character-manager'); return; }
                console.log("Loading character data from Firestore:", data);
                const loadedTimestamp = data.lastUpdated instanceof Timestamp ? data.lastUpdated.toMillis() : (typeof data.lastUpdated === 'number' ? data.lastUpdated : Date.now());
                const loadedBaseSkills = data.baseSkills || {};
                const mergedBaseSkills = { ...initializeBaseSkills(), ...loadedBaseSkills };
                 equipmentBonuses.reset(); featureManager.reset(); const loadedEquippedItems = data.equippedItems || defaultEquippedItems;
                const safeJSONParse = (jsonString: string | undefined | null, defaultValue: any = []): any => { if (!jsonString) return defaultValue; try { if (typeof jsonString !== 'string') return jsonString; return JSON.parse(jsonString); } catch (e) { console.error("Error parsing JSON string:", jsonString, e); return defaultValue; } };
                for (const [slot, itemUntyped] of Object.entries(loadedEquippedItems)) { /* ... existing item processing logic ... */ }
                const tempBaseStats = data.baseStats || defaultStats; const tempRace = data.selectedRace || null; const tempClass = data.selectedClass || null; const tempLevel = data.characterLevel || 1;
                const tempCurrentStats = { ...tempBaseStats };
                if(tempRace) Object.entries(tempRace.statbonus).forEach(([st, bn]) => tempCurrentStats[st as keyof CharacterStats] = (tempCurrentStats[st as keyof CharacterStats] || 0) + (bn || 0));
                if(tempClass) Object.entries(tempClass.statbonus).forEach(([st, bn]) => tempCurrentStats[st as keyof CharacterStats] = (tempCurrentStats[st as keyof CharacterStats] || 0) + (bn || 0));
                 // Recalculate HP/MP/AP based on loaded stats before setting state
                 const loadedMaxHp = (tempCurrentStats.stamina || 0) * 8 + tempLevel + (tempRace?.hpbonus || 0) + (tempClass?.hpbonus || 0);
                 const loadedMaxMp = (tempCurrentStats.intelligence || 0) * 5 + tempLevel + (tempRace?.mpbonus || 0) + (tempClass?.mpbonus || 0);
                 const loadedMaxAp = tempLevel * 2;
                 const currentHp = (data.currentHp !== undefined && data.currentHp !== null && data.currentHp <= loadedMaxHp) ? data.currentHp : loadedMaxHp;
                 const currentMp = (data.currentMp !== undefined && data.currentMp !== null && data.currentMp <= loadedMaxMp) ? data.currentMp : loadedMaxMp;
                 const currentAp = (data.currentAp !== undefined && data.currentAp !== null && data.currentAp <= loadedMaxAp) ? data.currentAp : loadedMaxAp;
                setCharacterState({
                    baseStats: data.baseStats || defaultStats,
                    selectedRace: data.selectedRace || null,
                    selectedClass: data.selectedClass || null,
                    abilityLevels: data.abilityLevels || {},
                    inventory: Array.isArray(data.inventory) ? data.inventory : [],
                    equippedItems: tempEquipped,
                    learnedSpells: data.learnedSpells || [],
                    characterName: data.characterName || 'Unnamed Character',
                    characterLevel: tempLevel,
                    baseSkills: mergedBaseSkills,
                    utilitySlots: data.utilitySlots || defaultUtilitySlots,
                    availableSkillPoints: data.availableSkillPoints ?? 16,
                    lastUpdated: loadedTimestamp,
                    notes: data.notes || defaultNotes,
                    gold: data.gold ?? 0,
                    goldTransactionHistory: data.goldTransactionHistory || [],
                    currentHp: currentHp, currentMp: currentMp, currentAp: currentAp,
                });
                setPreviousLevel(tempLevel); console.log(`Character ${data.characterName || 'Unnamed'} loaded successfully.`);
            } else { console.log(`No character document found with ID: ${characterIdToLoad}`); toast({ title: "Character Not Found", description: `Could not find character with ID ${characterIdToLoad}. Redirecting to create new.`, status: "warning" }); router.replace('/game?new=true'); return; }
        } catch (error: any) { console.error('Error loading character data:', error); toast({ title: "Load Error", description: error.message || "Could not load character data.", status: "error" }); resetCharacter(); setDocId(null); router.push('/character-manager'); } finally { setLoaded(true); setIsLoading(false); }
    };
    loadCharacterData();
  // Removed resetCharacter from dependency array to prevent potential issues with useCallback identity
  }, [currentUser, initialCharacterId, isNewCharacterMode, router, toast]);


  // --- Debounced Auto-Save Effect ---
  useEffect(() => { if (!loaded || !currentUser || !isDirty || isSaving || isLoading) return; if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); saveTimeoutRef.current = setTimeout(() => { console.log("Debounced save triggered..."); saveCharacterData(false); }, 3000); return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); }; }, [characterState, loaded, currentUser, isDirty, isSaving, isLoading, saveCharacterData]);

  // --- Visibility & Unload Save Effect ---
  useEffect(() => { if (!currentUser || !loaded) return; const handleVisibilityChange = () => { if (document.visibilityState === 'hidden' && isDirty && !isSaving) { console.log("Saving on visibility change..."); saveCharacterData(false); } }; const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (isDirty && !isSaving) { console.log("Attempting save on beforeunload..."); saveCharacterData(false); } return undefined; }; document.addEventListener('visibilitychange', handleVisibilityChange); window.addEventListener('beforeunload', handleBeforeUnload); return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); window.removeEventListener('beforeunload', handleBeforeUnload); if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); }; }, [currentUser, loaded, isDirty, isSaving, saveCharacterData]);

  // --- Periodic Save Effect ---
  useEffect(() => { if (!currentUser || !loaded) return; const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; const intervalId = setInterval(() => { if (isDirty && !isSaving) { console.log("Periodic save triggered..."); saveCharacterData(false); } }, AUTO_SAVE_INTERVAL); return () => clearInterval(intervalId); }, [currentUser, loaded, isDirty, isSaving, saveCharacterData]);

  // --- Level Up Logic ---
  useEffect(() => { if (loaded && previousLevel !== 0 && previousLevel !== characterState.characterLevel) { if (characterState.characterLevel > previousLevel) { let skillPointsToAdd = 0; for (let lvl = previousLevel + 1; lvl <= characterState.characterLevel; lvl++) { skillPointsToAdd += (lvl <= 10) ? 2 : (lvl <= 20) ? 4 : (lvl <= 30) ? 6 : (lvl <= 40) ? 8 : (lvl <= 50) ? 10 : (lvl <= 60) ? 12 : (lvl <= 70) ? 14 : (lvl <= 80) ? 16 : (lvl <= 90) ? 18 : 20; } updateCharacterState({ availableSkillPoints: (characterState.availableSkillPoints || 0) + skillPointsToAdd }); toast({ title: "Level Up!", description: `Gained ${skillPointsToAdd} skill points!`, status: "success" }); } setPreviousLevel(characterState.characterLevel); } else if (loaded && previousLevel === 0 && characterState.characterLevel > 0) { setPreviousLevel(characterState.characterLevel); } }, [characterState.characterLevel, loaded, updateCharacterState, toast]);


  // --- Delete Character ---
  const deleteCharacter = useCallback(async () => { const currentDocId = docId; if (!currentUser || !currentDocId) { toast({ title: "Error", description: "Cannot delete character: No ID found or user not logged in.", status: "error" }); return; } setIsSaving(true); try { const charDoc = await getDoc(doc(db, 'characters', currentDocId)); if (!charDoc.exists() || charDoc.data()?.userId !== currentUser.uid) { throw new Error("Character not found or permission denied."); } await deleteDoc(doc(db, 'characters', currentDocId)); toast({ title: "Character Deleted", status: "success" }); resetCharacter(); setDocId(null); router.push('/character-manager'); } catch (error: any) { console.error('Error deleting character:', error); toast({ title: "Deletion Failed", description: error.message || "Could not delete character.", status: "error" }); } finally { setIsSaving(false); } }, [currentUser, docId, resetCharacter, router, toast]);


  // --- Inventory Management ---
  const addToInventory = useCallback((item: InventoryItem) => { if (!item?.id) { console.warn("Attempted to add invalid item to inventory:", item); return; } const existingIndex = characterState.inventory.findIndex(invItem => invItem.item.id === item.id); let newInventory; if (existingIndex >= 0) { newInventory = characterState.inventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: invItem.quantity + 1 } : invItem); } else { newInventory = [...characterState.inventory, { item, quantity: 1 }]; } updateCharacterState({ inventory: newInventory }); }, [characterState.inventory, updateCharacterState]);
  const addItemsWithQuantity = useCallback((itemToAdd: InventoryItem, quantityToAdd: number) => { if (!itemToAdd?.id || quantityToAdd <= 0) { console.warn("Attempted to add invalid item or quantity:", itemToAdd, quantityToAdd); return; } const existingIndex = characterState.inventory.findIndex(invItem => invItem.item.id === itemToAdd.id); let newInventory; if (existingIndex >= 0) { newInventory = characterState.inventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: invItem.quantity + quantityToAdd } : invItem); } else { newInventory = [...characterState.inventory, { item: itemToAdd, quantity: quantityToAdd }]; } updateCharacterState({ inventory: newInventory }); }, [characterState.inventory, updateCharacterState]);
  const addMultipleItemsToInventory = useCallback((items: InventoryItem[]) => { if (!items || items.length === 0) return; let newInventory = [...characterState.inventory]; const updates = new Map<string, { item: InventoryItem, quantityChange: number }>(); items.forEach(item => { if (item?.id) { const currentUpdate = updates.get(item.id); updates.set(item.id, { item: item, quantityChange: (currentUpdate?.quantityChange || 0) + 1 }); } }); updates.forEach(({ item, quantityChange }) => { const existingIndex = newInventory.findIndex(invItem => invItem.item.id === item.id); if (existingIndex >= 0) { newInventory[existingIndex] = { ...newInventory[existingIndex], quantity: newInventory[existingIndex].quantity + quantityChange }; } else { newInventory.push({ item: item, quantity: quantityChange }); } }); updateCharacterState({ inventory: newInventory }); }, [characterState.inventory, updateCharacterState]);
  const removeFromInventory = useCallback((itemId: string) => { if (!itemId) return; const existingIndex = characterState.inventory.findIndex(invItem => invItem.item.id === itemId); if (existingIndex === -1) { console.warn(`Attempted to remove item ID ${itemId} not found.`); return; } const currentItem = characterState.inventory[existingIndex]; let newInventory; if (currentItem.quantity > 1) { newInventory = characterState.inventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: invItem.quantity - 1 } : invItem); } else { newInventory = characterState.inventory.filter((_, index) => index !== existingIndex); } updateCharacterState({ inventory: newInventory }); }, [characterState.inventory, updateCharacterState]);
  const updateInventoryItemQuantity = useCallback((itemId: string, newQuantity: number) => { if (!itemId || newQuantity < 0) { console.warn(`Invalid input for updateInventoryItemQuantity: itemId=${itemId}, newQuantity=${newQuantity}`); return; } let updatedInventory; const existingIndex = characterState.inventory.findIndex(invItem => invItem.item.id === itemId); if (newQuantity === 0) { if (existingIndex !== -1) { updatedInventory = characterState.inventory.filter((_, index) => index !== existingIndex); } else { updatedInventory = [...characterState.inventory]; } } else { if (existingIndex !== -1) { updatedInventory = characterState.inventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: newQuantity } : invItem); } else { console.warn(`updateInventoryItemQuantity called for item ID ${itemId} not found.`); updatedInventory = [...characterState.inventory]; } } updateCharacterState({ inventory: updatedInventory }); }, [characterState.inventory, updateCharacterState]);
  const getInventoryByType = useCallback((itemType: string): InventoryItemWithQuantity[] => { const lowerItemType = itemType?.toLowerCase().trim(); if (!lowerItemType) return []; return characterState.inventory.filter(invItem => invItem.item.itemType?.toLowerCase() === lowerItemType); }, [characterState.inventory]);
  // FIX 3: Explicit return type annotation
  const getItemQuantity = useCallback((itemId: string): number => { const item = characterState.inventory.find(invItem => invItem.item.id === itemId); return item ? item.quantity : 0; }, [characterState.inventory]);
  // FIX 4: Explicit return type annotation
  const hasItem = useCallback((itemId: string): boolean => { return characterState.inventory.some(invItem => invItem.item.id === itemId); }, [characterState.inventory]);


  // --- Equipment Management ---
  const equipItem = useCallback((slot: keyof EquippedItems, newItem: InventoryItem | null) => { const currentItemInSlot = characterState.equippedItems[slot]; let tempInventory = [...characterState.inventory]; if (!newItem && currentItemInSlot) { const existingIndex = tempInventory.findIndex(inv => inv.item.id === currentItemInSlot.id); if (existingIndex > -1) { tempInventory[existingIndex] = { ...tempInventory[existingIndex], quantity: tempInventory[existingIndex].quantity + 1 }; } else { tempInventory.push({ item: currentItemInSlot, quantity: 1 }); } } if (newItem) { const itemToRemoveIndex = tempInventory.findIndex(inv => inv.item.id === newItem.id); if (itemToRemoveIndex > -1) { if (tempInventory[itemToRemoveIndex].quantity > 1) { tempInventory[itemToRemoveIndex] = { ...tempInventory[itemToRemoveIndex], quantity: tempInventory[itemToRemoveIndex].quantity - 1 }; } else { tempInventory.splice(itemToRemoveIndex, 1); } } else { console.warn(`Item ${newItem.name} (${newItem.id}) being equipped was not found in inventory!`); } if (currentItemInSlot) { const existingIndex = tempInventory.findIndex(inv => inv.item.id === currentItemInSlot.id); if (existingIndex > -1) { tempInventory[existingIndex] = { ...tempInventory[existingIndex], quantity: tempInventory[existingIndex].quantity + 1 }; } else { tempInventory.push({ item: currentItemInSlot, quantity: 1 }); } } } let finalEquippedItem: WeaponItem | ArmorItem | null = null; if (newItem) { if ((slot === 'primaryWeapon' || slot === 'secondaryWeapon') && newItem.itemType === 'Weapon') { finalEquippedItem = newItem as WeaponItem; } else if (newItem.itemType === 'Armor') { finalEquippedItem = newItem as ArmorItem; } else { console.warn(`Cannot equip item type ${newItem.itemType} to slot ${String(slot)}.`); if (!tempInventory.find(inv => inv.item.id === newItem.id)) { tempInventory.push({ item: newItem, quantity: 1 }); } else { const idx = tempInventory.findIndex(inv => inv.item.id === newItem.id); if (idx > -1) tempInventory[idx] = { ...tempInventory[idx], quantity: tempInventory[idx].quantity + 1 }; } finalEquippedItem = null; } } if (finalEquippedItem !== currentItemInSlot) { equipmentBonuses.equipItem(String(slot), finalEquippedItem); if (currentItemInSlot) featureManager.removeFeatures(currentItemInSlot); if (finalEquippedItem) featureManager.addFeatures(finalEquippedItem); updateCharacterState({ equippedItems: { ...characterState.equippedItems, [slot]: finalEquippedItem }, inventory: tempInventory }); } else { if (JSON.stringify(tempInventory) !== JSON.stringify(characterState.inventory)) { updateCharacterState({ inventory: tempInventory }); } } }, [characterState.equippedItems, characterState.inventory, updateCharacterState, equipmentBonuses, featureManager]);
  const equipMultipleItems = useCallback((equipmentUpdates: Partial<Record<keyof EquippedItems, InventoryItem | null>>) => { let tempEquipped = { ...characterState.equippedItems }; let tempInventory = [...characterState.inventory]; const itemsToAddBack = new Map<string, { item: InventoryItem, count: number }>(); const itemsToRemove = new Map<string, number>(); Object.entries(equipmentUpdates).forEach(([slotKey, newItem]) => { const slot = slotKey as keyof EquippedItems; const currentItem = tempEquipped[slot]; let finalEquippedItem: WeaponItem | ArmorItem | null = null; if (newItem) { if ((slot === 'primaryWeapon' || slot === 'secondaryWeapon') && newItem.itemType === 'Weapon') { finalEquippedItem = newItem as WeaponItem; } else if (newItem.itemType === 'Armor') { finalEquippedItem = newItem as ArmorItem; } else { console.warn(`Cannot equip item type ${newItem.itemType} to slot ${String(slot)} in equipMultiple.`); finalEquippedItem = null; } } else { finalEquippedItem = null; } if (finalEquippedItem) { itemsToRemove.set(finalEquippedItem.id, (itemsToRemove.get(finalEquippedItem.id) || 0) + 1); if (currentItem) { const existingAdd = itemsToAddBack.get(currentItem.id); itemsToAddBack.set(currentItem.id, { item: currentItem, count: (existingAdd?.count || 0) + 1 }); } } else if (currentItem) { const existingAdd = itemsToAddBack.get(currentItem.id); itemsToAddBack.set(currentItem.id, { item: currentItem, count: (existingAdd?.count || 0) + 1 }); } equipmentBonuses.equipItem(String(slot), finalEquippedItem); if (currentItem) featureManager.removeFeatures(currentItem); if (finalEquippedItem) featureManager.addFeatures(finalEquippedItem); if (slot === 'primaryWeapon' || slot === 'secondaryWeapon') { tempEquipped[slot] = finalEquippedItem as WeaponItem | null; } else { tempEquipped[slot] = finalEquippedItem as ArmorItem | null; } }); itemsToRemove.forEach((count, itemId) => { const index = tempInventory.findIndex(inv => inv.item.id === itemId); if (index > -1) { const newQuantity = tempInventory[index].quantity - count; if (newQuantity > 0) { tempInventory[index] = { ...tempInventory[index], quantity: newQuantity }; } else { tempInventory.splice(index, 1); } } else { console.warn(`Tried to remove ${count}x item ID ${itemId} from inventory during equipMultiple, but item not found.`); } }); itemsToAddBack.forEach(({ item, count }) => { const index = tempInventory.findIndex(inv => inv.item.id === item.id); if (index > -1) { tempInventory[index] = { ...tempInventory[index], quantity: tempInventory[index].quantity + count }; } else { tempInventory.push({ item, quantity: count }); } }); updateCharacterState({ equippedItems: tempEquipped, inventory: tempInventory }); }, [characterState.equippedItems, characterState.inventory, updateCharacterState, equipmentBonuses, featureManager]);
  const getEquippedItem = useCallback((slot: keyof EquippedItems) => characterState.equippedItems[slot], [characterState.equippedItems]);
  const getStatBonus = useCallback((stat: string) => equipmentBonuses.getStatBonus(stat), [equipmentBonuses]);
  const getSkillBonus = useCallback((skill: string) => equipmentBonuses.getSkillBonus(skill), [equipmentBonuses]);
  const getEquipmentAbilities = useCallback(() => featureManager.getAbilities(), [featureManager]);
  const getEquipmentTraits = useCallback(() => featureManager.getTraits(), [featureManager]);
  const hasAbility = useCallback((ability: string) => featureManager.hasAbility(ability), [featureManager]);
  const hasTrait = useCallback((trait: string) => featureManager.hasTrait(trait), [featureManager]);


  // --- Stat & Skill Point Management ---
  const increaseSkill = useCallback((skillName: string) => { if (characterState.availableSkillPoints > 0) { const attribute = getAttributeForSkill(skillName); if (!attribute) { console.warn(`Attribute not found for skill: ${skillName}`); return; } const currentSkillLevel = characterState.baseSkills[skillName] || 0; const currentStatValue = characterState.baseStats[attribute] || 0; updateCharacterState({ baseSkills: { ...characterState.baseSkills, [skillName]: currentSkillLevel + 1 }, baseStats: { ...characterState.baseStats, [attribute]: currentStatValue + 1 }, availableSkillPoints: characterState.availableSkillPoints - 1, }); } else { toast({ title: "No Skill Points", description: "You have no skill points left.", status: "warning", duration: 1500 }); } }, [characterState.availableSkillPoints, characterState.baseSkills, characterState.baseStats, updateCharacterState, toast]);
  const decreaseSkill = useCallback((skillName: string) => { const currentSkillValue = characterState.baseSkills[skillName] || 0; const minimumSkillValue = 0; if (currentSkillValue > minimumSkillValue) { const attribute = getAttributeForSkill(skillName); if (!attribute) { console.warn(`Attribute not found for skill: ${skillName}`); return; } const currentStatValue = characterState.baseStats[attribute] || 0; const newStatValue = Math.max(0, currentStatValue - 1); updateCharacterState({ baseSkills: { ...characterState.baseSkills, [skillName]: currentSkillValue - 1 }, baseStats: { ...characterState.baseStats, [attribute]: newStatValue }, availableSkillPoints: characterState.availableSkillPoints + 1, }); } }, [characterState.baseSkills, characterState.baseStats, characterState.availableSkillPoints, updateCharacterState]);


  // --- Combat & Spells ---
  const createAttackFromWeapon = useCallback((weapon: WeaponItem, slot: string): Attack => { /* ... */ return {} as Attack; }, []);
  const getAttacksFromEquipment = useCallback((): Attack[] => { const weaponAttacks: Attack[] = []; if (characterState.equippedItems.primaryWeapon) weaponAttacks.push(createAttackFromWeapon(characterState.equippedItems.primaryWeapon, 'Primary')); if (characterState.equippedItems.secondaryWeapon) weaponAttacks.push(createAttackFromWeapon(characterState.equippedItems.secondaryWeapon, 'Secondary')); return weaponAttacks; }, [characterState.equippedItems, createAttackFromWeapon]);
  useEffect(() => { setAttacks(getAttacksFromEquipment()); }, [getAttacksFromEquipment]);
  const executeAttack = useCallback((attackId: string) => { const attack = attacks.find(a => a.id === attackId); if (!attack) return; console.log(`Executing attack: ${attack.name}`); toast({ title: `Attacked with ${attack.name}`, description: `Damage: ${attack.damageAmount} ${attack.damageType}, Range: ${attack.meleeRanged}`, status: "info", duration: 3000 }); }, [attacks, toast]);
  const addToLearnedSpells = useCallback((spell: Spell) => { if (!characterState.learnedSpells.some(s => s.name === spell.name)) { updateCharacterState({ learnedSpells: [...characterState.learnedSpells, spell] }); } }, [characterState.learnedSpells, updateCharacterState]);

  // --- NEW: Function to generate Spell actions from Scrolls ---
  const getScrollSpells = useCallback((): ActionSpell[] => {
    const scrollSpells: ActionSpell[] = [];
    characterState.utilitySlots.forEach(slot => {
        if (slot.stack && slot.stack.item && slot.stack.item.itemType === 'Scroll') {
            const scroll = slot.stack.item as ScrollItem;
            // Map scroll properties to spell properties
            const spellAction: ActionSpell = {
                // --- Core Spell properties - Assign undefined for missing optionals ---
                id: `scroll-${scroll.id}-${slot.id}`, // Unique ID for this action
                name: scroll.name,
                spelldescription: scroll.description || undefined, // Use undefined if empty/null
                effectdescription: scroll.effect || undefined,      // Use undefined if empty/null
                archetype: undefined, // Scrolls don't have archetypes
                school: undefined,    // Scrolls don't usually have schools
                damage: scroll.damageAmount || undefined, // Use undefined if empty/null
                damageType: scroll.damageType || undefined,
                castingTime: scroll.castingTime || undefined,
                range: scroll.range?.toString() || undefined, // Convert to string or undefined
                duration: scroll.duration?.toString() || undefined, // Convert to string or undefined
                manaPointCost: typeof scroll.manaPointCost === 'string'
                    ? parseInt(scroll.manaPointCost, 10) || undefined // Parse or undefined
                    : scroll.manaPointCost || undefined, // Use number or undefined
                spellAttackStat: undefined, // Not typically on scrolls
                spellSaveStat: undefined,   // Not typically on scrolls
                spellDC: undefined,        // Not typically on scrolls
                requiresConcentration: false, // Assume false unless specified otherwise
                isRitual: false,            // Assume false
                hasVerbalComponent: true,    // Assume default components
                hasSomaticComponent: true,
                hasMaterialComponent: false, // Assume false
                materialComponentDescription: undefined,
                scaling: scroll.scaling, // Map scaling directly (ensure type compatibility)
                cooldown: scroll.cooldown || undefined,
                spellModifier: scroll.spellCastingModifier || undefined, // Map modifier

                // --- ActionSpell specific properties ---
                source: 'scroll',
                sourceId: scroll.id,
                sourceSlotId: slot.id,
            };
            scrollSpells.push(spellAction);
        }
    });
    return scrollSpells;
}, [characterState.utilitySlots]); // Dependency: utilitySlots

  // --- NEW: Memoized combined list of all spells (learned + scrolls) ---
  const allCharacterSpells = useMemo(() => {
    const learned: ActionSpell[] = characterState.learnedSpells.map(spell => ({
        ...spell,
        source: 'learned',
        sourceId: spell.id
    }));
    const fromScrolls = getScrollSpells();
    // Combine and potentially sort or filter duplicates if needed
    // Simple combination for now:
    return [...learned, ...fromScrolls];
  }, [characterState.learnedSpells, getScrollSpells]); // Dependencies


  // --- Vitals Management ---
  const setCharacterName = useCallback((name: string) => updateCharacterState({ characterName: name }), [updateCharacterState]);
  const setCharacterLevel = useCallback((level: number) => { if (typeof level === 'number' && level >= 1) { updateCharacterState({ characterLevel: level }); } else { console.warn(`Invalid level provided: ${level}`); } }, [updateCharacterState]);
  const setCurrentHp = useCallback((hp: number) => updateCharacterState({ currentHp: Math.max(0, Math.min(hp, getMaxHp())) }), [updateCharacterState, getMaxHp]);
  const setCurrentMp = useCallback((mp: number) => updateCharacterState({ currentMp: Math.max(0, Math.min(mp, getMaxMp())) }), [updateCharacterState, getMaxMp]);
  const setCurrentAp = useCallback((ap: number) => updateCharacterState({ currentAp: Math.max(0, Math.min(ap, getMaxAp())) }), [updateCharacterState, getMaxAp]);


  // --- Utility Slots ---
  const setUtilitySlots = useCallback((slots: UtilitySlot[]) => updateCharacterState({ utilitySlots: slots }), [updateCharacterState]);
  const addItemToUtilitySlot = useCallback((slotId: string, item: InventoryItem, quantity: number) => { if (!item?.id || quantity <= 0) return; const inventoryItemIndex = characterState.inventory.findIndex(inv => inv.item.id === item.id); if (inventoryItemIndex === -1 || characterState.inventory[inventoryItemIndex].quantity < quantity) { toast({ title: "Insufficient Inventory", description: `Need ${quantity}, have ${getItemQuantity(item.id)}.`, status: "warning" }); return; } let tempInventory = [...characterState.inventory]; let tempSlots = [...characterState.utilitySlots]; const targetSlotIndex = tempSlots.findIndex(slot => slot.id === slotId); if (targetSlotIndex === -1) return; const currentSlotStack = tempSlots[targetSlotIndex].stack; if (currentSlotStack) { const oldItem = currentSlotStack.item; const oldQty = currentSlotStack.quantity; const existingInvIndex = tempInventory.findIndex(inv => inv.item.id === oldItem.id); if (existingInvIndex > -1) { tempInventory[existingInvIndex] = { ...tempInventory[existingInvIndex], quantity: tempInventory[existingInvIndex].quantity + oldQty }; } else { tempInventory.push({ item: oldItem, quantity: oldQty }); } } const currentInvQuantity = tempInventory[inventoryItemIndex].quantity; if (currentInvQuantity === quantity) { tempInventory.splice(inventoryItemIndex, 1); } else { tempInventory[inventoryItemIndex] = { ...tempInventory[inventoryItemIndex], quantity: currentInvQuantity - quantity }; } tempSlots[targetSlotIndex] = { ...tempSlots[targetSlotIndex], stack: { item, quantity } }; updateCharacterState({ inventory: tempInventory, utilitySlots: tempSlots }); }, [characterState.inventory, characterState.utilitySlots, updateCharacterState, toast, getItemQuantity]);
  const removeItemFromUtilitySlot = useCallback((slotId: string) => { const slotIndex = characterState.utilitySlots.findIndex(s => s.id === slotId); if (slotIndex === -1 || !characterState.utilitySlots[slotIndex].stack) { return; } const { item, quantity } = characterState.utilitySlots[slotIndex].stack!; addItemsWithQuantity(item, quantity); const newSlots = characterState.utilitySlots.map((s, index) => index === slotIndex ? { ...s, stack: null } : s); updateCharacterState({ utilitySlots: newSlots }); }, [characterState.utilitySlots, addItemsWithQuantity, updateCharacterState]);
  const updateUtilitySlotQuantity = useCallback((slotId: string, quantityChange: number) => { const slotIndex = characterState.utilitySlots.findIndex(s => s.id === slotId); if (slotIndex === -1 || !characterState.utilitySlots[slotIndex].stack) return; const currentSlot = characterState.utilitySlots[slotIndex]; const { item, quantity: currentQuantity } = currentSlot.stack!; const newQuantity = currentQuantity + quantityChange; if (newQuantity <= 0) { removeItemFromUtilitySlot(slotId); } else { let tempInventory = [...characterState.inventory]; let operationPossible = true; if (quantityChange > 0) { const invItemIndex = tempInventory.findIndex(inv => inv.item.id === item.id); if (invItemIndex === -1 || tempInventory[invItemIndex].quantity < quantityChange) { toast({ title: "Insufficient Inventory", description: `Need ${quantityChange} ${item.name}, have ${getItemQuantity(item.id)}.`, status: "warning" }); operationPossible = false; } else { const currentInvQty = tempInventory[invItemIndex].quantity; if (currentInvQty === quantityChange) { tempInventory.splice(invItemIndex, 1); } else { tempInventory[invItemIndex] = { ...tempInventory[invItemIndex], quantity: currentInvQty - quantityChange }; } } } else if (quantityChange < 0) { const quantityToAddBack = Math.abs(quantityChange); const invItemIndex = tempInventory.findIndex(inv => inv.item.id === item.id); if (invItemIndex > -1) { tempInventory[invItemIndex] = { ...tempInventory[invItemIndex], quantity: tempInventory[invItemIndex].quantity + quantityToAddBack }; } else { tempInventory.push({ item, quantity: quantityToAddBack }); } } if (operationPossible) { const newSlots = [...characterState.utilitySlots]; newSlots[slotIndex] = { ...currentSlot, stack: { ...currentSlot.stack!, quantity: newQuantity } }; updateCharacterState({ utilitySlots: newSlots, inventory: tempInventory }); } } }, [characterState.utilitySlots, characterState.inventory, updateCharacterState, getItemQuantity, toast, removeItemFromUtilitySlot]);


  // --- Gold Management ---
  const addGold = useCallback((amount: number, reason: string) => { if (amount <= 0) { toast({ title: 'Invalid Amount', description: 'Gold amount must be positive.', status: 'warning' }); return; } const newTransaction: GoldTransaction = { amount, reason, timestamp: Date.now(), by: currentUser?.uid }; updateCharacterState({ gold: (characterState.gold || 0) + amount, goldTransactionHistory: [...characterState.goldTransactionHistory, newTransaction].slice(-100) }); toast({title: `+${amount} Gold`, description: reason, status: "success", duration: 1500}); }, [characterState.gold, characterState.goldTransactionHistory, updateCharacterState, currentUser, toast]);
  const subtractGold = useCallback((amount: number, reason: string) => { if (amount <= 0) { toast({ title: 'Invalid Amount', description: 'Amount must be positive.', status: 'warning' }); return; } const currentGold = characterState.gold || 0; if (amount > currentGold) { toast({ title: "Insufficient Gold", description: `Need ${amount}, have ${currentGold}.`, status: "warning" }); return; } const newTransaction: GoldTransaction = { amount: -amount, reason, timestamp: Date.now(), by: currentUser?.uid }; updateCharacterState({ gold: currentGold - amount, goldTransactionHistory: [...characterState.goldTransactionHistory, newTransaction].slice(-100) }); toast({title: `-${amount} Gold`, description: reason, status: "warning", duration: 1500}); }, [characterState.gold, characterState.goldTransactionHistory, updateCharacterState, currentUser, toast]);
  const setGold = useCallback((amount: number, reason: string) => { const isShopTransaction = reason && reason.toLowerCase().includes('shop transaction'); if (isDM || isShopTransaction || amount < (characterState.gold || 0)) { const change = amount - (characterState.gold || 0); const finalReason = isShopTransaction ? reason : `Set to ${amount} (${reason || 'DM adjustment'})`; const newTransaction: GoldTransaction = { amount: change, reason: finalReason, timestamp: Date.now(), by: currentUser?.uid }; updateCharacterState({ gold: amount, goldTransactionHistory: [...characterState.goldTransactionHistory, newTransaction].slice(-100) }); if (!isShopTransaction) { toast({ title: `Gold ${change >= 0 ? 'Increased' : 'Decreased'} to ${amount}`, description: reason, status: change >= 0 ? "info" : "warning", duration: 1500 }); } } else { toast({ title: 'Unauthorized', description: 'Only DMs can set gold directly.', status: 'error' }); } }, [characterState.gold, characterState.goldTransactionHistory, updateCharacterState, isDM, currentUser, toast]);
  const processTransaction = useCallback(async (details: { /*...*/ }) => { /* ... */ }, [characterState.gold, characterState.inventory, characterState.goldTransactionHistory, updateCharacterState, saveCharacterManually, currentUser, toast]);


  // --- Crafting ---
  const craftItem = useCallback(async (componentsToRemove: { itemId: string; quantity: number }[], itemToAdd: InventoryItem): Promise<boolean> => {
    if (!docId) { console.error("Cannot craft: No document ID available."); toast({ title: "Crafting Error", description: "Character ID missing.", status: "error" }); return false; }
    const characterRef = doc(db, 'characters', docId);
    try {
      const characterSnapshot = await getDoc(characterRef);
      if (!characterSnapshot.exists()) {
        throw new Error("Character document not found");
      }
      const data = characterSnapshot.data();
      // FIX: Use InventoryItemWithQuantity instead of PlayerInventoryItem
      let currentInventory: InventoryItemWithQuantity[] = Array.isArray(data.inventory) ? data.inventory : [];

      // Process component removal
      componentsToRemove.forEach(({ itemId, quantity }) => {
        const index = currentInventory.findIndex(invItem => invItem.item.id === itemId);
        if (index === -1) {
          throw new Error(`Item ${itemId} not found in inventory`);
        }
        const currentQty = currentInventory[index].quantity;
        if (currentQty < quantity) {
          throw new Error(`Not enough of item ${itemId} (need ${quantity}, have ${currentQty})`);
        }
        if (currentQty === quantity) {
          currentInventory.splice(index, 1);
        } else {
          currentInventory[index].quantity = currentQty - quantity;
        }
      });

      // Process adding the crafted item
      const existingIndex = currentInventory.findIndex(invItem => invItem.item.id === itemToAdd.id);
      if (existingIndex >= 0) {
        currentInventory[existingIndex].quantity += 1;
      } else {
        currentInventory.push({ item: itemToAdd, quantity: 1 });
      }

      // Sanitize before updating Firestore
      const inventoryToSave = currentInventory.map(inv => ({
        item: sanitizeDataForFirestore(inv.item),
        quantity: inv.quantity
      }));
      await updateDoc(characterRef, { inventory: inventoryToSave, lastUpdated: serverTimestamp() });

      // Update local state
      setCharacterState(prevState => ({
        ...prevState,
        inventory: currentInventory,
        lastUpdated: Date.now()
      }));
      
      console.log("Craft operation completed successfully");
      setIsDirty(false);
      dirtyFieldsRef.current = {};
      setLastSaveTime(Date.now());
      return true; // Explicitly return true on success
    } catch (error) {
      console.error('Error during crafting transaction:', error);
      toast({
        title: 'Crafting Failed',
        description: error instanceof Error ? error.message : 'Could not craft item.',
        status: 'error',
        duration: 5000
      });
      return false; // Added return false in catch block
    }
  }, [docId, toast, updateCharacterState]); // Added updateCharacterState dependency

  const removeItems = useCallback(async (items: { itemId: string; quantity: number }[]) => { /* ... */ }, [characterState.inventory, updateCharacterState, toast]);


  // --- Notes Management ---
  const updateNotes = useCallback((newNotes: NotesState) => updateCharacterState({ notes: newNotes }), [updateCharacterState]);
  const addNoteCategory = useCallback((category: NoteCategory) => updateNotes([...characterState.notes, category]), [characterState.notes, updateNotes]);
  const updateNoteCategory = useCallback((categoryId: string, updates: Partial<NoteCategory>) => { updateNotes(characterState.notes.map(cat => cat.id === categoryId ? { ...cat, ...updates } : cat)); }, [characterState.notes, updateNotes]);
  const deleteNoteCategory = useCallback((categoryId: string) => { updateNotes(characterState.notes.filter(cat => cat.id !== categoryId)); }, [characterState.notes, updateNotes]);
  const addNote = useCallback((categoryId: string, note: Note) => { updateNotes(characterState.notes.map(cat => cat.id === categoryId ? { ...cat, notes: [...cat.notes, { ...note, lastEdited: Date.now() }] } : cat)); }, [characterState.notes, updateNotes]);
  const updateNote = useCallback((categoryId: string, noteId: string, updates: Partial<Note>) => { updateNotes(characterState.notes.map(cat => cat.id === categoryId ? { ...cat, notes: cat.notes.map(n => n.id === noteId ? { ...n, ...updates, lastEdited: Date.now() } : n) } : cat)); }, [characterState.notes, updateNotes]);
  const deleteNote = useCallback((categoryId: string, noteId: string) => { updateNotes(characterState.notes.map(cat => cat.id === categoryId ? { ...cat, notes: cat.notes.filter(n => n.id !== noteId) } : cat)); }, [characterState.notes, updateNotes]);


  // --- Context Value Object ---
  // REMOVED availableStatPoints, incrementStat, decrementStat
  const value: CharacterContextType = {
    characterName: characterState.characterName, setCharacterName, characterLevel: characterState.characterLevel, setCharacterLevel,
    baseStats: characterState.baseStats, setBaseStats: (stats) => updateCharacterState({ baseStats: stats }), currentStats,
    selectedRace: characterState.selectedRace, setSelectedRace: (race) => updateCharacterState({ selectedRace: race }),
    selectedClass: characterState.selectedClass, setSelectedClass: (cls) => updateCharacterState({ selectedClass: cls }),
    currentHp: characterState.currentHp, setCurrentHp, getMaxHp, currentMp: characterState.currentMp, setCurrentMp, getMaxMp, currentAp: characterState.currentAp, setCurrentAp, getMaxAp,
    baseSkills: characterState.baseSkills, currentSkills, abilityLevels: characterState.abilityLevels, setAbilityLevel: (name, level) => updateCharacterState({ abilityLevels: { ...characterState.abilityLevels, [name]: level } }),
    getEquipmentAbilities, getEquipmentTraits, hasAbility, hasTrait,
    inventory: characterState.inventory, addToInventory, addItemsWithQuantity, addMultipleItemsToInventory, removeFromInventory, updateInventoryItemQuantity, getInventoryByType, getItemQuantity, hasItem,
    equippedItems: characterState.equippedItems, equipItem, getEquippedItem, equipMultipleItems, getStatBonus, getSkillBonus, removeItems,
    utilitySlots: characterState.utilitySlots, setUtilitySlots, addItemToUtilitySlot, removeItemFromUtilitySlot, updateUtilitySlotQuantity,
    availableSkillPoints: characterState.availableSkillPoints, increaseSkill, decreaseSkill,
    attacks, getAttacksFromEquipment, executeAttack, learnedSpells: characterState.learnedSpells, addToLearnedSpells, allCharacterSpells, spellList: characterState.learnedSpells,
    notes: characterState.notes, updateNotes, addNoteCategory, updateNoteCategory, deleteNoteCategory, addNote, updateNote, deleteNote,
    gold: characterState.gold, setGold, goldTransactionHistory: characterState.goldTransactionHistory, addGold, subtractGold, processTransaction,
    craftItem,
    isDirty, isSaving, lastSaveTime, saveCharacterManually, resetCharacter, deleteCharacter,
    docId: docId,
  };

  return (
    <CharacterContext.Provider value={value}>
      {isLoading ? ( <Center h="100vh"><Spinner size="xl" color="brand.500" /></Center> ) : ( children )}
    </CharacterContext.Provider>
  );
}

// -------------------------------------------------------------------------
// Custom Hook & Helper Functions
// -------------------------------------------------------------------------
export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) throw new Error('useCharacter must be used within CharacterProvider');
  return context;
}

interface CharacterSummary { id: string; characterName: string; characterLevel: number; raceName?: string; className?: string; lastUpdated?: number; }
export async function getAllCharactersForUser(userId: string): Promise<CharacterSummary[]> { if (!userId) return []; try { const charactersRef = collection(db, 'characters'); const q = query(charactersRef, where('userId', '==', userId), orderBy('lastUpdated', 'desc')); const querySnapshot = await getDocs(q); const characters: CharacterSummary[] = querySnapshot.docs.map((doc) => { const data = doc.data(); return { id: doc.id, characterName: data.characterName || 'Unnamed Character', characterLevel: data.characterLevel || 1, raceName: data.selectedRace?.name, className: data.selectedClass?.name, lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toMillis() : data.lastUpdated, }; }); return characters; } catch (error) { console.error('Error fetching characters:', error); return []; } }
export async function deleteCharacterById(userId: string, characterId: string): Promise<boolean> { if (!userId || !characterId) return false; try { const characterRef = doc(db, 'characters', characterId); const charDoc = await getDoc(characterRef); if (!charDoc.exists() || charDoc.data()?.userId !== userId) { console.error(`Permission denied or character not found for deletion: User ${userId}, Character ${characterId}`); return false; } await deleteDoc(characterRef); return true; } catch (error) { console.error('Error deleting character via helper:', error); return false; } }

// Helper to sanitize data for Firestore
const sanitizeDataForFirestore = (data: any): any => {
    if (data === undefined) {
        return null; // Firestore doesn't like undefined
    }
    if (data === null || typeof data !== 'object' || data instanceof Timestamp || data instanceof Date) {
        return data;
    }
    if (Array.isArray(data)) {
        // Filter out undefined values from arrays before saving
        return data.map(item => sanitizeDataForFirestore(item)).filter(item => item !== undefined);
    }
    const sanitizedObject: { [key: string]: any } = {};
    for (const key in data) {
        // Skip internal React/Next.js properties or keys starting with _
        if (Object.prototype.hasOwnProperty.call(data, key) && !key.startsWith('_') && key !== '$$typeof') {
            const value = data[key];
            if (value !== undefined) { // Only include defined properties
                sanitizedObject[key] = sanitizeDataForFirestore(value);
            } else {
                 sanitizedObject[key] = null; // Or explicitly set to null if needed
            }
        }
    }
    return sanitizedObject;
};

// --- END OF FILE CharacterContext.tsx ---