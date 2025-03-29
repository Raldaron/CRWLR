import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  Badge,
  HStack,
  Button,
  useToast
} from '@chakra-ui/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCharacter } from '@/context/CharacterContext';
import { Minus } from 'lucide-react';
import type { InventoryItem } from '@/types/inventory';

// Import card components
import ExplosivesCard from '@/components/ItemCards/ExplosivesCard';
import AmmunitionCard from '@/components/ItemCards/AmmunitionCard';
import ScrollCard from '@/components/ItemCards/ScrollCard';
import TrapCard from '@/components/ItemCards/TrapCard';
import PotionCard from '@/components/ItemCards/PotionCard';
import CraftingComponentCard from '@/components/ItemCards/CraftingComponentCard';

// Import detail modals
import ExplosivesDetailModal from '@/components/Modals/ExplosivesDetailModal';
import AmmunitionDetailModal from '@/components/Modals/AmmunitionDetailModal';
import ScrollDetailModal from '@/components/Modals/ScrollDetailModal';
import TrapDetailModal from '@/components/Modals/TrapDetailModal';
import PotionDetailModal from '@/components/Modals/PotionDetailModal';
import CraftingComponentDetailModal from '@/components/Modals/CraftingComponentDetailModal';

// Import specific item types from their respective files
import type { ExplosiveItem } from '@/types/explosives';
import type { AmmunitionItem } from '@/types/ammunition';
import type { ScrollItem } from '@/types/scroll';
import type { TrapItem } from '@/types/trap';
import type { PotionItem } from '@/types/potion';
import type { CraftingComponentItem } from '@/types/craftingcomponent';

// Hot List Action interface
interface HotListAction {
  id: string;
  slotId: string;
  item: InventoryItem;
  quantity: number;
}

const HotList: React.FC = () => {
  const { utilitySlots, updateUtilitySlotQuantity } = useCharacter();
  const [hotListActions, setHotListActions] = useState<HotListAction[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  // Extract items from utility slots whenever they change
  useEffect(() => {
    const actions: HotListAction[] = [];
    
    // Only process if utilitySlots is properly defined
    if (utilitySlots && Array.isArray(utilitySlots)) {
      utilitySlots.forEach(slot => {
        if (slot && slot.stack && slot.stack.item) {
          actions.push({
            id: `hotlist-${slot.id}`,
            slotId: slot.id,
            item: slot.stack.item,
            quantity: slot.stack.quantity
          });
        }
      });
    }
    
    setHotListActions(actions);
  }, [utilitySlots]);

  // Handle card click to show details
  const handleCardClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Handle using an item from the hot list
  const handleUseItem = (action: HotListAction) => {
    // Use the updateUtilitySlotQuantity function to decrement the item
    updateUtilitySlotQuantity(action.slotId, -1);
    
    // Show feedback
    toast({
      title: "Item Used",
      description: `Used 1 × ${action.item.name}`,
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Render appropriate card based on item type
  const renderItemCard = (action: HotListAction) => {
    const { id, item, quantity } = action;
    
    // Common wrapper with quantity badge and use button
    const withActions = (cardElement: React.ReactNode) => (
      <Box key={id} position="relative">
        {/* Quantity badge */}
        <Badge 
          position="absolute" 
          top={2} 
          right={2} 
          zIndex={1}
          colorScheme="blue" 
          fontSize="md"
          px={2}
          py={1}
          borderRadius="full"
        >
          {quantity}
        </Badge>
        
        {/* Use button */}
        <Box 
          position="absolute" 
          bottom={2} 
          right={2} 
          zIndex={1}
        >
          <Button
            size="xs"
            colorScheme="green"
            leftIcon={<Minus size={12} />}
            onClick={(e) => {
              e.stopPropagation();
              handleUseItem(action);
            }}
          >
            Use
          </Button>
        </Box>
        
        {cardElement}
      </Box>
    );
    
    switch (item.itemType) {
      case 'Explosive':
      case 'Throwable':
        return withActions(
          <ExplosivesCard
            item={item as ExplosiveItem}
            onClick={() => handleCardClick(item)}
          />
        );
      case 'Ammunition':
        return withActions(
          <AmmunitionCard
            item={item as AmmunitionItem}
            onClick={() => handleCardClick(item)}
          />
        );
      case 'Scroll':
        // Handle duration conversion for ScrollItem
        const safeScrollItem = {
          ...item,
          duration: typeof item.duration === 'string' 
            ? parseInt(item.duration) || 0 
            : item.duration || 0
        };
        
        return withActions(
          <ScrollCard
            item={safeScrollItem as unknown as ScrollItem}
            onClick={() => handleCardClick(item)}
          />
        );
      case 'Trap':
        return withActions(
          <TrapCard
            item={item as TrapItem}
            onClick={() => handleCardClick(item)}
          />
        );
      case 'Potion':
        return withActions(
          <PotionCard
            item={item as PotionItem}
            onClick={() => handleCardClick(item)}
          />
        );
      case 'Crafting Component':
        return withActions(
          <CraftingComponentCard
            item={item as CraftingComponentItem}
            onClick={() => handleCardClick(item)}
          />
        );
      default:
        return null;
    }
  };

  // Render appropriate detail modal based on selected item type
  const renderDetailModal = () => {
    if (!selectedItem) return null;

    const commonProps = {
      isOpen: isModalOpen,
      onClose: () => {
        setIsModalOpen(false);
        setSelectedItem(null);
      },
    };

    switch (selectedItem.itemType) {
      case 'Explosive':
      case 'Throwable':
        return (
          <ExplosivesDetailModal
            explosive={selectedItem as ExplosiveItem}
            {...commonProps}
          />
        );
      case 'Ammunition':
        return (
          <AmmunitionDetailModal
            ammunition={selectedItem as AmmunitionItem}
            {...commonProps}
          />
        );
      case 'Scroll':
        const safeScrollItem = {
          ...selectedItem,
          duration: typeof selectedItem.duration === 'string' 
            ? parseInt(selectedItem.duration) || 0 
            : selectedItem.duration || 0
        };
        
        return (
          <ScrollDetailModal
            scroll={safeScrollItem as unknown as ScrollItem}
            {...commonProps}
          />
        );
      case 'Trap':
        return (
          <TrapDetailModal
            trap={selectedItem as TrapItem}
            {...commonProps}
          />
        );
      case 'Potion':
        return (
          <PotionDetailModal
            potion={selectedItem as PotionItem}
            {...commonProps}
          />
        );
      case 'Crafting Component':
        return (
          <CraftingComponentDetailModal
            component={selectedItem as CraftingComponentItem}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box p={4}>
      {hotListActions.length === 0 ? (
        <VStack spacing={4} py={8}>
          <Text color="gray.500">No items in Hot List</Text>
          <Text color="gray.400" fontSize="sm">
            Equip items in Utility slots to add them to Hot List
          </Text>
        </VStack>
      ) : (
        <ScrollArea className="h-[600px]">
          <SimpleGrid columns={[1, 2, 3]} spacing={4}>
            {hotListActions.map(action => renderItemCard(action))}
          </SimpleGrid>
        </ScrollArea>
      )}
      {renderDetailModal()}
    </Box>
  );
};

export default HotList;