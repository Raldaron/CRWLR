// utils/firebaseItemsUtil.js
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    doc, 
    getDoc 
  } from 'firebase/firestore';
  import { db } from '@/firebase/firebaseConfig';
  
  /**
   * Fetch all items from a specific collection
   * @param {string} collectionName - Name of the Firebase collection (e.g., 'weapons', 'armor')
   * @returns {Promise<Array>} - Array of items from the collection
   */
  export const fetchItemsFromCollection = async (collectionName) => {
    try {
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      
      const items = [];
      querySnapshot.forEach((doc) => {
        // Add the document ID as the item ID if it's not already present
        const item = {
          ...doc.data(),
          id: doc.id
        };
        items.push(item);
      });
      
      return items;
    } catch (error) {
      console.error(`Error fetching items from ${collectionName}:`, error);
      throw error;
    }
  };
  
  /**
   * Fetch a single item by ID from a specific collection
   * @param {string} collectionName - Name of the Firebase collection
   * @param {string} itemId - ID of the item to fetch
   * @returns {Promise<Object|null>} - The item data or null if not found
   */
  export const fetchItemById = async (collectionName, itemId) => {
    try {
      const itemRef = doc(db, collectionName, itemId);
      const itemSnap = await getDoc(itemRef);
      
      if (itemSnap.exists()) {
        return {
          ...itemSnap.data(),
          id: itemSnap.id
        };
      } else {
        console.warn(`Item with ID ${itemId} not found in ${collectionName}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching item ${itemId} from ${collectionName}:`, error);
      throw error;
    }
  };
  
  /**
   * Fetch items that match a specific field value
   * @param {string} collectionName - Name of the Firebase collection
   * @param {string} field - The field to filter by
   * @param {any} value - The value to match
   * @returns {Promise<Array>} - Array of matching items
   */
  export const fetchItemsByField = async (collectionName, field, value) => {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where(field, '==', value));
      const querySnapshot = await getDocs(q);
      
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({
          ...doc.data(),
          id: doc.id
        });
      });
      
      return items;
    } catch (error) {
      console.error(`Error fetching items from ${collectionName} where ${field} = ${value}:`, error);
      throw error;
    }
  };
  
  /**
   * Fetch all items from all item collections
   * @returns {Promise<Object>} - Object with keys for each collection and arrays of items
   */
  export const fetchAllItems = async () => {
    try {
      const collections = [
        'weapons', 
        'armor', 
        'ammunition', 
        'potions', 
        'scrolls', 
        'explosives', 
        'traps', 
        'crafting_components'
      ];
      
      const results = {};
      
      // Use Promise.all to fetch from all collections in parallel
      await Promise.all(collections.map(async (collectionName) => {
        results[collectionName] = await fetchItemsFromCollection(collectionName);
      }));
      
      return results;
    } catch (error) {
      console.error('Error fetching all items:', error);
      throw error;
    }
  };
  
  /**
   * Fetch items by their IDs from a specific collection
   * @param {string} collectionName - Name of the Firebase collection
   * @param {Array<string>} itemIds - Array of item IDs to fetch
   * @returns {Promise<Array>} - Array of fetched items
   */
  export const fetchItemsByIds = async (collectionName, itemIds) => {
    try {
      const items = [];
      
      // Use Promise.all to fetch all items in parallel
      await Promise.all(itemIds.map(async (itemId) => {
        const item = await fetchItemById(collectionName, itemId);
        if (item) {
          items.push(item);
        }
      }));
      
      return items;
    } catch (error) {
      console.error(`Error fetching items by IDs from ${collectionName}:`, error);
      throw error;
    }
  };