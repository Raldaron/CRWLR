// components/inventory/InventoryMain.tsx
import React, { useState } from 'react';
import {
  Box,
  Select,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import { Package, Sword, Shield, Crosshair, Beaker, Scroll, Wrench, Key, Bomb } from 'lucide-react';
import { useCharacter } from '@/context/CharacterContext';
import InventoryTable from './InventoryTable';
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
    Weapon: false,
    Armor: false,
    Ammunition: false,
    Potion: false,
    Scroll: false,
    'Crafting Component': false,
    Trap: false,
    Explosive: false,
    Throwable: false,
  });

  // Define the available categories for the dropdown.
  const categoryOptions: CategoryOption[] = [
    { label: 'All', itemType: 'all', icon: Package },
    { label: 'Weapons', itemType: 'Weapon', icon: Sword },
    { label: 'Armor', itemType: 'Armor', icon: Shield },
    { label: 'Ammunition', itemType: 'Ammunition', icon: Crosshair },
    { label: 'Potions', itemType: 'Potion', icon: Beaker },
    { label: 'Scrolls', itemType: 'Scroll', icon: Scroll },
    { label: 'Crafting', itemType: 'Crafting Component', icon: Wrench },
    { label: 'Traps', itemType: 'Trap', icon: Key },
    { label: 'Explosives', itemType: 'Explosive', icon: Bomb },
  ];

  const handleViewDetails = (item: InventoryItem) => {
    if (!item || !item.itemType) return;
    setSelectedItem(item);
    setIsModalOpen({ ...isModalOpen, [item.itemType]: true });
  };

  const handleCloseModal = (itemType: string) => {
    setIsModalOpen({ ...isModalOpen, [itemType]: false });
    setSelectedItem(null);
  };

  // Get the items to display based on selected category.
  const displayedItems =
    activeCategory === 'all'
      ? inventory
      : getInventoryByType(activeCategory);

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
      {/* Dropdown for selecting inventory category */}
      <Select
        placeholder="Select category"
        value={activeCategory}
        onChange={(e) => setActiveCategory(e.target.value)}
        mb={4}
      >
        {categoryOptions.map((option) => (
          <option key={option.itemType} value={option.itemType}>
            {option.label} ({option.itemType === 'all'
              ? inventory.reduce((total, item) => total + item.quantity, 0)
              : getInventoryByType(option.itemType).reduce(
                  (total, item) => total + item.quantity,
                  0
                )}
            )
          </option>
        ))}
      </Select>

      {/* Inventory Table */}
      <InventoryTable
        items={displayedItems}
        columns={activeCategory === 'all' ? DEFAULT_COLUMNS : (ITEM_TYPE_COLUMNS[activeCategory] || DEFAULT_COLUMNS)}
        getColumnValue={(item, column) => String(getColumnValue(item, column))}
        onViewDetails={handleViewDetails}
        onRemoveItem={removeFromInventory}
      />

      {/* Detail Modals */}
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
      <PotionDetailModal
        potion={selectedItem && selectedItem.itemType === 'Potion' ? selectedItem : null}
        isOpen={isModalOpen['Potion']}
        onClose={() => handleCloseModal('Potion')}
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
        component={
          selectedItem && selectedItem.itemType === 'Crafting Component'
            ? selectedItem
            : null
        }
        isOpen={isModalOpen['Crafting Component']}
        onClose={() => handleCloseModal('Crafting Component')}
      />
      <ExplosivesDetailModal
        explosive={
          selectedItem &&
          (selectedItem.itemType === 'Explosive' || selectedItem.itemType === 'Throwable')
            ? selectedItem
            : null
        }
        isOpen={isModalOpen['Explosive'] || isModalOpen['Throwable']}
        onClose={() => {
          handleCloseModal('Explosive');
          handleCloseModal('Throwable');
        }}
      />
    </Box>
  );
};

export default InventoryMain;
