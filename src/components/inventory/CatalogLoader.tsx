// components/inventory/CatalogLoader.tsx
import React, { useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

/**
 * Props for CatalogLoader:
 * - onItemsLoaded is a callback that provides all loaded items so
 *   the parent can store them in state and use them as a "catalog."
 */
interface CatalogLoaderProps {
  onItemsLoaded: (items: any[]) => void;
}

const CatalogLoader: React.FC<CatalogLoaderProps> = ({ onItemsLoaded }) => {
  const toast = useToast();

  useEffect(() => {
    const loadItemsFromFirestore = async () => {
      const allItems: any[] = [];
      
      // Define all collections to load
      const collections = [
        'weapons',
        'armor',
        'ammunition',
        'potions',
        'scrolls',
        'crafting_components',
        'traps',
        'explosives'
      ];
      
      try {
        // Load data from each collection
        for (const collectionName of collections) {
          try {
            console.log(`Loading items from ${collectionName} collection...`);
            
            // Get reference to the collection
            const collectionRef = collection(db, collectionName);
            
            // Get all documents in the collection
            const querySnapshot = await getDocs(collectionRef);
            
            if (querySnapshot.empty) {
              console.log(`No items found in the ${collectionName} collection`);
              continue;
            }
            
            // Process each document
            querySnapshot.forEach((doc) => {
              // Get item data and ID
              const itemData = doc.data();
              
              // Determine item type from collection name
              const itemType = getItemTypeFromCollectionName(collectionName);
              
              // Create a normalized item with consistent fields
              const normalizedItem = {
                ...itemData,
                id: doc.id,
                itemType: itemData.itemType || itemType
              };
              
              allItems.push(normalizedItem);
            });
            
            console.log(`Loaded ${querySnapshot.size} items from ${collectionName}`);
          } catch (error) {
            console.error(`Error loading ${collectionName}:`, error);
          }
        }
        
        // Call the callback with all loaded items
        onItemsLoaded(allItems);
        
        toast({
          title: 'Catalog Loaded',
          description: `Loaded ${allItems.length} items from Firestore.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error loading item catalog:', error);
        toast({
          title: 'Error',
          description: 'Failed to load item catalog from Firestore.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    // Helper function to determine item type from collection name
    const getItemTypeFromCollectionName = (collectionName: string): string => {
      // Handle special case for crafting components
      if (collectionName === 'crafting_components') {
        return 'Crafting Component';
      }
      
      // For all other collections, capitalize the singular form
      const singular = collectionName.replace(/s$/, '');
      return singular.charAt(0).toUpperCase() + singular.slice(1);
    };

    loadItemsFromFirestore();
  }, [toast, onItemsLoaded]);

  return null; // This component is invisible
};

export default CatalogLoader;