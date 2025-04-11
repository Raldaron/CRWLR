// --- START OF FILE CharacterContext.tsx ---
// --- (Keep imports and other code the same) ---
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
import type { CharacterStats } from '@/types/character';
import type { Class } from '@/types/class';
import type { WeaponItem } from '@/types/weapon';
import type { ArmorItem } from '@/types/armor';
import type { InventoryItem, InventoryItemWithQuantity } from '@/types/inventory';
import type { Spell } from '@/types/spell';
import AttackCard from '@/components/ItemCards/AttackCard'; // Import the component
import type { Attack } from '@/types/attack'; // Import the TYPE from the correct types file
import type { Race } from '@/types/race';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
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
// Removed: import { EquipmentAbilitiesManager } from '@/types/equipmentAbilitiesManager';

// -------------------------------------------------------------------------
// Reinstated FeatureManager Class (from original CharacterContext.tsx)
// You could also move this to its own file e.g., src/managers/FeatureManager.ts and import it
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

// Equipped Items Interface
interface EquippedItems {
  primaryWeapon: WeaponItem | null; secondaryWeapon: WeaponItem | null;
  head: ArmorItem | null; face0: ArmorItem | null; face1: ArmorItem | null;
  neck: ArmorItem | null; shoulders: ArmorItem | null; torso: ArmorItem | null;
  arm0: ArmorItem | null; arm1: ArmorItem | null; wrist0: ArmorItem | null; wrist1: ArmorItem | null;
  finger0: ArmorItem | null; finger1: ArmorItem | null; finger2: ArmorItem | null; finger3: ArmorItem | null;
  waist: ArmorItem | null; legs: ArmorItem | null; thighs: ArmorItem | null;
  knees: ArmorItem | null; shins: ArmorItem | null; ankle0: ArmorItem | null;
  ankle1: ArmorItem | null; feet: ArmorItem | null; toes0: ArmorItem | null;
  toes1: ArmorItem | null; toes2: ArmorItem | null; toes3: ArmorItem | null;
}

// Other Interfaces
interface AbilityLevels { [key: string]: number; }
interface CharacterSkills { [key: string]: number; }
interface Note { id: string; title: string; content: string; lastEdited: number; } // timestamp
interface NoteCategory { id: string; name: string; notes: Note[]; }
type NotesState = NoteCategory[];

// Consolidated Character State Interface (Combined)
interface CharacterState {
  baseStats: CharacterStats; selectedRace: Race | null; selectedClass: Class | null;
  abilityLevels: AbilityLevels; inventory: InventoryItemWithQuantity[]; equippedItems: EquippedItems;
  learnedSpells: Spell[]; characterName: string; currentHp: number; currentMp: number;
  currentAp: number; characterLevel: number; baseSkills: CharacterSkills;
  utilitySlots: UtilitySlot[]; availableStatPoints: number; availableSkillPoints: number;
  lastUpdated: number; // Store as milliseconds timestamp
  notes: NotesState; gold: number; goldTransactionHistory: GoldTransaction[];
}

// -------------------------------------------------------------------------
// Default Values
// -------------------------------------------------------------------------
const defaultStats: CharacterStats = { strength: 0, dexterity: 0, stamina: 0, intelligence: 0, perception: 0, wit: 0, charisma: 0 };
const defaultEquippedItems: EquippedItems = {
  primaryWeapon: null, secondaryWeapon: null, head: null, face0: null, face1: null, neck: null,
  shoulders: null, torso: null, arm0: null, arm1: null, wrist0: null, wrist1: null,
  finger0: null, finger1: null, finger2: null, finger3: null, waist: null, legs: null,
  thighs: null, knees: null, shins: null, ankle0: null, ankle1: null, feet: null,
  toes0: null, toes1: null, toes2: null, toes3: null,
};
const defaultNotes: NotesState = [ { id: 'general-' + Date.now(), name: 'General', notes: [ { id: 'welcome-' + Date.now(), title: 'Welcome to Notes', content: 'Use this tab to keep track of important information during your adventures. You can create different categories to organize your notes!', lastEdited: Date.now() } ] }, { id: 'quests-' + Date.now(), name: 'Quests', notes: [] }, { id: 'npcs-' + Date.now(), name: 'NPCs', notes: [] } ];
const defaultUtilitySlots: UtilitySlot[] = Array.from({ length: 10 }, (_, i) => ({ id: `utility${i}`, name: `Utility Slot ${i + 1}`, stack: null }));

// -------------------------------------------------------------------------
// Context Interface (Combined & Fully Typed)
// -------------------------------------------------------------------------
export interface CharacterContextType {
  // Basic Info
  characterName: string; setCharacterName: (name: string) => void;
  characterLevel: number; setCharacterLevel: (level: number) => void;
  // Core Attributes
  baseStats: CharacterStats; setBaseStats: (stats: CharacterStats) => void;
  currentStats: CharacterStats; // Derived
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
  baseSkills: CharacterSkills; currentSkills: CharacterSkills; // Derived
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
  getItemQuantity: (itemId: string) => number;
  hasItem: (itemId: string) => boolean;
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
  availableStatPoints: number; incrementStat: (stat: keyof CharacterStats) => void; decrementStat: (stat: keyof CharacterStats) => void;
  availableSkillPoints: number; increaseSkill: (skillName: string) => void; decreaseSkill: (skillName: string) => void;
  // Combat
  attacks: Attack[]; // Derived
  getAttacksFromEquipment: () => Attack[]; executeAttack: (attackId: string) => void;
  // Spells
  learnedSpells: Spell[]; addToLearnedSpells: (spell: Spell) => void;
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

  // Equipment Managers (Instantiated once using imported/internal classes)
  const equipmentBonuses = useMemo(() => new EquipmentBonusManager(), []);
  const featureManager = useMemo(() => new FeatureManager(), []); // Use internal or imported FeatureManager

  // Consolidated character state
  const [characterState, setCharacterState] = useState<CharacterState>({
    baseStats: defaultStats, selectedRace: null, selectedClass: null,
    abilityLevels: {}, inventory: [], equippedItems: defaultEquippedItems,
    learnedSpells: [], characterName: '', currentHp: 8, currentMp: 5,
    currentAp: 2, characterLevel: 1, baseSkills: {}, utilitySlots: defaultUtilitySlots,
    availableStatPoints: 7, availableSkillPoints: 16, lastUpdated: 0, // Initialize timestamp
    notes: defaultNotes, gold: 0, goldTransactionHistory: [],
  });

  // Other non-persistent states
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading indicator state
  const [docId, setDocId] = useState<string | null>(null); // Start null, set during load
  const [previousLevel, setPreviousLevel] = useState<number>(0); // Initialize to 0 before load
  const [attacks, setAttacks] = useState<Attack[]>([]);

  // Save tracking states
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(0); // Tracks JS time of last Firestore save attempt success
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for debounced save timeout
  const dirtyFieldsRef = useRef<{ [key: string]: boolean }>({}); // Tracks specific dirty fields

  // --- Derived Values ---
  const currentStats = useMemo(() => {
    let stats = { ...characterState.baseStats };
    if (characterState.selectedRace) Object.entries(characterState.selectedRace.statbonus).forEach(([st, bn]) => { stats[st as keyof CharacterStats] = (stats[st as keyof CharacterStats] || 0) + bn; });
    if (characterState.selectedClass) Object.entries(characterState.selectedClass.statbonus).forEach(([st, bn]) => { stats[st as keyof CharacterStats] = (stats[st as keyof CharacterStats] || 0) + bn; });
    const eqStatBonuses = equipmentBonuses.getStatBonuses();
    Object.entries(eqStatBonuses).forEach(([st, bn]) => { stats[st as keyof CharacterStats] = (stats[st as keyof CharacterStats] || 0) + bn; });
    return stats;
  }, [characterState.baseStats, characterState.selectedRace, characterState.selectedClass, equipmentBonuses]);

  const currentSkills = useMemo(() => {
    let skills = { ...characterState.baseSkills };
    if (characterState.selectedRace) Object.entries(characterState.selectedRace.skillbonus).forEach(([sk, bn]) => { skills[sk] = (skills[sk] || 0) + bn; });
    if (characterState.selectedClass) Object.entries(characterState.selectedClass.skillbonus).forEach(([sk, bn]) => { skills[sk] = (skills[sk] || 0) + bn; });
    const eqSkillBonuses = equipmentBonuses.getSkillBonuses();
    Object.entries(eqSkillBonuses).forEach(([sk, bn]) => { skills[sk] = (skills[sk] || 0) + bn; });
    return skills;
  }, [characterState.baseSkills, characterState.selectedRace, characterState.selectedClass, equipmentBonuses]);

