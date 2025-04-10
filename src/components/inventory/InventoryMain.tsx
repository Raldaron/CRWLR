// components/inventory/InventoryMain.tsx
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import {
  Box,
  Select,
  HStack,
  Text,
  Badge,
  InputGroup, // Added InputGroup
  InputLeftElement, // Added InputLeftElement
  Input // Added Input
} from '@chakra-ui/react';
import { Package, Sword, Shield, Crosshair, Beaker, ScrollText, Wrench, Key, Bomb, Search } from 'lucide-react'; // Added Search
import { useCharacter } from '@/context/CharacterContext';
import InventoryTable from './InventoryTable';
// Adjusted ITEM_TYPE_COLUMNS import path if needed, and added DEFAULT_COLUMNS
import { ITEM_TYPE_COLUMNS, DEFAULT_COLUMNS } from '../../types/inventory';
import { getColumnValue } from './InventoryHelpers';
import WeaponDetailModal from '../Modals/WeaponDetailModal';
import ArmorDetailModal from '../Modals/ArmorDetailModal';
import AmmunitionDetailModal from '../Modals/AmmunitionDetailModal';
import PotionDetailModal from '../Modals/PotionDetailModal';
import ScrollDetailModal from '../Modals/ScrollDetailModal';
import TrapDetailModal from '../Modals/TrapDetailModal';
import CraftingComponentDetailModal from '../Modals/CraftingComponentDetailModal';
import ExplosivesDetailModal from '../Modals/ExplosivesDetailModal';
import EmptyInventory from './EmptyInventory';
import { InventoryItem } from '@/types/inventory';

interface CategoryOption {
  label: string;
  itemType: string;
  icon: React.ElementType;
}

