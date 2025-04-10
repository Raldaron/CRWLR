// --- START OF FILE src/services/spellDataService.ts ---
import {
    collection,
    getDocs,
    query,
    where,
    limit, // Optional: If you want to limit results in the future
    DocumentData,
    QueryDocumentSnapshot,
  } from 'firebase/firestore';
  import { db } from '@/firebase/firebaseConfig'; // <-- CHECK THIS PATH
  import { Spell } from '@/types/spell';         // <-- CHECK THIS PATH
  import { convertToSpell } from '@/utils/spellConverter'; // <-- CHECK THIS PATH
  
  /**
   * Fetches all spells from the 'spells' collection in Firestore.
   * Converts raw Firestore data into structured Spell objects using convertToSpell.
   *
   * @returns Promise<Spell[]> - A promise that resolves to an array of Spell objects.
   * @throws {Error} If fetching from Firestore fails.
   */
  export const fetchAllSpells = async (): Promise<Spell[]> => {
    console.log("Attempting to fetch all spells from Firestore collection 'spells'...");
    try {
      const spellsCollectionRef = collection(db, 'spells');
      const spellsSnapshot = await getDocs(spellsCollectionRef);
  
      if (spellsSnapshot.empty) {
        console.warn("No documents found in the 'spells' collection.");
        return []; // Return empty array if no spells exist
      }
  
      // Map through the documents, converting each one to a Spell object
      const spellsArray: Spell[] = spellsSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const rawData = doc.data();
          // Ensure the document ID is included when converting
          const spell = convertToSpell({ ...rawData, id: doc.id });
          return spell;
        }
      );
  
      console.log(`Successfully fetched and converted ${spellsArray.length} spells.`);
      // Optionally sort spells alphabetically by name here if desired
      spellsArray.sort((a, b) => a.name.localeCompare(b.name));
      return spellsArray;
  
    } catch (error) {
      console.error('Firestore Error: Failed to fetch all spells:', error);
      // Re-throw a more specific error for the hook to handle
      throw new Error('Failed to fetch spell data from the database.');
    }
  };
  
  /**
   * Fetches spells filtered by a specific archetype from the 'spells' collection.
   * Converts raw Firestore data into structured Spell objects using convertToSpell.
   *
   * @param {string} archetype - The archetype string to filter by (e.g., "Evocation").
   * @returns {Promise<Spell[]>} - A promise that resolves to an array of matching Spell objects.
   * @throws {Error} If fetching from Firestore fails.
   */
  export const fetchSpellsByArchetype = async (archetype: string): Promise<Spell[]> => {
    // If no archetype is provided, maybe return all spells or an empty array
    if (!archetype) {
      console.warn("fetchSpellsByArchetype called without an archetype. Returning all spells.");
      return fetchAllSpells(); // Or decide to return []: return Promise.resolve([]);
    }
  
    console.log(`Attempting to fetch spells with archetype: '${archetype}'...`);
    try {
      const spellsCollectionRef = collection(db, 'spells');
  
      // Create a Firestore query to filter documents by the 'archetype' field.
      // Note: Firestore queries are case-sensitive by default. Ensure your data matches.
      const q = query(spellsCollectionRef, where('archetype', '==', archetype));
      const spellsSnapshot = await getDocs(q);
  
      if (spellsSnapshot.empty) {
        console.log(`No spells found matching archetype: '${archetype}'.`);
        return []; // Return empty array if no matching spells
      }
  
      // Map through the matching documents, converting each one
      const spellsArray: Spell[] = spellsSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const rawData = doc.data();
          const spell = convertToSpell({ ...rawData, id: doc.id });
          return spell;
        }
      );
  
      console.log(`Successfully fetched and converted ${spellsArray.length} spells for archetype '${archetype}'.`);
      // Optionally sort results
      spellsArray.sort((a, b) => a.name.localeCompare(b.name));
      return spellsArray;
  
    } catch (error) {
      console.error(`Firestore Error: Failed to fetch spells for archetype '${archetype}':`, error);
      throw new Error(`Failed to fetch spells for archetype: ${archetype}.`);
    }
  };
  
  // --- END OF FILE src/services/spellDataService.ts ---