  // --- Derived Getters (FIXED case sensitivity) ---
  const getMaxHp = useCallback(() => (currentStats.stamina || 0) * 8 + (characterState.characterLevel || 0) + (characterState.selectedRace?.hpbonus || 0) + (characterState.selectedClass?.hpbonus || 0), [currentStats.stamina, characterState.characterLevel, characterState.selectedRace, characterState.selectedClass]);
  const getMaxMp = useCallback(() => (currentStats.intelligence || 0) * 5 + (characterState.characterLevel || 0) + (characterState.selectedRace?.mpbonus || 0) + (characterState.selectedClass?.mpbonus || 0), [currentStats.intelligence, characterState.characterLevel, characterState.selectedRace, characterState.selectedClass]);
  const getMaxAp = useCallback(() => (characterState.characterLevel || 0) * 2, [characterState.characterLevel]);


  // Updater function for consolidated state with dirty tracking
  const updateCharacterState = useCallback((updates: Partial<CharacterState>) => {
    let hasChanges = false;
    const newState = { ...characterState, ...updates, lastUpdated: Date.now() }; // Calculate new state first

    // Mark fields as dirty only if the value actually changed
    Object.keys(updates).forEach(key => {
        const typedKey = key as keyof CharacterState;
        if (characterState[typedKey] !== newState[typedKey]) {
             dirtyFieldsRef.current[key] = true;
             hasChanges = true;
        }
        // Add deep comparisons for complex objects if simple reference check isn't enough
        if (key === 'inventory' && JSON.stringify(characterState.inventory) !== JSON.stringify(newState.inventory)) { dirtyFieldsRef.current.inventory = true; hasChanges = true; }
        if (key === 'equippedItems' && JSON.stringify(characterState.equippedItems) !== JSON.stringify(newState.equippedItems)) { dirtyFieldsRef.current.equippedItems = true; hasChanges = true; }
        if (key === 'notes' && JSON.stringify(characterState.notes) !== JSON.stringify(newState.notes)) { dirtyFieldsRef.current.notes = true; hasChanges = true; }
        if (key === 'baseStats' && JSON.stringify(characterState.baseStats) !== JSON.stringify(newState.baseStats)) { dirtyFieldsRef.current.baseStats = true; hasChanges = true; }
        if (key === 'baseSkills' && JSON.stringify(characterState.baseSkills) !== JSON.stringify(newState.baseSkills)) { dirtyFieldsRef.current.baseSkills = true; hasChanges = true; }
         // Add others if needed (utilitySlots, learnedSpells, goldTransactionHistory, abilityLevels)
    });

    if (hasChanges) {
        setIsDirty(true); // Set overall dirty flag if any field changed
        setCharacterState(newState); // Apply the update
    }
  }, [characterState]); // Dependency: characterState is needed for comparison


  // --- Save Character Data Function ---
  const saveCharacterData = useCallback(async (isManualSave = false): Promise<boolean> => {
    if (!loaded || !currentUser || isSaving) return false;
    if (!isDirty && !isManualSave) return true;

    const currentDocId = docId;
    const needsCreation = isNewCharacterMode && !currentDocId;

    if (!currentDocId && !needsCreation) {
      console.error("Cannot save: No document ID available and not in new character mode.");
      toast({ title: "Save Error", description: "Character ID missing.", status: "error" });
      return false;
    }

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
        availableStatPoints: characterState.availableStatPoints,
        availableSkillPoints: characterState.availableSkillPoints,
        gold: characterState.gold,
        lastUpdated: serverTimestamp(),
        // --- Include all potentially changed fields for save ---
        inventory: characterState.inventory,
        equippedItems: characterState.equippedItems,
        learnedSpells: characterState.learnedSpells,
        abilityLevels: characterState.abilityLevels,
        utilitySlots: characterState.utilitySlots,
        notes: characterState.notes,
        goldTransactionHistory: characterState.goldTransactionHistory,
      };

      // --- Determine which fields to actually save ---
      const fieldsToSave = (isManualSave || needsCreation)
          ? Object.keys(dataToSave) // Save everything on manual or creation
          : Object.keys(dirtyFieldsRef.current).filter(key => dirtyFieldsRef.current[key]); // Only save dirty fields on auto-save

      const finalDataToSave: Record<string, any> = { userId: currentUser.uid, lastUpdated: serverTimestamp() }; // Always include userId and timestamp

      fieldsToSave.forEach(key => {
          // Make sure the key is actually part of our intended data
          if (key in dataToSave && key !== 'userId' && key !== 'lastUpdated') {
              finalDataToSave[key] = dataToSave[key];
          }
      });

      // --- Ensure arrays/objects aren't saved as undefined ---
      Object.keys(finalDataToSave).forEach(key => {
        if (finalDataToSave[key] === undefined) {
            finalDataToSave[key] = null; // Use null instead of undefined for Firestore compatibility
        }
        // Ensure array fields are saved as empty arrays if they become null/undefined, prevents errors
        if (['inventory', 'learnedSpells', 'utilitySlots', 'notes', 'goldTransactionHistory', 'abilities', 'traits', 'spellsGranted'].includes(key) && !Array.isArray(finalDataToSave[key])) {
            finalDataToSave[key] = [];
        }
        // Ensure object fields are saved as empty objects if they become null/undefined
        if (['baseStats', 'baseSkills', 'equippedItems', 'abilityLevels', 'statBonus', 'skillBonus', 'scaling'].includes(key) && (finalDataToSave[key] === null || typeof finalDataToSave[key] !== 'object' || Array.isArray(finalDataToSave[key]))) {
            finalDataToSave[key] = {};
        }
      });

      // Clean data to replace any remaining undefined with null
      const removeUndefined = (obj: any): any => {
        if (obj === undefined) return null;
        if (obj === null) return null;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => removeUndefined(item));
        const cleanedObj: any = {};
        Object.entries(obj).forEach(([key, value]) => {
          cleanedObj[key] = removeUndefined(value);
        });
        return cleanedObj;
      };

      const cleanedDataToSave = removeUndefined(finalDataToSave);

      if (needsCreation) {
        // Create a type for the creation data that includes an index signature
        type CreationDataType = {
          userId: string;
          lastUpdated: ReturnType<typeof serverTimestamp>;
          [key: string]: any; // Allow any additional string keys
        };

        // Ensure all fields are present for creation
        const creationData: CreationDataType = { 
          ...dataToSave, 
          userId: currentUser.uid, 
          lastUpdated: serverTimestamp() 
        };

        // Re-sanitize just in case
        Object.keys(creationData).forEach(key => {
            if (creationData[key] === undefined) creationData[key] = null;
            if (['inventory', 'learnedSpells', 'utilitySlots', 'notes', 'goldTransactionHistory', 'abilities', 'traits', 'spellsGranted'].includes(key) && !Array.isArray(creationData[key])) {
                creationData[key] = [];
            }
            if (['baseStats', 'baseSkills', 'equippedItems', 'abilityLevels', 'statBonus', 'skillBonus', 'scaling'].includes(key) && (creationData[key] === null || typeof creationData[key] !== 'object' || Array.isArray(creationData[key]))) {
                creationData[key] = {};
            }
        });

        const newDocRef = await addDoc(collection(db, 'characters'), creationData);
        setDocId(newDocRef.id);
        console.log(`Created new character with ID: ${newDocRef.id}`);
        router.replace(`/game?characterId=${newDocRef.id}`, { scroll: false }); // Update URL without reload
      } else if (currentDocId && Object.keys(cleanedDataToSave).length > 2) { // Only save if there's more than just userId/timestamp
        const characterRef = doc(db, 'characters', currentDocId);
        await setDoc(characterRef, cleanedDataToSave, { merge: true }); // Now using cleanedDataToSave here
        console.log(`Saved character changes to document: ${currentDocId}. Fields:`, Object.keys(cleanedDataToSave));
      } else if (currentDocId) {
          console.log(`No changes detected for auto-save for character: ${currentDocId}`);
          // Still reset dirty state even if nothing was saved to Firestore
      }

      setIsDirty(false);
      dirtyFieldsRef.current = {};
      setLastSaveTime(Date.now()); // Record time of save attempt completion