const InventoryMain: React.FC = () => {
  const { inventory, removeFromInventory, getInventoryByType } = useCharacter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<{ [key: string]: boolean }>({
    Weapon: false, Armor: false, Ammunition: false, Potion: false, Scroll: false,
    'Crafting Component': false, Trap: false, Explosive: false, Throwable: false,
    Pharmaceutical: false, // Added Pharmaceutical if used
  });
  const [searchTerm, setSearchTerm] = useState(''); // Added search term state

  // Define the available categories for the dropdown.
   const categoryOptions: CategoryOption[] = useMemo(() => [
      { label: 'All', itemType: 'all', icon: Package },
      { label: 'Weapons', itemType: 'Weapon', icon: Sword },
      { label: 'Armor', itemType: 'Armor', icon: Shield },
      { label: 'Ammunition', itemType: 'Ammunition', icon: Crosshair },
      { label: 'Potions & Pharma', itemType: 'Potion', icon: Beaker }, // Combined
      { label: 'Scrolls', itemType: 'Scroll', icon: ScrollText },
      { label: 'Crafting', itemType: 'Crafting Component', icon: Wrench },
      { label: 'Traps', itemType: 'Trap', icon: Key },
      { label: 'Explosives & Throwables', itemType: 'Explosive', icon: Bomb }, // Combined
  ], []); // Empty dependency array, categories are static


  const handleViewDetails = (item: InventoryItem) => {
    if (!item || !item.itemType) return;
    setSelectedItem(item);
    // Handle combined categories for modal opening
    let modalKey = item.itemType;
    if (item.itemType === 'Pharmaceutical') modalKey = 'Potion';
    if (item.itemType === 'Throwable') modalKey = 'Explosive';
    setIsModalOpen(prev => ({ ...prev, [modalKey]: true }));
  };

  const handleCloseModal = (itemType: string) => {
    // Handle combined categories for modal closing
    let modalKey = itemType;
    if (itemType === 'Pharmaceutical') modalKey = 'Potion';
    if (itemType === 'Throwable') modalKey = 'Explosive';
    setIsModalOpen(prev => ({ ...prev, [modalKey]: false }));
    setSelectedItem(null);
  };

   // Get the items to display based on selected category and search term.
   const displayedItems = useMemo(() => {
      let itemsToFilter = inventory;
      if (activeCategory !== 'all') {
          if (activeCategory === 'Potion') {
              // Combine Potions and Pharmaceuticals
              itemsToFilter = inventory.filter(invItem => invItem.item.itemType === 'Potion' || invItem.item.itemType === 'Pharmaceutical');
          } else if (activeCategory === 'Explosive') {
              // Combine Explosives and Throwables
              itemsToFilter = inventory.filter(invItem => invItem.item.itemType === 'Explosive' || invItem.item.itemType === 'Throwable');
          } else {
              itemsToFilter = getInventoryByType(activeCategory);
          }
      }

      // Apply search filter
      if (searchTerm.trim() !== '') {
          const lowerSearch = searchTerm.toLowerCase();
          itemsToFilter = itemsToFilter.filter(invItem =>
              invItem.item.name.toLowerCase().includes(lowerSearch) ||
              invItem.item.description.toLowerCase().includes(lowerSearch)
          );
      }
      return itemsToFilter;
   }, [inventory, activeCategory, getInventoryByType, searchTerm]);

  // Calculate quantity for display in dropdown
  const getCategoryQuantity = (itemType: string): number => {
    let itemsInCategory;
     if (itemType === 'all') {
      itemsInCategory = inventory;
    } else if (itemType === 'Potion') {
      itemsInCategory = inventory.filter(invItem => invItem.item.itemType === 'Potion' || invItem.item.itemType === 'Pharmaceutical');
    } else if (itemType === 'Explosive') {
      itemsInCategory = inventory.filter(invItem => invItem.item.itemType === 'Explosive' || invItem.item.itemType === 'Throwable');
    } else {
      itemsInCategory = getInventoryByType(itemType);
    }
    return itemsInCategory.reduce((total, item) => total + item.quantity, 0);
  };

  // Determine columns based on active category
   const columns = useMemo(() => {
      if (activeCategory === 'all') return DEFAULT_COLUMNS;
      // Handle combined categories for column lookup
      const categoryKey = activeCategory === 'Pharmaceutical' ? 'Potion' :
                         activeCategory === 'Throwable' ? 'Explosive' :
                         activeCategory;
      return ITEM_TYPE_COLUMNS[categoryKey] || DEFAULT_COLUMNS;
   }, [activeCategory]);


  if (inventory.length === 0) {
    return (
      <EmptyInventory
        title="Your inventory is empty"
        message="Go to the 'Add Items' tab to add items to your inventory"
        icon={Package}
      />
    );
  }

  return (
    <Box width="100%">
      <HStack mb={4} spacing={4}>
          {/* Dropdown for selecting inventory category */}
          <Select
            placeholder="Select category"
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            bg="gray.700"
            borderColor="gray.600"
            flexShrink={0} // Prevent shrinking
            width={{ base: '100%', md: '250px' }} // Responsive width
          >
            {categoryOptions.map((option) => (
              <option key={option.itemType} value={option.itemType}>
                {option.label} ({getCategoryQuantity(option.itemType)})
              </option>
            ))}
          </Select>
            {/* Search Input */}
           <InputGroup flex={1}> {/* Allow input to grow */}
                <InputLeftElement pointerEvents="none">
                    <Search className="h-4 w-4 text-gray-400" />
                </InputLeftElement>
                <Input
                    placeholder="Search current category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="gray.700"
                    borderColor="gray.600"
                />
            </InputGroup>
      </HStack>

      {/* Inventory Table */}
      <InventoryTable
        items={displayedItems}
        columns={columns} // Use memoized columns
        getColumnValue={(item, column) => String(getColumnValue(item, column))}
        onViewDetails={handleViewDetails}
        onRemoveItem={removeFromInventory}
      />

      {/* Detail Modals */}
      {/* Ensure modal rendering logic uses the correct item types */}
      <WeaponDetailModal
        weapon={selectedItem && selectedItem.itemType === 'Weapon' ? selectedItem : null}
        isOpen={isModalOpen['Weapon']}
        onClose={() => handleCloseModal('Weapon')}
      />
      <ArmorDetailModal
        armor={selectedItem && selectedItem.itemType === 'Armor' ? selectedItem : null}
        isOpen={isModalOpen['Armor']}
        onClose={() => handleCloseModal('Armor')}
      />
      <AmmunitionDetailModal
        ammunition={selectedItem && selectedItem.itemType === 'Ammunition' ? selectedItem : null}
        isOpen={isModalOpen['Ammunition']}
        onClose={() => handleCloseModal('Ammunition')}
      />
      {/* Combined Potion/Pharmaceutical Modal */}
      <PotionDetailModal
        potion={selectedItem && (selectedItem.itemType === 'Potion' || selectedItem.itemType === 'Pharmaceutical') ? selectedItem : null}
        isOpen={isModalOpen['Potion'] || isModalOpen['Pharmaceutical']}
        onClose={() => {handleCloseModal('Potion'); handleCloseModal('Pharmaceutical');}}
      />
      <ScrollDetailModal
        scroll={selectedItem && selectedItem.itemType === 'Scroll' ? selectedItem : null}
        isOpen={isModalOpen['Scroll']}
        onClose={() => handleCloseModal('Scroll')}
      />
      <TrapDetailModal
        trap={selectedItem && selectedItem.itemType === 'Trap' ? selectedItem : null}
        isOpen={isModalOpen['Trap']}
        onClose={() => handleCloseModal('Trap')}
      />
      <CraftingComponentDetailModal
        component={selectedItem && selectedItem.itemType === 'Crafting Component' ? selectedItem : null}
        isOpen={isModalOpen['Crafting Component']}
        onClose={() => handleCloseModal('Crafting Component')}
      />
      {/* Combined Explosive/Throwable Modal */}
      <ExplosivesDetailModal
        explosive={selectedItem && (selectedItem.itemType === 'Explosive' || selectedItem.itemType === 'Throwable') ? selectedItem : null}
        isOpen={isModalOpen['Explosive'] || isModalOpen['Throwable']}
        onClose={() => { handleCloseModal('Explosive'); handleCloseModal('Throwable'); }}
      />
    </Box>
  );
};

export default InventoryMain;