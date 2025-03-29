// components/inventory/InventoryLoader.tsx
import React, { useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { useCharacter } from '@/context/CharacterContext';

const InventoryLoader: React.FC = () => {
  const { addToInventory } = useCharacter();
  const toast = useToast();

  useEffect(() => {
    const isInventoryLoaded = localStorage.getItem('inventoryLoaded');
    if (isInventoryLoaded === 'true') {
      console.log('Inventory already loaded, skipping...');
      return;
    }
    const loadItems = async (filename: string) => {
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
        items.forEach((item: any) => {
          if (item && item.name) {
            if (!item.id) {
              item.id = `${filename}-${Math.random().toString(36).substring(2, 9)}`;
            }
            const itemWithType = {
              ...item,
              itemType: getItemTypeFromFilename(filename)
            };
            addToInventory(itemWithType);
          }
        });
        console.log(`Loaded ${items.length} items from ${filename}.json`);
      } catch (error) {
        console.error(`Error loading ${filename}.json:`, error);
        toast({
          title: `Error loading ${filename}`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
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
    
    filesToLoad.forEach(filename => loadItems(filename));
    
    toast({
      title: 'Inventory Loaded',
      description: 'Items have been loaded into your inventory.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    localStorage.setItem('inventoryLoaded', 'true');
  }, [addToInventory, toast]);

  return null;
};

export default InventoryLoader;