      if (isManualSave) {
        toast({ title: "Character Saved", status: "success", duration: 2000, isClosable: true });
      }
      return true; // Indicate save attempt was processed

    } catch (error: any) {
      console.error('Error saving character data:', error);
      toast({ title: "Save Failed", description: error.message || "Could not save character data.", status: "error" });
      return false; // Indicate save failed
    } finally {
      setIsSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterState, currentUser, docId, loaded, isDirty, isSaving, toast, router, isNewCharacterMode]); // Dependencies

  

  // --- Manual Save Function ---
  const saveCharacterManually = useCallback(async () => {
    if (!loaded || !currentUser) {
      toast({ title: "Cannot Save", description: "Character not loaded or user not logged in.", status: "warning"});
      return;
    }
    // Set all fields as dirty for manual save to ensure everything is included
    dirtyFieldsRef.current = Object.keys(characterState).reduce((acc, key) => { acc[key] = true; return acc; }, {} as Record<string, boolean>);
    setIsDirty(true);
    await saveCharacterData(true); // Call core save function with manual flag
  }, [currentUser, loaded, saveCharacterData, toast, characterState]); // Added characterState


  // --- Load Character Data (FIXED case sensitivity for bonuses) ---
  useEffect(() => {
    const loadCharacterData = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return; // No user logged in
      }
      setLoaded(false);
      setIsLoading(true);
      setIsDirty(false); // Start clean
      dirtyFieldsRef.current = {};
    
      // Declare tempEquipped here, initialized with defaults
      let tempEquipped: EquippedItems = { ...defaultEquippedItems };
    
      try {
        let characterIdToLoad: string | null = initialCharacterId; // From URL param first
        let characterDocRef;
    
        if (isNewCharacterMode) {
          console.log("Initializing new character state.");
          resetCharacter();
          setDocId(null); // Ensure docId is null for new characters
          setLoaded(true);
          setIsLoading(false);
          // Mark as dirty immediately for initial save
          setIsDirty(true);
          dirtyFieldsRef.current = Object.keys(characterState).reduce((acc, key) => { acc[key] = true; return acc; }, {} as Record<string, boolean>);
          return;
        }
    
        // If no characterId in URL, find the latest one for the user
        if (!characterIdToLoad) {
          console.log("No characterId in URL, attempting to find latest character for user:", currentUser.uid);
          const q = query(collection(db, 'characters'), where('userId', '==', currentUser.uid), orderBy('lastUpdated', 'desc'), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            characterIdToLoad = firstDoc.id;
            console.log(`Found latest character ID ${characterIdToLoad} for user.`);
            // Update URL to reflect the loaded character ID
            router.replace(`/game?characterId=${characterIdToLoad}`, { scroll: false });
          } else {
            // No characters found at all, redirect to create new character flow
            console.log("No existing characters found for user. Redirecting to create new.");
            router.replace('/game?new=true'); // Use replace to avoid back button issues
            // No need to reset state here, the effect will re-run with new=true
            return;
          }
        }
    
        if (!characterIdToLoad) { throw new Error("Failed to determine character ID to load."); }
    
        setDocId(characterIdToLoad);
        characterDocRef = doc(db, 'characters', characterIdToLoad);
        const characterDoc = await getDoc(characterDocRef);
    
        if (characterDoc.exists()) {
          const data = characterDoc.data();
    
          if (data.userId !== currentUser.uid) {
            // Access denied logic
            console.error(`Access Denied: User ${currentUser.uid} attempted to load character ${characterIdToLoad} owned by ${data.userId}`);
            toast({ title: "Access Denied", description: "You do not own this character.", status: "error" });
            resetCharacter();
            setDocId(null);
            router.push('/character-manager');
            return;
          }
    
          console.log("Loading character data from Firestore:", data);
          const loadedTimestamp = data.lastUpdated instanceof Timestamp
            ? data.lastUpdated.toMillis()
            : (typeof data.lastUpdated === 'number' ? data.lastUpdated : Date.now());
    
          // Prepare temporary state for calculations
          const tempBaseStats = data.baseStats || defaultStats;
          const tempRace = data.selectedRace || null;
          const tempClass = data.selectedClass || null;
          const tempLevel = data.characterLevel || 1;
          const loadedMaxHp = (tempBaseStats.stamina || 0) * 8 + tempLevel + (tempRace?.hpbonus || 0) + (tempClass?.hpbonus || 0);
          const loadedMaxMp = (tempBaseStats.intelligence || 0) * 5 + tempLevel + (tempRace?.mpbonus || 0) + (tempClass?.mpbonus || 0);
          const loadedMaxAp = tempLevel * 2;
          const currentHp = (data.currentHp !== undefined && data.currentHp !== null && data.currentHp <= loadedMaxHp) ? data.currentHp : loadedMaxHp;
          const currentMp = (data.currentMp !== undefined && data.currentMp !== null && data.currentMp <= loadedMaxMp) ? data.currentMp : loadedMaxMp;
          const currentAp = (data.currentAp !== undefined && data.currentAp !== null && data.currentAp <= loadedMaxAp) ? data.currentAp : loadedMaxAp;
    
          // Re-initialize equipment managers and process loaded items
          equipmentBonuses.reset();
          featureManager.reset();
          const loadedEquippedItems = data.equippedItems || defaultEquippedItems;
          
          const removeUndefined = (obj: any): any => {
            if (obj === null || obj === undefined) {
              return null; // Replace undefined with null
            }
            
            if (Array.isArray(obj)) {
              return obj.map(item => removeUndefined(item));
            }
            
            if (typeof obj === 'object') {
              const result: any = {};
              for (const key in obj) {
                const value = removeUndefined(obj[key]);
                if (value !== undefined) {
                  result[key] = value;
                } else {
                  result[key] = null; // Replace undefined with null
                }
              }
              return result;
            }
            
            return obj;
          };

          // Helper function to parse JSON strings safely
          const safeJSONParse = (jsonString: string | undefined | null, defaultValue: any = []): any => {
            if (!jsonString) return defaultValue;
            
            try {
              // Check if it's already an array or object
              if (typeof jsonString !== 'string') return jsonString;
              
              // Parse the JSON string
              return JSON.parse(jsonString);
            } catch (e) {
              console.error("Error parsing JSON string:", jsonString, e);
              return defaultValue;
            }
          };
    
          // Process loaded equipped items - Change from forEach to for...of to support async/await
          for (const [slot, itemUntyped] of Object.entries(loadedEquippedItems)) {
            // Ensure itemUntyped is treated as 'any' for flexibility
            const item = itemUntyped as any;
            const slotKey = slot as keyof EquippedItems;
    
            if (item) { // Check if item data exists
              // Process based on item type
              if (item.itemType === 'Weapon' && (slotKey === 'primaryWeapon' || slotKey === 'secondaryWeapon')) {
                // Log raw weapon data for debugging
                console.log(`[WEAPON DEBUG] Raw weapon data for ${item.name}:`, JSON.stringify(item, null, 2));
                
                // Parse arrays and objects that might be stored as strings
                const abilities = safeJSONParse(item.abilities, []);
                const traits = safeJSONParse(item.traits, []);
                const spellsGranted = safeJSONParse(item.spellsGranted, []);
                const skillBonus = safeJSONParse(item.skillBonus, {});
                
                // Handle statBonus separately since it might be problematic
                let statBonus = {};
                try {
                  if (item.statBonus && !isNaN(item.statBonus)) {
                    statBonus = JSON.parse(item.statBonus);
                  } else if (typeof item.statBonus === 'object') {
                    statBonus = item.statBonus;
                  }
                } catch (e) {
                  console.warn("Could not parse statBonus", item.statBonus);
                }
                
                // Check if we have all the required weapon fields
                const hasMissingFields = !item.weaponType || !item.damageType || !item.meleeRanged;
                
                // Fetch complete weapon data if critical fields are missing
                if (hasMissingFields) {
                  try {
                    console.log(`[WEAPON LOAD] Missing critical fields for ${item.name}. Attempting to fetch from Firestore.`);
                    
                    // Fetch complete weapon data
                    const weaponDoc = await getDoc(doc(db, 'weapons', item.id));
                    
                    if (weaponDoc.exists()) {
                      const freshData = weaponDoc.data();
                      console.log(`[WEAPON LOAD] Fresh data from Firestore:`, freshData);
                      
                      // Update the missing fields with data from Firestore
                      item.weaponType = freshData.weaponType || item.weaponType || 'Unknown';
                      item.damageType = freshData.damageType || item.damageType || 'Physical';
                      item.meleeRanged = freshData.meleeRanged || item.meleeRanged || 'Melee';
                      item.handsRequired = freshData.handsRequired || item.handsRequired || 'One-handed';
                      item.magicNonMagical = freshData.magicNonMagical || item.magicNonMagical || 'Non-Magical';
                      
                      // Update arrays/objects if available in fresh data
                      if (freshData.abilities) item.abilities = freshData.abilities;
                      if (freshData.traits) item.traits = freshData.traits;
                      if (freshData.spellsGranted) item.spellsGranted = freshData.spellsGranted;
                      if (freshData.statBonus) item.statBonus = freshData.statBonus;
                      if (freshData.skillBonus) item.skillBonus = freshData.skillBonus;
                    } else {
                      console.warn(`[WEAPON LOAD] Weapon ID ${item.id} not found in Firestore.`);
                    }
                  } catch (err) {
                    console.error(`[WEAPON LOAD] Error fetching fresh data for ${item.name}:`, err);
                  }
                }
                
                console.log('[WEAPON LOAD DEBUG] Raw item data from Firestore:', JSON.stringify(item, null, 2));
                const typedWeapon: WeaponItem = {
                  id: item.id || `temp-${Math.random()}`,
                  name: item.name || 'Unknown Weapon',
                  description: item.description || '',
                  itemType: 'Weapon',
                  rarity: item.rarity || 'Common',
                  
                  // Use the exact values from Firebase for simple fields, with fallbacks
                  meleeRanged: item.meleeRanged as 'Melee' | 'Ranged' || 'Melee', 
                  weaponType: item.weaponType || 'Unknown',
                  
                  magicNonMagical: item.magicNonMagical || 'Non-Magical',
                  handsRequired: item.handsRequired || 'One-handed',
                  damageAmount: item.damageAmount || 'N/A',
                  damageType: item.damageType || 'Physical',
                  
                  // Use the parsed values for complex properties
                  statBonus: statBonus,
                  skillBonus: skillBonus,
                  abilities: Array.isArray(abilities) ? abilities : [],
                  traits: Array.isArray(traits) ? traits : [],
                  spellsGranted: Array.isArray(spellsGranted) ? spellsGranted : [],
                  
                  // Simple number properties
                  hpBonus: Number(item.hpBonus || 0),
                  mpBonus: Number(item.mpBonus || 0),
                  sellValue: Number(item.sellValue || 0),
                  buyValue: Number(item.buyValue || 0),
                };
                
                console.log('[WEAPON LOAD DEBUG] Constructed typedWeapon:', JSON.stringify(typedWeapon, null, 2));
                
                // Detailed logging to verify the mapped object
                console.log(`[WEAPON DEBUG] Mapped weapon properties for ${typedWeapon.name}:`);
                console.log(`  - meleeRanged: "${typedWeapon.meleeRanged}" (from "${item.meleeRanged}")`);
                console.log(`  - weaponType: "${typedWeapon.weaponType}" (from "${item.weaponType}")`);
                console.log(`  - damageType: "${typedWeapon.damageType}" (from "${item.damageType}")`);
                
                equipmentBonuses.equipItem(slotKey, typedWeapon);
                featureManager.addFeatures(typedWeapon);
                tempEquipped[slotKey] = typedWeapon;
              } else if (item.itemType === 'Armor') {
                // Process armor items with similar parsing approach for complex properties
                const abilities = safeJSONParse(item.abilities, []);
                const traits = safeJSONParse(item.traits, []);
                const spellsGranted = safeJSONParse(item.spellsGranted, []);
                const statBonus = safeJSONParse(item.statBonus, {});
                const skillBonus = safeJSONParse(item.skillBonus, {});
                
                const armorSlotKeys: Array<keyof EquippedItems> = [
                    'head', 'face0', 'face1', 'neck', 'shoulders', 'torso', 'arm0', 'arm1',
                    'wrist0', 'wrist1', 'finger0', 'finger1', 'finger2', 'finger3',
                    'waist', 'legs', 'thighs', 'knees', 'shins', 'ankle0', 'ankle1',
                    'feet', 'toes0', 'toes1', 'toes2', 'toes3'
                ];
                
                if (armorSlotKeys.includes(slotKey)) {
                  const typedArmor: ArmorItem = {
                    id: item.id || `temp-${Math.random()}`,
                    name: item.name || 'Unknown Armor',
                    description: item.description || '',
                    itemType: 'Armor',
                    armorType: item.armorType || 'Unknown',
                    rarity: item.rarity || 'Common',
                    armorRating: Number(item.armorRating || 0),
                    tankModifier: Number(item.tankModifier || 0),
                    statBonus: statBonus,
                    skillBonus: skillBonus,
                    abilities: Array.isArray(abilities) ? abilities : [],
                    traits: Array.isArray(traits) ? traits : [],
                    spellsGranted: Array.isArray(spellsGranted) ? spellsGranted : [],
                    hpBonus: Number(item.hpBonus || 0),
                    mpBonus: Number(item.mpBonus || 0),
                    sellValue: Number(item.sellValue || 0),
                    buyValue: Number(item.buyValue || 0),
                  };
                  
                  equipmentBonuses.equipItem(slotKey, typedArmor);
                  featureManager.addFeatures(typedArmor);
                  (tempEquipped[slotKey] as ArmorItem | null) = typedArmor;
                } else {
                  console.warn(`Attempted to assign Armor item to non-armor slot: ${slotKey}`);
                }
              } else {
                console.warn(`Item in slot ${slotKey} has unrecognized itemType: ${item.itemType || '(missing)'}`);
                tempEquipped[slotKey] = null;
              }
            } else {
              tempEquipped[slotKey] = null;
            }
          }
    
          // Set the actual character state
          setCharacterState({
            baseStats: tempBaseStats,
            selectedRace: tempRace,
            selectedClass: tempClass,
            abilityLevels: data.abilityLevels || {},
            inventory: Array.isArray(data.inventory) ? data.inventory : [],
            equippedItems: tempEquipped, // Use the processed items
            learnedSpells: data.learnedSpells || [],
            characterName: data.characterName || 'Unnamed Character',
            characterLevel: tempLevel,
            baseSkills: data.baseSkills || {},
            utilitySlots: data.utilitySlots || defaultUtilitySlots,
            availableStatPoints: data.availableStatPoints ?? 7,
            availableSkillPoints: data.availableSkillPoints ?? 16,
            lastUpdated: loadedTimestamp,
            notes: data.notes || defaultNotes,
            gold: data.gold ?? 0,
            goldTransactionHistory: data.goldTransactionHistory || [],
            currentHp: currentHp,
            currentMp: currentMp,
            currentAp: currentAp,
          });
    
          setPreviousLevel(tempLevel); // Set previous level *after* setting state
    
          console.log(`Character ${data.characterName || 'Unnamed'} loaded successfully.`);
    
        } else {
          // Character not found logic
          console.log(`No character document found with ID: ${characterIdToLoad}`);
          toast({ title: "Character Not Found", description: `Could not find character with ID ${characterIdToLoad}. Redirecting to create new.`, status: "warning" });
          router.replace('/game?new=true'); // Redirect to create new if not found
          // State reset will happen on next effect run
          return;
        }
      } catch (error: any) {
        // Error handling logic
        console.error('Error loading character data:', error);
        toast({ title: "Load Error", description: error.message || "Could not load character data.", status: "error" });
        resetCharacter(); // Reset to default on load error
        setDocId(null);
        router.push('/character-manager'); // Go back to manager on error
      } finally {
        setLoaded(true); // Mark loading complete
        setIsLoading(false);
      }
    };
  
    loadCharacterData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, initialCharacterId, isNewCharacterMode, router, toast]);// Dependencies for load effect


  // --- Debounced Auto-Save Effect ---
  useEffect(() => {
    if (!loaded || !currentUser || !isDirty || isSaving || isLoading) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      console.log("Debounced save triggered...");
      saveCharacterData(false);
    }, 3000); // 3 second debounce

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [characterState, loaded, currentUser, isDirty, isSaving, isLoading, saveCharacterData]); // characterState is the trigger


  // --- Visibility & Unload Save Effect ---
  useEffect(() => {
    if (!currentUser || !loaded) return;
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden' && isDirty && !isSaving) { console.log("Saving on visibility change..."); saveCharacterData(false); } };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (isDirty && !isSaving) { console.log("Attempting save on beforeunload..."); saveCharacterData(false); /* e.preventDefault(); e.returnValue = ''; return e.returnValue; */ } return undefined; }; // Note: Reliable save on unload is tricky.
    document.addEventListener('visibilitychange', handleVisibilityChange); window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { document.removeEventListener('visibilitychange', handleVisibilityChange); window.removeEventListener('beforeunload', handleBeforeUnload); if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, loaded, isDirty, isSaving, saveCharacterData]); // Dependencies


  // --- Periodic Save Effect ---
  useEffect(() => {
    if (!currentUser || !loaded) return;
    const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const intervalId = setInterval(() => {
        // Only save periodically if there are changes and not currently saving
        if (isDirty && !isSaving) {
            console.log("Periodic save triggered...");
            saveCharacterData(false);
        }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, loaded, isDirty, isSaving, saveCharacterData]); // Dependencies


  // --- Level Up Logic ---
  useEffect(() => {
    if (loaded && previousLevel !== 0 && previousLevel !== characterState.characterLevel) {
      if (characterState.characterLevel > previousLevel) {
        let statPointsToAdd = 0, skillPointsToAdd = 0;
        for (let lvl = previousLevel + 1; lvl <= characterState.characterLevel; lvl++) {
          statPointsToAdd += (lvl <= 10) ? 1 : (lvl <= 20) ? 2 : (lvl <= 30) ? 3 : (lvl <= 40) ? 4 : (lvl <= 50) ? 5 : (lvl <= 60) ? 6 : (lvl <= 70) ? 7 : (lvl <= 80) ? 8 : (lvl <= 90) ? 9 : 10;
          skillPointsToAdd += (lvl <= 10) ? 2 : (lvl <= 20) ? 4 : (lvl <= 30) ? 6 : (lvl <= 40) ? 8 : (lvl <= 50) ? 10 : (lvl <= 60) ? 12 : (lvl <= 70) ? 14 : (lvl <= 80) ? 16 : (lvl <= 90) ? 18 : 20;
        }
        updateCharacterState({ availableStatPoints: (characterState.availableStatPoints || 0) + statPointsToAdd, availableSkillPoints: (characterState.availableSkillPoints || 0) + skillPointsToAdd });
        toast({ title: "Level Up!", description: `Gained ${statPointsToAdd} stat & ${skillPointsToAdd} skill points!`, status: "success" });
      }
      setPreviousLevel(characterState.characterLevel);
    } else if (loaded && previousLevel === 0 && characterState.characterLevel > 0) { setPreviousLevel(characterState.characterLevel); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterState.characterLevel, loaded]); // Dependencies


  // --- Reset Character ---
  const resetCharacter = useCallback(() => {
    setCharacterState({
      baseStats: defaultStats, selectedRace: null, selectedClass: null, abilityLevels: {},
      inventory: [], equippedItems: defaultEquippedItems, learnedSpells: [], characterName: '',
      currentHp: 8, currentMp: 5, currentAp: 2, characterLevel: 1, baseSkills: {},
      utilitySlots: defaultUtilitySlots, availableStatPoints: 7, availableSkillPoints: 16,
      lastUpdated: Date.now(), notes: defaultNotes, gold: 0, goldTransactionHistory: [],
    });
    equipmentBonuses.reset(); featureManager.reset(); setPreviousLevel(1); setIsDirty(false); dirtyFieldsRef.current = {};
    console.log("Character state reset to defaults.");
  }, [equipmentBonuses, featureManager]); // Keep managers as dependencies


  // --- Delete Character ---
  const deleteCharacter = useCallback(async () => {
    const currentDocId = docId;
    if (!currentUser || !currentDocId) { toast({ title: "Error", description: "Cannot delete character: No ID found or user not logged in.", status: "error" }); return; }
    setIsSaving(true); // Prevent other saves during deletion
    try {
      const charDoc = await getDoc(doc(db, 'characters', currentDocId));
      if (!charDoc.exists() || charDoc.data()?.userId !== currentUser.uid) { throw new Error("Character not found or permission denied."); }
      await deleteDoc(doc(db, 'characters', currentDocId));
      toast({ title: "Character Deleted", status: "success" });
      resetCharacter(); // Reset local state
      setDocId(null); // Clear docId
      router.push('/character-manager'); // Navigate away
    } catch (error: any) { console.error('Error deleting character:', error); toast({ title: "Deletion Failed", description: error.message || "Could not delete character.", status: "error" });
    } finally { setIsSaving(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, docId, resetCharacter, router, toast]);


  // --- Inventory Management ---
  const addToInventory = useCallback((item: InventoryItem) => {
    if (!item?.id) { console.warn("Attempted to add invalid item to inventory:", item); return; }
    const existingIndex = characterState.inventory.findIndex(invItem => invItem.item.id === item.id);
    let newInventory;
    if (existingIndex >= 0) { newInventory = characterState.inventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: invItem.quantity + 1 } : invItem); }
    else { newInventory = [...characterState.inventory, { item, quantity: 1 }]; }
    updateCharacterState({ inventory: newInventory });
  }, [characterState.inventory, updateCharacterState]);

  const addItemsWithQuantity = useCallback((itemToAdd: InventoryItem, quantityToAdd: number) => {
    if (!itemToAdd?.id || quantityToAdd <= 0) { console.warn("Attempted to add invalid item or quantity:", itemToAdd, quantityToAdd); return; }
    const existingIndex = characterState.inventory.findIndex(invItem => invItem.item.id === itemToAdd.id);
    let newInventory;
    if (existingIndex >= 0) { newInventory = characterState.inventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: invItem.quantity + quantityToAdd } : invItem); }
    else { newInventory = [...characterState.inventory, { item: itemToAdd, quantity: quantityToAdd }]; }
    updateCharacterState({ inventory: newInventory });
  }, [characterState.inventory, updateCharacterState]);

  const addMultipleItemsToInventory = useCallback((items: InventoryItem[]) => {
    if (!items || items.length === 0) return;
    let newInventory = [...characterState.inventory];
    const updates = new Map<string, { item: InventoryItem, quantityChange: number }>();
    items.forEach(item => { if (item?.id) { const currentUpdate = updates.get(item.id); updates.set(item.id, { item: item, quantityChange: (currentUpdate?.quantityChange || 0) + 1 }); } });
    updates.forEach(({ item, quantityChange }) => { const existingIndex = newInventory.findIndex(invItem => invItem.item.id === item.id); if (existingIndex >= 0) { newInventory[existingIndex] = { ...newInventory[existingIndex], quantity: newInventory[existingIndex].quantity + quantityChange }; } else { newInventory.push({ item: item, quantity: quantityChange }); } });
    updateCharacterState({ inventory: newInventory });
  }, [characterState.inventory, updateCharacterState]);

  const removeFromInventory = useCallback((itemId: string) => {
    if (!itemId) return;
    const existingIndex = characterState.inventory.findIndex(invItem => invItem.item.id === itemId);
    if (existingIndex === -1) { console.warn(`Attempted to remove item ID ${itemId} not found.`); return; }
    const currentItem = characterState.inventory[existingIndex]; let newInventory;
    if (currentItem.quantity > 1) { newInventory = characterState.inventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: invItem.quantity - 1 } : invItem); }
    else { newInventory = characterState.inventory.filter((_, index) => index !== existingIndex); }
    updateCharacterState({ inventory: newInventory });
  }, [characterState.inventory, updateCharacterState]);

  const updateInventoryItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (!itemId || newQuantity < 0) { console.warn(`Invalid input for updateInventoryItemQuantity: itemId=${itemId}, newQuantity=${newQuantity}`); return; }
    let updatedInventory; const existingIndex = characterState.inventory.findIndex(invItem => invItem.item.id === itemId);
    if (newQuantity === 0) { if (existingIndex !== -1) { updatedInventory = characterState.inventory.filter((_, index) => index !== existingIndex); } else { updatedInventory = [...characterState.inventory]; } }
    else { if (existingIndex !== -1) { updatedInventory = characterState.inventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: newQuantity } : invItem); } else { console.warn(`updateInventoryItemQuantity called for item ID ${itemId} not found.`); updatedInventory = [...characterState.inventory]; } }
    updateCharacterState({ inventory: updatedInventory });
  }, [characterState.inventory, updateCharacterState]);

  const getInventoryByType = useCallback((itemType: string): InventoryItemWithQuantity[] => {
    const lowerItemType = itemType?.toLowerCase().trim(); if (!lowerItemType) return [];
    return characterState.inventory.filter(invItem => invItem.item.itemType?.toLowerCase() === lowerItemType);
  }, [characterState.inventory]);

  const getItemQuantity = useCallback((itemId: string) => {
    const item = characterState.inventory.find(invItem => invItem.item.id === itemId); return item ? item.quantity : 0;
  }, [characterState.inventory]);

  const hasItem = useCallback((itemId: string) => characterState.inventory.some(invItem => invItem.item.id === itemId), [characterState.inventory]);


  // --- Equipment Management (FIXED type handling) ---
  const equipItem = useCallback((slot: keyof EquippedItems, newItem: InventoryItem | null) => {
    const currentItemInSlot = characterState.equippedItems[slot];
    let tempInventory = [...characterState.inventory];

    // --- Inventory Adjustments ---
    if (!newItem && currentItemInSlot) { // Unequipping
      const existingIndex = tempInventory.findIndex(inv => inv.item.id === currentItemInSlot.id);
      if (existingIndex > -1) { tempInventory[existingIndex] = { ...tempInventory[existingIndex], quantity: tempInventory[existingIndex].quantity + 1 }; }
      else { tempInventory.push({ item: currentItemInSlot, quantity: 1 }); }
    }
    if (newItem) { // Equipping
      const itemToRemoveIndex = tempInventory.findIndex(inv => inv.item.id === newItem.id);
      if (itemToRemoveIndex > -1) {
        if (tempInventory[itemToRemoveIndex].quantity > 1) { tempInventory[itemToRemoveIndex] = { ...tempInventory[itemToRemoveIndex], quantity: tempInventory[itemToRemoveIndex].quantity - 1 }; }
        else { tempInventory.splice(itemToRemoveIndex, 1); }
      } else { console.warn(`Item ${newItem.name} (${newItem.id}) being equipped was not found in inventory!`); }
      // Add back the item that was previously in the slot
      if (currentItemInSlot) {
        const existingIndex = tempInventory.findIndex(inv => inv.item.id === currentItemInSlot.id);
        if (existingIndex > -1) { tempInventory[existingIndex] = { ...tempInventory[existingIndex], quantity: tempInventory[existingIndex].quantity + 1 }; }
        else { tempInventory.push({ item: currentItemInSlot, quantity: 1 }); }
      }
    }

    // --- Determine final item and type ---
    let finalEquippedItem: WeaponItem | ArmorItem | null = null;
    if (newItem) {
        if ((slot === 'primaryWeapon' || slot === 'secondaryWeapon') && newItem.itemType === 'Weapon') {
            finalEquippedItem = newItem as WeaponItem;
        } else if (newItem.itemType === 'Armor') { // Simplified armor check
            finalEquippedItem = newItem as ArmorItem;
        } else {
            console.warn(`Cannot equip item type ${newItem.itemType} to slot ${String(slot)}.`);
            // If equip fails due to type mismatch, add the item back to inventory
            if (!tempInventory.find(inv => inv.item.id === newItem.id)) {
                tempInventory.push({ item: newItem, quantity: 1 }); // Add it back if it was fully removed
            } else {
                 // If it was only decremented, increment it back
                 const idx = tempInventory.findIndex(inv => inv.item.id === newItem.id);
                 if (idx > -1) tempInventory[idx] = { ...tempInventory[idx], quantity: tempInventory[idx].quantity + 1 };
            }
            finalEquippedItem = null; // Ensure slot remains empty or keeps previous item (handled below)
        }
    }

    // --- Update Managers & State ---
    // Only update managers if the item *actually* changed or type is valid
    if (finalEquippedItem !== currentItemInSlot) {
        equipmentBonuses.equipItem(String(slot), finalEquippedItem);
        if (currentItemInSlot) featureManager.removeFeatures(currentItemInSlot);
        if (finalEquippedItem) featureManager.addFeatures(finalEquippedItem);

        updateCharacterState({
          equippedItems: { ...characterState.equippedItems, [slot]: finalEquippedItem },
          inventory: tempInventory
        });
    } else {
         // If the item didn't change (e.g., type mismatch prevented equip), only update inventory if it changed
         if (JSON.stringify(tempInventory) !== JSON.stringify(characterState.inventory)) {
             updateCharacterState({ inventory: tempInventory });
         }
    }

  }, [characterState.equippedItems, characterState.inventory, updateCharacterState, equipmentBonuses, featureManager]);


  // --- (Keep equipMultipleItems, getEquippedItem, getStatBonus, getSkillBonus, etc. as they were) ---
  // --- (Most likely don't need changes for the reported damage issue) ---
  const equipMultipleItems = useCallback((equipmentUpdates: Partial<Record<keyof EquippedItems, InventoryItem | null>>) => {
    let tempEquipped = { ...characterState.equippedItems };
    let tempInventory = [...characterState.inventory];
    const itemsToAddBack = new Map<string, { item: InventoryItem, count: number }>();
    const itemsToRemove = new Map<string, number>();

    Object.entries(equipmentUpdates).forEach(([slotKey, newItem]) => {
        const slot = slotKey as keyof EquippedItems;
        const currentItem = tempEquipped[slot];
        let finalEquippedItem: WeaponItem | ArmorItem | null = null;

        // Determine final item type for this slot
        if (newItem) {
            if ((slot === 'primaryWeapon' || slot === 'secondaryWeapon') && newItem.itemType === 'Weapon') {
                finalEquippedItem = newItem as WeaponItem;
            } else if (newItem.itemType === 'Armor') { // Add specific slot checks if needed
                finalEquippedItem = newItem as ArmorItem;
            } else {
                console.warn(`Cannot equip item type ${newItem.itemType} to slot ${String(slot)} in equipMultiple.`);
                finalEquippedItem = null;
            }
        } else {
            finalEquippedItem = null; // Explicitly null if newItem is null
        }

        // Track inventory changes based on *actual* item being equipped (or null)
        if (finalEquippedItem) { // If we are equipping something valid
            itemsToRemove.set(finalEquippedItem.id, (itemsToRemove.get(finalEquippedItem.id) || 0) + 1);
            if (currentItem) { // If replacing, track old item
                const existingAdd = itemsToAddBack.get(currentItem.id);
                itemsToAddBack.set(currentItem.id, { item: currentItem, count: (existingAdd?.count || 0) + 1 });
            }
        } else if (currentItem) { // If unequipping (finalEquippedItem is null, but there *was* an item)
            const existingAdd = itemsToAddBack.get(currentItem.id);
            itemsToAddBack.set(currentItem.id, { item: currentItem, count: (existingAdd?.count || 0) + 1 });
        }
         // If finalEquippedItem is null AND currentItem is null, no inventory change for this slot.

        // Update managers
        equipmentBonuses.equipItem(slot, finalEquippedItem);
        if (currentItem) featureManager.removeFeatures(currentItem);
        if (finalEquippedItem) featureManager.addFeatures(finalEquippedItem);

        // Update the temporary equipped state with proper type handling
        if (slot === 'primaryWeapon' || slot === 'secondaryWeapon') {
            tempEquipped[slot] = finalEquippedItem as WeaponItem | null;
        } else {
            tempEquipped[slot] = finalEquippedItem as ArmorItem | null;
        }
    });

    // Batch process inventory updates
    itemsToRemove.forEach((count, itemId) => {
        const index = tempInventory.findIndex(inv => inv.item.id === itemId);
        if (index > -1) { const newQuantity = tempInventory[index].quantity - count; if (newQuantity > 0) { tempInventory[index] = { ...tempInventory[index], quantity: newQuantity }; } else { tempInventory.splice(index, 1); } }
        else { console.warn(`Tried to remove ${count}x item ID ${itemId} from inventory during equipMultiple, but item not found.`); }
    });
    itemsToAddBack.forEach(({ item, count }) => {
        const index = tempInventory.findIndex(inv => inv.item.id === item.id);
        if (index > -1) { tempInventory[index] = { ...tempInventory[index], quantity: tempInventory[index].quantity + count }; }
        else { tempInventory.push({ item, quantity: count }); }
    });

    updateCharacterState({ equippedItems: tempEquipped, inventory: tempInventory });

  }, [characterState.equippedItems, characterState.inventory, updateCharacterState, equipmentBonuses, featureManager]);

  const getEquippedItem = useCallback((slot: keyof EquippedItems) => characterState.equippedItems[slot], [characterState.equippedItems]);
  const getStatBonus = useCallback((stat: string) => equipmentBonuses.getStatBonus(stat), [equipmentBonuses]);
  const getSkillBonus = useCallback((skill: string) => equipmentBonuses.getSkillBonus(skill), [equipmentBonuses]);
  const getEquipmentAbilities = useCallback(() => featureManager.getAbilities(), [featureManager]);
  const getEquipmentTraits = useCallback(() => featureManager.getTraits(), [featureManager]);
  const hasAbility = useCallback((ability: string) => featureManager.hasAbility(ability), [featureManager]);
  const hasTrait = useCallback((trait: string) => featureManager.hasTrait(trait), [featureManager]);


  // --- Stat & Skill Point Management ---
  const incrementStat = useCallback((stat: keyof CharacterStats) => { if (characterState.availableStatPoints > 0) { updateCharacterState({ baseStats: { ...characterState.baseStats, [stat]: (characterState.baseStats[stat] || 0) + 1 }, availableStatPoints: characterState.availableStatPoints - 1, }); } }, [characterState.availableStatPoints, characterState.baseStats, updateCharacterState]);
  const decrementStat = useCallback((stat: keyof CharacterStats) => { const currentStatValue = characterState.baseStats[stat] || 0; const minimumStatValue = 0; if (currentStatValue > minimumStatValue) { updateCharacterState({ baseStats: { ...characterState.baseStats, [stat]: currentStatValue - 1 }, availableStatPoints: characterState.availableStatPoints + 1, }); } }, [characterState.baseStats, characterState.availableStatPoints, updateCharacterState]);
  const increaseSkill = useCallback((skillName: string) => { if (characterState.availableSkillPoints > 0) { updateCharacterState({ baseSkills: { ...characterState.baseSkills, [skillName]: (characterState.baseSkills[skillName] || 0) + 1 }, availableSkillPoints: characterState.availableSkillPoints - 1, }); } }, [characterState.availableSkillPoints, characterState.baseSkills, updateCharacterState]);
  const decreaseSkill = useCallback((skillName: string) => { const currentSkillValue = characterState.baseSkills[skillName] || 0; const minimumSkillValue = 0; if (currentSkillValue > minimumSkillValue) { updateCharacterState({ baseSkills: { ...characterState.baseSkills, [skillName]: currentSkillValue - 1 }, availableSkillPoints: characterState.availableSkillPoints + 1, }); } }, [characterState.baseSkills, characterState.availableSkillPoints, updateCharacterState]);


  // --- Combat & Spells ---
  const createAttackFromWeapon = useCallback((weapon: WeaponItem, slot: string): Attack => { 
    // Ensure we have the complete weapon data
    console.log(`Creating attack from weapon:`, weapon);
    
    // Set reasonable defaults for any missing properties
    const damageAmount = weapon.damageAmount || '1d6';
    const damageType = weapon.damageType || 'Physical';
    const meleeRanged = weapon.meleeRanged || 'Melee';
    const weaponType = weapon.weaponType || 'Unknown';
    const handsRequired = weapon.handsRequired || 'One-handed';
    const magicNonMagical = weapon.magicNonMagical || 'Non-Magical';
    
    // For ranged weapons, set a default range based on weapon type
    const range = meleeRanged === 'Ranged' 
      ? (weaponType.toLowerCase().includes('bow') ? '60 ft' : 
         weaponType.toLowerCase().includes('gun') ? '90 ft' : '30 ft') 
      : 'Melee';
    
    const slotForAttack = slot === 'Primary' ? 'primaryWeapon' : 'secondaryWeapon';
    
    return {
      id: `${weapon.id}-${slotForAttack}-attack`,
      weaponId: weapon.id,
      name: `${weapon.name} (${slot})`,
      description: weapon.description || `Attack with your ${weapon.name}`,
      damageAmount: damageAmount,
      damageType: damageType,
      meleeRanged: meleeRanged as 'Melee' | 'Ranged',
      weaponType: weaponType,
      handsRequired: handsRequired,
      slot: slotForAttack as 'primaryWeapon' | 'secondaryWeapon',
      range: range,
      magicNonMagical: magicNonMagical as 'Magical' | 'Non-Magical',
      abilities: weapon.abilities || [],
      traits: weapon.traits || [],
      statBonus: weapon.statBonus || {},
      skillBonus: weapon.skillBonus || {},
      isCustom: false
    };
  }, []);
  const getAttacksFromEquipment = useCallback((): Attack[] => { 
    const weaponAttacks: Attack[] = []; 
    
    // Get complete weapon data for primary weapon
    if (characterState.equippedItems.primaryWeapon) {
      const primaryWeapon = characterState.equippedItems.primaryWeapon;
      
      // Log the weapon data to debug
      console.log('Primary weapon data for attack creation:', primaryWeapon);
      
      weaponAttacks.push(createAttackFromWeapon(primaryWeapon, 'Primary'));
    }
    
    // Get complete weapon data for secondary weapon
    if (characterState.equippedItems.secondaryWeapon) {
      const secondaryWeapon = characterState.equippedItems.secondaryWeapon;
      
      // Log the weapon data to debug
      console.log('Secondary weapon data for attack creation:', secondaryWeapon);
      
      weaponAttacks.push(createAttackFromWeapon(secondaryWeapon, 'Secondary'));
    }
    
    return weaponAttacks;
  }, [characterState.equippedItems, createAttackFromWeapon]);  useEffect(() => { setAttacks(getAttacksFromEquipment()); }, [getAttacksFromEquipment]); // Update attacks when equipment changes
  const executeAttack = useCallback((attackId: string) => { const attack = attacks.find(a => a.id === attackId); if (!attack) return; console.log(`Executing attack: ${attack.name}`); toast({ title: `Attacked with ${attack.name}`, description: `Damage: ${attack.damageAmount} ${attack.damageType}, Range: ${attack.meleeRanged}`, status: "info", duration: 3000 }); }, [attacks, toast]);
  const addToLearnedSpells = useCallback((spell: Spell) => { if (!characterState.learnedSpells.some(s => s.name === spell.name)) { updateCharacterState({ learnedSpells: [...characterState.learnedSpells, spell] }); } }, [characterState.learnedSpells, updateCharacterState]);


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
  const processTransaction = useCallback(async (details: { itemId: string; item?: InventoryItem; quantity: number; goldChange: number; transactionType: 'buy' | 'sell'; reason: string }) => { const { itemId, item, quantity, goldChange, transactionType, reason } = details; if (quantity <= 0) { console.warn("processTransaction called with invalid quantity:", quantity); toast({ title: "Transaction Error", description: "Invalid item quantity.", status: "error"}); return; } const currentGold = characterState.gold || 0; const newGoldAmount = currentGold + goldChange; if (newGoldAmount < 0) { console.warn("processTransaction would result in negative gold."); toast({ title: "Transaction Error", description: "Transaction would result in negative gold.", status: "error"}); return; } let newInventory = [...characterState.inventory]; if (transactionType === 'buy') { if (!item) { console.error("processTransaction 'buy' called without item details."); toast({ title: "Transaction Error", description: "Missing item data for purchase.", status: "error"}); return; } const existingIndex = newInventory.findIndex(invItem => invItem.item.id === item.id); if (existingIndex >= 0) { newInventory = newInventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: invItem.quantity + quantity } : invItem); } else { newInventory.push({ item: item, quantity: quantity }); } } else { const existingIndex = newInventory.findIndex(invItem => invItem.item.id === itemId); if (existingIndex === -1) { console.error(`processTransaction 'sell': Item ID ${itemId} not found in inventory.`); toast({ title: "Transaction Error", description: "Item to sell not found in your inventory.", status: "error"}); return; } const currentItem = newInventory[existingIndex]; if (currentItem.quantity < quantity) { console.error(`processTransaction 'sell': Insufficient quantity for item ID ${itemId}. Have ${currentItem.quantity}, need ${quantity}.`); toast({ title: "Transaction Error", description: "Not enough items to sell.", status: "error"}); return; } if (currentItem.quantity === quantity) { newInventory = newInventory.filter((_, index) => index !== existingIndex); } else { newInventory = newInventory.map((invItem, index) => index === existingIndex ? { ...invItem, quantity: invItem.quantity - quantity } : invItem); } } const newTransactionRecord: GoldTransaction = { amount: goldChange, reason: reason, timestamp: Date.now(), by: currentUser?.uid || 'player' }; const newHistory = [...characterState.goldTransactionHistory, newTransactionRecord].slice(-100); updateCharacterState({ gold: newGoldAmount, inventory: newInventory, goldTransactionHistory: newHistory }); try { await saveCharacterManually(); console.log("Transaction processed and character saved."); } catch (error) { console.error("Error saving character after transaction:", error); toast({ title: "Save Warning", description: "Transaction applied locally, but failed to save to server.", status: "warning", duration: 5000 }); } }, [characterState.gold, characterState.inventory, characterState.goldTransactionHistory, updateCharacterState, saveCharacterManually, currentUser, toast]);


  // --- Crafting ---
  const craftItem = useCallback(async (componentsToRemove: { itemId: string; quantity: number }[], itemToAdd: InventoryItem): Promise<boolean> => {
    if (!docId) {
      console.error("Cannot craft: No document ID available.");
      toast({ title: "Crafting Error", description: "Character ID missing.", status: "error" });
      return false;
    }

    const characterRef = doc(db, 'characters', docId);
    const characterSnapshot = await getDoc(characterRef);

    if (!characterSnapshot.exists()) {
      throw new Error("Character document not found");
    }

    const data = characterSnapshot.data();
    let currentInventory = Array.isArray(data.inventory) ? data.inventory : [];

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

    // Update Firestore in a single operation
    await updateDoc(characterRef, {
      inventory: currentInventory,
      lastUpdated: serverTimestamp()
    });

    // Update local state to match
    setCharacterState(prevState => ({
      ...prevState,
      inventory: currentInventory,
      lastUpdated: Date.now()
    }));

    console.log("Craft operation completed successfully");

    // Reset dirty state
    dirtyFieldsRef.current = {};
    setIsDirty(false);
    setLastSaveTime(Date.now());

    return true;
  }, [docId, toast]);

  const removeItems = useCallback(async (items: { itemId: string; quantity: number }[]): Promise<void> => {
    if (items.length === 0) return;
    
    // Verify all items exist in inventory with sufficient quantities
    let canRemoveAll = true;
    const notFoundItems: string[] = [];
    const insufficientItems: { id: string; needed: number; available: number }[] = [];
    
    items.forEach(({ itemId, quantity }) => {
      const existingItem = characterState.inventory.find(invItem => invItem.item.id === itemId);
      if (!existingItem) {
        canRemoveAll = false;
        notFoundItems.push(itemId);
      } else if (existingItem.quantity < quantity) {
        canRemoveAll = false;
        insufficientItems.push({ id: itemId, needed: quantity, available: existingItem.quantity });
      }
    });
    
    if (!canRemoveAll) {
      if (notFoundItems.length > 0) {
        console.error(`Some items not found in inventory: ${notFoundItems.join(', ')}`);
        toast({ title: "Removal Error", description: "Some items not found in inventory", status: "error" });
      }
      if (insufficientItems.length > 0) {
        console.error(`Insufficient quantities:`, insufficientItems);
        toast({ title: "Removal Error", description: "Insufficient quantities for some items", status: "error" });
      }
      throw new Error("Failed to remove items due to insufficient inventory");
    }
    
    // Update inventory
    let updatedInventory = [...characterState.inventory];
    
    items.forEach(({ itemId, quantity }) => {
      const index = updatedInventory.findIndex(invItem => invItem.item.id === itemId);
      if (updatedInventory[index].quantity === quantity) {
        // Remove item completely if quantities match
        updatedInventory.splice(index, 1);
      } else {
        // Reduce quantity otherwise
        updatedInventory[index] = {
          ...updatedInventory[index],
          quantity: updatedInventory[index].quantity - quantity
        };
      }
    });
    
    // Update character state
    updateCharacterState({ inventory: updatedInventory });
    
    // Indicate success in console - useful for debugging
    console.log(`Successfully removed items:`, items);
  }, [characterState.inventory, updateCharacterState, toast]);


  // --- Notes Management ---
  const updateNotes = useCallback((newNotes: NotesState) => updateCharacterState({ notes: newNotes }), [updateCharacterState]);
  const addNoteCategory = useCallback((category: NoteCategory) => updateNotes([...characterState.notes, category]), [characterState.notes, updateNotes]);
  const updateNoteCategory = useCallback((categoryId: string, updates: Partial<NoteCategory>) => { updateNotes(characterState.notes.map(cat => cat.id === categoryId ? { ...cat, ...updates } : cat)); }, [characterState.notes, updateNotes]);
  const deleteNoteCategory = useCallback((categoryId: string) => { updateNotes(characterState.notes.filter(cat => cat.id !== categoryId)); }, [characterState.notes, updateNotes]);
  const addNote = useCallback((categoryId: string, note: Note) => { updateNotes(characterState.notes.map(cat => cat.id === categoryId ? { ...cat, notes: [...cat.notes, { ...note, lastEdited: Date.now() }] } : cat)); }, [characterState.notes, updateNotes]);
  const updateNote = useCallback((categoryId: string, noteId: string, updates: Partial<Note>) => { updateNotes(characterState.notes.map(cat => cat.id === categoryId ? { ...cat, notes: cat.notes.map(n => n.id === noteId ? { ...n, ...updates, lastEdited: Date.now() } : n) } : cat)); }, [characterState.notes, updateNotes]);
  const deleteNote = useCallback((categoryId: string, noteId: string) => { updateNotes(characterState.notes.map(cat => cat.id === categoryId ? { ...cat, notes: cat.notes.filter(n => n.id !== noteId) } : cat)); }, [characterState.notes, updateNotes]);


  // --- Context Value Object ---
  const value: CharacterContextType = {
    characterName: characterState.characterName, setCharacterName, characterLevel: characterState.characterLevel, setCharacterLevel,
    baseStats: characterState.baseStats, setBaseStats: (stats) => updateCharacterState({ baseStats: stats }), currentStats,
    selectedRace: characterState.selectedRace, setSelectedRace: (race) => updateCharacterState({ selectedRace: race }),
    selectedClass: characterState.selectedClass, setSelectedClass: (cls) => updateCharacterState({ selectedClass: cls }),
    currentHp: characterState.currentHp, setCurrentHp, getMaxHp, currentMp: characterState.currentMp, setCurrentMp, getMaxMp, currentAp: characterState.currentAp, setCurrentAp, getMaxAp,
    baseSkills: characterState.baseSkills, currentSkills, abilityLevels: characterState.abilityLevels, setAbilityLevel: (name, level) => updateCharacterState({ abilityLevels: { ...characterState.abilityLevels, [name]: level } }),
    getEquipmentAbilities, getEquipmentTraits, hasAbility, hasTrait,
    inventory: characterState.inventory, addToInventory, addItemsWithQuantity, addMultipleItemsToInventory, removeFromInventory, updateInventoryItemQuantity, getInventoryByType, getItemQuantity, hasItem,
    equippedItems: characterState.equippedItems, equipItem, getEquippedItem, equipMultipleItems, getStatBonus, getSkillBonus,
    utilitySlots: characterState.utilitySlots, setUtilitySlots, addItemToUtilitySlot, removeItemFromUtilitySlot, updateUtilitySlotQuantity,
    availableStatPoints: characterState.availableStatPoints, incrementStat, decrementStat, availableSkillPoints: characterState.availableSkillPoints, increaseSkill, decreaseSkill,
    attacks, getAttacksFromEquipment, executeAttack, learnedSpells: characterState.learnedSpells, addToLearnedSpells, spellList: characterState.learnedSpells,
    notes: characterState.notes, updateNotes, addNoteCategory, updateNoteCategory, deleteNoteCategory, addNote, updateNote, deleteNote,
    gold: characterState.gold, setGold, goldTransactionHistory: characterState.goldTransactionHistory, addGold, subtractGold, processTransaction,
    craftItem,
    isDirty, isSaving, lastSaveTime, saveCharacterManually, resetCharacter, deleteCharacter,
    docId: docId,
    removeItems: function (items: { itemId: string; quantity: number; }[]): Promise<void> {
      throw new Error('Function not implemented.');
    }
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

// Define a more specific type for character summaries if needed
interface CharacterSummary {
    id: string;
    characterName: string;
    characterLevel: number;
    raceName?: string;
    className?: string;
    lastUpdated?: number;
}

export const useCharacterContext = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacterContext must be used within a CharacterProvider');
  }
  return context;
};


