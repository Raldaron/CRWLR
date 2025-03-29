// components/inventory/CatalogLoader.tsx
import React, { useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

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
    // We'll load from JSON every time, or you can add a check if desired.
    const loadItemsFromJson = async (filename: string) => {
      try {
        const response = await fetch(`/data/${filename}.json`);
        const data = await response.json();

        let items: any[] = [];
        if (data[filename]) {
          items = Object.values(data[filename]);
        } else if (data.hasOwnProperty(filename.replace(/s$/, ''))) {
          items = Object.values(data[filename.replace(/s$/, '')]);
        } else {
          items = Object.values(data);
        }

        // Each item is assigned a fallback itemType from the filename
        return items.map((item: any) => {
          if (!item.id) {
            item.id = `${filename}-${Math.random().toString(36).substring(2, 9)}`;
          }
          if (!item.itemType) {
            item.itemType = getItemTypeFromFilename(filename);
          }
          return item;
        });
      } catch (error) {
        console.error(`Error loading ${filename}.json:`, error);
        toast({
          title: `Error loading ${filename}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return [];
      }
    };

    const getItemTypeFromFilename = (filename: string): string => {
      const singular = filename.replace(/s$/, '');
      switch (singular) {
        case 'weapon':
          return 'Weapon';
        case 'armor':
          return 'Armor';
        case 'ammunition':
          return 'Ammunition';
        case 'potion':
          return 'Potion';
        case 'scroll':
          return 'Scroll';
        case 'crafting_component':
          return 'Crafting Component';
        case 'trap':
          return 'Trap';
        case 'explosive':
          return 'Explosive';
        default:
          return singular.charAt(0).toUpperCase() + singular.slice(1);
      }
    };

    const loadAllFiles = async () => {
      const filesToLoad = [
        'weapons',
        'armor',
        'ammunition',
        'potions',
        'scrolls',
        'crafting_components',
        'traps',
        'explosives'
      ];

      const allItems: any[] = [];
      for (const filename of filesToLoad) {
        const fileItems = await loadItemsFromJson(filename);
        allItems.push(...fileItems);
      }
      onItemsLoaded(allItems);

      toast({
        title: 'Catalog Loaded',
        description: 'All items have been loaded from JSON.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    };

    loadAllFiles();
  }, [toast, onItemsLoaded]);

  return null; // This component is invisible
};

export default CatalogLoader;
