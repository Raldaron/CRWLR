// utils/characterUtils.js
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

/**
 * Save character data to Firestore
 * 
 * @param {string} userId - The user ID
 * @param {string} characterId - The character ID
 * @param {Object} characterData - The character data to save
 * @returns {Promise<string>} - The character ID
 */
export async function saveCharacterData(userId, characterId, characterData) {
  // Add a timestamp and userId to the data
  const dataToSave = {
    ...characterData,
    userId,
    updatedAt: serverTimestamp(),
  };

  // If we have a character ID, update that document
  if (characterId) {
    const characterRef = doc(db, 'characters', characterId);
    await setDoc(characterRef, dataToSave, { merge: true });
    return characterId;
  } 
  // Otherwise create a new document
  else {
    // Add creation timestamp for new characters
    dataToSave.createdAt = serverTimestamp();
    
    // Create a new document with automatic ID
    const characterRef = await addDoc(collection(db, 'characters'), dataToSave);
    return characterRef.id;
  }
}

/**
 * Create a new character document in Firestore
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<string>} - The new character ID
 */
export async function createNewCharacter(userId) {
  try {
    // Basic character template
    const characterData = {
      userId,
      characterName: 'New Character',
      characterLevel: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Add any other default properties here
    };
    
    // Create a new document with an auto-generated ID
    const docRef = await addDoc(collection(db, 'characters'), characterData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating new character:', error);
    throw error;
  }
}

/**
 * Load a character from Firestore
 * 
 * @param {string} characterId - The character ID to load
 * @returns {Promise<Object>} - The character data
 */
export async function loadCharacterData(characterId) {
  try {
    const characterDoc = await getDoc(doc(db, 'characters', characterId));
    
    if (!characterDoc.exists()) {
      throw new Error('Character not found');
    }
    
    return characterDoc.data();
  } catch (error) {
    console.error('Error loading character:', error);
    throw error;
  }
}

/**
 * Check if a character belongs to a user
 * 
 * @param {string} characterId - The character ID to check
 * @param {string} userId - The user ID to check against
 * @returns {Promise<boolean>} - Whether the character belongs to the user
 */
export async function verifyCharacterOwnership(characterId, userId) {
  try {
    const characterData = await loadCharacterData(characterId);
    return characterData.userId === userId;
  } catch (error) {
    console.error('Error verifying character ownership:', error);
    return false;
  }
}

/**
 * Get a list of all characters belonging to a user
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of character data
 */