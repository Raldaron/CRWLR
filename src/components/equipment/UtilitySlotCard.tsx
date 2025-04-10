// components/equipment/UtilitySlotCard.tsx
import React from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  IconButton, // Can remove IconButton if not used elsewhere
  HStack,
  Badge,
  Tooltip, // Added Tooltip for clarity
} from '@chakra-ui/react';
import { Package, Plus, Minus, Info, X } from 'lucide-react'; // Use Minus icon for the Use button
import DarkThemedCard from '../ui/DarkThemedCard'; // Ensure path is correct
import type { InventoryItem } from '@/types/inventory'; // Ensure path is correct

// Specify the type for a utility slot
interface UtilitySlot {
  id: string;
  name: string;
  stack: {
    item: InventoryItem;
    quantity: number;
  } | null;
}

interface UtilitySlotCardProps {
  slot: UtilitySlot;
  onAddItem: () => void;
  onViewDetails: (item: InventoryItem) => void;
  onIncrement: () => void;
  onDecrement: () => void; // This will be our "Use" action
  onUnequip: () => void;
}

const UtilitySlotCard: React.FC<UtilitySlotCardProps> = ({
  slot,
  onAddItem,
  onViewDetails,
  onIncrement,
  onDecrement, // Renamed button will call this
  onUnequip
}) => {
  const hasItem = slot.stack !== null;

  return (
    <DarkThemedCard
      // Clicking the card itself opens details
      onClick={hasItem ? () => onViewDetails(slot.stack!.item) : onAddItem}
      isSelected={hasItem}
      borderColor={hasItem ? "green.600" : "gray.700"} // Green border when item is present
      isHoverable={true}
      height="150px" // Slightly increased height for controls
    >
      <VStack spacing={1} align="center" justify="center" h="full" position="relative">
        {/* Unequip Button - Placed first for layer order if needed */}
        {hasItem && (
             <Tooltip label="Remove from Slot" placement="top">
                <Button
                    size="xs"
                    variant="ghost" // Use ghost for less visual noise
                    colorScheme="red" // Use red for remove action
                    position="absolute"
                    top={1}
                    right={1}
                    height="20px"
                    minWidth="20px"
                    p={0}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        onUnequip();
                    }}
                    aria-label="Unequip item from slot"
                    >
                    <X size={14} />
                </Button>
            </Tooltip>
        )}

        {/* Item Information */}
        {slot.stack ? (
          <>
            <Package size={20} className="text-green-500" />
            <Text fontWeight="bold" fontSize="sm" textAlign="center" noOfLines={1} color="gray.200">
              {slot.stack.item.name}
            </Text>
            <Badge colorScheme="green" fontSize="xs">{slot.stack.item.itemType}</Badge>

            {/* Quantity Display and Controls */}
            <HStack mt={2}>
               {/* "Use" Button (calls onDecrement) */}
               <Tooltip label="Use 1 Item" placement="bottom">
                  <Button
                     size="xs"
                     colorScheme="blue" // Use a distinct color for "Use"
                     variant="solid" // Make it more prominent
                     onClick={(e) => {
                       e.stopPropagation(); // Prevent card click
                       onDecrement();
                     }}
                     aria-label="Use one item"
                     leftIcon={<Minus size={12} />} // Icon indicates reduction
                   >
                     Use
                   </Button>
               </Tooltip>

                <Badge colorScheme="blue" variant="solid" fontSize="md" px={2} minW="30px" textAlign="center">
                  {slot.stack.quantity}
                </Badge>

                {/* "Add" Button (calls onIncrement) */}
                 <Tooltip label="Add 1 Item (from Inventory)" placement="bottom">
                  <Button
                    size="xs"
                    colorScheme="green" // Green for adding
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      onIncrement();
                    }}
                    aria-label="Add quantity from inventory"
                  >
                    <Plus size={12} />
                  </Button>
                 </Tooltip>
              </HStack>
          </>
        ) : (
          // Empty Slot Display
          <>
            <Package size={32} className="text-gray-500" /> {/* Larger icon for empty */}
            <Text color="gray.500" fontSize="sm" textAlign="center">
              {slot.name}
            </Text>
            <Text fontSize="xs" color="gray.600" textAlign="center">
              (Empty Slot)
            </Text>
            <Button size="xs" colorScheme="green" mt={2} onClick={onAddItem}>
              Equip Item
            </Button>
          </>
        )}
      </VStack>
    </DarkThemedCard>
  );
};

export default UtilitySlotCard;