export async function getAllCharactersForUser(userId: string): Promise<CharacterSummary[]> {
  if (!userId) return [];
  try {
    const charactersRef = collection(db, 'characters');
    const q = query(charactersRef, where('userId', '==', userId), orderBy('lastUpdated', 'desc')); // Order by last update
    const querySnapshot = await getDocs(q);
    const characters: CharacterSummary[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        characterName: data.characterName || 'Unnamed Character',
        characterLevel: data.characterLevel || 1,
        raceName: data.selectedRace?.name, // Optional chaining
        className: data.selectedClass?.name, // Optional chaining
        lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toMillis() : data.lastUpdated,
      };
    });
    return characters;
  } catch (error) { console.error('Error fetching characters:', error); return []; }
}

export async function deleteCharacterById(userId: string, characterId: string): Promise<boolean> {
  if (!userId || !characterId) return false;
  try {
    const characterRef = doc(db, 'characters', characterId);
    const charDoc = await getDoc(characterRef);
    if (!charDoc.exists() || charDoc.data()?.userId !== userId) { console.error(`Permission denied or character not found for deletion: User ${userId}, Character ${characterId}`); return false; }
    await deleteDoc(characterRef);
    return true;
  } catch (error) { console.error('Error deleting character via helper:', error); return false; }
}
// --- END OF FILE CharacterContext.tsx ---